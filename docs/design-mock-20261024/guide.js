/* Haru's fixed, contextual instructions. Reading a guide never creates a record. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const journey=window.osnJourney;
  if(!journey)return;
  const page=document.body.dataset.page, params=new URLSearchParams(location.search);
  const demo=journey.prefix.includes('season-example');
  const homeDate=$('#home-before')?new URL($('#home-before').href).searchParams.get('date'):null;
  const context={example:demo?'dribble':'own',tasks:demo?'demo':'own',date:homeDate||(page==='onboarding'?'2026-10-25':journey.date)};
  const url=(file,extra={})=>{
    const target=new URL(file,location.href);
    for(const [key,value] of Object.entries({...context,...extra}))target.searchParams.set(key,value);
    return target.pathname.split('/').pop()+target.search;
  };
  const t=s=>window.osnI18n?.t(s)||s;
  const videoPages=['gallery','video-export','exports','export-status','premium','record','record-ready','video','watch','watch-record'];
  const topic=videoPages.includes(page)?'video':'daily';
  const step=['reflection','reflection-ready'].includes(page)?1:['video-export','export-status','exports'].includes(page)?2:0;
  const helpUrl=url('guide.html',{topic,step:String(step)});
  const pages=['home','calendar','tasks','growth','intention','intention-ready','reflection','reflection-ready','day','intention-saved','reflection-saved','record','record-ready','video','watch','watch-record','gallery','video-export','export-status','exports','premium','settings','onboarding'];
  if(pages.includes(page)){
    const link=$('.mock-preview a');
    if(link){link.href=helpUrl;link.textContent=t('ハルに使い方を聞く');}
  }
  $$('[data-haru-help]').forEach(a=>a.href=helpUrl);
  if(page==='home'){
    const entry=document.createElement('a');entry.className='manager-home-link manager-guide-entry';entry.href=helpUrl;
    entry.innerHTML='<img src="manager-haru.png" alt="" width="56" height="56"><span><strong>ハルに使い方を聞く</strong><small>練習前・練習後にすることを案内するよ</small></span><span aria-hidden="true">›</span>';
    $('.home-start')?.append(entry);
  }
  if(page==='gallery'){
    // Empty results are rendered again when filters change. Keep their help links in context.
    const updateHelp=()=>$$('#gallery-empty [data-haru-help]').forEach(a=>a.href=helpUrl);
    new MutationObserver(updateHelp).observe($('#gallery-empty'),{childList:true});updateHelp();
  }
  if(page!=='guide')return;
  let currentTopic=params.get('topic')==='video'?'video':'daily';
  let currentStep=/^[0-2]$/.test(params.get('step')||'')?Number(params.get('step')):0;
  const steps={daily:['練習前','練習後','見返す'],video:['つける','見返す','書き出す']};
  const next={daily:['次：練習のあと','次：記録を見返す'],video:['次：ギャラリーを見る','次：動画を書き出す']};
  $$('[data-guide-action]').forEach(a=>{
    const extra=a.getAttribute('href').startsWith('gallery.html')?{videos:demo?'demo':'own'}:{};
    a.href=url(a.getAttribute('href'),extra);
  });
  $$('[data-guide-home],[data-guide-done]').forEach(a=>a.href=url('home.html'));
  $$('[data-guide-sample]').forEach(a=>a.href=url(a.getAttribute('href'),{example:'dribble',tasks:'demo',videos:'demo'}));
  function render(focus=false){
    const panels=$$('.guide-panel');
    panels.forEach(el=>el.hidden=el.dataset.guideTopic!==currentTopic||Number(el.dataset.guideStep)!==currentStep);
    $$('[data-guide-topic-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideTopicButton===currentTopic)));
    $$('[data-guide-jump]').forEach((b,i)=>{
      b.textContent=`${i+1}. ${t(steps[currentTopic][i])}`;
      b.setAttribute('aria-label',t(steps[currentTopic][i]));
      if(i===currentStep)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
    });
    $('[data-guide-back]').disabled=currentStep===0;
    $('[data-guide-next]').hidden=currentStep===2;
    $('[data-guide-next]').textContent=t(next[currentTopic][currentStep]||'次へ');
    $('[data-guide-done]').hidden=currentStep!==2;
    history.replaceState(null,'',url('guide.html',{topic:currentTopic,step:String(currentStep)}));
    if(focus){const heading=$('.guide-panel:not([hidden]) h2');heading.focus({preventScroll:true});$('.haru-guide').scrollIntoView({block:'start',behavior:'instant'});}
  }
  $$('[data-guide-topic-button]').forEach(b=>b.addEventListener('click',()=>{currentTopic=b.dataset.guideTopicButton;currentStep=0;render(true);}));
  $$('[data-guide-jump]').forEach(b=>b.addEventListener('click',()=>{currentStep=Number(b.dataset.guideJump);render(true);}));
  $('[data-guide-back]').addEventListener('click',()=>{currentStep=Math.max(0,currentStep-1);render(true);});
  $('[data-guide-next]').addEventListener('click',()=>{currentStep=Math.min(2,currentStep+1);render(true);});
  document.addEventListener('osn-languagechange',()=>render());
  $('.mock-preview span').textContent=t(demo?'15歳の選手のサンプル · 架空の記録':'操作デモ · このタブ内だけに保存');
  $('.mock-preview a').href=url('home.html');$('.mock-preview a').textContent=t('ホームへ');
  render();
})();
