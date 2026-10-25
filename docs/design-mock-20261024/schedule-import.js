/* UI prototype. No OCR service or image upload. Only the labeled sample has fixture results. */
(() => {
  if(document.body.dataset.page!=='schedule-import')return;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const prefix=window.osnJourney.prefix,params=new URLSearchParams(location.search);
  const read=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(prefix+key))??fallback;}catch{return fallback;}};
  const put=(key,value)=>{try{sessionStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch{return false;}};
  const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
  const timeValid=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t||'');
  const draftKey='schedule-import-draft-v1';
  let model=read(draftKey,null),imageURL='',reading=null,replaceAction=null;
  let readFailure=params.get('simulate')==='read-error',saveFailure=params.get('simulate')==='save-error';
  const schedules=()=>read('schedules-v1',[]);
  const newRow=()=>({id:crypto.randomUUID(),include:true,date:'',type:'practice',title:'',time:'',endTime:'',location:'',notes:'',timeUnknown:false,warning:''});
  const sample=()=>{
    const make=(data)=>({...newRow(),...data});
    return [
      make({date:'2026-11-03',title:'チーム練習',time:'16:30',endTime:'18:00',location:'市民グラウンド'}),
      make({date:'2026-11-07',type:'match',title:'練習試合 vs 青葉FC',time:'09:00',endTime:'12:00',location:'青葉中学校',notes:'集合 8:30。開始時刻は9:00。'}),
      make({date:'2026-11-10',title:'チーム練習',location:'市民グラウンド',warning:'開始時刻が未定です。'}),
      make({date:'2026-11-14',type:'match',title:'練習試合（中止）',time:'10:00',include:false,warning:'中止の予定です。追加対象から外しました。'}),
      make({date:'',type:'other',title:'ミーティング',time:'18:30',location:'クラブハウス',warning:'日付を読み取れませんでした。'})
    ];
  };
  function keep(){if(model&&!put(draftKey,model)){$('#import-save-error').textContent='下書きを保存できませんでした。この画面を閉じる前に内容を控えてください。';$('#import-save-error').hidden=false;}}
  function stage(name){
    ['choose','reading','read-error','review','done'].forEach(key=>$('#import-'+key).hidden=key!==name);
    document.body.classList.toggle('has-dock',name==='review');
    $$('[data-import-step]').forEach(el=>{if(el.dataset.importStep===(['reading','read-error'].includes(name)?'choose':name))el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
  }
  function errors(row){
    if(!row.include)return [];
    const out=[];
    if(!valid(row.date))out.push('日付を確認してください。');
    if(!row.title.trim())out.push('予定のタイトルを入力してください。');
    if(row.title.length>120)out.push('タイトルは120文字以内にしてください。');
    if(!row.time&&!row.timeUnknown)out.push('開始時刻を入力するか、時刻未定を選んでください。');
    if(row.time&&!timeValid(row.time))out.push('開始時刻を確認してください。');
    if(row.endTime&&(!timeValid(row.endTime)||!row.time||row.endTime<=row.time))out.push('終了時刻は開始時刻より後にしてください。');
    if(row.location.length>120||row.notes.length>500)out.push('場所は120文字、メモは500文字以内にしてください。');
    if(schedules().some(s=>s.date===row.date&&s.type===row.type))out.push('同じ日の同じ種類の予定が、カレンダーにあります。');
    if(model.rows.some(s=>s.id!==row.id&&s.include&&s.date&&s.date===row.date&&s.type===row.type))out.push('選んだ予定の中で、日付と種類が重複しています。');
    return out;
  }
  function sync(){
    const chosen=model.rows.filter(r=>r.include);let invalid=0;
    for(const row of model.rows){const issue=errors(row);if(issue.length)invalid++;const el=$(`[data-import-errors="${row.id}"]`);if(el){el.textContent=issue.join(' ');el.hidden=!issue.length;}}
    $('#import-selection-count').textContent=`${model.rows.length}件中 ${chosen.length}件を選択`;
    $('#import-save-help').textContent=!chosen.length?'追加する予定を選んでください。':invalid?`${invalid}件の内容を確認してください。`:!$('#import-confirm').checked?'日時と場所を確認して、チェックしてください。':`${chosen.length}件をカレンダーに追加します。`;
    $('[data-import-save]').disabled=!chosen.length||invalid>0||!$('#import-confirm').checked;
  }
  function render(){
    $('#import-rows').innerHTML=model.rows.map((r,i)=>`<article class="import-row" data-import-row="${r.id}"><div class="import-row-heading"><label><input type="checkbox" data-import-field="include" ${r.include?'checked':''}><strong>予定 ${i+1}</strong></label><span class="small-text">${r.warning?h(r.warning):'元の画像と見比べてください。'}</span></div><div class="import-row-fields"><div class="task-form-grid"><label class="field">日付<input type="date" value="${h(r.date)}" data-import-field="date" aria-label="日付 予定${i+1}"></label><label class="field">種類<select data-import-field="type" aria-label="種類 予定${i+1}">${[['practice','練習'],['match','試合'],['other','その他']].map(([v,l])=>`<option value="${v}" ${r.type===v?'selected':''}>${l}</option>`).join('')}</select></label></div><label class="field">タイトル<input type="text" maxlength="120" value="${h(r.title)}" data-import-field="title" aria-label="タイトル 予定${i+1}"></label><div class="task-form-grid"><label class="field">開始時刻<input type="time" value="${h(r.time)}" data-import-field="time" aria-label="開始時刻 予定${i+1}"></label><label class="field">終了時刻 <span class="label-optional">任意</span><input type="time" value="${h(r.endTime)}" data-import-field="endTime" aria-label="終了時刻 予定${i+1}"></label></div><label class="import-time-unknown"><input type="checkbox" data-import-field="timeUnknown" ${r.timeUnknown?'checked':''}>時刻未定で追加する</label><label class="field">場所 <span class="label-optional">任意</span><input type="text" maxlength="120" value="${h(r.location)}" data-import-field="location" aria-label="場所 予定${i+1}"></label><details><summary>メモ</summary><label class="field"><span class="sr-only">メモ</span><textarea maxlength="500" data-import-field="notes" aria-label="メモ 予定${i+1}">${h(r.notes)}</textarea></label></details><p class="field-error" data-import-errors="${r.id}" role="status" hidden></p></div></article>`).join('')+'<label class="import-final-check"><input type="checkbox" id="import-confirm">選んだ予定の日時・場所を確認しました</label>';
    $('#import-source-name').textContent=model.filename;
    $('#import-review-help').textContent=model.kind==='manual'?'この画像は端末内で表示しています。AI未接続のため、予定を手入力してください。':'AIの読み取りには間違いがあります。元の画像と見比べてください。';
    $('#import-source-image').hidden=!imageURL;$('#import-image-missing').hidden=Boolean(imageURL);
    if(imageURL)$('#import-source-image').src=imageURL;else $('#import-source-image').removeAttribute('src');
    $('#import-image-details').open=window.innerWidth>=768;
    sync();stage('review');
  }
  function review(){
    model={id:crypto.randomUUID(),kind:'sample',filename:'sample-team-schedule.svg',rows:sample()};
    for(const row of model.rows)if(schedules().some(s=>s.date===row.date&&s.type===row.type)){row.include=false;row.warning='カレンダーにある予定です。追加対象から外しました。';}
    imageURL='sample-team-schedule.svg';keep();render();
  }
  function startSample(){stage('reading');clearTimeout(reading);reading=setTimeout(()=>{if(readFailure){readFailure=false;stage('read-error');}else review();},650);}
  function askReplace(action){if(model?.rows?.length){replaceAction=action;$('#import-replace').showModal();}else action();}
  function reset(){clearTimeout(reading);model=null;put(draftKey,null);if(imageURL.startsWith('blob:'))URL.revokeObjectURL(imageURL);imageURL='';$('#schedule-image').value='';$('#import-resume').hidden=true;stage('choose');}
  $('[data-import-sample]').addEventListener('click',()=>askReplace(startSample));
  $('[data-import-retry]').addEventListener('click',startSample);
  $('[data-import-cancel]').addEventListener('click',()=>{clearTimeout(reading);stage('choose');});
  $$('[data-import-back]').forEach(el=>el.addEventListener('click',()=>askReplace(reset)));
  $('[data-import-keep]').addEventListener('click',()=>{$('#import-replace').close();replaceAction=null;});
  $('[data-import-discard]').addEventListener('click',()=>{const action=replaceAction;replaceAction=null;$('#import-replace').close();action?.();});
  $('[data-import-new]').addEventListener('click',reset);
  $('[data-import-resume]').addEventListener('click',()=>{imageURL=model.kind==='sample'?'sample-team-schedule.svg':'';render();});
  $('.import-file-label').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#schedule-image').click();}});
  $('#schedule-image').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;const error=$('#import-file-error');error.hidden=true;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){error.textContent='10MB以下のJPEG・PNG・WebP画像を選んでください。';error.hidden=false;e.target.value='';return;}
    const candidate=URL.createObjectURL(file);const probe=new Image();probe.src=candidate;
    try{await probe.decode();}catch{URL.revokeObjectURL(candidate);error.textContent='画像を開けませんでした。別の画像を選んでください。';error.hidden=false;e.target.value='';return;}
    askReplace(()=>{if(imageURL.startsWith('blob:'))URL.revokeObjectURL(imageURL);imageURL=candidate;model={id:crypto.randomUUID(),kind:'manual',filename:file.name,rows:[newRow()]};keep();render();});
  });
  $('#import-rows').addEventListener('input',e=>{
    if(e.target.id==='import-confirm'){sync();return;}
    const field=e.target.dataset.importField;if(!field)return;const row=model.rows.find(r=>r.id===e.target.closest('[data-import-row]').dataset.importRow);if(!row)return;
    row[field]=e.target.type==='checkbox'?e.target.checked:e.target.value;
    if(field==='time'&&row.time){row.timeUnknown=false;e.target.closest('[data-import-row]').querySelector('[data-import-field=timeUnknown]').checked=false;}
    if(field==='timeUnknown'&&row.timeUnknown){row.time='';row.endTime='';for(const name of ['time','endTime'])e.target.closest('[data-import-row]').querySelector(`[data-import-field=${name}]`).value='';}
    $('#import-confirm').checked=false;keep();sync();
  });
  $('[data-import-add-row]').addEventListener('click',()=>{if(model.rows.length>=30){$('#import-save-error').textContent='一度に追加できる予定は30件までです。';$('#import-save-error').hidden=false;return;}model.rows.push(newRow());keep();render();$$('[data-import-row]').at(-1).querySelector('input[type=date]').focus();});
  $('[data-import-save]').addEventListener('click',()=>{
    if(!model)return;
    sync();if($('[data-import-save]').disabled)return;
    const error=$('#import-save-error');if(saveFailure){saveFailure=false;error.textContent='保存できませんでした。入力は残っています。もう一度お試しください。';error.hidden=false;return;}
    const all=schedules(),selected=model.rows.filter(r=>r.include);
    const existingBatch=all.filter(s=>s.importBatch===model.id);
    if(!existingBatch.length){
      const created=selected.map(r=>({id:crypto.randomUUID(),date:r.date,type:r.type,title:r.title.trim(),time:r.time,endTime:r.endTime,location:r.location.trim(),notes:r.notes.trim(),importBatch:model.id}));
      if(!put('schedules-v1',[...all,...created])){error.textContent='このタブに保存できませんでした。入力を残しています。';error.hidden=false;return;}
    }
    const count=existingBatch.length||selected.length, first=selected.map(r=>r.date).sort()[0];
    $('#import-done-count').textContent=`${count}件の予定を追加しました。`;
    const demo=prefix.includes('season-example');$('#import-calendar-link').href='calendar.html?'+new URLSearchParams({date:first,example:demo?'dribble':'own',tasks:demo?'demo':'own'});
    put(draftKey,null);model=null;stage('done');$('#import-calendar-link').focus();
  });
  $('#import-resume').hidden=!model?.rows?.length;stage('choose');
})();
