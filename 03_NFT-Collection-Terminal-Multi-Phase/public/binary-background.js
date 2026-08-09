(() => {
  "use strict";

  // Decorative, static dim-gold 8 texture for the empty side gutters.
  // No timers, no animation, no network calls, no application/data state.
  const root = document.createElement("div");
  root.className = "binary-background";
  root.setAttribute("aria-hidden", "true");

  function makeEightBlock(seed, rows = 42, cols = 7) {
    // Deterministic pseudo-random generator so the pattern stays visually stable.
    let state = seed >>> 0;
    const next = () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };

    const lines = [];
    for (let r = 0; r < rows; r += 1) {
      let line = "";
      for (let c = 0; c < cols; c += 1) {
        line += next() > 0.17 ? "8" : " ";
        if (c < cols - 1) line += " ";
      }
      lines.push(line);
    }
    return lines.join("\n");
  }

  [
    ["left", 0x47a11],
    ["right", 0x90b1f]
  ].forEach(([side, seed]) => {
    const gutter = document.createElement("div");
    gutter.className = `binary-background__gutter binary-background__gutter--${side}`;

    const pattern = document.createElement("pre");
    pattern.className = "binary-background__pattern";
    pattern.textContent = makeEightBlock(seed);

    gutter.appendChild(pattern);
    root.appendChild(gutter);
  });

  document.body.prepend(root);
})();
