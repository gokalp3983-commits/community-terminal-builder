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
      e.href = c.links.home;
      e.title = `Return to ${c.project.name} Community Terminal`;
    });
    document.querySelectorAll("[data-project-mascot]").forEach((e) => {
      e.src = c.branding.mascot;
      e.alt = c.branding.mascotAlt;
    });
    document.querySelectorAll("[data-project-version]").forEach((e) => {
      e.textContent = `${c.project.name} Community Terminal ver ${c.project.version}`;
    });
    document.querySelectorAll("[data-project-footer]").forEach((e) => {
      e.innerHTML = `Independent community-built tools.<br>Not affiliated with or endorsed by the official ${c.project.ticker} team.<br>Built for the ${c.project.ecosystem} ${c.project.ticker} ecosystem.`;
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
