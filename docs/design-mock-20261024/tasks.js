/* Interactive design mock only. No backend, notifications, coach messages or billing.
   Personal / example tasks are isolated. Keep production authorization on the server. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const page = document.body.dataset.page;
  if(!['tasks','reflection-saved','day','intention','intention-ready','home','calendar','weekly'].includes(page))return;
  const params = new URLSearchParams(location.search);
  const base = 'osn-design-20261024:tasks-v1:';
  const read = (key, fallback) => { try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const put = (key, value) => { try { sessionStorage.setItem(key,JSON.stringify(value));return true; } catch { return false; } };
  const drop = key => { try { sessionStorage.removeItem(key); } catch {} };
  const h = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => crypto.randomUUID();
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value||'') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
  const addDays = (date,n) => {const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const dateText = date => {if(!validDate(date))return '期限なし';const d=new Date(date+'T12:00:00Z');return `${d.getUTCMonth()+1}/${d.getUTCDate()}（${'日月火水木金土'[d.getUTCDay()]}）`;};
  const star = '<svg viewBox="0 0 24 24" class="ico small" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>';
  const chevron = '<svg viewBox="0 0 24 24" class="ico small" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  let mode = ['home','calendar','weekly'].includes(page) ? (window.osnJourney.prefix.includes('season-example')?'demo':'own') : ['demo','own'].includes(params.get('tasks')) ? params.get('tasks') : read(base+'mode','demo');
  if(!['demo','own'].includes(mode))mode='demo';
  if(page==='tasks')put(base+'mode',mode);
  const key=base+mode;
  const goal = mode==='demo' ? {goal:'Aチームのスタメンとして、試合で結果を出す',focus:'ドリブルからチャンスをつくる'} : window.osnJourney.profile();
  const fresh = () => ({items:[],lists:[{id:'training',name:'自主練習'},{id:'match',name:'試合に向けて'},{id:'life',name:'日々のこと'}]});
  function seed() {
    const s=fresh();
    const make=(id,title,due,list,extra={})=>({id,title,due,list,notes:'',important:false,repeat:'none',reminder:'none',goal:goal.focus,status:'open',subtasks:[],owner:'self',source:null,createdAt:'2026-10-24T09:00:00Z',completedAt:null,deletedAt:null,rev:0,...extra});
    s.items=[
      make('sample-coach-question','コーチに、先発で続けたい役割を聞く','2026-10-23','match',{notes:'自分ではドリブルがよくなったと感じている。試合で任されている役割も確かめたい。'}),
      make('sample-video','昨日のドリブルを見て、抜いた後の判断を1つ書く','2026-10-25','training',{important:true,notes:'青葉FC戦の折り返しから、1アシスト。春の映像と比べる。',subtasks:[{id:'v1',title:'折り返しの場面を選ぶ',done:true},{id:'v2',title:'抜いた後に、どこを見ていたかを書く',done:false}]}),
      make('sample-week','今週の挑戦を1つ見直す','2026-10-25','training',{repeat:'weekly',reminder:'same',subtasks:[{id:'w1',title:'できるようになったことを1つ選ぶ',done:false},{id:'w2',title:'来週も続けることを決める',done:false}]}),
      make('sample-practice','1対1で、抜いた後に顔を上げることを試す','2026-10-27','training',{important:true}),
      make('sample-coach','抜いた後の場面を、動画から1つ選ぶ','2026-10-28','match',{owner:'coach',coach:'山田コーチ',notes:'うまくいった場面でも、迷った場面でも大丈夫。次の練習で一緒に見返そう。'}),
      make('sample-collection','春と秋のプレーを1本にまとめる','','match'),
      make('sample-reflection','青葉FC戦をふりかえる','2026-10-24','match',{status:'done',completedAt:'2026-10-24T12:00:00Z',notes:'先発60分・1アシスト。次も縦への仕掛けを続けたい。'})
    ];return s;
  }
  let model=read(key,null);
  if(!model||!Array.isArray(model.items)||!Array.isArray(model.lists)){model=mode==='demo'?seed():fresh();put(key,model);}

  window.osnTasks = {mode,items:clone(model.items),lists:clone(model.lists),today:validDate(read(base+'today','2026-10-25'))?read(base+'today','2026-10-25'):'2026-10-25'};

  // A reflection is transferred only when the player chooses the link.
  if(page==='reflection-saved'||page==='day') {
    const date=window.osnJourney.date;
    const day=read(window.osnJourney.prefix+'days',{})[date];
    if(day?.reflection?.next?.trim()) {
      const a=document.createElement('a');a.className='mock-control task-reflection-link';a.textContent='次の一歩をタスクにする';
      a.href=`tasks.html?tasks=${window.osnJourney.prefix.includes('season-example')?'demo':'own'}&from=reflection&source_date=${date}`;
      const target=page==='reflection-saved'?$('.daily-saved-copy'):$('#day-detail .day-actions');
      target?.insertAdjacentElement(page==='reflection-saved'?'afterend':'beforeend',a);
    }
  }
  if(['intention','intention-ready'].includes(page)&&params.has('task_id')) {
    const task=model.items.find(t=>t.id===params.get('task_id')&&!t.deletedAt);
    if(task) {
      const section=document.createElement('section');section.className='task-theme-source';
      section.innerHTML=`<span class="small-text">タスクから、今日のテーマへ</span><p>${h(task.title)}</p><button type="button" class="mock-control mock-secondary" data-apply-task-theme>テーマに使う</button><p class="small-text">使うかどうかは、自分で決められます。タスクは完了になりません。</p>`;
      $('#daily-form')?.prepend(section);
      const dialog=document.createElement('dialog');dialog.innerHTML='<h2>入力中のテーマを置き換えますか？</h2><p>いまの入力をタスクの内容に置き換えます。</p><div class="dialog-actions"><button type="button" class="mock-control" data-keep-theme>いまのテーマを残す</button><button type="button" class="mock-control mock-secondary" data-replace-theme>置き換える</button></div>';
      document.body.append(dialog);
      const field=$('#daily-form [name=intention]');
      const apply=()=>{field.value=task.title;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();section.querySelector('[data-apply-task-theme]').textContent='テーマに反映しました';};
      $('[data-apply-task-theme]').addEventListener('click',()=>field.value.trim()&&field.value.trim()!==task.title?dialog.showModal():apply());
      $('[data-keep-theme]').addEventListener('click',()=>dialog.close());
      $('[data-replace-theme]').addEventListener('click',()=>{dialog.close();apply();});
    }
  }
  if(page!=='tasks')return;

  let today=read(base+'today','2026-10-25');if(!validDate(today))today='2026-10-25';
  let view=['today','upcoming','all','done','trash'].includes(location.hash.slice(1))?location.hash.slice(1):'today';
  let search='',listFilter='',onlyImportant=false,sort='due',lastUndo=null,editor=null;
  let loadState=['loading','error'].includes(params.get('state'))?params.get('state'):'';
  let failSaveOnce=params.get('simulate')==='save-error';
  let confirmAction=null;
  const listName=id=>model.lists.find(l=>l.id===id)?.name||'リストなし';
  const own=t=>t.owner!=='coach';
  const fail=(message,editorError=false)=>{const el=$(editorError?'#task-editor-error':'#task-error');el.textContent=message;el.hidden=false;};
  const announce=(text)=>{const el=$('#toast');el.textContent=text;el.hidden=false;setTimeout(()=>{el.hidden=true;},4500);};
  function commit(next,message,{undo=true,editorError=false}={}) {
    if(failSaveOnce){failSaveOnce=false;fail('保存できませんでした。入力は残っています。もう一度お試しください。',editorError);return false;}
    if(!put(key,next)){fail('このタブに保存できませんでした。入力は残っています。ブラウザーの保存設定を確認してください。',editorError);return false;}
    const before=clone(model);model=next;
    lastUndo=undo?{before,message}:null;
    $('#task-error').hidden=true;$('#task-editor-error').hidden=true;
    $('#task-undo').hidden=!lastUndo;$('#task-undo-text').textContent=message;
    render();return true;
  }
  function ask(title,copy,yes,action) {
    $('#task-confirm-title').textContent=title;$('#task-confirm-copy').textContent=copy;$('[data-task-confirm-yes]').textContent=yes;confirmAction=action;$('#task-confirm').showModal();
  }
  $('[data-task-cancel-confirm]').addEventListener('click',()=>{$('#task-confirm').close();confirmAction=null;});
  $('[data-task-confirm-yes]').addEventListener('click',()=>{const action=confirmAction;confirmAction=null;$('#task-confirm').close();action?.();});

  function filterView(t,target=view) {
    if(target==='trash')return Boolean(t.deletedAt);
    if(t.deletedAt)return false;
    if(target==='done')return t.status==='done';
    if(t.status==='done')return false;
    if(target==='today')return Boolean(t.due)&&t.due<=today;
    if(target==='upcoming')return t.due>today;
    return true;
  }
  function row(t) {
    const finished=t.status==='done';const trash=Boolean(t.deletedAt);
    const meta=[t.due?`${dateText(t.due)}${t.due===today&&!finished?' · 今日まで':''}`:'期限なし',listName(t.list)];
    if(t.repeat!=='none')meta.push(t.repeat==='daily'?'毎日':'毎週');
    if(t.subtasks.length)meta.push(`${t.subtasks.filter(s=>s.done).length}/${t.subtasks.length}ステップ`);
    if(t.reminder!=='none')meta.push('通知の設定あり');
    if(t.owner==='coach')meta.push(`${t.coach}から`);
    if(t.source)meta.push('ふりかえりから');
    return `<div class="task-row ${finished?'is-complete':''}" data-task-row="${h(t.id)}">${trash?'':`<label class="task-completion"><input type="checkbox" data-task-toggle="${h(t.id)}" ${finished?'checked':''} aria-label="${h(t.title)}を${finished?'未完了に戻す':'完了にする'}"><span class="task-checkbox-mark" aria-hidden="true">✓</span></label>`}<${trash?'div':'button'} ${trash?'':`type="button" data-task-open="${h(t.id)}"`} class="task-open"><strong>${h(t.title)}</strong><span class="task-row-meta">${meta.map(h).join('<span aria-hidden="true"> · </span>')}</span></${trash?'div':'button'}>${trash?`<button type="button" class="mock-control" data-task-restore="${h(t.id)}">戻す</button>`:`<button type="button" class="task-star" data-task-star="${h(t.id)}" aria-pressed="${t.important}" aria-label="${h(t.title)}の重要度を切り替える">${star}</button>`}</div>`;
  }
  function render() {
    if(location.hash!=='#'+view)history.replaceState(null,'',location.pathname+location.search+'#'+view);
    $('#task-example-bar').hidden=mode!=='demo';
    $('#task-goal').textContent=goal.goal||'自分の目標に向けて';$('#task-focus').textContent=goal.focus?`取り組み：${goal.focus}`:'今日できる、小さな行動から始めよう。';
    $('#task-goal-link').href=`record.html?date=${today}&example=${mode==='demo'?'dribble':'own'}`;
    $('#task-today').value=today;
    $('#task-quick-title').disabled=Boolean(loadState);$('[data-task-new]').disabled=Boolean(loadState);$('[data-task-list-new]').disabled=Boolean(loadState);
    $$('[data-task-view]').forEach(a=>{if(a.dataset.taskView===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $$('[data-task-count]').forEach(el=>el.textContent=String(model.items.filter(t=>filterView(t,el.dataset.taskCount)).length));
    $('#task-list-filter').innerHTML='<option value="">すべてのリスト</option><option value="none">リストなし</option>'+model.lists.map(l=>`<option value="${h(l.id)}">${h(l.name)}</option>`).join('');$('#task-list-filter').value=listFilter;
    $('#task-list-summary').innerHTML=model.lists.map(l=>`<button class="task-list-shortcut" type="button" data-task-list-shortcut="${h(l.id)}"><span>${h(l.name)}</span><span class="small-text">${model.items.filter(t=>!t.deletedAt&&t.status==='open'&&t.list===l.id).length}</span></button>`).join('');
    const quickDue=view==='today'||view==='done'?today:view==='upcoming'?addDays(today,1):'';
    $('#task-quick-hint').textContent=quickDue?`${quickDue===today?'今日':dateText(quickDue)}のタスクに追加します`:'期限なしで追加します';
    $('#task-quick-form').hidden=view==='trash';$('.task-quick-caption').hidden=view==='trash';
    $('#task-view-title').textContent=({today:`今日 · ${dateText(today)}`,upcoming:'これから',all:'すべてのタスク',done:'完了したタスク',trash:'削除したタスク'})[view];
    let filtered=model.items.filter(t=>filterView(t)&&(!listFilter||t.list===listFilter||(listFilter==='none'&&!t.list))&&(!onlyImportant||t.important)&&(!search||`${t.title} ${t.notes} ${t.goal} ${t.subtasks.map(s=>s.title).join(' ')}`.toLocaleLowerCase('ja').includes(search)));
    filtered.sort((a,b)=>view==='done'?(b.completedAt||'').localeCompare(a.completedAt||''):sort==='important'?Number(b.important)-Number(a.important)||(a.due||'9999').localeCompare(b.due||'9999'):sort==='new'?b.createdAt.localeCompare(a.createdAt):(a.due||'9999').localeCompare(b.due||'9999')||Number(b.important)-Number(a.important));
    $('#task-result-count').textContent=`${filtered.length}件`;
    const activeFilters=Number(Boolean(listFilter))+Number(onlyImportant)+Number(sort!=='due');$('#task-filter-count').textContent=activeFilters?` ${activeFilters}`:'';
    if(loadState){$('#task-result-count').textContent='';$('#task-results').innerHTML=loadState==='loading'?'<div class="task-empty" role="status"><h3>タスクを読み込んでいます</h3><p>読み込み中の表示見本です。</p><button type="button" class="mock-control mock-secondary" data-task-retry>読み込み後を見る</button></div>':'<div class="task-empty" role="alert"><h3>タスクを読み込めませんでした</h3><p>保存済みのタスクはそのまま残っています。</p><button type="button" class="mock-control mock-secondary" data-task-retry>もう一度読み込む</button></div>';$('#task-quick-add').disabled=true;return;}
    $('#task-quick-add').disabled=!$('#task-quick-title').value.trim();
    if(!filtered.length){
      const constrained=search||listFilter||onlyImportant;
      const copy=constrained?['条件に合うタスクがありません','検索やリスト、重要度の条件を変えてみよう。']:view==='done'?['完了したタスクがここに残ります','小さく終えたことを、あとから見返せます。']:view==='trash'?['削除したタスクはありません','削除したタスクは、この一覧から戻せます。']:view==='today'?['今日のタスクはありません','これからの予定や、期限のないタスクも見返せます。']:view==='upcoming'?['これからの予定はありません','次の練習でやりたいことが決まったら、追加しよう。']:['まだタスクがありません','やることをひとつ、上の欄から追加してみよう。'];
      $('#task-results').innerHTML=`<div class="task-empty"><h3>${copy[0]}</h3><p>${copy[1]}</p>${constrained?'<button type="button" class="mock-control mock-secondary" data-task-reset-filters>条件をリセット</button>':view==='today'?'<button type="button" class="mock-control mock-secondary" data-show-all>すべてのタスクを見る</button>':''}</div>`;return;
    }
    const groups=new Map();
    for(const t of filtered){let label=view==='done'?'完了':view==='trash'?'削除済み':sort!=='due'?'タスク':!t.due?'期限なし':t.due<today?'予定を見直したいタスク':t.due===today?'今日まで':dateText(t.due);if(!groups.has(label))groups.set(label,[]);groups.get(label).push(t);}
    $('#task-results').innerHTML=[...groups].map(([label,items])=>`<section class="task-group"><div class="task-group-heading"><h3>${h(label)}</h3>${label==='予定を見直したいタスク'?'<span class="small-text">期限を変えても大丈夫</span>':''}</div><div class="task-list-surface">${items.map(row).join('')}</div></section>`).join('');
  }
  const newTask=(title='',due='')=>({id:uid(),title,due,list:listFilter&&listFilter!=='none'?listFilter:'',notes:'',important:false,repeat:'none',reminder:'none',goal:'',status:'open',subtasks:[],owner:'self',source:null,createdAt:new Date().toISOString(),completedAt:null,deletedAt:null,rev:0});
  const defaultDue=()=>view==='today'||view==='done'?today:view==='upcoming'?addDays(today,1):'';
  function quickAdd(event){event.preventDefault();if(loadState)return;const title=$('#task-quick-title').value.trim();if(!title)return;const next=clone(model);next.items.push(newTask(title,defaultDue()));if(commit(next,'タスクを追加しました')){$('#task-quick-title').value='';if(view==='done')view='today';render();$('#task-quick-title').focus();}}
  $('#task-quick-form').addEventListener('submit',quickAdd);$('#task-quick-add').addEventListener('click',quickAdd);$('#task-quick-title').addEventListener('input',()=>$('#task-quick-add').disabled=loadState||!$('#task-quick-title').value.trim());
  $('[data-task-filters-close]').addEventListener('click',()=>$('.task-filter-panel').open=false);
  $('#task-search').addEventListener('input',e=>{search=e.target.value.trim().toLocaleLowerCase('ja');render();});
  $('#task-list-filter').addEventListener('change',e=>{listFilter=e.target.value;render();});
  $('#task-important-filter').addEventListener('change',e=>{onlyImportant=e.target.checked;render();});
  $('#task-sort').addEventListener('change',e=>{sort=e.target.value;render();});
  $('#task-today').addEventListener('change',e=>{if(validDate(e.target.value)){today=e.target.value;put(base+'today',today);render();}else e.target.value=today;});
  function resetFilters(){search='';listFilter='';onlyImportant=false;$('#task-search').value='';$('#task-important-filter').checked=false;render();}
  function selectView(value){view=value;history.replaceState(null,'','#'+view);render();}
  window.addEventListener('hashchange',()=>{if(['today','upcoming','all','done','trash'].includes(location.hash.slice(1))){view=location.hash.slice(1);render();}});

  function toggleTask(id,allSteps=false) {
    const original=model.items.find(t=>t.id===id&&!t.deletedAt);if(!original)return;
    if(original.status==='open'&&!allSteps&&original.subtasks.some(s=>!s.done)){
      render();ask('残っているステップも完了にしますか？',`まだ終わっていないステップが${original.subtasks.filter(s=>!s.done).length}件あります。`,'すべて完了にする',()=>toggleTask(id,true));return;
    }
    const next=clone(model);const t=next.items.find(t=>t.id===id);
    if(t.status==='done') {
      const child=next.items.find(item=>item.generatedFrom===t.id);
      if(child&&(child.rev>0||child.status==='done'||child.deletedAt)){
        render();ask('この完了は戻せません','次回分を変更済みです。以前の履歴を戻す代わりに、必要な行動を新しく追加できます。','閉じる',()=>{});return;
      }
      if(child)next.items=next.items.filter(item=>item.id!==child.id);
      t.status='open';t.completedAt=null;t.rev++;
    } else {
      t.status='done';t.completedAt=new Date().toISOString();t.subtasks.forEach(s=>s.done=true);t.rev++;
      if(t.repeat!=='none'&&validDate(t.due)) {
        const step=t.repeat==='daily'?1:7;const daysPast=Math.floor((Date.parse(today)-Date.parse(t.due))/86400000);const due=addDays(t.due,Math.max(1,Math.floor(daysPast/step)+1)*step);
        next.items.push({...clone(t),id:uid(),due,status:'open',completedAt:null,createdAt:new Date().toISOString(),rev:0,generatedFrom:t.id,source:null,subtasks:t.subtasks.map(s=>({...s,id:uid(),done:false}))});
      }
    }
    if(commit(next,t.status==='done'?(t.repeat!=='none'?'完了しました。次回分を追加しました':'タスクを完了しました'):'未完了に戻しました')){if($('#task-editor').open){drop(key+':draft:'+id);$('#task-editor').close();editor=null;}}else render();
  }
  function deleteTask(id) {
    const t=model.items.find(t=>t.id===id);if(!t||!own(t))return;
    ask('タスクを削除しますか？','「削除したタスク」から戻せます。'+(t.repeat==='none'?'':t.status==='done'?'作成済みの次回タスクは残ります。':'このタスクから次回分は作られません。'),'削除する',()=>{
      const next=clone(model);const item=next.items.find(t=>t.id===id);item.deletedAt=new Date().toISOString();item.rev++;
      if(commit(next,'タスクを削除しました')){drop(key+':draft:'+id);$('#task-editor').close();editor=null;}
    });
  }
  function restoreTask(id){const next=clone(model);const t=next.items.find(t=>t.id===id);if(!t)return;t.deletedAt=null;t.rev++;commit(next,'タスクを戻しました');}
  $('[data-task-undo]').addEventListener('click',()=>{if(!lastUndo)return;const previous=clone(lastUndo.before);if(commit(previous,'操作を元に戻しました',{undo:false}))announce('操作を元に戻しました');});

  const draftKey=id=>key+':draft:'+(id||'new');
  function formData() {
    return {...editor.task,title:$('#task-title').value.trim(),due:$('#task-due').value,list:$('#task-list').value,important:$('#task-important').checked,notes:$('#task-notes').value.trim(),repeat:$('#task-repeat').value,reminder:$('#task-reminder').value,goal:$('#task-link-goal').checked?(goal.focus||editor.task.goal||''):editor.task.goal&&$('#task-link-goal').disabled?editor.task.goal:'',subtasks:clone(editor.task.subtasks)};
  }
  function keepDraft(){if(!editor)return;editor.task=formData();if(!put(draftKey(editor.id),{task:editor.task,baseRev:editor.baseRev}))fail('下書きを保存できませんでした。この画面を閉じる前に内容を控えてください。',true);}
  function renderSubtasks(){
    $('#task-subtasks').innerHTML=editor.task.subtasks.map(s=>`<div class="task-subtask"><label><input type="checkbox" data-subtask-check="${h(s.id)}" ${s.done?'checked':''}><span>${h(s.title)}</span></label>${own(editor.task)?`<button type="button" class="mock-control" data-subtask-remove="${h(s.id)}" aria-label="${h(s.title)}を削除">×</button>`:''}</div>`).join('');
  }
  function openEditor(id=null,seedData=null) {
    const original=id?model.items.find(t=>t.id===id&&!t.deletedAt):newTask('',defaultDue());if(!original)return;
    const draft=read(draftKey(id),null);
    const useDraft=!seedData&&draft&&(!id||draft.baseRev===original.rev);
    editor={id,baseRev:original.rev,task:clone(useDraft?draft.task:seedData?{...original,...seedData}:original)};
    const t=editor.task;const editable=own(t);
    $('#task-editor-title').textContent=id?'タスクの詳細':'タスクを追加';
    $('#task-title').value=t.title;$('#task-due').value=t.due;$('#task-important').checked=t.important;$('#task-notes').value=t.notes;$('#task-repeat').value=t.repeat;$('#task-reminder').value=t.reminder;
    $('#task-list').innerHTML='<option value="">リストなし</option>'+model.lists.map(l=>`<option value="${h(l.id)}">${h(l.name)}</option>`).join('');$('#task-list').value=t.list;
    $('#task-link-goal').checked=Boolean(t.goal);$('#task-link-goal').disabled=!editable||!goal.focus;
    $('#task-goal-preview').textContent=goal.focus||'今日のノートで取り組みを決めると、つなげられます。';
    ['#task-title','#task-due','#task-list','#task-notes','#task-repeat','#task-reminder'].forEach(s=>$(s).disabled=!editable);
    $('.task-subtask-add').hidden=!editable;$('.task-delete-row').hidden=!id||!editable;
    $('#task-owner-note').hidden=editable;$('#task-owner-note').textContent=editable?'':`${t.coach}からの課題です。内容と期限はコーチが管理します。完了の記録は自分で付けられます。`;
    $('#task-subtask-title').value='';renderSubtasks();
    $('#task-origin').hidden=!t.source;$('#task-origin').innerHTML=t.source?`<span class="small-text">${h(dateText(t.source.date))}${t.source.kind==='weekly'?'の週のふりかえり':'のふりかえり'}から</span><a class="quiet-link" href="${t.source.kind==='weekly'?'weekly.html':'day.html'}?date=${h(t.source.date)}&example=${mode==='demo'?'dribble':'own'}&tasks=${mode}">元の記録を見る</a>`:'';
    $('#task-detail-actions').hidden=!id;$('[data-task-complete]').textContent=t.status==='done'?'未完了に戻す':'完了にする';
    $('#task-to-theme').href=`record.html?date=${today}&example=${mode==='demo'?'dribble':'own'}&tasks=${mode}&task_id=${encodeURIComponent(t.id)}`;
    $('[data-task-save]').textContent=id?(editable?'変更を保存する':'チェックを保存する'):'追加する';
    $('#task-edit-help').textContent=useDraft?'保存前の下書きを復元しました':'入力中の内容は、このタブに下書き保存されます';$('#task-editor-error').hidden=true;
    $('.task-more').open=Boolean(t.notes||t.repeat!=='none'||t.reminder!=='none'||t.goal);
    $('#task-editor').showModal();$('#task-title').focus();
  }
  function addSubtask(){if(!editor||!own(editor.task))return;const title=$('#task-subtask-title').value.trim();if(!title)return;if(editor.task.subtasks.length>=20){fail('ステップは20件まで追加できます。',true);return;}editor.task.subtasks.push({id:uid(),title,done:false});$('#task-subtask-title').value='';renderSubtasks();keepDraft();$('#task-subtask-title').focus();}
  $('[data-subtask-add]').addEventListener('click',addSubtask);$('#task-subtask-title').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addSubtask();}});
  $('#task-editor-form').addEventListener('input',e=>{if(e.target.id!=='task-subtask-title')keepDraft();});
  $('#task-editor-form').addEventListener('change',e=>{
    if(e.target.matches('[data-subtask-check]')){const s=editor.task.subtasks.find(s=>s.id===e.target.dataset.subtaskCheck);if(s)s.done=e.target.checked;}
    keepDraft();
  });
  function saveEditor(e,after=null){e.preventDefault();if(!editor)return;if($('#task-subtask-title').value.trim()){if(editor.task.subtasks.length>=20){fail('ステップは20件まで追加できます。',true);return;}addSubtask();}let t=formData();
    if(!t.title){fail('やることを入力してください。',true);$('#task-title').focus();return;}
    if(t.title.length>200){fail('やることは200文字以内にしてください。元のふりかえりはリンクから見返せます。',true);$('#task-title').focus();return;}
    if(t.due&&!validDate(t.due)){fail('期限を確認してください。',true);return;}
    if((t.repeat!=='none'||t.reminder!=='none')&&!t.due){fail('繰り返しや通知を使うときは、期限を入れてください。',true);$('#task-due').focus();return;}
    if(editor.id){const current=model.items.find(t=>t.id===editor.id&&!t.deletedAt);if(!current||current.rev!==editor.baseRev){fail('タスクが更新されています。画面を開き直してから編集してください。',true);return;}if(!own(current))t={...current,important:t.important,subtasks:t.subtasks};t.rev=current.rev+1;}
    const next=clone(model);if(editor.id)next.items=next.items.map(item=>item.id===editor.id?t:item);else next.items.push(t);
    if(commit(next,editor.id?'タスクを更新しました':'タスクを追加しました',{editorError:true})){drop(draftKey(editor.id));$('#task-editor').close();editor=null;$('#task-quick-title').value='';if(!filterView(t)){view='all';resetFilters();}render();after?.(t.id);}
  }
  $('#task-editor-form').addEventListener('submit',saveEditor);$('[data-task-save]').addEventListener('click',saveEditor);
  $('[data-task-close]').addEventListener('click',()=>{keepDraft();$('#task-editor').close();editor=null;});
  $('#task-editor').addEventListener('cancel',()=>{keepDraft();});
  $('[data-task-complete]').addEventListener('click',event=>{if(!editor?.id)return;const id=editor.id;const current=model.items.find(t=>t.id===id);if(JSON.stringify(formData())!==JSON.stringify(current))saveEditor(event,()=>toggleTask(id));else toggleTask(id);});
  $('[data-task-delete]').addEventListener('click',()=>{if(editor?.id)deleteTask(editor.id);});

  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-task-view],[data-task-open],[data-task-star],[data-task-new],[data-task-restore],[data-subtask-remove],[data-task-retry],[data-task-reset-filters],[data-show-all],[data-task-list-shortcut]');if(!el)return;
    if(el.hasAttribute('data-task-view')){event.preventDefault();selectView(el.dataset.taskView);}
    if(el.hasAttribute('data-task-open'))openEditor(el.dataset.taskOpen);
    if(el.hasAttribute('data-task-star')){const next=clone(model);const t=next.items.find(t=>t.id===el.dataset.taskStar);if(t){t.important=!t.important;t.rev++;commit(next,t.important?'重要なタスクにしました':'重要度を外しました');}}
    if(el.hasAttribute('data-task-new'))openEditor(null,$('#task-quick-title').value.trim()?{title:$('#task-quick-title').value.trim()}:null);
    if(el.hasAttribute('data-task-restore'))restoreTask(el.dataset.taskRestore);
    if(el.hasAttribute('data-subtask-remove')){editor.task.subtasks=editor.task.subtasks.filter(s=>s.id!==el.dataset.subtaskRemove);renderSubtasks();keepDraft();}
    if(el.hasAttribute('data-task-retry')){loadState='';render();}
    if(el.hasAttribute('data-task-reset-filters'))resetFilters();
    if(el.hasAttribute('data-show-all'))selectView('all');
    if(el.hasAttribute('data-task-list-shortcut')){listFilter=el.dataset.taskListShortcut;view='all';render();}
  });
  $('#task-results').addEventListener('change',e=>{if(e.target.matches('[data-task-toggle]'))toggleTask(e.target.dataset.taskToggle);});
  $('[data-task-list-new]').addEventListener('click',()=>{$('#task-list-name').value='';$('#task-list-error').hidden=true;$('#task-list-dialog').showModal();});
  $('[data-task-close-list]').addEventListener('click',()=>$('#task-list-dialog').close());
  function createList(e){e.preventDefault();const name=$('#task-list-name').value.trim();const error=$('#task-list-error');if(!name||model.lists.some(l=>l.name===name)){error.textContent=name?'同じ名前のリストがあります。':'リスト名を入力してください。';error.hidden=false;return;}const next=clone(model);const id=uid();next.lists.push({id,name});if(commit(next,'リストを追加しました')){$('#task-list-dialog').close();listFilter=id;view='all';render();}}
  $('[data-task-create-list]').addEventListener('click',createList);$('#task-list-form').addEventListener('submit',createList);

  render();
  if(!loadState&&params.has('task_id')) {
    const found=model.items.find(t=>t.id===params.get('task_id')&&!t.deletedAt);
    if(found)openEditor(found.id);else announce('このタスクが見つかりません。削除したタスクも確認できます。');
  }
  if(!loadState&&params.get('from')==='weekly'&&validDate(params.get('source_date'))) {
    const date=params.get('source_date');const review=read(window.osnJourney.prefix+'weekly-reviews-v1',{})[date];
    if(review?.next?.trim()) {
      const existing=model.items.find(t=>!t.deletedAt&&t.source?.kind==='weekly'&&t.source?.date===date);
      if(existing){openEditor(existing.id);$('#task-edit-help').textContent='この週から作ったタスクです。重複して追加しません。元のふりかえりを編集しても、タスクは自動変更しません。';}
      else openEditor(null,{title:review.next.trim(),goal:review.focus||'',source:{kind:'weekly',date},due:addDays(date,7)>today?addDays(date,7):today});
    }else announce('この週のふりかえりはまだ保存されていません。');
  }
  if(params.get('from')==='reflection'&&validDate(params.get('source_date'))) {
    const date=params.get('source_date');const day=read(window.osnJourney.prefix+'days',{})[date];
    if(day?.reflection?.next?.trim()) {
      const existing=model.items.find(t=>!t.deletedAt&&t.source?.date===date&&t.source?.kind==='reflection');
      if(existing){openEditor(existing.id);$('#task-edit-help').textContent='このふりかえりから作ったタスクです。重複して追加しません。';}
      else openEditor(null,{title:day.reflection.next.trim(),goal:day.focus||'',source:{kind:'reflection',date},due:today});
    }else announce('この日の「次に試したいこと」はまだありません。');
  }
})();
