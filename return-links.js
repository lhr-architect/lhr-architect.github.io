// Parent-page links use the website language, including standalone pages.
(() => {
  let language = 'en';
  try { if (localStorage.getItem('haoran-language') === 'zh') language = 'zh'; } catch (_) {}
  const queryLanguage = new URLSearchParams(location.search).get('lang');
  if (['zh', 'en'].includes(queryLanguage)) language = queryLanguage;
  document.querySelectorAll('[data-return-en]').forEach(link => {
    link.textContent = language === 'zh' ? link.dataset.returnZh : link.dataset.returnEn;
  });
})();
