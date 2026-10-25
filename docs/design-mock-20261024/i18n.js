/* Prototype UI localization. Source values and user-written content are never translated. */
(() => {
  const languages=['ja','en','zh-Hant'], key='osn-design-20261024:language';
  let locale='ja';try{locale=localStorage.getItem(key)||'ja';}catch{}
  if(!languages.includes(locale))locale='ja';
  const memory=new WeakMap(),attributes=new WeakMap();let observer=null,queued=false;
  const skip='script,style,svg,textarea,[translate="no"],[data-user-content]';
  const userSelectors='[data-goal-title],[data-focus-title],#daily-saved-text,#daily-goal-text,#weekly-saved-action,#request-message,#family-confirm-message,.task-open strong,.task-subtask label span,#task-goal,#task-focus,#task-goal-preview,.task-theme-source p,.history-copy strong,.history-copy > p:not(.small-text),.daily-play-row p:not(.small-text),.theme-text,.compare-block > p,#day-detail .read-section > p:not(.outcome-text),.continuity-row-copy strong,.continuity-row-copy > p,#calendar-note > p,#gallery-list h3,.video-title,.gallery-tile > p,.export-clip-heading > div > p:last-child,#previous-next > p,[data-current-theme],#day-detail .day-note > h2,.day-note .read-section > p:not(.outcome-text)';
  const defaults=['目標を決めよう','まだ決めていません','未設定','テーマなし','目指すことを書いてみよう','取り組みをまだ決めていません','メモなし','まだ言葉の記録はありません。','まだ記録はありません。','記録はまだありません。','テーマはまだありません。','テーマなしのふりかえり','テーマを決めました。','言葉の記録はありません。','この日のプレーはありません。'];
  function lookup(text){
    if(locale==='ja')return text;
    const dict=window.osnLocaleCatalog?.[locale]||{};
    if(dict[text]!=null)return dict[text];
    // Product titles share the same suffix on every page.
    if(text.includes('｜オンラインサッカーノート'))return lookup(text.split('｜')[0])+' | '+lookup('オンラインサッカーノート');
    // Numeric UI phrases have explicit patterns; never apply word replacement to free text.
    if(/^\d{4}年\d{1,2}月$/.test(text)){const [,y,m]=text.match(/(\d{4})年(\d{1,2})月/);return new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',timeZone:'Asia/Tokyo'}).format(new Date(`${y}-${m.padStart(2,'0')}-01T12:00:00+09:00`));}
    const dated=text.replace(/(\d+)\/(\d+)（([日月火水木金土])）/g,(_,m,d,day)=>locale==='en'?`${['Sun','Mon','Tue','Wed','Thu','Fri','Sat']['日月火水木金土'.indexOf(day)]}, ${m}/${d}`:`${m}/${d}（週${'日一二三四五六'['日月火水木金土'.indexOf(day)]}）`);
    if(dated!==text)return lookup(dated);
    if(text.includes(' · ')||text.includes(' / '))return text.split(/( · | \/ )/).map(x=>x===' · '||x===' / '?x:lookup(x)).join('');
    const patterns=window.osnLocalePatterns?.[locale]||[];
    for(const [source,target] of patterns){const re=new RegExp(source);if(re.test(text))return text.replace(re,target);}
    if(text.includes('。 '))return text.split(/(?<=。) +/).map(lookup).join(' ');
    return text;
  }
  function translateText(node){
    const parent=node.parentElement;if(!parent||parent.closest(skip))return;
    const value=node.nodeValue;let info=memory.get(node);
    if(!info||value!==info.output)info={source:value,output:value};
    const trimmed=info.source.trim();if(!trimmed)return;
    let out;
    if(parent.closest('.calendar-weekdays'))out=locale==='ja'?trimmed:locale==='en'?({月:'Mon',火:'Tue',水:'Wed',木:'Thu',金:'Fri',土:'Sat',日:'Sun'}[trimmed]||trimmed):({月:'一',火:'二',水:'三',木:'四',金:'五',土:'六',日:'日'}[trimmed]||trimmed);
    else out=lookup(trimmed);
    info.output=info.source.replace(trimmed,out);memory.set(node,info);
    if(node.nodeValue!==info.output)node.nodeValue=info.output;
  }
  function apply(){
    queued=false;observer?.disconnect();document.documentElement.lang=locale;
    const placeholders=new Set(defaults.flatMap(s=>[s,...languages.map(l=>window.osnLocaleCatalog?.[l]?.[s]).filter(Boolean)]));
    document.querySelectorAll(userSelectors).forEach(el=>{if(!placeholders.has(el.textContent.trim()))el.setAttribute('data-user-content','');});
    document.querySelectorAll('option:not([value])').forEach(el=>el.setAttribute('value',el.textContent));
    const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())translateText(node);
    document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(el=>{
      if(el.closest('[translate="no"],[data-user-content]'))return;
      let map=attributes.get(el)||{};
      for(const attr of ['placeholder','aria-label','title','alt']){
        if(!el.hasAttribute(attr))continue;const now=el.getAttribute(attr);let info=map[attr];if(!info||now!==info.output)info={source:now,output:now};info.output=lookup(info.source);map[attr]=info;if(now!==info.output)el.setAttribute(attr,info.output);
      }attributes.set(el,map);
    });
    document.querySelectorAll('input[type=date],input[type=time]').forEach(el=>el.lang=locale);
    document.querySelectorAll('[data-language-form]').forEach(form=>{if(!form.contains(document.activeElement))form.querySelectorAll('input[name=language]').forEach(el=>el.checked=el.value===locale);});
    observer?.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','alt']});
  }
  function setLanguage(value,status){
    if(!languages.includes(value))return;
    try{localStorage.setItem(key,value);}catch{if(status)status.textContent=lookup('言語を保存できませんでした。もう一度お試しください。');return;}
    locale=value;if(status)status.textContent='表示言語を保存しました。';apply();document.dispatchEvent(new CustomEvent('osn-languagechange',{detail:{locale}}));
  }
  window.osnI18n={t:lookup,get locale(){return locale;},apply};
  function init(){
    const dialog=document.createElement('dialog');dialog.id='language-dialog';dialog.setAttribute('aria-labelledby','language-title');
    dialog.innerHTML='<form data-language-form><div class="task-dialog-heading"><h2 id="language-title">Language / 表示言語</h2><button type="button" class="mock-control" data-language-close>閉じる</button></div><fieldset class="language-options"><legend class="sr-only">表示言語</legend><label><input type="radio" name="language" value="ja"><span lang="ja" translate="no">日本語</span></label><label><input type="radio" name="language" value="en"><span lang="en" translate="no">English</span></label><label><input type="radio" name="language" value="zh-Hant"><span lang="zh-Hant" translate="no">繁體中文</span></label></fieldset><p class="small-text">ノートや予定の内容は、書いた言語のまま残ります。</p><button type="button" class="mock-control mock-primary wide" data-language-save>言語を保存</button><p class="small-text" data-language-status role="status"></p></form>';
    document.body.append(dialog);
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-language-open]')){dialog.querySelectorAll('input[name=language]').forEach(el=>el.checked=el.value===locale);dialog.showModal();}
      if(e.target.closest('[data-language-close]'))dialog.close();
      if(e.target.closest('[data-language-save]')){const form=e.target.closest('form');setLanguage(form.querySelector('input[name=language]:checked')?.value,form.querySelector('[data-language-status]'));}
    });
    document.querySelectorAll('[data-language-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();setLanguage(form.querySelector('input[name=language]:checked')?.value,form.querySelector('[data-language-status]'));}));
    observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(apply);}});apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
