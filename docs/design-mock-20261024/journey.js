/* Interactive design prototype. No backend. All entries stay in this tab.
 * A separate namespace keeps the fictional season apart from manually entered data. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const base = 'osn-design-20261024:';
  const modeKey = base + 'journey-mode';
  let mode = 'own';
  try {
    mode = sessionStorage.getItem(modeKey) || 'own';
    if (params.get('example') === 'dribble') mode = 'dribble';
    if (params.get('example') === 'own') mode = 'own';
    sessionStorage.setItem(modeKey, mode);
  } catch {}
  const prefix = base + (mode === 'dribble' ? 'season-example-v2:' : 'journey-v2:');
  const read = (key, fallback = null) => { try { return JSON.parse(sessionStorage.getItem(prefix + key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { sessionStorage.setItem(prefix + key, JSON.stringify(value)); return true; } catch { return false; } };
  const remove = key => { try { sessionStorage.removeItem(prefix + key); } catch {} };
  const h = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const arrow = window.osnIcons.chevron;
  const show = (el, yes) => { if (el) el.hidden = !yes; };
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const dateLabel = value => { const d = new Date(value + 'T12:00:00+09:00'); return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`; };
  const days = () => read('days', {});
  const profile = () => read('profile', {goal:'',focus:''});

  if (mode === 'dribble' && !read('seeded')) {
    const p = {goal:'Aチームのスタメンになり、試合で結果を出す',focus:'ドリブルからチャンスをつくる'};
    const samples = [
      ['2026-04-11','練習','取られるのを怖がらず、1対1で一度は自分から仕掛ける。','少しできた','Bでは1回抜けた。でもAだと取られるのが怖くて、すぐパスしてしまった。またBに戻って悔しい。','次はAの1対1でも、最初の1回は自分から仕掛ける。','Bチーム','','',''],
      ['2026-06-13','練習','Aチームでも、最初の1回は自分から仕掛ける。','できた','6回仕掛けて3回抜けた。でもその後のパスがずれて、チャンスにできなかった。抜くだけじゃ足りない。','抜いたあとに味方を見て、シュートにつながるパスを出したい。','Aチーム','','',''],
      ['2026-08-08','試合','抜いたあとに味方を見て、シュートにつながるパスを出す。','試す機会がなかった','今日はAの試合で出番なし。練習ではできることが増えたのに、何が足りないのか分からなくて悔しい。','次の紅白戦で、ドリブルから味方のシュートにつなげたい。','Aチーム','出番なし','0','0対1で敗戦'],
      ['2026-09-19','試合','ドリブルから、味方がシュートできる場面をつくる。','できた','初めてAで先発。右で1人抜いて、味方のシュートにつながった。ゴールにはならなかったけど、前より周りが見えた。','次は得点につながるラストパスを出したい。','Aチーム','先発','40','1対1で引き分け'],
      ['2026-10-24','試合','右サイドで縦に仕掛けて、得点につながるラストパスを1本出す。','できた','Aチームで先発して60分出た。右で縦に抜いて、折り返しから1アシスト。2対1で勝てた！ 春はすぐパスしていたけど、自分から仕掛けて味方のゴールにつなげられた。','次の試合でも、ドリブルから味方のシュートにつながる場面をつくる。','Aチーム','先発','60','2対1で勝利']
    ];
    const entries = Object.fromEntries(samples.map(([date,activity,intention,outcome,good,next,team,appearance,minutes,result]) => [date,{date,activity,goal:p.goal,focus:p.focus,intention,reflection:{outcome,good,next,team,appearance,minutes,result}}]));
    const plays = [
      ['2026-04-11',2,'Bでは1人抜けた。Aでは仕掛けられず、すぐパスしてしまった。'],
      ['2026-06-13',3,'右サイドで1人抜けた。その後のパスがずれた。'],
      ['2026-09-19',4,'縦に抜いて折り返し。味方がシュートまで持っていけた。'],
      ['2026-10-24',5,'縦に抜いて折り返し、1アシスト。抜いたあとに味方を見られた。']
    ].map(([date,rating,memo],i) => ({id:`season-${i}`,date,rating:String(rating),memo,'play-type':'ドリブル',goal:p.goal,focus:p.focus,match:date==='2026-10-24'?'aoba':'',attachment:null}));
    write('profile',p); write('days',entries); write('records',plays); write('seeded',true);
  }
  const matchDate = match => ({aoba:'2026-10-24',minato:'2026-10-18'}[match]);
  const requestedDate = params.get('date') || matchDate(params.get('match'));
  const date = validDate(requestedDate) ? requestedDate : read('selected-date','2026-10-24');
  write('selected-date',date);
  const current = () => days()[date] || {date,activity:read('activity:'+date,'練習'),...profile()};
  const ensureDay = (day = date, activity = '') => { const all = days(); if (!all[day]) all[day] = day === date ? current() : {date:day,activity:activity || '練習',...profile()}; if (activity) all[day].activity=activity; write('days',all); };
  window.osnJourney = {prefix,date,profile,ensureDay,matchDate};
  const recordsFor = day => read('records',[]).filter(p => p.date === day);
  const entries = () => Object.values(days()).sort((a,b) => a.date.localeCompare(b.date));
  const context = entry => {
    const r = entry.reflection || {};
    return [entry.activity,r.team,r.appearance,r.minutes !== '' && r.minutes != null ? `${r.minutes}分` : '',r.result].filter(Boolean).join(' · ');
  };
  const playRows = day => recordsFor(day).map(p => `<a class="daily-play-row" href="play-detail.html?id=${encodeURIComponent(p.id)}"><div><strong>${h(p['play-type'])}</strong> <span class="inline-stars" aria-label="星${Number(p.rating)}つ">${'★'.repeat(Number(p.rating))}${'☆'.repeat(5-Number(p.rating))}</span><p>${h(p.memo || 'メモなし')}</p><p class="small-text">${p.attachment || p.start ? '動画あり' : '動画なし'}</p></div>${arrow}</a>`).join('');
  const playSection = day => recordsFor(day).length ? `<h2>この日のプレー <span class="small-text">${recordsFor(day).length}件</span></h2>${playRows(day)}` : '';
  const autoSize = el => { el.style.height='auto'; el.style.height = `${Math.max(96,el.scrollHeight+2)}px`; };

  if (mode === 'dribble') {
    $('.mock-preview span').textContent='15歳の選手のサンプル · 架空の記録';
    $('.mock-preview a').textContent='自分で試す';
    $('.mock-preview a').href='record.html?example=own';
  }
  $$('[data-goal-title]').forEach(el => el.textContent = profile().goal || '目標を決めよう');
  $$('[data-focus-title]').forEach(el => el.textContent = profile().focus || 'まだ決めていません');
  const goalForm = $('#goal-form');
  if (goalForm) {
    goalForm.elements.goal.value=profile().goal; goalForm.elements.focus.value=profile().focus;
    if (!profile().goal) $('.goal-editor').open=true;
    const saveGoal = event => {
      event.preventDefault(); if (!goalForm.reportValidity()) return;
      const data={...profile(),goal:goalForm.elements.goal.value.trim(),focus:goalForm.elements.focus.value.trim()};
      if (!data.goal) { goalForm.elements.goal.setCustomValidity('目指すことを書いてください。'); goalForm.reportValidity(); return; }
      if (!write('profile',data)) { $('#goal-status').textContent='保存できませんでした。入力を残しています。もう一度お試しください。'; return; }
      $$('[data-goal-title]').forEach(el=>el.textContent=data.goal); $$('[data-focus-title]').forEach(el=>el.textContent=data.focus || 'まだ決めていません');
      $('.goal-editor').open=false; $('[data-goal-title]').setAttribute('tabindex','-1'); $('[data-goal-title]').focus();
    };
    goalForm.addEventListener('input',()=>goalForm.elements.goal.setCustomValidity(''));
    goalForm.addEventListener('submit',saveGoal); $('[data-goal-save]').addEventListener('click',saveGoal);
  }
  if ($('#journal-date')) {
    $('#journal-date').value=date;
    $('#journal-date').addEventListener('change',event=>{
      if (!validDate(event.target.value)) return;
      write('selected-date',event.target.value);
      location.href=location.pathname+'?date='+event.target.value;
    });
    $('#journal-activity').value=current().activity;
    const updateContext=()=>{if($('#daily-context-label'))$('#daily-context-label').textContent=dateLabel(date)+' · '+$('#journal-activity').value;};
    updateContext();
    $('#journal-activity').addEventListener('change',updateContext);
    $('#journal-activity').addEventListener('change',event=>{
      write('activity:'+date,event.target.value);
      const all=days(); if (all[date]) { all[date].activity=event.target.value; write('days',all); }
    });
  }

  const form=$('#daily-form'); const save=$('[data-daily-save]');
  const kind=form?.dataset.kind; const draftKey=`draft-${kind}:${date}`;
  const data=()=>Object.fromEntries(new FormData(form));
  const previous=entries().filter(e=>e.date<date).at(-1);
  // A preparation-only day or a reflection with no next step must not hide the last explicit plan.
  const previousNext=entries().filter(e=>e.date<date && e.reflection?.next?.trim()).at(-1);
  if ($('#last-entry') && previous) $('#last-entry').innerHTML=`<h2>${dateLabel(previous.date)} · ${h(previous.activity)}</h2><p data-user-content>${h(previous.reflection?.good || previous.intention)}</p><a class="quiet-link" href="day.html?date=${previous.date}">この日の記録を見る →</a>`;
  if (form) {
    const saved=kind==='before' ? {intention:current().intention || '',...(current().checks || {})} : current().reflection || {};
    const draft=read(draftKey,saved);
    if (!document.body.dataset.page.endsWith('-ready')) Object.entries(draft).forEach(([name,value])=>{
      $$(`[name="${name}"]`,form).forEach(el=>{
        if(el.type==='radio') el.checked=el.value===value;
        else if(el.type==='checkbox') el.checked=value==='on';
        else el.value=value;
      });
    });
    function update() {
      const d=data();
      if ($('#intention-count')) $('#intention-count').textContent=`${(d.intention||'').length} / 200`;
      save.disabled=kind==='before' ? !d.intention?.trim() : !(d.outcome || d.good?.trim() || d.next?.trim());
      if ($('#outcome-help')) $('#outcome-help').textContent=d.outcome==='試す機会がなかった' ? '試せなかった日も、そのまま残そう。' : '選ばずに、言葉だけ残しても大丈夫。';
      show($('[data-clear-outcome]'),Boolean(d.outcome));
      $$('textarea',form).forEach(autoSize);
    }
    ['input','change'].forEach(event=>form.addEventListener(event,()=>{write(draftKey,data());update();$('#daily-status').textContent='';}));
    $('[data-clear-outcome]')?.addEventListener('click',()=>{$$('[name="outcome"]',form).forEach(el=>el.checked=false);write(draftKey,data());update();});
    if(kind==='after') {
      if(current().intention) $('#daily-goal-text').textContent=current().intention;
      $('#daily-plays').innerHTML=playSection(date);
      if(['team','appearance','minutes','result'].some(k=>draft[k])) $('.session-details').open=true;
    } else if(previousNext) {
      show($('#previous-next'),true); $('#previous-next .small-text').textContent=`${dateLabel(previousNext.date)}に決めた、次の一歩`;
      $('#previous-next p').textContent=previousNext.reflection.next;
      $('[data-use-next]').addEventListener('click',()=>{form.elements.intention.value=previousNext.reflection.next;write(draftKey,data());update();form.elements.intention.focus();});
    }
    function saveDaily(event) {
      event.preventDefault(); if(save.disabled || !form.reportValidity()) return;
      const d=data(); const all=days(); const entry={...current(),activity:$('#journal-activity').value};
      if(kind==='before') { entry.intention=d.intention.trim(); entry.checks=Object.fromEntries(Object.entries(d).filter(([k])=>k.startsWith('check-'))); }
      else entry.reflection=d;
      all[date]=entry;
      if(!write('days',all)) { $('#daily-status').textContent='保存できませんでした。入力を残しています。もう一度お試しください。'; return; }
      remove(draftKey); save.disabled=true; save.textContent='保存しています…';
      window.setTimeout(()=>{location.href=kind==='before'?'intention-saved.html':'reflection-saved.html';},200);
    }
    form.addEventListener('submit',saveDaily);save.addEventListener('click',saveDaily);update();
  }
  if($('#daily-saved-text')) {
    const after=document.body.dataset.page==='reflection-saved'; const r=current().reflection || {};
    $('#daily-saved-text').textContent=after ? r.next || r.good || r.outcome || '記録はまだありません。' : current().intention || 'テーマはまだありません。';
    if(after && !r.next) $('.daily-saved-copy .small-text').textContent='今日のふりかえり';
  }
  if($('#record-form')) {
    const matchSelect=$('select[name=match]');
    matchSelect?.addEventListener('change',()=>{if($('.page-heading .date')) $('.page-heading .date').textContent=dateLabel(matchDate(matchSelect.value) || date);});
    if($('.page-heading .date')) $('.page-heading .date').textContent=dateLabel(date);
    if($('[data-current-theme]')) { $('[data-current-theme]').textContent=profile().focus || '取り組みをまだ決めていません'; $('[data-current-theme]').disabled=!profile().focus; }
    const rail=$('.context-rail section:last-child');
    if(rail && !document.body.dataset.page.startsWith('watch')) rail.innerHTML=`<h2>この日の記録</h2>${recordsFor(date).length ? playRows(date) : '<p>プレーを残すと、ここで見返せます。</p>'}`;
  }

  function comparisonCard(entry) {
    const r=entry.reflection || {};
    return `<article><h3>${dateLabel(entry.date)}</h3><p class="small-text">${h(context(entry))}</p>${entry.goal !== profile().goal ? `<div class="compare-block"><h4>このときの目標</h4><p>${h(entry.goal || '未設定')}</p></div>` : ''}<div class="compare-block"><h4>今日のテーマ</h4><p class="theme-text">${h(entry.intention || 'テーマなし')}</p></div>${r.outcome?`<div class="compare-outcome">${h(r.outcome)}</div>`:''}<div class="compare-block"><h4>ふりかえり</h4><p>${h(r.good || '言葉の記録はありません。')}</p></div><div class="compare-block"><h4>残したプレー</h4>${playRows(entry.date) || '<p>この日のプレーはありません。</p>'}</div><a class="row-link" href="day.html?date=${entry.date}">この日の記録を見る${arrow}</a></article>`;
  }
  if($('#history-list')) {
    const all=entries(); $('#history-count').textContent=`${all.length}日分`;
    $('#history-list').innerHTML=all.length ? [...all].reverse().map(e=>`<a class="history-row" href="day.html?date=${e.date}"><span class="history-date">${dateLabel(e.date).split('（')[0]}<span class="small-text" style="display:block">${e.date.slice(0,4)}</span></span><div class="history-copy"><p class="small-text">${h(context(e))}</p><strong>${h(e.intention || 'テーマなしのふりかえり')}</strong><p>${h(e.reflection?.good || 'テーマを決めました。')}</p><p class="small-text">${h(e.reflection?.outcome || 'ふりかえり前')}${recordsFor(e.date).length ? ' · プレー'+recordsFor(e.date).length+'件':''}</p></div>${arrow}</a>`).join('') : '<div class="empty-copy">まだ記録はありません。今日、試したいことから始めよう。</div>';
    show($('#comparison-empty'),all.length<2);show($('#comparison-content'),all.length>=2);
    if(all.length>=2) {
      const opts=all.map(e=>`<option value="${e.date}">${dateLabel(e.date)} ${h(e.activity)}</option>`).join('');
      $('#compare-before').innerHTML=opts;$('#compare-after').innerHTML=opts;
      $('#compare-before').value=all[0].date;$('#compare-after').value=all.at(-1).date;
      function renderCompare(){
        const left=days()[$('#compare-before').value];const right=days()[$('#compare-after').value];
        const same=left.date===right.date;$('#compare-message').textContent=same?'違う日を選ぶと、変化を見比べられます。':'';
        $('#comparison').innerHTML=same?'':comparisonCard(left)+comparisonCard(right);show($('#comparison'),!same);
      }
      $('#compare-before').addEventListener('change',renderCompare);$('#compare-after').addEventListener('change',renderCompare);renderCompare();
    }
    const todayLink=$('.growth-layout + a'); if(todayLink) todayLink.href='record.html?date=2026-10-24';
  }
  if($('#day-detail')) {
    const e=days()[date];
    if(!e) $('#day-detail').innerHTML='<h1>まだ記録がありません</h1><p class="empty-copy">この日のテーマやふりかえりを残してみよう。</p><a class="mock-control mock-primary" href="record.html">テーマを書く</a>';
    else {
      const r=e.reflection || {};
      $('#day-detail').innerHTML=`<div class="page-heading"><h1>${dateLabel(date)}の記録</h1></div><article class="surface day-note"><p class="metadata">${h(context(e))}</p><p class="small-text">目指すこと</p><h2>${h(e.goal || '未設定')}</h2>${e.focus?`<p class="small-text">取り組み：${h(e.focus)}</p>`:''}<section class="read-section"><h2>今日のテーマ</h2><p>${h(e.intention || 'テーマなし')}</p></section><section class="read-section"><h2>ふりかえり</h2><p class="outcome-text">${h(r.outcome)}</p><p>${h(r.good || 'まだ言葉の記録はありません。')}</p></section>${r.next?`<section class="read-section"><h2>次に試したいこと</h2><p>${h(r.next)}</p></section>`:''}<section class="read-section">${playSection(date) || '<h2>この日のプレー</h2><p>まだ記録はありません。</p>'}</section></article><div class="day-actions"><a class="mock-control mock-primary" href="reflection.html">ふりかえりを編集する</a><a class="mock-control" href="record.html">テーマを見直す</a></div>`;
    }
  }
  if(document.body.dataset.page==='play-detail' && params.has('id')) {
    const p=read('records',[]).find(p=>p.id===params.get('id'));
    const main=$('#main-content');
    if(!p) main.innerHTML='<h1>このプレーが見つかりません</h1><a class="row-link" href="growth.html">これまでの記録に戻る →</a>';
    else {
      write('selected-date',p.date);
      main.innerHTML=`<div class="breadcrumb"><a href="day.html?date=${p.date}">‹ ${dateLabel(p.date)}の記録</a></div><div class="page-heading"><h1>${h(p['play-type'])}</h1></div><article class="surface day-note"><p class="small-text">${dateLabel(p.date)} · ${h(days()[p.date]?.activity || '練習')}</p><p class="inline-stars" aria-label="星${p.rating}つ">${'★'.repeat(Number(p.rating))}${'☆'.repeat(5-Number(p.rating))}</p><section class="read-section"><h2>この場面のメモ</h2><p>${h(p.memo || 'メモなし')}</p></section><section class="read-section"><h2>取り組んでいること</h2><p>${h(p.focus || '未設定')}</p></section><p class="small-text">${p.attachment || p.start ? '動画を添付しています（操作確認用）' : '動画なし'}</p></article>`;
    }
  }
})();
