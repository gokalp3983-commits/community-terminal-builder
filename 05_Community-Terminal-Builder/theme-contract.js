"use strict";

const DEFAULT_TERMINAL_THEME = Object.freeze({
  background: "#020806",
  panel: "#03100b",
  green: "#39ff14",
  yellow: "#ff6a00",
  cyan: "#65dfff",
  blue: "#68c8ff",
  orange: "#ff8a00",
  red: "#ff5a67",
  muted: "#708a7b",
  line: "#ff8a00",
});

const THEME_ROLES = Object.freeze({
  background: "black terminal background",
  structure: "orange borders, headings, and primary framing",
  positive: "green LIVE / OK / READY / positive states",
  primaryText: "bright white readable text and important values",
  highlight: "cyan highlights, links, prompts, and selected/key metrics",
  negative: "red negative movement, errors, and warnings",
});

module.exports = { DEFAULT_TERMINAL_THEME, THEME_ROLES };
