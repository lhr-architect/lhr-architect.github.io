// Builds the construction log on design.html from design-content.js.
// Each card previews its photos (Prev / Next); the title and the photos open the project page.
(() => {
  const list = document.querySelector('.log-groups');
  if (!list) return;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  list.innerHTML = window.DESIGN_LOG.map((slug, i) => {
    const project = window.DESIGN_PROJECTS[slug];
    const href = `design-${slug}.html`;
    const description = project.listText || project.en.intro;
    const photos = project.images.map((image, n) => `<a class="archive-item stack-item" style="--i: ${n}" href="${href}"><img src="./${escape(image.src)}" alt="${escape(image.en || `${project.listTitle} · photo ${n + 1}`)}" loading="lazy" /></a>`).join('');
    return `<article class="log-group panel" id="${slug}"><div class="log-head"><span>${String(i + 1).padStart(2, '0')}</span><h3><a href="${href}">${escape(project.listTitle)} ↗</a></h3></div><div class="log-stack">${photos}</div><p class="log-description">${escape(description)}</p></article>`;
  }).join('');
})();
