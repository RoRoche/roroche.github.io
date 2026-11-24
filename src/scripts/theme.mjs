const themes = {
  dark: {
    label: 'Light',
    next: 'light',
    accessibleLabel: 'Switch to light theme',
  },
  light: {
    label: 'Dark',
    next: 'dark',
    accessibleLabel: 'Switch to dark theme',
  },
};

export function initializeThemeToggle(document = window.document) {
  const root = document.documentElement;
  const button = document.querySelector('[data-theme-toggle]');
  const label = button?.querySelector('[data-theme-label]');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (!button || !label) return;

  const applyTheme = (theme) => {
    const selectedTheme = Object.hasOwn(themes, theme) ? theme : 'dark';
    const config = themes[selectedTheme];
    root.dataset.theme = selectedTheme;
    button.dataset.themeTarget = config.next;
    button.setAttribute('aria-label', config.accessibleLabel);
    label.textContent = config.label;
    if (themeColor)
      themeColor.content = window
        .getComputedStyle(root)
        .getPropertyValue('--bg')
        .trim();
  };

  applyTheme(root.dataset.theme);
  button.hidden = false;
  button.addEventListener('click', () => {
    const nextTheme = themes[root.dataset.theme].next;
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem('site-theme', nextTheme);
    } catch (error) {
      console.warn('Could not save the selected theme.', error);
    }
  });
}
