/* Guided prototype setup. Preset guidance only; no AI requests or account creation. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const page = document.body.dataset.page, journey = window.osnJourney;
  if (!journey) return;
  const params = new URLSearchParams(location.search);
  const demo = journey.prefix.includes('season-example');
  const setupUrl = 'onboarding.html?example=own&tasks=own&edit=1';
  const t = value => window.osnI18n?.t(value) || value;
  const read = (key, fallback) => {try {return JSON.parse(sessionStorage.getItem(journey.prefix + key)) ?? fallback;} catch {return fallback;}};
  const write = (key, value) => {try {sessionStorage.setItem(journey.prefix + key, JSON.stringify(value)); return true;} catch {return false;}};
  const profile = () => journey.profile();
  const homeUrl = 'home.html?example=own&tasks=own';
  const personal = !demo && (!document.body.dataset.accountMode || document.body.dataset.accountMode === 'player');
  function applyNickname() {
    if (!personal) return;
    const name = profile().nickname?.trim();
    $$('.side-person strong,.bar-person span,.account-identity h2').forEach(el => {
      if (name) {el.setAttribute('data-user-content',''); el.textContent=name;}
      else {el.removeAttribute('data-user-content');el.textContent=t('あなた');}
    });
    if ($('.account-identity .muted')) $('.account-identity .muted').textContent=t('このタブのプロフィール');
  }
  applyNickname();
  document.addEventListener('osn-languagechange', applyNickname);
  if (page === 'home') {
    const entry = document.createElement('a'); entry.className='manager-home-link'; entry.href=setupUrl;
    entry.innerHTML='<img src="manager-haru.png" alt="" width="64" height="64"><span><strong></strong><small></small></span><span aria-hidden="true">›</span>';
    entry.querySelector('strong').textContent=demo?'ハルと、自分の目標を決める':profile().setupStatus==='complete'?'ハルと設定を見直す':'ハルと初回設定をする';
    entry.querySelector('small').textContent='呼び名・目標・伸ばしたいプレー';
    $('.home-goal')?.append(entry);
  }
  $$('[data-manager-settings]').forEach(a => a.href=setupUrl);
  if (page !== 'onboarding') return;
  if (demo) {location.replace(setupUrl);return;}
  const existing = profile();
  if (existing.setupStatus && !params.has('edit')) {location.replace(homeUrl);return;}
  const savedDraft = read('manager-draft-v1', {});
  let step = Number.isInteger(savedDraft.step) && savedDraft.step >= 0 && savedDraft.step <= 3 ? savedDraft.step : 0;
  let failOnce = params.get('simulate') === 'save-error';
  const form = $('#manager-form');
  const limits = {nickname:20,goal:100,focus:100};
  for (const field of Object.keys(limits)) form.elements[field].value=String(savedDraft[field] ?? existing[field] ?? '').slice(0,limits[field]);
  const data = () => Object.fromEntries(Object.keys(limits).map(key=>[key,form.elements[key].value.trim()]));
  function draft() {
    const ok=write('manager-draft-v1',{...data(),step});
    $('#manager-draft-status').textContent=t(ok?'途中の入力は、このタブ内に保存されています。':'途中の入力を保存できません。この画面を開いたままお試しください。');
  }
  function choices() {
    $$('[data-manager-choice]').forEach(b=>{
      const source=b.dataset.choiceValue;
      const labels=[source,...Object.values(window.osnLocaleCatalog||{}).map(dict=>dict[source]).filter(Boolean)];
      b.setAttribute('aria-pressed',String(labels.includes(form.elements[b.dataset.managerChoice].value)));
    });
  }
  function reviewValue(selector, value) {
    const el=$(selector);
    if(value){el.setAttribute('data-user-content','');el.textContent=value;}
    else {el.removeAttribute('data-user-content');el.textContent=t('あとで決める');}
  }
  function render(focus=false) {
    $$('[data-manager-step]').forEach(section=>section.hidden=Number(section.dataset.managerStep)!==step);
    $$('[data-manager-progress]').forEach(li=>{const i=Number(li.dataset.managerProgress);li.classList.toggle('is-complete',i<step);if(i===step||step===3&&i===2)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
    const messages=['はじめまして！あなたの目標に向かう準備を、一緒にしよう。','まずは、なりたい自分を言葉にしてみよう。','目標につながるプレーを、1つ選んでみよう。','準備ができたね。毎日の小さな挑戦を残していこう。'];
    $('#manager-message').textContent=t(messages[step]);
    $('[data-manager-back]').hidden=step===0;
    $('#manager-next').textContent=t(step===3?'この内容で始める':step===2?'内容を確認する':'次へ');
    const d=data();reviewValue('#manager-review-name',d.nickname);reviewValue('#manager-review-goal',d.goal);reviewValue('#manager-review-focus',d.focus);choices();
    if (focus) $(`[data-manager-step="${step}"] h1`).focus();
  }
  function validate() {
    const field=['nickname','goal','focus'][step];
    if(field && form.elements[field].value.trim().length>limits[field]) {
      $('#manager-error').textContent=t('入力が長すぎます。短くして、もう一度お試しください。');$('#manager-error').hidden=false;form.elements[field].focus();return false;
    }
    return true;
  }
  function finish(status) {
    const current=profile();
    // Skipping never overwrites an existing profile or turns a completed setup into a new one.
    const updated=status==='complete'?{...current,...data(),setupStatus:'complete'}:{...current,setupStatus:current.setupStatus||'skipped'};
    if(failOnce||!write('profile',updated)) {
      failOnce=false;$('#manager-error').textContent=t('設定を保存できませんでした。入力は残っています。もう一度お試しください。');$('#manager-error').hidden=false;return;
    }
    if(status==='complete'){try{sessionStorage.removeItem(journey.prefix+'manager-draft-v1');}catch{}}
    location.href=homeUrl;
  }
  form.addEventListener('input',()=>{choices();draft();$('#manager-error').hidden=true;});
  form.addEventListener('submit',e=>{e.preventDefault();if(!validate())return;$('#manager-error').hidden=true;if(step===3){finish('complete');return;}step++;draft();render(true);});
  $('[data-manager-back]').addEventListener('click',()=>{if(step>0){step--;draft();render(true);$('#manager-error').hidden=true;}});
  $('[data-manager-skip]').addEventListener('click',()=>{draft();finish('skipped');});
  $$('[data-manager-choice]').forEach(b=>b.addEventListener('click',()=>{form.elements[b.dataset.managerChoice].value=t(b.dataset.choiceValue);choices();draft();$('#manager-error').hidden=true;}));
  document.addEventListener('osn-languagechange',()=>{render();draft();});
  $('.mock-preview span').textContent='操作デモ · このタブ内だけに保存';
  $('.mock-preview a').textContent='選手の例を見る';$('.mock-preview a').href='home.html?example=dribble&tasks=demo';
  render();
})();
