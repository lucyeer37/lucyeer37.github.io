(() => {
  'use strict';
  const repository = 'lucyeer37/lucyeer37.github.io';
  const issueNumber = 1;
  const issueURL = `https://github.com/${repository}/issues/${issueNumber}`;
  const apiURL = `https://api.github.com/repos/${repository}/issues/${issueNumber}`;
  const pageSize = 20;
  const state = { comments: [], total: null, nextPage: 0, loading: false, loaded: false, error: '', notice: '', snapshotComments: null, locked: false, request: 0 };
  let controller;
  const find = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false}).format(date); };
  const illustration = `<svg class="guestbook-art" viewBox="0 0 190 120" fill="none" aria-hidden="true"><ellipse cx="96" cy="106" rx="60" ry="6" fill="currentColor" opacity=".05"/><circle cx="95" cy="57" r="47" fill="currentColor" opacity=".04"/><path d="M48 32h80v49H76L58 94V81H48Z" fill="var(--card)" stroke="currentColor" stroke-width="1.5" opacity=".7"/><path d="M71 47h34M71 57h43M71 67h23" stroke="currentColor" stroke-linecap="round" opacity=".35"/><path d="M110 55h34v34h-6l-10 9v-9h-18Z" fill="var(--soft)" stroke="currentColor" opacity=".6"/><path d="M120 67h14m-14 8h9" stroke="currentColor" opacity=".4"/><path d="m146 20 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#cbbf9c"/><path d="M23 61h11a5 5 0 1 0-5-5m122 43h15" stroke="currentColor" stroke-linecap="round" opacity=".35"/></svg>`;

  function layout() {
    return `<section class="card guestbook-welcome"><span class="about-kicker">A NOTE LEFT IN THE WIND</span><h3>很高兴，你来过。</h3><p>一句问候、一个建议，或是此刻的小小心情。<br>把想说的话留在这里，让相遇多一点回声。</p><div class="guestbook-actions"><a class="guestbook-primary" id="guestbook-write" href="${issueURL}#new_comment_field" target="_blank" rel="noopener noreferrer"><svg class="icon" aria-hidden="true"><use href="#i-message"/></svg>用 GitHub 留言 <span aria-hidden="true">↗</span></a><a class="guestbook-thread" href="${issueURL}" target="_blank" rel="noopener noreferrer">查看完整讨论 ↗</a></div><p class="guestbook-help" id="guestbook-instructions">需要 GitHub 账号。在打开的页面登录并发表评论，发布后返回这里刷新即可。</p></section><section class="card guestbook-messages" aria-labelledby="guestbook-list-title"><div class="guestbook-toolbar"><h3 id="guestbook-list-title">路过的声音 <span id="guestbook-count">—</span></h3><button type="button" id="guestbook-refresh" aria-label="刷新留言">↻ 刷新</button></div><p class="guestbook-status" id="guestbook-status" role="status" aria-live="polite"></p><div id="guestbook-feed" aria-busy="true"></div><div class="guestbook-pagination"><button type="button" id="guestbook-older" hidden>加载更早的留言</button></div><p class="guestbook-footnote">留言公开展示 · 友善交流，欢迎常来</p></section>`;
  }

  function paint() {
    const feed = find('guestbook-feed');
    if (!feed) return;
    find('guestbook-count').textContent = state.total === null ? '—' : `${state.total} 条`;
    const status = find('guestbook-status');
    status.textContent = state.error || (state.loading ? '正在接住风里的声音…' : state.notice);
    status.classList.toggle('is-error', Boolean(state.error));
    feed.setAttribute('aria-busy', String(state.loading));
    const refresh = find('guestbook-refresh');
    refresh.disabled = state.loading;
    const older = find('guestbook-older');
    older.hidden = state.nextPage < 1;
    older.disabled = state.loading;
    const write = find('guestbook-write');
    write.href = state.locked ? issueURL : `${issueURL}#new_comment_field`;
    if (state.locked) {
      write.innerHTML = '查看 GitHub 留言 ↗';
      find('guestbook-instructions').textContent = '留言板暂时停止接收新留言，已有留言仍可查看。';
    } else {
      write.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-message"/></svg>用 GitHub 留言 <span aria-hidden="true">↗</span>';
      find('guestbook-instructions').textContent = '需要 GitHub 账号。在打开的页面登录并发表评论，发布后返回这里刷新即可。';
    }
    if (!state.comments.length) {
      feed.innerHTML = state.loading ? `<div class="guestbook-empty">${illustration}<p>稍等，留言正在路上。</p></div>` : state.error ? `<div class="guestbook-empty">${illustration}<h4>暂时没能听见风的回声</h4><p>可以点击刷新重试，或<a href="${issueURL}" target="_blank" rel="noopener noreferrer">前往 GitHub 查看留言 ↗</a></p></div>` : `<div class="guestbook-empty">${illustration}<h4>第一声问候，留给你。</h4><p>这里还没有留言。欢迎写下第一句，开启我们的对话。</p></div>`;
      return;
    }
    feed.innerHTML = state.comments.map(comment => {
      const login = typeof comment.user?.login === 'string' ? comment.user.login : '已注销用户';
      const owner = login === repository.split('/')[0];
      const id = String(comment.id);
      const permalink = /^\d+$/.test(id) ? `${issueURL}#issuecomment-${id}` : issueURL;
      return `<article class="guestbook-comment"><div class="guestbook-avatar" aria-hidden="true">${escapeHTML(login.slice(0,1).toUpperCase())}</div><div class="guestbook-comment-main"><header><span class="guestbook-author">${escapeHTML(login)}</span>${owner ? '<span class="guestbook-owner">博主</span>' : ''}<a href="${permalink}" target="_blank" rel="noopener noreferrer" class="guestbook-date"><time datetime="${escapeHTML(comment.created_at)}">${escapeHTML(dateText(comment.created_at))}</time></a></header><p class="guestbook-body">${escapeHTML(comment.body || '（这条留言没有文字内容）')}</p><a class="guestbook-reply" href="${permalink}" target="_blank" rel="noopener noreferrer">查看 / 回复 ↗</a></div></article>`;
    }).join('');
  }

  async function requestJSON(url, signal) {
    const response = await fetch(url, {signal, headers:{Accept:'application/vnd.github+json'}, cache:'no-store', credentials:'omit'});
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) throw Error('访问暂时较多，请稍后刷新；你也可以直接前往 GitHub 查看和发布留言。');
      throw Error('留言暂时加载失败，请点击刷新重试，或前往 GitHub 查看。');
    }
    return response.json();
  }

  async function load(older = false) {
    if (state.loading) return;
    if (older && state.snapshotComments) {
      state.comments = state.snapshotComments.slice(0, state.comments.length + pageSize);
      state.nextPage = state.comments.length < state.snapshotComments.length ? 1 : 0;
      paint(); return;
    }
    const revision = ++state.request;
    state.loading = true; state.error = ''; state.notice = '';
    controller?.abort(); controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    paint();
    try {
      let page;
      if (older) {
        page = state.nextPage;
        if (page < 1) return;
      } else {
        const issue = await requestJSON(apiURL, controller.signal);
        if (!Number.isSafeInteger(issue.comments) || issue.comments < 0) throw Error('留言数据暂时无法读取，请稍后重试。');
        state.total = issue.comments; state.locked = Boolean(issue.locked);
        page = Math.max(1, Math.ceil(issue.comments / pageSize));
      }
      const data = state.total === 0 ? [] : await requestJSON(`${apiURL}/comments?per_page=${pageSize}&page=${page}`, controller.signal);
      if (!Array.isArray(data)) throw Error('留言数据暂时无法读取，请稍后重试。');
      if (revision !== state.request) return;
      const comments = data.filter(c => c && Number.isSafeInteger(c.id)).reverse();
      state.snapshotComments = null;
      state.comments = older ? [...new Map([...state.comments,...comments].map(c => [c.id,c])).values()] : comments;
      state.nextPage = page - 1; state.loaded = true;
    } catch (error) {
      if (revision !== state.request) return;
      try {
        const snapshot = await requestJSON(`guestbook-data.json?t=${Date.now()}`, AbortSignal.timeout(10000));
        if (snapshot.issue_number !== issueNumber || !Array.isArray(snapshot.comments) || snapshot.total !== snapshot.comments.length) throw Error('Invalid snapshot');
        if (revision !== state.request) return;
        state.snapshotComments = snapshot.comments.filter(c => c && Number.isSafeInteger(c.id)).reverse();
        state.comments = state.snapshotComments.slice(0, pageSize);
        state.total = snapshot.total; state.locked = Boolean(snapshot.locked);
        state.nextPage = state.snapshotComments.length > pageSize ? 1 : 0;
        state.loaded = true;
        state.notice = '已显示最近同步的留言；新留言可能需要稍等片刻，再刷新查看。';
      } catch {
        state.error = error.name === 'AbortError' ? '连接有些慢，请点击刷新重试，或直接前往 GitHub 留言。' : error.message || '留言暂时加载失败，请稍后重试。';
      }
    } finally {
      clearTimeout(timer);
      if (revision === state.request) { state.loading = false; paint(); }
    }
  }

  function mount() {
    find('guestbook-refresh').onclick = () => load();
    find('guestbook-older').onclick = () => load(true);
    paint();
    if (!state.loaded && !state.loading) load();
  }
  window.SIFENG_GUESTBOOK = { layout, mount };
})();
