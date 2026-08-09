"use strict";
(() => {
  const c = window.PROJECT_CONFIG;
  if (!c) throw new Error("PROJECT_CONFIG missing");

  window.PROJECT_NAME = c.project.name;
  window.PROJECT_TICKER = c.project.ticker;
  window.PROJECT_PROMPT = `${c.project.promptUser}@${c.project.promptHost}:~$`;

  function replaceTokens(value) {
    return String(value ?? "")
      .replaceAll("{{PROJECT_NAME}}", c.project.name)
      .replaceAll("{{PROJECT_TICKER}}", c.project.ticker)
      .replaceAll("{{NFT_COLLECTION_NAME}}", c.nft?.collectionName || `${c.project.name} NFT`)
      .replaceAll("{{PROJECT_ECOSYSTEM}}", c.project.ecosystem);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.title = replaceTokens(document.title);

    document.querySelectorAll("[data-project-name]").forEach((e) => { e.textContent = c.project.name; });
    document.querySelectorAll("[data-project-ticker]").forEach((e) => { e.textContent = c.project.ticker; });
    document.querySelectorAll("[data-project-prompt]").forEach((e) => { e.textContent = window.PROJECT_PROMPT; });
    document.querySelectorAll("[data-project-home]").forEach((e) => {
      const mintAt = c.nft?.mintAt ? new Date(c.nft.mintAt).getTime() : NaN;
      const postMint = Number.isFinite(mintAt) && Date.now() >= mintAt;
      e.href = postMint ? "/terminal" : c.links.home;
      e.title = postMint
        ? `${c.project.name} NFT Terminal`
        : `Return to ${c.project.name} mint countdown`;
    });
    document.querySelectorAll("[data-project-mascot]").forEach((e) => {
      const mascot = String(c.branding.mascot || "");
      const assetRoot = ["/", "assets/"].join("");
      e.src = mascot.startsWith(assetRoot) ? `/nft${mascot}` : mascot;
      e.alt = c.branding.mascotAlt;
    });
    document.querySelectorAll("[data-project-version]").forEach((e) => {
      e.textContent = `${c.project.name} NFT Terminal`;
    });
    document.querySelectorAll("[data-project-footer]").forEach((e) => {
      e.innerHTML = `<span class="footer-line footer-built">Independently built by Gokalp <a class="x-credit" href="https://x.com/Gokalp8339" target="_blank" rel="noopener noreferrer">𝕏 @Gokalp8339</a></span><span class="footer-line footer-disclaimer"><span class="footer-mobile-line">Not affiliated with or endorsed by</span><span class="footer-mobile-line">the official ${c.project.ticker} team.</span></span><span class="footer-line footer-ecosystem"><span class="footer-mobile-line">Built for the ${c.project.ecosystem}</span><span class="footer-mobile-line">${c.project.ticker} ecosystem.</span></span>`;
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => { node.nodeValue = replaceTokens(node.nodeValue); });

    document.querySelectorAll("[aria-label],[title],[content],[placeholder]").forEach((e) => {
      ["aria-label", "title", "content", "placeholder"].forEach((attribute) => {
        const value = e.getAttribute(attribute);
        if (value) e.setAttribute(attribute, replaceTokens(value));
      });
    });

    const colors = c.branding.colors || {};
    const colorMap = {
      background: "--bg", panel: "--panel", green: "--green", yellow: "--yellow",
      cyan: "--cyan", blue: "--blue", orange: "--orange", red: "--red",
      muted: "--muted"
    };
    Object.entries(colorMap).forEach(([key, variable]) => {
      if (colors[key]) document.documentElement.style.setProperty(variable, colors[key]);
    });
    document.documentElement.style.setProperty("--nft-terminal-label", `"${c.project.name} NFT Collection"`);

    document.querySelectorAll("[data-opensea-link]").forEach((e) => {
      e.href = c.links.openSea || "#";
      e.hidden = !c.links.openSea;
    });
    document.querySelectorAll("[data-nft-explorer-link]").forEach((e) => {
      e.href = c.links?.explorer || (c.contracts.nft ? `https://etherscan.io/address/${c.contracts.nft}` : "#");
      e.hidden = !c.contracts.nft;
    });
    document.querySelectorAll("[data-nft-contract]").forEach((e) => {
      e.textContent = c.contracts.nft || "NOT CONFIGURED";
    });
  });
})();
