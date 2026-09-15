(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  try {
    const saved = window.localStorage.getItem('readyvio-theme');
    if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  } catch {}

  const currentTheme = () => root.dataset.theme || (media.matches ? 'dark' : 'light');
  const sync = () => {
    const dark = currentTheme() === 'dark';
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#131916' : '#f8fbf7');
  };

  const init = () => {
    const button = document.querySelector('[data-theme-toggle]');
    button?.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { window.localStorage.setItem('readyvio-theme', next); } catch {}
      sync();
    });
    media.addEventListener?.('change', () => { if (!root.dataset.theme) sync(); });
    sync();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
