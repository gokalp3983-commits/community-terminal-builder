"use strict";

const DEFAULT_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const DEFAULT_BLOCKSCOUT_API_BASE = "https://robinhoodchain.blockscout.com/api/v2";
const DEFAULT_EXPLORER_BASE = "https://robinhoodchain.blockscout.com";
const ZERO_HEX = /^0x0*$/i;

function normalizeAddress(value) {
  const address = String(value || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    const error = new Error("NFT contract must be a valid 42-character 0x EVM address.");
    error.code = "INVALID_EVM_ADDRESS";
    throw error;
  }
  return address;
}

function cleanBase(value, fallback) {
  return String(value || fallback).trim().replace(/\/+$/, "");
}

function parseQuantity(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  try {
    if (/^0x[0-9a-f]+$/i.test(raw)) {
      const n = BigInt(raw);
      return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n.toString();
    }
  } catch {}
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function decodeAbiString(hex) {
  const raw = String(hex || "");
  if (!/^0x[0-9a-f]*$/i.test(raw) || raw.length < 66 || ZERO_HEX.test(raw)) return null;
  const data = raw.slice(2);
  try {
    // Standard ABI dynamic string: offset -> length -> UTF-8 bytes.
    const offset = Number(BigInt(`0x${data.slice(0, 64)}`));
    if (Number.isSafeInteger(offset) && offset >= 0) {
      const lengthPos = offset * 2;
      if (data.length >= lengthPos + 64) {
        const length = Number(BigInt(`0x${data.slice(lengthPos, lengthPos + 64)}`));
        const start = lengthPos + 64;
        const end = start + length * 2;
        if (Number.isSafeInteger(length) && length >= 0 && end <= data.length) {
          const text = Buffer.from(data.slice(start, end), "hex").toString("utf8").replace(/\0+$/g, "").trim();
          if (text) return text;
        }
      }
    }
    // Legacy bytes32 strings.
    const text = Buffer.from(data.slice(0, 64), "hex").toString("utf8").replace(/\0+$/g, "").trim();
    return text || null;
  } catch {
    return null;
  }
}

function boolFromAbi(hex) {
  const raw = String(hex || "").replace(/^0x/i, "");
  if (!/^[0-9a-f]+$/i.test(raw)) return null;
  try { return BigInt(`0x${raw}`) !== 0n; } catch { return null; }
}

function encodeBytes4Arg(interfaceId) {
  return String(interfaceId || "").replace(/^0x/i, "").padEnd(64, "0");
}

class ChainDataProvider {
  constructor({ fetchImpl = globalThis.fetch, rpcUrl = DEFAULT_RPC_URL, blockscoutApiBase = DEFAULT_BLOCKSCOUT_API_BASE, explorerBase = DEFAULT_EXPLORER_BASE, timeoutMs = 8000 } = {}) {
    if (typeof fetchImpl !== "function") throw new Error("fetch implementation is required");
    this.fetch = fetchImpl;
    this.rpcUrl = cleanBase(rpcUrl, DEFAULT_RPC_URL);
    this.blockscoutApiBase = cleanBase(blockscoutApiBase, DEFAULT_BLOCKSCOUT_API_BASE);
    this.explorerBase = cleanBase(explorerBase, DEFAULT_EXPLORER_BASE);
    this.timeoutMs = timeoutMs;
  }

  async fetchJson(url, options = {}) {
    const response = await this.fetch(url, {
      ...options,
      headers: { Accept: "application/json", ...(options.headers || {}) },
      signal: options.signal || AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async rpc(method, params = []) {
    const payload = await this.fetchJson(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (payload && payload.error) {
      const error = new Error(payload.error.message || `RPC ${method} failed`);
      error.code = payload.error.code;
      throw error;
    }
    return payload ? payload.result : null;
  }

  async getCode(address) {
    return this.rpc("eth_getCode", [normalizeAddress(address), "latest"]);
  }

  async ethCall(address, data) {
    return this.rpc("eth_call", [{ to: normalizeAddress(address), data }, "latest"]);
  }

  async supportsInterface(address, interfaceId) {
    try {
      const result = await this.ethCall(address, `0x01ffc9a7${encodeBytes4Arg(interfaceId)}`);
      return boolFromAbi(result);
    } catch { return null; }
  }

  async readString(address, selector) {
    try { return decodeAbiString(await this.ethCall(address, selector)); } catch { return null; }
  }

  async readUint(address, selector) {
    try { return parseQuantity(await this.ethCall(address, selector)); } catch { return null; }
  }

  async getTokenInfo(address) {
    try { return await this.fetchJson(`${this.blockscoutApiBase}/tokens/${normalizeAddress(address)}`); } catch { return null; }
  }

  explorerUrl(address) {
    return `${this.explorerBase}/token/${normalizeAddress(address)}`;
  }
}

module.exports = {
  ChainDataProvider,
  DEFAULT_RPC_URL,
  DEFAULT_BLOCKSCOUT_API_BASE,
  DEFAULT_EXPLORER_BASE,
  normalizeAddress,
  decodeAbiString,
  parseQuantity,
};
