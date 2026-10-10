(() => {
  let lang = 'en';
  try { const saved = localStorage.getItem('haoran-language'); if (['en','zh'].includes(saved)) lang = saved; } catch (_) {}
  const param = new URLSearchParams(location.search).get('lang');
  if (['en','zh'].includes(param)) lang = param;
  let page = document.body.dataset.page || 'cv';
  let enteredFromMore = new URLSearchParams(location.search).get('from') === 'more';
  try {
    enteredFromMore = enteredFromMore || history.state?.enteredFromMore === true || sessionStorage.getItem('haoran-more-origin') === location.pathname;
    sessionStorage.removeItem('haoran-more-origin');
  } catch (_) {}
  history.replaceState({ ...history.state, enteredFromMore }, '', location.href);
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const e = escape;
  const projectLink = (d,i) => `project-${d.researchRoutes[i]}.html`;
  const routes = ['index.html','research.html','thoughts.html','more.html'];
  const education = d => d.education.map(x=>`<article class="education-item"><span class="meta">${e(x[0])}</span><div><h3>${e(x[1])}</h3><p class="degree">${e(x[2])}</p><p>${e(x[3])}</p></div></article>`).join('');
  const papers = d => d.pubs.map(x=>`<article class="publication"><span class="meta">${e(x[0])}</span><div><h3><a href="assets/papers/${e(x[5])}.pdf" target="_blank" rel="noopener">${e(x[1])} ↗</a></h3><p>${e(x[2])}</p><p>${e(x[3])} · ${e(x[4])}</p></div></article>`).join('');
  const sectionTitle = text => `<h2 class="profile-heading">${e(text)}</h2>`;
  const pageHeader = (title,intro,back) => `${back?`<a class="back-link" href="${back[0]}">${e(back[1])}</a>`:''}<header class="page-heading"><h1>${e(title)}</h1>${intro?`<p>${e(intro)}</p>`:''}</header>`;
  const proseSections = rows => rows.map(x=>`<section><h2>${e(x[0])}</h2><p>${e(x[1])}</p></section>`).join('');
  function home(d) {
    return `<section class="profile-introduction"><div class="profile-main"><h1>${e(d.name)} <span>${e(d.chinese)}</span></h1><p class="profile-position">${lang==='en'?'Geography · Human mobility & spatial interaction':'地理学 · 人类移动与空间交互'}</p><div class="prose"><p class="lead">${e(d.intro)}</p><p>${e(d.aboutText)}</p></div></div><aside class="hero-aside profile-aside"><figure class="profile-photo"><img src="assets/personal/portrait.png" alt="${lang==='en'?'Haoran Liu outdoors with a camera':'拿着相机的刘浩然'}" width="836" height="1204"><figcaption>${lang==='en'?'A moment outside research.':'研究之外的一瞬。'}</figcaption></figure><p class="meta">${lang==='en'?'PHD APPLICATION':'博士申请'}</p><p>${e(d.phd)}</p><div class="text-links"><a href="cv.html?lang=${lang}">${e(d.cv)}</a><a href="mailto:2401213545@stu.pku.edu.cn">Contact</a></div></aside></section>
    <div class="profile-grid"><section>${sectionTitle(d.homeInterests)}<div class="profile-interests">${d.interests.map(x=>`<article><h3>${e(x[0])}</h3><p>${e(x[1])}</p></article>`).join('')}</div></section><section>${sectionTitle(d.educationTitle)}<div class="education">${education(d)}</div></section></div>
    <div class="profile-grid"><section>${sectionTitle(d.homeExperience)}<div class="compact-projects">${d.research.map((x,i)=>`<article><h3><a href="${projectLink(d,i)}">${e(x[3])} ↗</a></h3><p class="meta">${e(x[1])}</p></article>`).join('')}</div><a class="text-link" href="research.html">${e(d.allResearch)}</a></section><section>${sectionTitle(d.honoursTitle)}<ul class="honours-list">${d.honours.map(x=>`<li>${e(x)}</li>`).join('')}</ul><div class="profile-contact"><h3>${e(d.contactTitle)}</h3><a href="mailto:2401213545@stu.pku.edu.cn">2401213545@stu.pku.edu.cn ↗</a></div></section></div>`;
  }
  function research(d) {
    return `${pageHeader(d.nav[1],d.researchLead)}<div class="project-index">${d.research.map((x,i)=>`<article><span class="project-number">${e(x[2])}</span><div><p class="meta">${e(x[1])}</p><h2><a href="${projectLink(d,i)}">${e(x[3])} ↗</a></h2><p>${e(x[4])}</p></div></article>`).join('')}</div><section class="publications">${sectionTitle(d.pubTitle)}${papers(d)}</section>`;
  }
  function project(d,slug) {
    const i = d.researchRoutes.indexOf(slug);
    const x = d.research[i];
    if (!x) return home(d);
    return `${pageHeader(x[3],x[1],['research.html',d.backResearch])}<article class="article-prose"><section><h2>${e(d.questionLabel)}</h2><p class="article-lead">${e(x[4])}</p></section><section><h2>${e(d.contribution)}</h2><p>${e(x[5])}</p></section><section><h2>${lang==='en'?'Approach & observations':'研究思路与认识'}</h2><p>${e(d.projectNotes[i])}</p></section><section><h2>${e(d.status)}</h2><p>${e(x[6])}</p></section></article><nav class="related-links" aria-label="Related research"><span class="meta">${e(d.projectFooter)}</span>${d.research.map((y,j)=>j!==i?`<a href="${projectLink(d,j)}">${e(y[3])} ↗</a>`:'').join('')}</nav>`;
  }
  function thoughts(d) {
    return `${pageHeader(d.nav[2],d.notesLead,['more.html',d.backMore])}<div class="topic-index">${d.thoughts.map((x,i)=>`<article><span class="meta">0${i+1}</span><div><h2><a href="thought-${x[0]}.html">${e(x[1])} ↗</a></h2><p>${e(x[2])}</p></div></article>`).join('')}</div>`;
  }
  function thought(d,slug) {
    const x = d.thoughts.find(x=>x[0]===slug);
    if (!x) return thoughts(d);
    return `${pageHeader(x[1],x[2],['thoughts.html',d.backThoughts])}<article class="article-prose">${proseSections(x[3])}</article>`;
  }
  function more(d) {
    const links=['design.html','games.html','water.html','thoughts.html'];
    const labels=lang==='en'?['Architecture','Games','In the water','Thoughts']:['建筑','游戏','在水里','文字思考'];
    const entries=d.more;
    const draftingTools=`<svg viewBox="0 0 160 140" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M28 25H51V117H28Z"/><path d="M28 38H38M28 51H35M28 64H38M28 77H35M28 90H38M28 103H35"/><path d="M91 28 106 33 82 106 67 101Z"/><path d="M91 28 94 20Q96 16 100 17L108 20Q112 21 111 25L108 33M67 101 68 119 82 106M70 114 73 115M97 31 74 103"/></svg>`;
    const controller=`<svg viewBox="0 0 160 110" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M48 29H112C125 29 132 42 136 58L141 77C144 90 136 97 127 89L111 74H49L33 89C24 97 16 90 19 77L24 58C28 42 35 29 48 29Z"/><path d="M44 43V65M33 54H55"/><circle cx="108" cy="47" r="3"/><circle cx="119" cy="58" r="3"/><path d="M68 62H74M86 62H92"/></svg>`;
    const diveKit=`<svg viewBox="0 0 160 150" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 30C24 24 40 23 56 28L65 34L74 28C90 23 106 24 110 30L107 57C99 65 82 63 74 50H56C48 63 31 65 23 57Z"/><path d="M24 34H48L54 39V47C49 55 33 58 28 52ZM106 34H82L76 39V47C81 55 97 58 102 52Z"/><path d="M20 37H12V52H22M110 37H117M126 13V60Q126 74 112 74H105V66"/><path d="M122 13H131"/><path d="M38 91L51 88L64 133Q50 142 28 135Z"/><path d="M40 92L38 109Q45 114 53 108L49 90"/><path d="M42 115L40 130M50 116L53 130"/><path d="M86 86L99 88L114 131Q97 142 78 135Z"/><path d="M87 89L87 106Q94 112 101 105L97 90"/><path d="M91 115L90 130M100 114L104 128"/></svg>`;
    return `<section class="more-hero"><div class="more-hero-copy"><h1>More<br>about me<span class="title-dot">.</span></h1></div><div class="portrait-composition personal-portals"><figure class="self-portrait"><img src="assets/personal/self-portrait.png" alt="${lang==='en'?'A line-drawn self-portrait by Haoran Liu':'刘浩然的线描自画像'}" width="988" height="988"><a class="head-portal" href="thoughts.html" aria-label="${lang==='en'?'Head — thoughts and reflections':'脑袋 — 进入文字思考'}"><span>${e(labels[3])} ↗</span></a><figcaption>${lang==='en'?'SELF-PORTRAIT / HAORAN LIU':'自画像 / 刘浩然'}</figcaption></figure><a class="floating-log portal-icon" href="design.html" aria-label="${lang==='en'?'Ruler and pencil — architecture portfolio':'尺子和笔 — 进入建筑作品集'}">${draftingTools}<span>${e(labels[0])} ↗</span></a><a class="floating-game portal-icon" href="games.html" aria-label="${lang==='en'?'Controller — game development':'手柄 — 进入游戏开发'}">${controller}<span>${e(labels[1])} ↗</span></a><a class="floating-water portal-icon" href="water.html" aria-label="${lang==='en'?'Diving mask and fins — swimming and underwater rugby':'潜水镜与脚蹼 — 进入游泳与水下橄榄球'}">${diveKit}<span>${e(labels[2])} ↗</span></a></div></section><div class="more-index more-editorial">${entries.map((x,i)=>`<article><div class="more-entry-title"><span class="meta">0${i+1}</span><h2><a href="${links[i]}">${e(x[0])} ↗</a></h2></div><div><p>${e(x[1])}</p></div></article>`).join('')}</div>`;
  }
  const gamesBack = () => ['games.html',lang==='en'?'← Games & prototypes':'← 游戏与原型'];
  function games(d) {
    const m = d.gameMedia, p = d.prototypes;
    const entries = [
      ['game-parkugo.html',d.gamesSections[0][0],m.intro],
      ['game-commonground.html','Common Ground',lang==='en'?'A participatory campus-garden project using playful interaction to connect spatial data, everyday care and co-design.':'以趣味交互连接空间数据、日常照料与共建设计的校园花园项目。'],
      ['game-mytravel.html',p.mytravel.title,p.mytravel.summary],
      ['game-trajectory.html',p.trajectory.title,p.trajectory.summary],
      ['game-emomap.html',p.emomap.title,p.emomap.summary]
    ];
    return `<div>${pageHeader(lang==='en'?'Games & prototypes':'游戏与原型',lang==='en'?'Location-based play, participatory care, tools for recording movement and an animated map of feelings: projects on how people connect with places.':'从基于位置的游戏、参与式照料、记录与分析移动的工具，到一段关于情绪的校园动画：关于人如何与场所发生联系的几个项目。',['more.html',d.backMore])}</div><div class="topic-index">${entries.map((x,i)=>`<article><span class="meta">0${i+1}</span><div><h2><a href="${x[0]}">${e(x[1])} ↗</a></h2><p>${e(x[2])}</p></div></article>`).join('')}</div>`;
  }
  function prototype(d,slug) {
    const m = d.prototypes[slug];
    const v = m.video;
    const video = v ? `<section class="story-video"><h2>${e(v.title)}</h2><figure><video controls playsinline preload="none" poster="${e(v.poster)}"><source src="${e(v.src)}" type="video/mp4"></video><figcaption>${e(v.caption)}</figcaption></figure></section>` : '';
    return `<div>${pageHeader(m.title,m.summary,gamesBack())}</div><div class="personal-story"><article class="article-prose"><p class="article-lead">${e(m.lead)}</p></article>${video}<article class="article-prose">${proseSections(m.sections)}</article></div>`;
  }
  function parkugo(d) {
    const m = d.gameMedia;
    return `<div>${pageHeader(d.gamesSections[0][0],m.intro,gamesBack())}</div><div class="personal-story"><div class="story-intro article-prose"><p class="article-lead">${e(d.gamesSections[0][1])}</p><div class="prototype-link"><a href="assets/parkugo-demo/index.html">${e(m.demo)}</a><p class="media-note">${e(m.note)}</p></div></div><section class="story-video"><h2>${e(m.video.title)}</h2><figure><video controls playsinline preload="none" poster="${e(m.video.poster)}"><source src="${e(m.video.src)}" type="video/mp4"></video><figcaption>${e(m.video.caption)}</figcaption></figure></section><section class="game-screens"><h2>${e(m.screenTitle)}</h2><div class="screen-gallery">${['home','roles','battle'].map((name,i)=>`<figure><a href="assets/personal/games/parkugo-${name}.webp" target="_blank" rel="noopener" aria-label="${e(m.screens[i])}"><img src="assets/personal/games/parkugo-${name}.webp" width="430" height="900" alt="${e(m.screens[i])}" loading="lazy"></a><figcaption>${e(m.screens[i])}</figcaption></figure>`).join('')}</div></section><article class="article-prose">${proseSections(d.gamesSections.slice(1,4))}</article></div>`;
  }
  function water(d) {
    const m = d.waterMedia;
    const picture = (name,i) => `<figure><img src="assets/personal/uwr/${name}.webp" width="${i===0?1800:i===1?1178:1350}" height="${i===0?1350:i===1?884:1800}" alt="${e(m.captions[i])}" loading="lazy"><figcaption>${e(m.captions[i])}</figcaption></figure>`;
    return `${pageHeader(d.more[2][0],lang==='en'?'Swimming & underwater rugby.':'游泳与水下橄榄球。',['more.html',d.backMore])}<div class="personal-story water-story">${picture('uwr',0)}<article class="article-prose">${proseSections(d.waterSections)}</article><div class="water-photo-pair">${picture('uwr3',2)}${picture('uwr4',3)}</div>${picture('uwr2',1)}<section class="water-video"><h2>${e(m.videoTitle)}</h2><figure><video controls playsinline preload="none" poster="assets/personal/uwr/video-poster.jpg" aria-label="${e(m.videoCaption)}"><source src="assets/personal/uwr/underwater-rugby.mp4" type="video/mp4"></video><figcaption>${e(m.videoCaption)}</figcaption></figure></section></div>`;
  }
  function designProject(slug) {
    const m=window.DESIGN_PROJECTS[slug][lang];
    const image=(id,caption,folder='bijie',ext='webp')=>`<figure><a href="assets/personal/${folder}/${id}.${ext}"><img src="assets/personal/${folder}/${id}.${ext}" alt="${e(caption)}" loading="lazy"></a><figcaption>${e(caption)}</figcaption></figure>`;
    const header=`<div>${pageHeader(m.title,m.intro,[slug==='commonground'?'games.html':`design.html#${slug}`,slug==='commonground'?gamesBack()[1]:(lang==='en'?'← Architecture projects':'← 建筑设计项目')])}</div>`;
    if(slug==='commonground') return `${header}<div class="personal-story design-story"><section><h2>${e(m.videoTitle)}</h2><figure><video controls playsinline preload="none" poster="assets/personal/commonground/poster.jpg"><source src="assets/personal/commonground/preview.mp4" type="video/mp4"></video><figcaption>${e(m.videoCaption)}</figcaption></figure><div class="prototype-link"><a href="assets/commonground-demo/index.html">${e(m.demo)}</a><p class="media-note">${e(m.note)}</p></div></section><article class="article-prose">${proseSections(m.sections)}</article></div>`;
    if(slug!=='bijie'){
      const project=window.DESIGN_PROJECTS[slug], v=project.video;
      const video=v?`<section class="story-video"><h2>${e(m.videoTitle)}</h2><figure><video controls playsinline preload="none" poster="${e(v.poster)}"><source src="${e(v.src)}" type="video/mp4"></video><figcaption>${e(m.videoCaption)}</figcaption></figure></section>`:'';
      const photos=project.images.map((x,i)=>{const caption=x[lang]||'';return `<figure><a href="${e(x.src)}"><img src="${e(x.src)}" alt="${e(caption||`${m.title} · ${lang==='en'?'photo':'照片'} ${i+1}`)}" loading="lazy"></a>${caption?`<figcaption>${e(caption)}</figcaption>`:''}</figure>`;}).join('');
      return `${header}<div class="personal-story design-story">${video}<section><div class="design-gallery">${photos}</div></section></div>`;
    }
    const ids=[1,2,7,19,17,15];
    return `${header}<div class="personal-story design-story">${image(23,m.caption)}<article class="article-prose">${proseSections(m.sections)}</article><section><h2>${e(m.galleryTitle)}</h2><div class="design-gallery">${ids.map((id,i)=>image(id,m.galleryCaptions[i])).join('')}</div><details class="design-all-photos"><summary>${e(m.all)}</summary><div class="design-gallery">${Array.from({length:25},(_,i)=>image(i+1,lang==='en'?`Bijie house · photograph ${i+1}`:`毕节住宅 · 照片 ${i+1}`)).join('')}</div></details></section><article class="article-prose design-reflection"><section><h2>${e(m.reflectionTitle)}</h2>${m.reflection.map((p,i)=>`<p${i===0?' class="article-lead"':''}>${e(p)}</p>`).join('')}</section></article><section><h2>${e(m.drawings)}</h2><div class="design-gallery">${[1,2,3].map(id=>`<figure><a href="assets/ppt-all/ppt/media/image${id}.jpeg"><img src="assets/ppt-all/ppt/media/image${id}.jpeg" alt="${lang==='en'?'Original architectural study':'原有建筑方案图'} ${id}" loading="lazy"></a></figure>`).join('')}</div></section></div>`;
  }
  function cv(d) {
    document.title=`${d.cvTitle} | ${lang==='en'?'Haoran Liu':'刘浩然'}`;
    document.querySelector('#cv-back').textContent=d.back;
    document.querySelector('#print-cv').textContent=d.print;
    document.querySelector('#cv-content').innerHTML=`<h1>${e(d.name)} <small>${e(d.chinese)}</small></h1><p>${e(d.affiliation)} · <a href="mailto:2401213545@stu.pku.edu.cn">2401213545@stu.pku.edu.cn</a></p><p>${e(d.intro)}</p><h2>${e(d.educationTitle)}</h2>${education(d)}<h2>${e(d.interestsTitle)}</h2>${d.interests.map(x=>`<h3>${e(x[0])}</h3><p>${e(x[1])}</p>`).join('')}<h2>${e(d.researchTitle)}</h2>${d.research.map(x=>`<article class="cv-project"><p class="meta">${e(x[1])}</p><h3>${e(x[3])}</h3><p>${e(x[4])}</p><p>${e(x[5])}</p><p class="scope">${e(x[6])}</p></article>`).join('')}<h2>${e(d.pubTitle)}</h2>${papers(d)}<h2>${e(d.honoursTitle)}</h2><ul class="honours-list">${d.honours.map(x=>`<li>${e(x)}</li>`).join('')}</ul><h2>${e(d.moreTitle)}</h2>${d.more.map(x=>`<h3>${e(x[0])}</h3><p>${e(x[1])}</p>`).join('')}<p class="meta">${e(d.updated)}</p>`;
  }
  function render() {
    const d=window.PROFILE[lang];
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    const button=document.querySelector('#language');
    button.textContent=lang==='en'?'中文':'EN';
    button.setAttribute('aria-label',lang==='en'?'Switch to Chinese':'切换为英文');
    if (page==='cv') { cv(d); return; }
    document.querySelector('#affiliation').textContent=d.affiliation;
    // Thoughts stays out of the top navigation until it has more content; it is reached from the More self-portrait.
    const group=page==='home'?0:page==='research'||page.startsWith('project-')?1:3;
    document.querySelector('#navigation').innerHTML=routes.map((route,i)=>i===2?'':`<a href="${route}"${i===group?' aria-current="page"':''}>${e(d.nav[i])}</a>`).join('');
    let html;
    if(page==='home') html=home(d);
    else if(page==='research') html=research(d);
    else if(page.startsWith('project-')) html=project(d,page.slice(8));
    else if(page==='thoughts') html=thoughts(d);
    else if(page.startsWith('thought-')) html=thought(d,page.slice(8));
    else if(page==='more') html=more(d);
    else if(page==='games') html=games(d);
    else if(page==='game-parkugo') html=parkugo(d);
    else if(['game-mytravel','game-trajectory','game-emomap'].includes(page)) html=prototype(d,page.slice(5));
    else if(page==='water') html=water(d);
    else if(page.startsWith('design-')) html=designProject(page.slice(7));
    else if(page==='game-commonground') html=designProject('commonground');
    else html=home(d);
    document.querySelector('#page-content').innerHTML=html;
    const heading=document.querySelector('#page-content h1')?.cloneNode(true);
    heading?.querySelectorAll('br').forEach(br=>br.replaceWith(' '));
    heading?.querySelector('.title-dot')?.remove();
    document.title=page==='home'?`${d.name} | ${lang==='en'?'Geography & Human Mobility':'地理学 · 人类移动'}`:`${heading?.textContent.replace(/\s+/g,' ').trim() || d.name} | ${lang==='en'?'Haoran Liu':'刘浩然'}`;
    document.querySelector('#footer').innerHTML=`<a href="mailto:2401213545@stu.pku.edu.cn">2401213545@stu.pku.edu.cn</a><span>${e(d.updated)}</span>`;
  }
  let flipLayer = null;
  let flipAnimations = [];
  let flipBusy = false;
  function clearFlip() {
    flipAnimations.forEach(animation => animation.cancel());
    flipAnimations = [];
    flipLayer?.remove();
    flipLayer = null;
    flipBusy = false;
    document.body.classList.remove('is-grid-flipping');
  }
  function pageFromLocation() {
    const name = location.pathname.split('/').pop().replace(/\.html$/, '');
    return !name || name === 'index' ? 'home' : name;
  }
  const motionScale = 2 / 5.4;
  const blankWord = '<svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><text x="14" y="157" fill="currentColor" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="500" font-size="155" textLength="272" lengthAdjust="spacingAndGlyphs">BLANK</text></svg>';
  function buildFlipLayer(word) {
    const columns = innerWidth < 760 ? 3 : 5;
    const rows = 5;
    const tileWidth = innerWidth / columns;
    const tileHeight = innerHeight / rows;
    const layer = document.createElement('div');
    layer.className = 'grid-flip-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    const pieces = [];
    const quotes = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-flip-cell';
        // Whole-pixel edges keep the dividing lines sharp; neighbouring cells meet exactly.
        const left = Math.round(col * tileWidth), top = Math.round(row * tileHeight);
        Object.assign(cell.style, { left: `${left}px`, top: `${top}px`, width: `${Math.round((col + 1) * tileWidth) - left}px`, height: `${Math.round((row + 1) * tileHeight) - top}px` });
        const tile = document.createElement('div');
        tile.className = 'grid-flip-tile';
        const middle = Math.floor(columns / 2);
        if (row === 2 && col === middle) {
          const quote = document.createElement('div');
          quote.className = 'grid-flip-quote';
          quote.innerHTML = `<div class="grid-flip-word-card"><div class="grid-flip-word-face">${word}</div></div>`;
          tile.append(quote);
          quotes.push(quote);
        }
        cell.append(tile);
        layer.append(cell);
        pieces.push({ tile, row, col });
      }
    }
    flipLayer = layer;
    flipBusy = true;
    document.body.append(layer);
    document.body.classList.add('is-grid-flipping');
    return { layer, pieces, quotes };
  }
  async function flipDown(layer, pieces) {
    layer.dataset.phase = 'flip-down';
    pieces.forEach(({ tile }) => { tile.style.transformOrigin = 'center bottom'; });
    flipAnimations = pieces.map(({ tile, row }) => tile.animate([
      { transform: 'rotateX(0deg)', opacity: 1 },
      { transform: 'rotateX(-75deg)', opacity: 1, offset: 0.85 },
      { transform: 'rotateX(-90deg)', opacity: 0 }
    ], { duration: 480 * motionScale, delay: (80 + row * 120) * motionScale, easing: 'cubic-bezier(.3,0,.25,1)', fill: 'forwards' }));
    await Promise.allSettled(flipAnimations.map(animation => animation.finished));
    if (flipLayer !== layer) return;
    clearFlip();
    const heading = document.querySelector('#page-content h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
  async function flipToMore(url) {
    if (flipBusy) return;
    const type = `<svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><g fill="currentColor" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="500" font-size="62">${['DESIGN', 'IS IMAGINATION', 'FACING THE…'].map((line, i) => `<text x="14" y="${[60, 119, 178][i]}" textLength="272" lengthAdjust="spacingAndGlyphs">${line}</text>`).join('')}</g></svg>`;
    const { layer, pieces, quotes } = buildFlipLayer(type);
    layer.dataset.phase = 'black-grid';
    flipAnimations = pieces.map(({ tile, row }) => tile.animate([
      { transform: 'rotateX(90deg)', opacity: 1 }, { transform: 'rotateX(0deg)', opacity: 1 }
    ], { duration: 420 * motionScale, delay: row * 60 * motionScale, easing: 'cubic-bezier(.3,0,.25,1)', fill: 'both' }));
    await Promise.allSettled(flipAnimations.map(animation => animation.finished));
    if (flipLayer !== layer) return;
    layer.dataset.phase = 'quote-hold';
    await new Promise(resolve => setTimeout(resolve, 900 * motionScale));
    if (flipLayer !== layer) return;
    const card = quotes[0].querySelector('.grid-flip-word-card');
    const face = card.querySelector('.grid-flip-word-face');
    async function turnWord(markup, white) {
      const outgoing = card.animate([
        { transform: 'rotateX(0deg)', opacity: 1 },
        { transform: 'rotateX(-75deg)', opacity: 1, offset: 0.85 },
        { transform: 'rotateX(-90deg)', opacity: 0 }
      ], { duration: 350 * motionScale, easing: 'cubic-bezier(.3,0,.25,1)', fill: 'forwards' });
      flipAnimations.push(outgoing);
      await Promise.allSettled([outgoing.finished]);
      if (flipLayer !== layer) return;
      face.innerHTML = markup;
      face.classList.toggle('grid-flip-word-white', white);
      const incoming = card.animate([
        { transform: 'rotateX(90deg)', opacity: 1 },
        { transform: 'rotateX(0deg)', opacity: 1 }
      ], { duration: 350 * motionScale, easing: 'cubic-bezier(.3,0,.25,1)', fill: 'forwards' });
      flipAnimations.push(incoming);
      await Promise.allSettled([incoming.finished]);
    }
    layer.dataset.phase = 'word-flip';
    await turnWord('', true);
    if (flipLayer !== layer) return;
    layer.dataset.phase = 'white-hold';
    await new Promise(resolve => setTimeout(resolve, 650 * motionScale));
    if (flipLayer !== layer) return;
    layer.dataset.phase = 'blank-flip';
    await turnWord(blankWord, false);
    if (flipLayer !== layer) return;
    layer.dataset.phase = 'blank-hold';
    await new Promise(resolve => setTimeout(resolve, 750 * motionScale));
    if (flipLayer !== layer) return;
    try {
      history.replaceState({ ...history.state, page, scrollY: scrollY }, '', location.href);
      history.pushState({ page: 'more', scrollY: 0, enteredFromMore: false }, '', url);
    } catch (_) {
      // Pages opened as local files cannot push another file's URL; load More and finish the reveal there.
      try { sessionStorage.setItem('haoran-flip-in', '1'); } catch (_) {}
      location.href = url;
      return;
    }
    enteredFromMore = false;
    page = 'more';
    document.body.dataset.page = page;
    render();
    window.scrollTo(0, 0);
    await flipDown(layer, pieces);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (link.closest('#page-content') && url.origin === location.origin && (page === 'more' || (enteredFromMore && /\/thought(?:s|-.*)\.html$/.test(url.pathname)))) {
      url.searchParams.set('from', 'more');
      link.href = url.href;
      try { sessionStorage.setItem('haoran-more-origin', url.pathname); } catch (_) {}
    }
    if (!['home', 'research', 'thoughts'].includes(page) || enteredFromMore || url.origin !== location.origin || !url.pathname.endsWith('/more.html')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof Element.prototype.animate !== 'function') return;
    event.preventDefault();
    flipToMore(url.href);
  });
  window.addEventListener('popstate', event => {
    clearFlip();
    const nextPage = pageFromLocation();
    if (nextPage === 'cv' || page === 'cv') { location.reload(); return; }
    enteredFromMore = !!event.state?.enteredFromMore || new URLSearchParams(location.search).get('from') === 'more';
    page = nextPage;
    document.body.dataset.page = page;
    render();
    window.scrollTo(0, event.state?.scrollY || 0);
  });
  render();
  let flipIn = false;
  try { flipIn = sessionStorage.getItem('haoran-flip-in') === '1'; sessionStorage.removeItem('haoran-flip-in'); } catch (_) {}
  if (flipIn && page === 'more') {
    const { layer, pieces } = buildFlipLayer(blankWord);
    requestAnimationFrame(() => flipDown(layer, pieces));
  }
  document.documentElement.classList.remove('flip-arriving');
  document.querySelector('#language').addEventListener('click',()=>{
    lang=lang==='en'?'zh':'en';
    try { localStorage.setItem('haoran-language',lang); } catch (_) {}
    render();
  });
  document.querySelector('#print-cv')?.addEventListener('click',()=>window.print());
})();
