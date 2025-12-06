// theme-toggle.js
(function() {
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');
  
  // Theme order: dark -> light -> dark
  const themeOrder = ['dark', 'light']; 

  function applyTheme(mode) {
    if (mode === 'dark') {
      html.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '🌙';
      themeBtn.setAttribute('aria-label', 'Switch to light theme');
    } else { // 'light'
      html.removeAttribute('data-theme'); // Use the default (light) CSS variables
      themeIcon.textContent = '☀️';
      themeBtn.setAttribute('aria-label', 'Switch to dark theme');
    }
    // Update localStorage for persistence
    localStorage.setItem('sn_theme', mode);
  }

  // Toggle cycle logic
  function toggleTheme() {
    const currentTheme = localStorage.getItem('sn_theme') || 'light';
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // Init
  // Default to 'light' if no stored theme is found
  const storedTheme = localStorage.getItem('sn_theme') || 'light';
  // Ensure the stored theme is only 'dark' or 'light'
  const validTheme = (storedTheme === 'dark' || storedTheme === 'light') ? storedTheme : 'light';
  applyTheme(validTheme);
  
  themeBtn?.addEventListener('click', toggleTheme);
})();