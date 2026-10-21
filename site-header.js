// The shared site header for static pages that are not rendered by academic.js (design.html).
(() => {
  const routes = ['index.html', 'research.html', 'more.html'];
  const labels = lang => [window.PROFILE[lang].nav[0], window.PROFILE[lang].nav[1], window.PROFILE[lang].nav[3]];
  let lang = 'en';
  try { if (localStorage.getItem('haoran-language') === 'zh') lang = 'zh'; } catch (_) {}
  const param = new URLSearchParams(location.search).get('lang');
  if (['en', 'zh'].includes(param)) lang = param;
  const current = document.body.dataset.section || 'more.html';
  function render() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelector('#affiliation').textContent = window.PROFILE[lang].affiliation;
    document.querySelector('#navigation').innerHTML = routes.map((route, i) => {
      const link = document.createElement('a');
      link.href = route;
      link.textContent = labels(lang)[i];
      if (route === current) link.setAttribute('aria-current', 'page');
      return link.outerHTML;
    }).join('');
    const button = document.querySelector('#language');
    button.textContent = lang === 'en' ? '中文' : 'EN';
    button.setAttribute('aria-label', lang === 'en' ? 'Switch to Chinese' : '切换为英文');
    // Images that have a Chinese edition (the Construction Log cover) follow the language too.
    document.querySelectorAll('img[data-src-zh]').forEach(image => {
      image.src = lang === 'zh' ? image.dataset.srcZh : image.dataset.srcEn;
      image.alt = lang === 'zh' ? image.dataset.altZh : image.dataset.altEn;
    });
    document.querySelectorAll('[data-return-en]').forEach(link => {
      link.textContent = lang === 'zh' ? link.dataset.returnZh : link.dataset.returnEn;
    });
  }
  document.querySelector('#language').addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('haoran-language', lang); } catch (_) {}
    render();
  });
  render();
})();
