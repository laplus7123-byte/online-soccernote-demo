/* Static integration preview. No server, calendar-provider sync or messages. */
(() => {
  'use strict';
  const page=document.body.dataset.page;
  // All five tabs keep the same selected day and personal/example data space.
  const navMode=page==='tasks'&&window.osnTasks?window.osnTasks.mode==='demo'?'dribble':'own':window.osnJourney.prefix.includes('season-example')?'dribble':'own';
  document.querySelectorAll('.side-nav a,.osn-tabbar a').forEach(a=>{
    const name=a.getAttribute('href')?.split('?')[0];
    if(!['home.html','calendar.html','record.html','growth.html','tasks.html'].includes(name))return;
    const query=new URLSearchParams({example:navMode,tasks:navMode==='dribble'?'demo':'own'});
    if(name!=='home.html')query.set('date',window.osnJourney.date);
    a.href=name+'?'+query;
  });
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const params=new URLSearchParams(location.search), journey=window.osnJourney, tasks=window.osnTasks;
  const demo=journey.prefix.includes('season-example'), mode=demo?'dribble':'own';
  const prefix=journey.prefix;
  const read=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(prefix+key))??fallback;}catch{return fallback;}};
  const put=(key,value)=>{try{sessionStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch{return false;}};
  const drop=key=>{try{sessionStorage.removeItem(prefix+key);}catch{}};
  const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
  const add=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const monday=date=>add(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));
  const label=date=>{const d=new Date(date+'T12:00:00Z');return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`;};
  const arrow='<span aria-hidden="true" class="continuity-arrow">›</span>';
  const today=tasks?.today||journey.date;
  let date=valid(params.get('date'))?params.get('date'):today;
  const url=(file,d=date,extra={})=>file+'?'+new URLSearchParams({example:mode,tasks:demo?'demo':'own',date:d,...extra});
  const link=(file,d,text,extra={})=>`<a class="quiet-link" href="${h(url(file,d,extra))}">${h(text)}</a>`;
  const days=()=>read('days',{});
  const records=()=>read('records',[]);
  const entries=()=>Object.values(days()).filter(e=>e.intention||e.reflection?.outcome||e.reflection?.good);
  const openTasks=()=>tasks.items.filter(t=>!t.deletedAt&&t.status!=='done');
  const tasksOn=d=>tasks.items.filter(t=>!t.deletedAt&&t.due===d);
  const notesOn=d=>days()[d]?.intention||days()[d]?.reflection?.outcome||days()[d]?.reflection?.good||records().some(r=>r.date===d);
  const types={practice:'練習',match:'試合',other:'その他'};
  let schedules=read('schedules-v1',null);
  if(!Array.isArray(schedules)){
    schedules=demo?[
      {id:'schedule-oct24',date:'2026-10-24',type:'match',title:'vs 青葉FC',time:'10:00'},
      {id:'schedule-oct25',date:'2026-10-25',type:'other',title:'体を休めて、昨日の試合を見返す',time:''},
      {id:'schedule-oct27',date:'2026-10-27',type:'practice',title:'チーム練習',time:'16:00'},
      {id:'schedule-oct31',date:'2026-10-31',type:'match',title:'練習試合',time:'09:00'},
      {id:'schedule-aug8',date:'2026-08-08',type:'match',title:'Aチームの試合',time:'10:00'}
    ]:[];
    put('schedules-v1',schedules);
  }
  document.querySelectorAll('.side-brand,.bar-title,.breadcrumb a[href="home.html"],.status-panel a[href="home.html"]').forEach(a=>a.href=url('home.html',page==='home'?date:journey.date));
  if(!['home','calendar','weekly'].includes(page))return;
  const events=d=>schedules.filter(s=>s.date===d).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
  const taskRows=list=>list.map(t=>`<a class="continuity-row ${t.status==='done'?'is-complete':''}" href="${h(url('tasks.html',date,{task_id:t.id}))}"><span class="continuity-row-copy"><strong>${h(t.title)}</strong><small>${h(t.due?label(t.due)+'まで':'期限なし')}${t.status==='done'?' · 完了':t.due<today?' · 期限を過ぎています':''}${t.owner==='coach'?' · コーチから':''}</small></span>${arrow}</a>`).join('');
  function renderNoteRows(list){return list.map(e=>`<a class="continuity-row" href="${h(url('day.html',e.date))}"><span class="continuity-row-copy"><small>${label(e.date)} · ${h(e.activity||'記録')}${e.reflection?.appearance?' · '+h(e.reflection.appearance):''}</small><strong>${h(e.intention||e.reflection?.good||'この日の記録')}</strong>${e.reflection?.good?`<p>${h(e.reflection.good)}</p>`:''}</span>${arrow}</a>`).join('');}
  const empty=text=>`<p class="continuity-empty">${h(text)}</p>`;
  let state=['loading','error'].includes(params.get('state'))?params.get('state'):'';
  let failOnce=params.get('simulate')==='save-error';
  function persist(key,value,error){
    if(failOnce){failOnce=false;error.textContent='保存できませんでした。入力は残っています。もう一度お試しください。';error.hidden=false;return false;}
    if(!put(key,value)){error.textContent='このタブに保存できませんでした。入力は残っています。ブラウザーの保存設定を確認してください。';error.hidden=false;return false;}
    error.hidden=true;return true;
  }
  function showState(){
    $('#continuity-content').hidden=Boolean(state);
    $('#continuity-status').hidden=!state;
    if(state)$('#continuity-status').innerHTML=`<h2>${state==='loading'?'読み込んでいます':'読み込めませんでした'}</h2><p class="small-text">${state==='loading'?'予定と記録を確認しています。':'通信状況を確認して、もう一度お試しください。'}</p><button type="button" class="mock-control mock-secondary" data-continuity-retry>${state==='loading'?'読み込み後を見る':'もう一度読み込む'}</button>`;
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-continuity-retry]')){state='';showState();}});
  $$('[data-switch-example]').forEach(a=>a.href=page+'.html?'+new URLSearchParams({example:a.dataset.switchExample,tasks:a.dataset.switchExample==='dribble'?'demo':'own',date}));
  $$('[data-state-link]').forEach(a=>a.href=url(page+'.html',date,{state:a.dataset.stateLink}));
  $('.mock-preview span').textContent=demo?'15歳の選手のサンプル · 架空の記録':'デザイン確認用 · このタブ内だけに保存';
  $('.mock-preview a').textContent=demo?'自分で試す':'画面一覧';
  $('.mock-preview a').href=demo?page+'.html?example=own&tasks=own':'index.html';
  // Navigation from these integration screens keeps the selected data space explicit.
  $$('.side-nav a,.osn-tabbar a').forEach(a=>{const name=a.getAttribute('href')?.split('?')[0];if(['home.html','calendar.html','record.html','growth.html','tasks.html'].includes(name))a.href=url(name,name==='home.html'?today:date);});
  showState();

  if(page==='home'){
    const day=days()[date]||{}, r=day.reflection||{};
    const done=Boolean(r.outcome||r.good||r.next);
    $('#home-date').textContent=`${date===today?'今日 · ':''}${date.slice(0,4)}年 ${label(date)}`;
    $('#home-calendar').href=url('calendar.html');$('#home-schedule-link').href=url('calendar.html');
    $('#home-tasks-link').href=url('tasks.html',today)+'#today';
    $('#home-start-heading').textContent=done?'今日の一歩を、残せたね。':day.intention?'準備OK。練習で試してみよう。':'まずは、今日のテーマを1つ。';
    $('.home-haru-copy > .muted').textContent=done?'おつかれさま。気づきは次の練習につながります。':day.intention?'今日のテーマを、練習・試合で試してみよう。':'書くのは、ひとことからでOK。';
    $('#home-daily').innerHTML=`<div class="home-start-options">
      <a id="home-before" class="home-start-option ${!day.intention&&!done?'is-next':''}" href="${h(url('record.html'))}"><span class="home-action-icon" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 6-6m-3 0h3v3"/></svg></span><span class="home-start-copy"><span class="home-start-time">${day.intention?'テーマは保存済み':'これから練習・試合'}</span><strong>${day.intention?'今日のテーマを見直す':'今日のテーマを決める'}</strong><span class="home-start-help">${day.intention?'決めたことを確認・変更できます':'意識したいことを、1つだけ。'}</span></span>${arrow}</a>
      <a id="home-after" class="home-start-option ${day.intention&&!done?'is-next':''}" href="${h(url('reflection.html'))}"><span class="home-action-icon" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h11l3 3v15H5ZM15 3v5h4M8 12h8m-8 4h5"/></svg></span><span class="home-start-copy"><span class="home-start-time">${done?'ふりかえりは保存済み':'練習・試合が終わった'}</span><strong>${done?'ふりかえりを見直す':'ふりかえりを書く'}</strong><span class="home-start-help">${done?'あとから書き足しても大丈夫':'テーマを決めていなくても書けます。'}</span></span>${arrow}</a>
      </div>${day.intention?`<div class="home-theme-preview"><span class="small-text">今日のテーマ</span><p data-user-content>${h(day.intention)}</p></div>`:''}${done?`<a class="row-link" href="${h(url('day.html'))}"><strong>今日の記録を見る</strong>${arrow}</a>`:''}`;
    $('#home-schedule').innerHTML=events(date).map(e=>`<a class="continuity-row" href="${h(url('calendar.html'))}"><span class="continuity-time">${h(e.time?(e.time+(e.endTime?'–'+e.endTime:'')):'時刻未定')}</span><span class="continuity-row-copy"><strong>${h(e.title||types[e.type])}</strong><small>${types[e.type]}</small></span>${arrow}</a>`).join('')||empty('今日は予定がありません。自分のペースで過ごそう。');
    const due=openTasks().filter(t=>t.due&&t.due<=date).sort((a,b)=>a.due.localeCompare(b.due)||Number(b.important)-Number(a.important));
    $('#home-tasks').innerHTML=(taskRows(due.slice(0,3))||empty('今日までのタスクはありません。'))+(due.length>3?`<div class="continuity-empty">${link('tasks.html',today,`ほか${due.length-3}件を見る`)}</div>`:'');
    const week=monday(date), review=read('weekly-reviews-v1',{})[week];
    $('#home-weekly').href=url('weekly.html',date);$('#home-week-label').textContent=`${label(week)}〜${label(add(week,6))}${review?' · 保存済み':''}`;
    $('#home-recent').innerHTML=renderNoteRows(entries().filter(e=>e.date<=date).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2))||empty('まだノートがありません。短い一言から始められます。');
  }

  if(page==='calendar'){
    $('.calendar-import-entry').href=url('schedule-import.html');
    let view=params.get('view')==='week'?'week':'month',editId=null,lastDeleted=null;
    let month=date.slice(0,7);
    function setDate(d,{focus=false}={}){if(!valid(d))return;date=d;month=d.slice(0,7);render();if(focus){$('#calendar-day-title').focus({preventScroll:true});$('#calendar-day').scrollIntoView({block:'start'});}}
    function summary(d){const ev=events(d), ts=tasksOn(d).filter(t=>t.status!=='done');return [ev.length?ev.map(s=>types[s.type]).join('・'):'',ts.length?`期限${ts.length}`:'',notesOn(d)?'記録':''].filter(Boolean);}
    function render(){
      put('selected-date',date);
      $$('.side-nav a,.osn-tabbar a').forEach(a=>{const name=a.getAttribute('href')?.split('?')[0];if(['calendar.html','record.html','growth.html','tasks.html'].includes(name))a.href=url(name);});
      $('#calendar-date').value=date;$('#calendar-day-title').textContent=`${label(date)}${date===today?' · 今日':''}`;
      $('#calendar-label').textContent=view==='month'?`${month.slice(0,4)}年${Number(month.slice(5))}月`:`${label(monday(date))}〜${label(add(monday(date),6))}`;
      $$('[data-calendar-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.calendarView===view)));
      if(view==='month'){
        const start=monday(month+'-01');
        const last=new Date(month+'-01T12:00:00Z');last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
        const cellCount=Math.ceil((Math.round((last-new Date(start+'T12:00:00Z'))/86400000)+1)/7)*7;
        $('#calendar-board').innerHTML=`<div class="calendar-weekdays" aria-hidden="true">${[...'月火水木金土日'].map(t=>`<span>${t}</span>`).join('')}</div><div class="calendar-days">${Array.from({length:cellCount},(_,i)=>{const d=add(start,i),bits=summary(d);return `<button type="button" class="calendar-cell ${d.slice(0,7)!==month?'outside-month':''}" data-calendar-date="${d}" aria-pressed="${d===date}" ${d===today?'aria-current="date"':''} aria-label="${d.slice(0,4)}年 · ${label(d)}${d===today?' · 今日':''} · ${bits.length?bits.join(' · '):'予定・期限・記録なし'}"><span class="calendar-number">${Number(d.slice(8))}</span><span class="calendar-markers">${bits.length?`<span>${h(bits[0]==='その他'?'予定':bits[0])}</span>${bits.length>1?`<small aria-hidden="true">+${bits.length-1}</small>`:''}`:''}</span></button>`;}).join('')}</div>`;
      }else{
        $('#calendar-board').innerHTML=`<div class="calendar-week-list">${Array.from({length:7},(_,i)=>{const d=add(monday(date),i);return `<button type="button" class="calendar-week-day" data-calendar-date="${d}" aria-pressed="${d===date}"><strong>${label(d)}${d===today?' · 今日':''}</strong><span>${events(d).map(e=>`${h(e.time?(e.time+(e.endTime?'–'+e.endTime:'')):'時刻未定')} ${h(e.title||types[e.type])}`).join('<br>')||'予定なし'}<small>${tasksOn(d).filter(t=>t.status!=='done').length}件の期限${notesOn(d)?' · 記録あり':''}</small></span>${arrow}</button>`;}).join('')}</div>`;
      }
      $('#calendar-schedule').innerHTML='<h3>予定</h3>'+(events(date).map(e=>`<button type="button" class="schedule-row" data-schedule-edit="${h(e.id)}"><span class="continuity-row-copy"><small>${types[e.type]} · ${h(e.time?(e.time+(e.endTime?'–'+e.endTime:'')):'時刻未定')}</small><strong data-user-content>${h(e.title||types[e.type])}</strong>${e.location?`<small data-user-content>${h(e.location)}</small>`:''}</span><span class="small-text">編集</span></button>`).join('')||empty('この日の予定はありません。'));
      $('#calendar-tasks').innerHTML='<h3>この日が期限のタスク</h3>'+(taskRows(tasksOn(date))||empty('この日が期限のタスクはありません。'));
      $('#calendar-note').innerHTML=`<h3>この日のノート</h3>${notesOn(date)?`<p>${h(days()[date]?.intention||'残したプレーを見る')}</p>${link('day.html',date,'記録を見る')}`:empty('まだ記録はありません。')}<div class="calendar-note-actions">${link('record.html',date,'テーマを書く')}${link('reflection.html',date,'ふりかえる')}</div>`;
      history.replaceState(null,'',url('calendar.html',date,{view}));
    }
    function draft(){return {id:editId,date:$('#schedule-date').value,type:$('#schedule-type').value,title:$('#schedule-title').value,time:$('#schedule-time').value,endTime:$('#schedule-endTime').value,location:$('#schedule-location').value,notes:$('#schedule-notes').value};}
    function openEditor(id=null){
      editId=id;const saved=id?schedules.find(s=>s.id===id):{id:null,date,type:'practice',title:'',time:''};if(!saved)return;
      const kept=read('schedule-draft-v1',null), s=kept&&kept.id===id&&(!id?kept.date===date:true)?kept:saved;
      $('#schedule-editor-title').textContent=id?'予定を編集':'予定を追加';
      for(const key of ['date','type','title','time','endTime','location','notes'])$('#schedule-'+key).value=s[key]||'';
      $('[data-schedule-delete]').hidden=!id;$('#schedule-error').hidden=true;
      $('#schedule-draft-status').textContent=s===kept?'保存前の下書きを復元しました。':'同じ日の同じ種類の予定は、1件にまとめます。';
      $('#schedule-editor').showModal();$('#schedule-title').focus();
    }
    const keepDraft=()=>{if(!put('schedule-draft-v1',draft())){$('#schedule-draft-status').textContent='下書きを保存できませんでした。この画面を閉じる前に内容を控えてください。';}};
    $('#schedule-form').addEventListener('input',keepDraft);$('#schedule-form').addEventListener('change',keepDraft);
    $('#schedule-editor').addEventListener('cancel',keepDraft);
    $('[data-schedule-close]').addEventListener('click',()=>{keepDraft();$('#schedule-editor').close();});
    function saveSchedule(e){
      e.preventDefault();const s=draft(),error=$('#schedule-error');
      function reject(message){error.textContent=message;error.hidden=false;}
      if(!valid(s.date))return reject('日付を入力してください。');
      if(s.title.trim().length>120)return reject('タイトルは120文字以内にしてください。');
      if(s.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))return reject('開始時刻を確認してください。');
      if(schedules.some(item=>item.id!==editId&&item.date===s.date&&item.type===s.type))return reject('同じ日の同じ種類の予定があります。いまの入力を残しています。閉じて既存の予定を編集してください。');
      if(s.endTime&&(!s.time||s.endTime<=s.time))return reject('終了時刻は開始時刻より後にしてください。');
      const next={...schedules.find(item=>item.id===editId),...s,id:editId||crypto.randomUUID(),title:s.title.trim()};const all=editId?schedules.map(item=>item.id===editId?next:item):[...schedules,next];
      if(!persist('schedules-v1',all,error))return;schedules=all;lastDeleted=null;$('#schedule-undo').hidden=true;drop('schedule-draft-v1');$('#schedule-editor').close();setDate(next.date);
    }
    $('#schedule-form').addEventListener('submit',saveSchedule);$('[data-schedule-save]').addEventListener('click',saveSchedule);
    $('[data-schedule-delete]').addEventListener('click',()=>{
      const item=schedules.find(s=>s.id===editId);if(!item)return;
      const next=schedules.filter(s=>s.id!==editId);if(!persist('schedules-v1',next,$('#schedule-error')))return;
      schedules=next;lastDeleted=item;drop('schedule-draft-v1');$('#schedule-editor').close();$('#schedule-undo').hidden=false;render();
    });
    $('[data-schedule-undo]').addEventListener('click',()=>{
      if(!lastDeleted)return;
      if(schedules.some(s=>s.date===lastDeleted.date&&s.type===lastDeleted.type)){$('#calendar-error').textContent='同じ日の予定が追加されています。重複するため、元に戻せません。';$('#calendar-error').hidden=false;return;}
      const next=[...schedules,lastDeleted];if(!persist('schedules-v1',next,$('#calendar-error')))return;
      schedules=next;lastDeleted=null;$('#schedule-undo').hidden=true;render();
    });
    document.addEventListener('click',e=>{
      const el=e.target.closest('[data-calendar-date],[data-calendar-step],[data-calendar-view],[data-calendar-today],[data-schedule-new],[data-schedule-edit]');if(!el||state)return;
      if(el.hasAttribute('data-calendar-date'))setDate(el.dataset.calendarDate,{focus:window.innerWidth<768});
      if(el.hasAttribute('data-calendar-step')){const n=Number(el.dataset.calendarStep);if(view==='week')setDate(add(date,n*7));else {const d=new Date(month+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);setDate(d.toISOString().slice(0,10));}}
      if(el.hasAttribute('data-calendar-view')){view=el.dataset.calendarView;render();}
      if(el.hasAttribute('data-calendar-today'))setDate(today);
      if(el.hasAttribute('data-schedule-new'))openEditor();
      if(el.hasAttribute('data-schedule-edit'))openEditor(el.dataset.scheduleEdit);
    });
    $('#calendar-date').addEventListener('change',e=>setDate(e.target.value));render();
  }

  if(page==='weekly'){
    document.body.classList.add('has-dock');
    const week=monday(date), end=add(week,6), future=week>today, until=end<today?end:today;
    const reviewKey='weekly-reviews-v1',draftKey='weekly-draft-v1:'+week;
    const stored=read(reviewKey,{})[week], kept=read(draftKey,null), data=kept||stored||{notice:'',direction:'continue',next:''};
    $('#weekly-period-label').textContent=`${week.slice(0,4)}年 ${label(week)}〜${label(end)}`;
    $('#weekly-prev').href=url('weekly.html',add(week,-7));$('#weekly-next').href=url('weekly.html',add(week,7));$('#weekly-next').hidden=add(week,7)>today;
    $('#weekly-range-note').textContent=future?'まだ始まっていない週です。ふりかえりは、その週になってから書けます。':end>today?`${label(today)}までの記録です。週の途中でも書けます。`:'';
    const list=entries().filter(e=>e.date>=week&&e.date<=until).sort((a,b)=>a.date.localeCompare(b.date));
    const weekTasks=tasks.items.filter(t=>!t.deletedAt&&t.status==='done'&&t.completedAt&&new Date(t.completedAt).toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})>=week&&new Date(t.completedAt).toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})<=until);
    $('#weekly-evidence-count').textContent=`ノート${list.length}日 · 完了${weekTasks.length}件`;
    $('.weekly-records').open=window.innerWidth>=768;
    $('#weekly-evidence').innerHTML=(renderNoteRows(list)||empty('この週のノートはまだありません。思い出せることから書いて大丈夫。'))+(weekTasks.length?`<h3 class="weekly-task-heading">完了したタスク</h3>${taskRows(weekTasks)}`:'');
    $('#weekly-notice').value=data.notice;$('#weekly-next-action').value=data.next;
    const direction=$(`input[name=weekly-direction][value="${['continue','change','ask'].includes(data.direction)?data.direction:'continue'}"]`);direction.checked=true;
    $('#weekly-draft-status').textContent=kept?'保存前の下書きを復元しました。':stored?'保存した内容を表示しています。':'';
    const formData=()=>({week,notice:$('#weekly-notice').value.trim(),direction:$('input[name=weekly-direction]:checked').value,next:$('#weekly-next-action').value.trim()});
    function directionHelp(){const ask=$('input[name=weekly-direction]:checked').value==='ask';$('#weekly-next-label').textContent=ask?'コーチに聞いてみたいことを、一つ':'次にすることを、一つ';$('#weekly-direction-help').textContent=ask?'迷ったら、試合で求められている役割を聞いてみよう。ここに書くだけでは送信されません。':$('input[name=weekly-direction]:checked').value==='change'?'変えるのは一つで大丈夫。試せる大きさにしてみよう。':'うまくいったことを、もう一度試してみよう。';}
    function keep(){if(!put(draftKey,formData()))$('#weekly-draft-status').textContent='下書きを保存できませんでした。画面を閉じる前に内容を控えてください。';else $('#weekly-draft-status').textContent='このタブに下書きを保存しています。';directionHelp();}
    $('#weekly-form').addEventListener('input',keep);$('#weekly-form').addEventListener('change',keep);
    function showSaved(value){document.body.classList.remove('has-dock');$('#weekly-form').hidden=true;$('#weekly-saved').hidden=false;$('#weekly-saved-action').textContent=value.next;$('#weekly-to-task').href=url('tasks.html',date,{from:'weekly',source_date:week});}
    function saveWeekly(e){e.preventDefault();if(future)return;const value=formData(),error=$('#weekly-error');if(!value.next||value.next.length>200||value.notice.length>600){error.textContent='次にすることを200文字以内で書いてください。気づいたことは600文字までです。';error.hidden=false;$('#weekly-next-action').focus();return;}const all=read(reviewKey,{});all[week]={...value,goal:journey.profile().goal,focus:journey.profile().focus,savedAt:new Date().toISOString()};if(!persist(reviewKey,all,error))return;drop(draftKey);showSaved(value);$('#weekly-to-task').focus();}
    $('[data-weekly-save]').addEventListener('click',saveWeekly);$('#weekly-form').addEventListener('submit',saveWeekly);
    $('[data-weekly-edit]').addEventListener('click',()=>{document.body.classList.add('has-dock');$('#weekly-saved').hidden=true;$('#weekly-form').hidden=false;$('#weekly-notice').focus();});
    if(future)$$('#weekly-form input,#weekly-form textarea,#weekly-form button').forEach(el=>el.disabled=true);
    else if(stored&&!kept)showSaved(stored);
    directionHelp();
  }
})();
