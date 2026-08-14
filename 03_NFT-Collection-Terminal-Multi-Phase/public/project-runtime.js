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
      const configuredMascot = String(c.branding.mascot || "");
      const currentSrc = String(e.getAttribute("src") || "");
      if (!currentSrc) {
        const assetRoot = ["/", "assets/"].join("");
        const mountedAssetRoot = ["/nft", assetRoot].join("");
        if (configuredMascot.startsWith(mountedAssetRoot)) e.src = configuredMascot;
        else if (configuredMascot.startsWith(assetRoot)) e.src = `/nft${configuredMascot}`;
        else if (configuredMascot.startsWith("assets/")) e.src = `/nft/${configuredMascot}`;
        else if (configuredMascot) e.src = configuredMascot;
      }
      e.alt = c.branding.mascotAlt;
    });
    document.querySelectorAll("[data-project-version]").forEach((e) => {
      e.textContent = `${c.project.name} Community Terminal`;
    });
    document.querySelectorAll("[data-project-footer]").forEach((e) => {
      const ticker = String(c.project.ticker || c.project.name || "").replace(/^\$/, "");
      e.innerHTML = `<div class="builder-signature" aria-label="Built by Gokalp @Gokalp8339"><img class="builder-signature-avatar" src="assets/gokalp-hoodrat-signature.png" alt="Gokalp Hoodrat NFT avatar"><div class="builder-signature-copy"><span class="builder-signature-label">Built by</span><span class="builder-signature-name">Gokalp</span><a class="x-credit builder-signature-handle" href="https://x.com/Gokalp8339" target="_blank" rel="noopener noreferrer" aria-label="Gokalp8339 on X">𝕏 @Gokalp8339</a></div></div><div class="builder-signature-disclaimer">Not affiliated with or endorsed by the official ${ticker} team.</div>`;
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
    document.documentElement.style.setProperty("--nft-terminal-label", '"MARKET UPDATE"');

    const additionalLinksHost = document.getElementById("additionalLinks");
    if (additionalLinksHost) {
      const links = Array.isArray(c.links?.additionalLinks) ? c.links.additionalLinks.slice(0, 5) : [];
      additionalLinksHost.innerHTML = "";
      links.filter((item) => item && item.label && item.url).forEach((item) => {
        const row = document.createElement("div");
        row.className = `additional-terminal-link${item.highlight ? " is-highlighted" : ""}`;
        const label = document.createElement("span");
        label.className = "additional-terminal-link-label";
        label.textContent = `[ ${String(item.label).replace(/^\[|\]$/g, "")} ]`;
        const link = document.createElement("a");
        link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.textContent = item.text || `Open ${item.label}`;
        row.append(label, link); additionalLinksHost.appendChild(row);
      });
      additionalLinksHost.hidden = !additionalLinksHost.children.length;
    }

    const openSeaUrl = c.links.openSea || (c.nft?.openSeaSlug ? `https://opensea.io/collection/${c.nft.openSeaSlug}/overview` : "");
    document.querySelectorAll("[data-opensea-link]").forEach((e) => {
      e.href = openSeaUrl || "#";
      e.hidden = !openSeaUrl;
      const infoRow = e.closest(".info-row");
      if (infoRow) infoRow.hidden = !openSeaUrl;
    });
    document.querySelectorAll("[data-opensea-action]").forEach((e) => {
      e.href = openSeaUrl || "#";
      if (openSeaUrl) {
        e.target = "_blank";
        e.rel = "noopener noreferrer";
        return;
      }
      e.removeAttribute("target");
      e.addEventListener("click", (event) => {
        event.preventDefault();
        let status = document.getElementById("openSeaActionStatus");
        if (!status) {
          status = document.createElement("div");
          status.id = "openSeaActionStatus";
          status.className = "opensea-action-status";
          status.setAttribute("role", "alert");
          status.setAttribute("aria-live", "assertive");
          const host = e.closest(".launch-actions, .official-mint, .terminal-area") || e.parentElement;
          host?.appendChild(status);
        }
        if (status) status.textContent = "[ ERROR ] OpenSea link not configured for this collection.";
      });
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
