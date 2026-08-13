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
      e.href = "/";
      e.title = `Return to ${c.project.name} Community Terminal`;
      if (!e.dataset.homeConfirmBound) {
        e.addEventListener("click", (event) => {
          if (!window.confirm("Return to the main Community Terminal landing page?")) event.preventDefault();
        });
        e.dataset.homeConfirmBound = "true";
      }
    });
    document.querySelectorAll("[data-project-mascot]").forEach((e) => {
      e.src = c.branding.mascot;
      e.alt = c.branding.mascotAlt;
    });
    document.querySelectorAll("[data-project-version]").forEach((e) => {
      e.textContent = `${c.project.name} Community Terminal`;
    });
    document.querySelectorAll("[data-project-footer-title]").forEach((e) => {
      e.textContent = `${c.project.name} Community Terminal`;
    });
    document.querySelectorAll("[data-project-footer-info]").forEach((e) => {
      e.textContent = `Independent community tools for ${c.project.ecosystem}.`;
    });
    document.querySelectorAll("[data-project-footer]").forEach((e) => {
      e.innerHTML = `<div class="builder-signature" aria-label="Built by Gokalp @Gokalp8339"><img class="builder-signature-avatar" src="/assets/gokalp-hoodrat-signature.png" alt="Gokalp Hoodrat NFT avatar"><div class="builder-signature-copy"><span class="builder-signature-label">Built by</span><span class="builder-signature-name">Gokalp</span><a class="x-credit builder-signature-handle" href="https://x.com/Gokalp8339" target="_blank" rel="noopener noreferrer" aria-label="Gokalp8339 on X">𝕏 @Gokalp8339</a></div></div><div class="builder-signature-disclaimer">Not affiliated with or endorsed by the official ${c.project.name} team.</div>`;
    });

    document.querySelectorAll("[data-token-contract]").forEach((e) => {
      e.textContent = c.contracts.token || "NOT CONFIGURED";
    });
    document.querySelectorAll("[data-copy-token-contract]").forEach((button) => {
      button.addEventListener("click", async () => {
        const address = c.contracts.token || "";
        if (!address) return;
        try {
          await navigator.clipboard.writeText(address);
          const original = button.textContent;
          button.textContent = "✓";
          button.setAttribute("aria-label", "Contract address copied");
          setTimeout(() => { button.textContent = original; button.setAttribute("aria-label", "Copy token contract address"); }, 1200);
        } catch (_) {
          const range = document.createRange();
          const target = document.querySelector("[data-token-contract]");
          if (target) { range.selectNodeContents(target); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }
        }
      });
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
      muted: "--muted", line: "--line"
    };
    Object.entries(colorMap).forEach(([key, variable]) => {
      if (colors[key]) document.documentElement.style.setProperty(variable, colors[key]);
    });
    document.documentElement.style.setProperty("--nft-terminal-label", `"${c.nft?.collectionName || `${c.project.name} NFT`} COLLECTION TERMINAL"`);
  });
})();
