/* Interaction-only prototype: no fetch, no backend, no actual uploads.
 * sessionStorage is namespaced and only holds this tab's demonstration data.
 * Cursor: replace these transitions with production behavior; do not ship this file. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const prefix = window.osnJourney.prefix;
  const read = (key, fallback = null) => { try { return JSON.parse(sessionStorage.getItem(prefix + key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { sessionStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* Private mode: still allow the interaction. */ } };
  const remove = key => { try { sessionStorage.removeItem(prefix + key); } catch {} };
  const show = (el, visible) => { if (el) el.hidden = !visible; };
  const fmt = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const parseTime = value => /^\d{1,4}:[0-5]\d$/.test(value.trim()) ? value.trim().split(':').reduce((a, b) => a * 60 + Number(b), 0) : NaN;
  const toast = message => { const el = $('#toast'); el.textContent = message; show(el, true); window.setTimeout(() => show(el, false), 3500); };
  let dirty = false;
  let leaving = '';
  let captured = page === 'watch-record';
  let clipValid = true;
  const recordForm = $('#record-form');
  const saveButton = $('[data-save]');
  const getFormData = () => recordForm ? Object.fromEntries(new FormData(recordForm)) : {};
  const saveDraft = () => write('draft', getFormData());

  function updateRecord() {
    if (!recordForm) return;
    const data = getFormData();
    const rating = Number(data.rating || 0);
    $$('.star-choice', recordForm).forEach((label, i) => label.classList.toggle('is-filled', i < rating));
    const captions = ['星を1つタップしてください', '★1：次にチャレンジ', '★2：もう少し', '★3：できた', '★4：よくできた', '★5：とてもよくできた'];
    $('#rating-status').textContent = captions[rating];
    if ($('#summary-type')) $('#summary-type').textContent = data['play-type'] || 'プレーを選んでください';
    if ($('#summary-rating')) $('#summary-rating').textContent = rating ? captions[rating] : '評価は、今の自分の感覚で。';
    const ready = Boolean(data['play-type'] && rating && clipValid && (!page.startsWith('watch') || captured));
    if (saveButton) saveButton.disabled = !ready;
    if ($('#dock-copy')) $('#dock-copy').textContent = ready ? `${data['play-type']} · ★${rating}${captured ? ' · ' + $('#clip-caption').textContent.split(' · ')[0] : ''}` : !clipValid ? '開始・終了の時刻を確認してください' : '種別と★を選ぶと保存できます';
  }

  function addType(name, select = true) {
    if (!recordForm) return;
    let input = $$('[name="play-type"]').find(el => el.value === name);
    if (!input) {
      const label = document.createElement('label'); label.className = 'type-choice';
      input = document.createElement('input'); input.type = 'radio'; input.name = 'play-type'; input.value = name; input.required = true;
      const span = document.createElement('span'); span.textContent = name;
      label.append(input, span); $('#type-grid').append(label);
    }
    if (select) input.checked = true;
  }

  if (new URLSearchParams(location.search).get('new') === '1') { remove('draft'); remove('attachment'); }
  if (recordForm) {
    const params = new URLSearchParams(location.search);
    const draft = read('draft');
    if (draft && page === 'record') {
      if (draft['play-type']) addType(draft['play-type']);
      for (const [key, value] of Object.entries(draft)) {
        const fields = $$(`[name="${key}"]`, recordForm);
        fields.forEach(el => { if (el.type === 'radio') el.checked = el.value === value; else el.value = value; });
      }
      dirty = Object.values(draft).some(Boolean);
    }
    if (params.get('match') === 'aoba') $('[name="match"]').value = 'aoba';
    const attachment = read('attachment');
    if (attachment && $('#record-attachment')) { show($('#record-attachment'), true); $('#record-attachment span').textContent = `動画あり · ${attachment.label}`; }
    recordForm.addEventListener('input', () => { dirty = true; updateRecord(); });
    recordForm.addEventListener('change', () => { dirty = true; updateRecord(); });
    recordForm.addEventListener('submit', event => { event.preventDefault(); if (!saveButton?.disabled) saveButton?.click(); });
    updateRecord();
  }

  $$('[data-open-type]').forEach(el => el.addEventListener('click', () => { $('#custom-type').value = ''; $('#custom-type').setCustomValidity(''); $('#add-type-dialog').showModal(); $('#custom-type').focus(); }));
  $$('[data-close-dialog]').forEach(el => el.addEventListener('click', () => el.closest('dialog').close()));
  function submitType(event) {
    event.preventDefault(); const input = $('#custom-type'); const name = input.value.trim();
    input.setCustomValidity(!name ? '種別の名前を入力してください。' : [...name].length > 16 ? '16文字以内で入力してください。' : $$('[name="play-type"]').some(el => el.value === name) ? '同じ名前の種別があります。' : '');
    if (!input.reportValidity()) return;
    addType(name); dirty = true; updateRecord(); $('#add-type-dialog').close(); toast(`「${name}」を追加しました`);
  }
  $('#custom-type')?.addEventListener('input', () => $('#custom-type').setCustomValidity(''));
  $('#add-type-form')?.addEventListener('submit', submitType);
  $('[data-add-type]')?.addEventListener('click', submitType);

  function completeSave() {
    const data = recordForm ? getFormData() : { 'play-type': 'パス', rating: '4', match: 'aoba', memo: '顔を上げて、前にパスできた。' };
    const recordDate = window.osnJourney.matchDate(data.match) || window.osnJourney.date;
    const result = { ...data, id: crypto.randomUUID(), date: recordDate, goal: window.osnJourney.profile().goal, focus: window.osnJourney.profile().focus, attachment: read('attachment'), start: captured ? $('#start-time').value : null, end: captured ? $('#end-time').value : null };
    window.osnJourney.ensureDay(recordDate, data.match ? '試合' : ''); write('selected-date', recordDate); write('last-saved', result); write('records', [...read('records', []), result]); remove('draft'); remove('attachment'); dirty = false;
    location.href = 'saved.html';
  }
  saveButton?.addEventListener('click', () => {
    if (saveButton.disabled) return;
    saveButton.disabled = true; saveButton.textContent = '保存しています…';
    recordForm.setAttribute('aria-busy', 'true'); window.setTimeout(completeSave, 350);
  });
  $('[data-retry-save]')?.addEventListener('click', event => { event.currentTarget.disabled = true; event.currentTarget.textContent = '保存しています…'; window.setTimeout(completeSave, 400); });
  $('[data-remove-video]')?.addEventListener('click', () => { remove('attachment'); show($('#record-attachment'), false); dirty = true; toast('動画の紐づけを外しました'); });

  // Preserve the current input across the optional video sub-flow.
  $$('[data-preserve]').forEach(el => el.addEventListener('click', () => { saveDraft(); dirty = false; }));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || !dirty || link.hasAttribute('data-preserve') || link.getAttribute('href').startsWith('#') || event.ctrlKey || event.metaKey) return;
    event.preventDefault(); leaving = link.href; $('#leave-dialog').showModal();
  });
  $('[data-confirm-leave]')?.addEventListener('click', () => { dirty = false; remove('draft'); remove('attachment'); location.href = leaving; });

  // Deliberately a sample diagram, not a real video player or remote embed.
  let timer = null;
  function pauseSample() { clearInterval(timer); timer = null; if ($('[data-player-toggle]')) { $('[data-player-toggle]').setAttribute('aria-label', 'サンプルを再生'); $('[data-player-toggle]').innerHTML = '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>'; } }
  function updateSeek() { $('#current-time').textContent = fmt(Number($('#seek').value)); }
  $('#seek')?.addEventListener('input', updateSeek);
  $('[data-player-toggle]')?.addEventListener('click', event => {
    if (timer) { pauseSample(); return; }
    event.currentTarget.setAttribute('aria-label', 'サンプルを一時停止');
    event.currentTarget.innerHTML = '<svg class="ico" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
    timer = setInterval(() => { const seek = $('#seek'); seek.value = Math.min(240, Number(seek.value) + 1); updateSeek(); if (Number(seek.value) >= 240) pauseSample(); }, 1000);
  });
  function validateClip() {
    const start = parseTime($('#start-time').value), end = parseTime($('#end-time').value);
    const message = !Number.isFinite(start) || !Number.isFinite(end) ? '01:24のように「分:秒」で入力してください。' : end <= start ? '終了は開始よりあとにしてください。' : end > 240 || start >= 240 ? '動画の長さ（04:00）以内にしてください。' : '';
    clipValid = !message;
    $('#clip-error').textContent = message; show($('#clip-error'), !clipValid);
    $('#start-time').setAttribute('aria-invalid', String(!clipValid)); $('#end-time').setAttribute('aria-invalid', String(!clipValid));
    $('#clip-caption').textContent = clipValid ? `${end - start}秒間 · 分:秒で変更できます` : '開始・終了の時刻を確認してください';
    updateRecord(); return clipValid;
  }
  function capture() {
    pauseSample(); const start = Math.min(Number($('#seek').value), 239);
    $('#start-time').value = fmt(start); $('#end-time').value = fmt(Math.min(start + 8, 240)); captured = true;
    show($('#clip-editor'), true); show($('#watch-record'), true); show($('#watch-hint'), false); show($('[data-capture]'), false); show($('.save-dock'), true);
    $('.watch-player').classList.add('is-captured'); dirty = true; validateClip();
    $('#watch-record').scrollIntoView({ behavior: 'auto', block: 'nearest' });
    toast('開始位置を入れました。種別と★を選んでください');
  }
  $('[data-capture]')?.addEventListener('click', capture);
  $('[data-recapture]')?.addEventListener('click', capture);
  ['#start-time', '#end-time'].forEach(id => $(id)?.addEventListener('input', () => { dirty = true; validateClip(); }));
  if (page === 'watch-record') validateClip();

  let validFile = false;
  let fileVersion = 0;
  $('[data-pick-file]')?.addEventListener('click', () => $('#video-file').click());
  function source() { return $('[name="video-source"]:checked')?.value; }
  function sourceInput() { return $(`#${source()}-url`); }
  function validURL(value, kind) {
    try {
      const url = new URL(value); if (url.protocol !== 'https:') return false;
      if (kind === 'youtube') return /^(www\.|m\.)?youtube\.com$/.test(url.hostname) && ((url.pathname === '/watch' && /^[\w-]{11}$/.test(url.searchParams.get('v') || '')) || /^\/(shorts|embed)\/[\w-]{11}\/?$/.test(url.pathname)) || url.hostname === 'youtu.be' && /^\/[\w-]{11}\/?$/.test(url.pathname);
      if (kind === 'drive') return url.hostname === 'drive.google.com' && (/^\/file\/d\/[\w-]+/.test(url.pathname) || url.pathname === '/open' && Boolean(url.searchParams.get('id')));
      return Boolean(url.hostname.includes('.')) && !url.username && !url.password;
    } catch { return false; }
  }
  function updateVideo() {
    if (page !== 'video') return;
    const current = source();
    $$('[data-source-panel]').forEach(el => show(el, el.dataset.sourcePanel === current));
    const valid = current === 'upload' ? validFile : validURL(sourceInput().value.trim(), current);
    $('[data-attach-video]').disabled = !valid;
    $('#dock-copy').textContent = valid ? 'このプレーだけに動画をつけます' : current === 'upload' ? '動画を選んでください' : '動画のURLを入力してください';
  }
  $$('[name="video-source"]').forEach(el => el.addEventListener('change', () => { show($('#url-error'), false); updateVideo(); }));
  $$('input[type="url"]').forEach(el => {
    el.addEventListener('input', () => { el.removeAttribute('aria-invalid'); show($('#url-error'), false); updateVideo(); });
    el.addEventListener('blur', () => {
      const invalid = Boolean(el.value && !validURL(el.value.trim(), source()));
      el.setAttribute('aria-invalid', String(invalid));
      $('#url-error').textContent = source() === 'youtube' ? 'YouTubeの動画URLを確認してください。' : source() === 'drive' ? 'Googleドライブの動画の共有URLを確認してください。' : 'https://から始まる共有URLを入力してください。';
      show($('#url-error'), invalid);
    });
  });
  let uploadMetadata = {};
  $('#video-file')?.addEventListener('change', async event => {
    uploadMetadata = {};
    const version = ++fileVersion; const file = event.target.files?.[0]; validFile = false; updateVideo(); show($('#file-error'), false);
    if (!file) { $('#file-summary').textContent = 'まだ選ばれていません'; return; }
    $('#file-summary').textContent = `${file.name} · 長さを確認しています…`;
    let error = !/\.(mp4|mov)$/i.test(file.name) ? 'MP4またはMOV形式の動画を選んでください。' : file.size > 100000000 ? `100MBを超えています（${(file.size / 1000000).toFixed(1)}MB）。短くするか、別の動画を選んでください。` : '';
    let duration = null;
    if (!error) {
      duration = await new Promise(resolve => {
        const video = document.createElement('video'); const url = URL.createObjectURL(file); let timeout;
        const done = value => { clearTimeout(timeout); video.onloadedmetadata = null; video.onerror = null; video.removeAttribute('src'); URL.revokeObjectURL(url); resolve(value); };
        timeout = setTimeout(() => done(null), 8000);
        video.preload = 'metadata'; video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null); video.onerror = () => done(null); video.src = url;
      });
      if (version !== fileVersion) return;
      if (duration === null) error = '動画の長さを確認できませんでした。別の動画を選ぶか、MP4形式で保存し直してください。';
      else if (duration > 60) error = `60秒を超えています（${fmt(duration)}）。60秒以内に短くしてから選んでください。`;
    }
    $('#file-summary').textContent = `${file.name} · ${(file.size / 1000000).toFixed(1)}MB${duration !== null ? ' · ' + fmt(duration) : ''}`;
    $('#file-error').textContent = error; show($('#file-error'), Boolean(error));
    validFile = !error; if(validFile) uploadMetadata={duration,filename:file.name,bytes:file.size}; updateVideo();
  });
  $('[data-attach-video]')?.addEventListener('click', () => {
    const current = source(); if ($('[data-attach-video]').disabled) return;
    const labels = { upload: '端末のクリップ', youtube: 'YouTube', drive: 'Googleドライブ', external: '外部リンク' };
    write('attachment', { ...(current==='upload'?uploadMetadata:{}), source: current, label: labels[current], url: sourceInput()?.value.trim() || '', memo: $('#external-memo')?.value || '' });
    location.href = current === 'upload' ? 'uploading.html?run=1' : 'play-record.html';
  });
  updateVideo();

  if (page === 'uploading' && new URLSearchParams(location.search).has('run')) {
    let value = 0; const progress = $('#upload-progress'); progress.value = 0; $('#upload-percent').textContent = '0%';
    const interval = setInterval(() => { value = Math.min(100, value + 16); progress.value = value; $('#upload-percent').textContent = `${value}%`; if (value === 100) { clearInterval(interval); location.href = 'play-record.html'; } }, 300);
    $('[data-cancel-upload]').addEventListener('click', () => { clearInterval(interval); remove('attachment'); });
  }
  if (page === 'saved') {
    const saved = read('last-saved');
    if (saved) { $('#saved-type').textContent = saved['play-type']; $('#saved-rating').textContent = `★${saved.rating}`; $('#saved-match').textContent = saved.match === 'aoba' ? '10/24（土）vs 青葉FC' : saved.match === 'minato' ? '10/18（日）vs みなとSC' : '試合ノートなし'; }
  }
  if (page === 'note') {
    const records = read('records', []).filter(record => record.match === 'aoba');
    for (const data of records) {
      const row = document.createElement('a'); row.className = 'play-row'; row.href = data.id ? 'play-detail.html?id=' + encodeURIComponent(data.id) : 'play-detail.html';
      const info = document.createElement('span'); info.className = 'play-info'; const title = document.createElement('strong'); title.textContent = data['play-type'];
      const stars = document.createElement('span'); stars.className = 'inline-stars'; stars.textContent = '★'.repeat(Number(data.rating)) + '☆'.repeat(5 - Number(data.rating));
      const meta = document.createElement('p'); meta.className = 'small-text'; meta.textContent = data.attachment || data.start ? '動画あり · 今の記録' : '動画なし · 今の記録';
      const memo = document.createElement('p'); memo.className = 'play-memo'; memo.textContent = data.memo;
      info.append(title, stars, meta, memo); row.append(info); $('.play-list').prepend(row);
    }
    if (records.length) { $('.section-heading .count').textContent = `${3 + records.length}件`; $('.section-heading > .small-text').textContent = `動画あり ${2 + records.filter(r => r.attachment || r.start).length}件`; }
  }
})();
