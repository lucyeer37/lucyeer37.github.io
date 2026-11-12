(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const name = config.name || '肆风';
  let posts = [], loadingError = false;
  document.querySelectorAll('[data-site-name]').forEach(el => el.textContent = name);
  $('#profile-bio').textContent = config.bio || '';
  $('#announcement').textContent = config.announcement || '';
  $('#announcement').style.whiteSpace = 'pre-line';
  $('#year').textContent = new Date().getFullYear();
  const art = `<svg class="empty-illustration" viewBox="0 0 240 160" fill="none" aria-hidden="true"><ellipse cx="120" cy="136" rx="77" ry="8" fill="currentColor" opacity=".045"/><circle cx="120" cy="74" r="60" fill="currentColor" opacity=".035"/><path d="M67 116c15-11 33-11 53-3 21-8 38-8 54 3V55c-18-8-35-6-54 2-20-8-38-10-53-2Z" fill="var(--card)" stroke="currentColor" stroke-width="1.4" opacity=".7"/><path d="M120 57v56M77 66c11-4 22-3 33 1m-33 9c11-4 22-3 33 1m20-10c11-4 23-5 33-1M77 86c11-4 22-3 33 1m-33 9c11-4 22-3 33 1" stroke="currentColor" stroke-width="1" opacity=".22"/><path d="m141 103 10-27 29-27-14 34Z" fill="#b7cdc2"/><path d="m141 103 29-39m-20 27 10-1m-4-8 1-9" stroke="#729588" stroke-width="1.3"/><path d="M35 61h20a6 6 0 1 0-6-6m132 50h18a5 5 0 1 0-5-5m-5-29h16" stroke="currentColor" opacity=".4" stroke-width="1.4" stroke-linecap="round"/><circle cx="53" cy="100" r="2" fill="currentColor" opacity=".2"/><path d="m176 29 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#cbbf9c"/><circle cx="82" cy="30" r="1.7" fill="currentColor" opacity=".25"/></svg>`;
  const empty = (title, body, caption = 'THE STORY IS YET TO COME', count = true) => `<div class="empty-panel card">${count ? '<span class="empty-number">0 ENTRIES</span>' : ''}<div>${art}<h3>${escapeHTML(title)}</h3><p>${escapeHTML(body)}</p><p class="empty-caption">${caption}</p></div></div>`;
  const heading = (title, en, detail = '') => `<div class="section-heading"><h2>${escapeHTML(title)}<small>${escapeHTML(en)}</small></h2><span>${escapeHTML(detail)}</span></div>`;
  const postURL = post => `#/post/${encodeURIComponent(post.id)}`;
  const postCard = post => `<a class="post-card card" href="${postURL(post)}"><span class="post-meta">${escapeHTML(post.date)}${post.category ? ' / ' + escapeHTML(post.category) : ''}</span><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt || '')}</p><span class="post-meta">阅读全文 ↗</span></a>`;
  function updateStats() {
    $('#post-count').textContent = posts.length;
    $('#info-count').textContent = `${posts.length} 篇`;
    $('#tag-count').textContent = new Set(posts.flatMap(p => p.tags || [])).size;
    $('#category-count').textContent = new Set(posts.map(p => p.category).filter(Boolean)).size;
    if (posts.length) $('#recent-posts').innerHTML = posts.slice(0, 3).map(p => `<a class="search-result" href="${postURL(p)}">${escapeHTML(p.title)}<small>${escapeHTML(p.date)}</small></a>`).join('');
  }
  function render() {
    if (location.hash === '#content') return;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const route = parts[0] || 'home';
    let detail;
    try { detail = decodeURIComponent(parts.slice(1).join('/')); } catch { detail = ''; }
    const routeNames = {home:name,archives:'归档',tags:'标签',categories:'分类',links:'友情链接',guestbook:'留言板',about:'关于'};
    let title = routeNames[route] || '文章';
    $('#hero').classList.toggle('inner', route !== 'home');
    $('#hero-title').textContent = title;
    $('#hero-subtitle').textContent = route === 'home' ? config.subtitle || '肆意生长，自在如风。' : {archives:'把走过的日子，轻轻收藏。',tags:'每个关键词，都是一条新的小径。',categories:'给思绪，留一个安放的地方。',links:'山海之间，总有同路的风。',guestbook:'风过留声，见字如面。',about:'一个小小的空间，一种自在的节奏。'}[route] || '';
    document.querySelectorAll('[data-route]').forEach(el => { const active = el.dataset.route === route; el.classList.toggle('active', active); if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    let html = '';
    if (route === 'home') {
      html = heading('文章', 'JOURNAL', `${posts.length} 篇记录`) + `<div class="welcome-strip card">${icon('wind')}<span>风从这里经过，故事从这里开始。</span><span>A NEW BEGINNING</span></div>`;
      html += posts.length ? posts.map(postCard).join('') : empty('留白，是故事的开始', '还没有发布文章。未来的探索、灵感与日常，都将在这里慢慢展开。');
      html += '<div class="below-note"><span>不急，慢慢记录。</span><span>END OF THE PAGE · BEGINNING OF A STORY</span></div>';
    } else if (route === 'archives') {
      html = heading('时间归档', 'ARCHIVES', `${posts.length} 篇记录`);
      html += posts.length ? `<div class="card">${posts.map(p => `<a class="archive-row" href="${postURL(p)}"><time>${escapeHTML(p.date)}</time><span>${escapeHTML(p.title)}</span></a>`).join('')}</div>` : empty('时光，尚待落笔', '第一篇文章发布后，会在这里留下时间的足迹。');
    } else if (route === 'tags' || route === 'categories') {
      const isTags = route === 'tags', values = [...new Set(isTags ? posts.flatMap(p => p.tags || []) : posts.map(p => p.category).filter(Boolean))];
      const selected = posts.filter(p => isTags ? (p.tags || []).includes(detail) : p.category === detail);
      html = heading(detail || (isTags ? '所有标签' : '文章分类'), isTags ? 'TAGS' : 'CATEGORIES', `${values.length} 个${isTags ? '标签' : '分类'}`);
      html += detail ? (selected.length ? selected.map(postCard).join('') : empty('这里暂时留白', '还没有与此相关的文章。')) : values.length ? `<div class="filter-list card">${values.map(v => `<a class="filter-chip" href="#/${route}/${encodeURIComponent(v)}">${escapeHTML(v)} <small>${posts.filter(p => isTags ? (p.tags || []).includes(v) : p.category === v).length}</small></a>`).join('')}</div>` : empty(isTags ? '灵感，还没有被命名' : '为未来的思绪，留个位置', isTags ? '文章添加标签后，会自动汇集在这里。' : '文章添加分类后，会自动整理在这里。');
    } else if (route === 'guestbook') {
      html = heading('风过留声', 'GUESTBOOK') + window.SIFENG_GUESTBOOK.layout();
    } else if (route === 'about') {
      html = heading('关于肆风', 'ABOUT') + `<div class="about-panel card"><span class="about-kicker">A SPACE TO BE MYSELF</span><h3>${escapeHTML(name)}</h3><p>${escapeHTML(config.subtitle || '')}</p><p>${escapeHTML(config.about || '关于我的故事，稍后再慢慢告诉你。')}</p></div>`;
    } else if (route === 'links') {
      const links = (config.links || []).filter(link => /^https?:\/\//i.test(link.url));
      html = heading('友情链接', 'FRIENDS', `${links.length} 位同行者`) + (links.length ? `<div class="card">${links.map(link => `<a class="friend-row" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.name)} ↗<span>${escapeHTML(link.description || '')}</span></a>`).join('')}</div>` : empty('等一阵，同路的风', '这里留给未来相遇的朋友。', 'GOOD THINGS TAKE TIME', false));
    } else if (route === 'post') {
      const post = posts.find(p => String(p.id) === detail);
      if (post) { title = post.title; $('#hero-title').textContent = title; $('#hero-subtitle').textContent = post.date || ''; html = `<article class="article card"><a class="post-meta" href="#/">← 返回文章列表</a><h2>${escapeHTML(post.title)}</h2><p class="post-meta">${escapeHTML(post.date)} · ${escapeHTML(post.category || '')}</p><div class="article-body">${escapeHTML(post.content || '')}</div></article>`; }
      else html = empty('这篇故事，还未抵达', '文章可能尚未发布，可以返回首页看看。', '<a href="#/">返回首页 →</a>', false);
    } else {
      title = '页面未找到'; $('#hero-title').textContent = title;
      html = empty('风把这一页吹远了', '可以通过顶部导航返回首页。', '<a href="#/">返回首页 →</a>', false);
    }
    $('#main-view').innerHTML = (loadingError ? '<p class="error-note" role="alert">文章列表暂时读取失败，请刷新重试。</p>' : '') + html;
    if (route === 'guestbook') window.SIFENG_GUESTBOOK.mount();
    document.title = `${title === name ? name + ' · 自在如风' : title + ' · ' + name}`;
    $('#nav-links').classList.remove('open'); $('#menu-button').setAttribute('aria-expanded', 'false');
  }
  window.addEventListener('hashchange', () => { render(); if (location.hash !== '#content') window.scrollTo({top:0,behavior:'instant'}); });
  $('#menu-button').addEventListener('click', () => { const opened = $('#nav-links').classList.toggle('open'); $('#menu-button').setAttribute('aria-expanded', String(opened)); });
  const dialog = $('#search-dialog');
  function search() {
    const query = $('#search-input').value.trim().toLocaleLowerCase();
    const matches = posts.filter(p => `${p.title} ${p.excerpt || ''} ${p.content || ''} ${(p.tags || []).join(' ')}`.toLocaleLowerCase().includes(query));
    $('#search-results').innerHTML = !posts.length ? '还没有文章。等第一篇故事到来，再来这里寻找吧。' : !query ? '输入关键词，寻找你想读的文章。' : matches.length ? matches.map(p => `<a class="search-result" href="${postURL(p)}">${escapeHTML(p.title)}<small>${escapeHTML(p.date)}</small></a>`).join('') : '没有找到相关记录，试试另一个关键词。';
  }
  $('#search-button').addEventListener('click', () => { search(); dialog.showModal(); $('#search-input').focus(); });
  $('#search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); dialog.close(); } });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  $('#search-results').addEventListener('click', event => { if (event.target.closest('a')) dialog.close(); });
  $('#search-input').addEventListener('input', search);
  function setTheme(dark) { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('#theme-button').setAttribute('aria-pressed', String(dark)); $('#theme-button').setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式'); }
  try { setTheme(localStorage.getItem('sifeng-theme') === 'dark'); } catch { setTheme(false); }
  $('#theme-button').addEventListener('click', () => { const dark = document.documentElement.dataset.theme !== 'dark'; setTheme(dark); try { localStorage.setItem('sifeng-theme', dark ? 'dark' : 'light'); } catch {} });
  $('#back-to-top').addEventListener('click', () => window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  window.addEventListener('scroll', () => $('#back-to-top').classList.toggle('visible', window.scrollY > 350), {passive:true});
  render();
  fetch('posts.json').then(response => { if (!response.ok) throw Error('Unable to load posts'); return response.json(); }).then(data => {
    if (!Array.isArray(data)) throw Error('Posts must be an array');
    posts = data.filter(p => p && typeof p.id === 'string' && typeof p.title === 'string').sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    updateStats(); render();
  }).catch(() => { loadingError = true; render(); });
})();
