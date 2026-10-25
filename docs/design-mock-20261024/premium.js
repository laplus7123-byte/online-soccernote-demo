/* UI prototype only: no remote media download, encoding, billing or publication. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const page = document.body.dataset.page;
  if (!['gallery','video-export','export-status','exports','premium'].includes(page)) return;
  const params = new URLSearchParams(location.search), root = window.osnJourney.prefix;
  const get = (k,d=null) => { try { return JSON.parse(sessionStorage.getItem(k)) ?? d; } catch { return d; } };
  const set = (k,v) => { try { sessionStorage.setItem(k,JSON.stringify(v)); return true; } catch { toast('このタブに保存できませんでした。ブラウザーの保存設定を確認してください。'); return false; } };
  let demo = ['failed','expired'].includes(params.get('state')) || (params.get('videos') ? params.get('videos') === 'demo' : get(root+'video-demo',false));
  set(root+'video-demo',demo);
  const prefix = root+(demo?'premium-demo-v1:':'premium-own-v1:');
  const read=(k,d=null)=>get(prefix+k,d), write=(k,v)=>set(prefix+k,v);
  let plan = params.get('plan') || get(root+'preview-plan','premium');
  if (!['free','premium'].includes(plan)) plan='premium';
  set(root+'preview-plan',plan);
  const h = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=n=>{n=Math.max(0,Math.round(n));return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;};
  const show=(el,v)=>{ if(el)el.hidden=!v; };
  const button=(label,attrs='',cls='')=>`<button type="button" class="mock-control ${cls}" ${attrs}>${label}</button>`;
  function toast(message) { const t=$('#toast');t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,4200); }
  const icon=kind=>`<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${kind==='check'?'<circle cx="12" cy="12" r="9"/><path d="m7 12 4 4 6-8"/>':kind==='warning'?'<path d="m12 3 10 18H2ZM12 9v5m0 3v1"/>':'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'}</svg>`;
  if($('[data-plan-label]'))$('[data-plan-label]').textContent=`選手 / ${plan==='premium'?'プレミアム':'無料プラン'}（表示例）`;
  show($('#video-example'),demo);
  document.addEventListener('click',e=>{ if(e.target.closest('[data-close-premium]'))e.target.closest('dialog').close(); });
  const sampleRows=[
    ['oct','2026-10-24','アシスト',5,'縦に抜いて、初めてのアシスト','青葉FC戦 · Aチーム先発',12,'upload','抜いたあとに味方を見て、折り返しから1アシスト。','season-3'],
    ['sep','2026-09-19','ドリブル',4,'初先発。ドリブルからチャンスへ','練習試合 · Aチーム先発',10,'upload','自分から仕掛けて、味方のシュートにつながった。','season-2'],
    ['jun','2026-06-13','ドリブル',3,'Aチームでも、1人抜けた','練習 · Aチーム',14,'upload','1人は抜けたけど、次のパスがずれた。','season-1'],
    ['apr','2026-04-11','ドリブル',2,'最初の一歩。自分から仕掛ける','練習 · Bチーム',8,'upload','Bでは1人抜けた。Aでも仕掛けられるようになりたい。','season-0'],
    ['yt','2026-10-18','シュート',3,'試合全体から、シュートを見返す','みなとSC戦',null,'youtube','YouTubeのリンクとして記録した場面。',''],
    ['drive','2026-09-26','パス',4,'抜いたあとに、味方を見る','練習 · Aチーム',null,'drive','共有リンクだけでは元の動画ファイルを使えません。','']
  ];
  const clips=demo?sampleRows.map(([id,date,type,rating,title,match,duration,source,memo,recordId],index)=>({id,date,type,rating,title,match,duration,source,memo,recordId,index,focus:'ドリブルからチャンスをつくる',demo:true})):get(root+'records',[]).filter(r=>r.attachment).map((r,index)=>({id:r.id,date:r.date,type:r['play-type'],rating:Number(r.rating),title:r.memo?([...r.memo].slice(0,40).join('')+([...r.memo].length>40?'…':'')):r['play-type'],match:r.match==='aoba'?'青葉FC戦':r.match==='minato'?'みなとSC戦':'練習・自主練習',duration:r.attachment.duration??null,source:r.attachment.source,memo:r.memo,recordId:r.id,index,focus:r.focus||'',demo:false,url:r.attachment.url}));
  const clipById=id=>clips.find(c=>c.id===id);
  const eligible=c=>c.source==='upload'&&Number.isFinite(c.duration)&&c.duration>0;
  let selected = read('selected',[]).filter(id=>clipById(id));
  let favorites = read('favorites',demo?['oct','apr']:[]);
  let collections = read('collections',demo?[{id:'dribble',name:'ドリブルの変化',ids:['apr','jun','sep','oct']}]:[]);
  let config = read('composition',{title:demo?'春から秋のドリブル':'自分のプレー集',quality:'1080',captions:true,audio:false,clips:[]});
  function thumb(c,interactive=false) {
    const offset=(c.index||0)*19;
    const svg=`<svg viewBox="0 0 320 180" role="img" aria-label="操作確認用のピッチ図"><rect width="320" height="180" fill="var(--accent-ink)"/><g fill="none" stroke="var(--pp-white)" opacity=".55"><rect x="16" y="12" width="288" height="156"/><path d="M160 12v156M16 58h42v64H16m288-64h-42v64h42"/><circle cx="160" cy="90" r="24"/></g><g fill="var(--pp-white)"><circle cx="${84+offset}" cy="62" r="5"/><circle cx="188" cy="${112-offset/3}" r="5"/><circle cx="244" cy="54" r="5"/></g><g fill="var(--pp-ink)" stroke="var(--pp-white)"><circle cx="${104+offset}" cy="75" r="5"/><circle cx="220" cy="96" r="5"/></g><path d="m${88+offset} 60 34-18" stroke="var(--pp-white)" fill="none" stroke-dasharray="4 3"/><circle cx="${92+offset}" cy="58" r="3" fill="var(--pp-white)"/></svg>`;
    const content=c.demo?svg:`<div class="no-video-preview">動画の表示見本</div>`;
    return `<div class="video-thumb">${interactive?`<a href="#clip-${h(c.id)}" data-preview="${h(c.id)}" aria-label="${h(c.title)}の内容を見る">${content}</a>`:content}<span class="thumb-sample">${c.demo?'サンプル図':'表示見本'}</span><span class="thumb-time">${c.duration?time(c.duration):'リンク'}</span></div>`;
  }
  function saveSelection(){write('selected',selected);}
  function gate(next){write('after-plan',next);location.href='premium.html';}
  function selectionUI(){
    const picked=selected.map(clipById), available=picked.filter(eligible);
    const exportButton=$('[data-open-export]'); if(!exportButton)return;
    exportButton.disabled=!available.length;
    exportButton.textContent=available.length?`${available.length}本を書き出す`:'動画を選んで書き出す';
    $('#dock-copy').textContent=!picked.length?'保存したい動画にチェック':available.length===picked.length?`${picked.length}本選択 · 1本のMP4にまとめます`:`${picked.length}本選択 · ${picked.length-available.length}本は書き出し対象外`;
    $('[data-clear-selection]').disabled=!selected.length;$('[data-open-collection]').disabled=!selected.length;
  }
  const filterIDs=['video-search','collection-filter','type-filter','source-filter','from-filter','to-filter','rating-filter','sort-filter'];
  function filtered(){
    write('filters',Object.fromEntries(filterIDs.map(id=>[id,$('#'+id).value])));
    const q=$('#video-search').value.trim().toLowerCase(), folder=$('#collection-filter').value;
    const from=$('#from-filter').value,to=$('#to-filter').value;
    const error=from&&to&&from>to?'期間の終了は、開始以降の日付を選んでください。':'';
    $('#filter-error').textContent=error;show($('#filter-error'),!!error);
    if(error)return [];
    let list=clips.filter(c=>[c.title,c.memo,c.type,c.match,c.focus].join(' ').toLowerCase().includes(q)&&(!folder||(folder==='favorites'?favorites.includes(c.id):collections.find(f=>f.id===folder)?.ids.includes(c.id)))&&(!$('#type-filter').value||c.type===$('#type-filter').value)&&(!$('#source-filter').value||($('#source-filter').value==='upload'?eligible(c):c.source!=='upload'))&&(!from||c.date>=from)&&(!to||c.date<=to)&&c.rating>=Number($('#rating-filter').value||0));
    list.sort((a,b)=>$('#sort-filter').value==='rating'?b.rating-a.rating||b.date.localeCompare(a.date):$('#sort-filter').value==='old'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
    return list;
  }
  function renderCollections(){
    const filter=$('#collection-filter'),value=filter.value;
    filter.innerHTML='<option value="">すべての動画</option><option value="favorites">お気に入り</option>'+collections.map(c=>`<option value="${h(c.id)}">${h(c.name)}</option>`).join('');filter.value=value;
  }
  function renderGallery(){
    const list=filtered();$('#gallery-count').textContent=`${list.length}本${selected.length?` · 選択中 ${selected.length}本`:''}`;
    $('#gallery-grid').innerHTML=list.map(c=>`<article class="gallery-tile">${thumb(c,true)}<label class="video-select"><input type="checkbox" data-select="${h(c.id)}" aria-label="${h(c.title)}を選択" ${selected.includes(c.id)?'checked':''}>${h(c.type)} <span class="small-text">★${c.rating}</span></label><p>${h(c.date.replaceAll('-','/'))}</p><a href="#clip-${h(c.id)}" data-preview="${h(c.id)}" class="video-title">${h(c.title)}</a><p>${h(c.match)}</p><div class="video-meta"><span class="small-text">${eligible(c)?'書き出し可':c.source==='upload'?'元動画を再追加':'リンクのみ'}</span>${button(favorites.includes(c.id)?'★':'☆',`data-favorite="${h(c.id)}" aria-label="${h(c.title)}をお気に入り${favorites.includes(c.id)?'から外す':'に追加'}" aria-pressed="${favorites.includes(c.id)}"`,'favorite')}</div></article>`).join('');
    show($('#gallery-empty'),!list.length);
    $('#gallery-empty').innerHTML=clips.length?'<h2>該当する動画がありません</h2><p>検索する言葉や、絞り込みを変えてみてください。</p>':'<h2>プレー動画を、ここに集めよう</h2><p>プレーの記録に動画をつけると、この一覧に並びます。</p><a href="gallery.html?example=dribble&amp;videos=demo">春から秋の動画で試す →</a>';
    selectionUI();
  }
  function openPreview(id){
    const c=clipById(id);if(!c)return;
    $('#clip-dialog-title').textContent=c.title;
    $('#clip-dialog-content').innerHTML=thumb(c)+`<p class="small-text">${h(c.date)} · ${h(c.match)} · ★${c.rating}</p><p>${h(c.memo)}</p><p class="notice">${c.demo?'架空のプレーを示す図です。実際の試合映像は再生されません。':'デザイン確認用です。ここでは元の動画を再生しません。'}</p>${eligible(c)?button('この動画を書き出す',`data-single-export="${h(c.id)}"`,'mock-secondary wide'):`<p class="small-text">${c.source==='upload'?'元の動画情報がありません。動画を追加し直してください。':'このリンクからは書き出せません。保存を許可された元の動画を端末から追加してください。'}</p><a class="mock-control wide" href="play-record.html?new=1">元の動画を追加する</a>`}${c.recordId?`<a class="mock-control wide" href="play-detail.html?id=${encodeURIComponent(c.recordId)}">この日のプレー記録を見る</a>`:''}`;
    $('#clip-dialog').showModal();
  }
  function beginEditor(ids){
    const allowed=ids.map(clipById).filter(eligible);if(!allowed.length)return;
    write('excluded-count',ids.length-allowed.length);
    const keep=config.clips.filter(r=>allowed.some(c=>c.id===r.id));
    config.clips=[...keep,...allowed.filter(c=>!keep.some(r=>r.id===c.id)).map(c=>({id:c.id,start:0,end:c.duration}))];
    write('composition',config);
    if(plan==='free')gate('export.html');else location.href='export.html';
  }
  if(page==='gallery'){
    renderCollections();
    const savedFilters=read('filters',{});filterIDs.forEach(id=>{if(savedFilters[id]!==undefined)$('#'+id).value=savedFilters[id];});
    if(params.get('collection'))$('#collection-filter').value=params.get('collection');
    if(['old','new','rating'].includes(params.get('sort')))$('#sort-filter').value=params.get('sort');
    renderGallery();
    $('#video-search').addEventListener('input',renderGallery);
    ['collection-filter','type-filter','source-filter','from-filter','to-filter','rating-filter','sort-filter'].forEach(id=>$('#'+id).addEventListener('change',renderGallery));
    $('[data-reset-filters]').addEventListener('click',()=>{['video-search','collection-filter','type-filter','source-filter','from-filter','to-filter','rating-filter'].forEach(id=>$('#'+id).value='');$('#sort-filter').value='new';renderGallery();});
    document.addEventListener('change',e=>{const id=e.target.dataset.select;if(!id)return;selected=e.target.checked?[...new Set([...selected,id])]:selected.filter(x=>x!==id);saveSelection();selectionUI();$('#gallery-count').textContent=`${filtered().length}本${selected.length?` · 選択中 ${selected.length}本`:''}`;});
    document.addEventListener('click',e=>{
      const fav=e.target.closest('[data-favorite]'),preview=e.target.closest('[data-preview]'),single=e.target.closest('[data-single-export]');
      if(fav){const id=fav.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];write('favorites',favorites);renderGallery();$(`[data-favorite="${CSS.escape(id)}"]`)?.focus();}
      if(preview){e.preventDefault();openPreview(preview.dataset.preview);}
      if(single)beginEditor([single.dataset.singleExport]);
    });
    $('[data-clear-selection]').addEventListener('click',()=>{selected=[];saveSelection();renderGallery();});
    $('[data-open-export]').addEventListener('click',()=>beginEditor(selected));
    $('[data-open-collection]').addEventListener('click',()=>{if(plan==='free'){gate('gallery.html');return;}$('#collection-dialog').showModal();$('#collection-form input').focus();});
    const createCollection=e=>{e.preventDefault();const input=$('#collection-form input');input.setCustomValidity(!input.value.trim()?'名前を入力してください。':collections.some(c=>c.name===input.value.trim())?'同じ名前のプレー集があります。':'');if(!input.reportValidity())return;const group={id:crypto.randomUUID(),name:input.value.trim(),ids:[...selected]};collections.push(group);if(!write('collections',collections))return;renderCollections();$('#collection-filter').value=group.id;$('#collection-dialog').close();renderGallery();toast('プレー集を作成しました');};
    $('#collection-form').addEventListener('submit',createCollection);$('[data-create-collection]').addEventListener('click',createCollection);$('#collection-form input').addEventListener('input',e=>e.target.setCustomValidity(''));
  }
  function validComposition(){return !!config.title.trim()&&config.clips.length>0&&config.clips.every(c=>eligible(clipById(c.id)||{})&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&c.end<=clipById(c.id).duration);}
  function duration(){return config.clips.reduce((s,c)=>s+Math.max(0,c.end-c.start),0);}
  function updateSummary(){
    const valid=validComposition();$('#export-total').textContent=`${config.clips.length}本 · ${Number.isFinite(duration())?time(duration()):'--:--'}`;
    $('#export-settings-summary').textContent=`MP4 · 最大${config.quality}p · ${config.audio?'音声あり':'音声なし'} · ${config.captions?'日付・プレー名あり':'文字なし'}`;
    $$('[data-trim]').forEach(input=>{const c=config.clips.find(c=>c.id===input.dataset.id);input.setAttribute('aria-invalid',String(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>clipById(c.id).duration));});
    $('[data-start-export]').disabled=!valid;
    $('#export-error').textContent=valid?'':'動画の名前と範囲を確認してください。終了は開始より後、元の動画の長さ以内にしてください。';show($('#export-error'),!valid&&!!config.clips.length);
    $('#dock-copy').textContent=read('excluded-count',0)?`リンクなど${read('excluded-count')}本は含めず、${config.clips.length}本を書き出します`:`${config.clips.length}本 · ${Number.isFinite(duration())?time(duration()):'--:--'} · 自分の端末に保存`;
    write('composition',config);
  }
  function renderEditor(){
    config.clips=config.clips.filter(c=>eligible(clipById(c.id)||{}));
    show($('#export-empty'),!config.clips.length);show($('#export-editor'),!!config.clips.length);
    $('#export-clips').innerHTML=config.clips.map((range,i)=>{const c=clipById(range.id);return `<article class="export-clip" data-clip="${h(c.id)}"><div class="export-clip-heading">${thumb(c)}<div><div class="clip-title-line"><h3><span>${i+1}.</span> ${h(c.type)}</h3>${button('外す',`data-remove-clip="${h(c.id)}" aria-label="${h(c.title)}を書き出しから外す"`)}</div><p class="small-text">${h(c.date)} · 元の長さ ${time(c.duration)}</p><p class="small-text">${h(c.title)}</p></div></div><div class="trim-fields"><label class="field">開始（秒）<input type="number" step="any" min="0" max="${c.duration}" value="${Number.isFinite(range.start)?range.start:''}" data-trim="start" data-id="${h(c.id)}" aria-label="${h(c.title)}の開始秒"></label><label class="field">終了（秒）<input type="number" step="any" min="0" max="${c.duration}" value="${Number.isFinite(range.end)?range.end:''}" data-trim="end" data-id="${h(c.id)}" aria-label="${h(c.title)}の終了秒"></label></div><div class="clip-controls"><div class="move-buttons">${button('↑',`data-move="-1" data-id="${h(c.id)}" aria-label="${h(c.title)}を前へ" ${i===0?'disabled':''}`)}${button('↓',`data-move="1" data-id="${h(c.id)}" aria-label="${h(c.title)}を後ろへ" ${i===config.clips.length-1?'disabled':''}`)}</div></div></article>`;}).join('');updateSummary();
  }
  function createJob(fail=false){
    const id=crypto.randomUUID(),job={id,title:config.title,quality:config.quality,captions:config.captions,audio:config.audio,clips:structuredClone(config.clips),seconds:duration(),created:Date.now(),status:'processing',fail};
    const jobs=read('jobs',[]);jobs.unshift(job);if(!write('jobs',jobs))return;location.href=`export-status.html?id=${id}`;
  }
  if(page==='video-export'){
    if(plan==='free'){gate('export.html');return;}
    $('#export-title').value=config.title;$('#export-quality').value=config.quality;$('#export-captions').checked=config.captions;$('#export-audio').checked=config.audio;renderEditor();
    $('#export-title').addEventListener('input',e=>{config.title=e.target.value;updateSummary();});
    $('#export-quality').addEventListener('change',e=>{config.quality=e.target.value;updateSummary();});
    ['captions','audio'].forEach(k=>$('#export-'+k).addEventListener('change',e=>{config[k]=e.target.checked;updateSummary();}));
    $('#export-clips').addEventListener('input',e=>{if(!e.target.dataset.trim)return;const c=config.clips.find(c=>c.id===e.target.dataset.id);c[e.target.dataset.trim]=e.target.value===''?NaN:Number(e.target.value);e.target.setAttribute('aria-invalid',String(!e.target.checkValidity()));updateSummary();});
    $('#export-clips').addEventListener('click',e=>{const move=e.target.closest('[data-move]'),remove=e.target.closest('[data-remove-clip]');if(move){const i=config.clips.findIndex(c=>c.id===move.dataset.id),to=i+Number(move.dataset.move);if(to<0||to>=config.clips.length)return;[config.clips[i],config.clips[to]]=[config.clips[to],config.clips[i]];renderEditor();$(`[data-clip="${CSS.escape(move.dataset.id)}"] input`)?.focus();toast('順番を変更しました');}if(remove){config.clips=config.clips.filter(c=>c.id!==remove.dataset.removeClip);renderEditor();toast('書き出しから外しました。元の動画は残っています');}});
    $('[data-start-export]').addEventListener('click',()=>{if(!validComposition())return;$('[data-start-export]').disabled=true;createJob(params.get('simulate')==='failure');});
  }
  function refreshJobs(){
    const jobs=read('jobs',[]);let changed=false;
    jobs.forEach(j=>{if(j.status==='processing'&&Date.now()-j.created>=7000){j.status=j.fail?'failed':'ready';changed=true;}});
    if(changed)write('jobs',jobs);return jobs;
  }
  const fileSummary=j=>`<div class="export-file"><strong>${h(j.title)}.mp4</strong><p class="small-text">${j.clips.length}本 · ${time(j.seconds)} · MP4 · 最大${h(j.quality)}p</p><p class="small-text">${j.audio?'音声あり':'音声なし'} · ${j.captions?'日付・プレー名あり':'文字なし'}</p></div>`;
  let job;
  if(page==='export-status'){
    const direct=params.get('state');
    if(['failed','expired'].includes(direct))job={id:'example',title:'春から秋のドリブル',quality:'1080',seconds:44,clips:sampleRows.slice(0,4).map(c=>({id:c[0],start:0,end:c[6]})),captions:true,audio:false,status:direct,fixture:true};
    else job=refreshJobs().find(j=>j.id===params.get('id'));
    function renderJob(){
      if(!job){$('#export-job').innerHTML='<h1>書き出しが見つかりません</h1><p>このタブで作成した動画は、履歴から確認できます。</p><a class="mock-control mock-primary wide" href="exports.html">履歴を開く</a>';return;}
      if(!job.fixture)job=refreshJobs().find(j=>j.id===job.id);
      const state=job.status, ready=state==='ready', processing=state==='processing';
      const title=ready?'書き出しが完了しました':processing?'動画をまとめています':state==='expired'?'保存期限が過ぎています':'書き出しできませんでした';
      const message=ready?'動画を端末に保存できます。':processing?'この画面を離れても、書き出し履歴から確認できます。':state==='expired'?'元の動画が残っていれば、同じ内容で作り直せます。':'一時的に処理できませんでした。選んだ動画と設定は残っています。';
      $('#export-job').innerHTML=`${icon(ready?'check':processing?'clock':'warning')}<h1>${title}</h1><p>${message}</p>${fileSummary(job)}${processing?'<progress max="100" value="'+Math.min(95,Math.round((Date.now()-job.created)/70))+'" aria-label="書き出しの進み具合"></progress><p class="small-text">デザイン確認用の進行表示</p>':ready?button('動画を保存する','data-download-demo','mock-primary wide'):button(state==='expired'?'同じ内容で作り直す':'もう一度書き出す','data-retry-export','mock-primary wide')}<a class="mock-control wide" href="exports.html">書き出し履歴へ</a><p class="small-text export-disclosure">動作確認用です。MP4生成・ダウンロードは行いません。</p>`;
      if(processing)setTimeout(renderJob,1000);
    }
    renderJob();document.addEventListener('click',e=>{if(e.target.closest('[data-download-demo]'))$('#download-demo-dialog').showModal();if(e.target.closest('[data-retry-export]')){if(plan==='free'){gate('export-status.html?'+params.toString());return;}config={title:job.title,quality:job.quality,captions:job.captions,audio:job.audio,clips:job.clips};write('composition',config);if(!validComposition()){toast('元の動画を確認してください。');return;}createJob(false);}});
  }
  if(page==='exports'){
    const renderHistory=()=>{const jobs=refreshJobs();$('#export-history').innerHTML=jobs.length?jobs.map(j=>`<a class="row-link" href="export-status.html?id=${h(j.id)}"><span class="copy"><strong>${h(j.title)}</strong><small>${j.clips.length}本 · ${time(j.seconds)} · ${new Date(j.created).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></span><span class="small-text">${j.status==='ready'?'保存可能':j.status==='failed'?'再試行':'作成中'}</span><span aria-hidden="true">›</span></a>`).join(''):'<section class="empty-copy"><h2>書き出した動画はまだありません</h2><p>ギャラリーから動画を選び、自分のプレー集を作れます。</p><a class="mock-control mock-primary" href="gallery.html">動画を選ぶ</a></section>';if(jobs.some(j=>j.status==='processing'))setTimeout(renderHistory,1000);};renderHistory();
  }
  $('[data-try-premium]')?.addEventListener('click',()=>{set(root+'preview-plan','premium');location.href=read('after-plan','gallery.html');});
})();
