/**
 * Runs before hydration: hides [data-reveal] content only until <RevealObserver> starts,
 * and shows everything again if it never does.
 */
export const REVEAL_BOOT_SCRIPT =
  "document.documentElement.classList.add('reveal-ready');" +
  "setTimeout(function(){if(!window.__revealBooted)document.documentElement.classList.remove('reveal-ready')},4000);";
