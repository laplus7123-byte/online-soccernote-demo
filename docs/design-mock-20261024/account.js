/* Design prototype only. No authentication, email, Stripe requests or card inputs.
 * The separate namespace contains fictional UI states, never credentials.
 * Do not use client-side role/state switches as production access control. */
(() => {
  'use strict';
  const page = document.body.dataset.page;
  if (!['account','family','membership','checkout-review','payment-result','login','admin-members'].includes(page)) return;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const prefix = 'osn-design-20261024:account-demo-v1:';
  const read = (key, fallback) => { try { return JSON.parse(sessionStorage.getItem(prefix+key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { sessionStorage.setItem(prefix+key, JSON.stringify(value)); } catch {} };
  const h = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const button = (label, attrs='', primary=false) => `<button type="button" class="mock-control ${primary?'mock-primary wide':''}" ${attrs}>${label}</button>`;
  const link = (label, href, primary=false) => `<a class="mock-control ${primary?'mock-primary wide':''}" href="${href}">${label}</a>`;
  const facts = rows => '<dl class="account-facts">'+rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')+'</dl>';
  const show = id => $(id).showModal();
  const stateLabels = {free:'無料プラン',trial:'無料体験中',active:'利用中',past_due:'支払いの確認が必要',cancel_scheduled:'更新停止済み',expired:'利用期間終了'};
  let state = Object.hasOwn(stateLabels,params.get('state')) ? params.get('state') : read('state','free');
  if (!Object.hasOwn(stateLabels,state)) state = 'free';
  let viewer = params.get('viewer') === 'parent' ? 'parent' : document.body.dataset.accountMode;
  if (['membership'].includes(page)) write('state',state);

  const playerNav = $('.side-nav').innerHTML;
  function identity() {
    document.body.dataset.accountMode = viewer;
    const parent = viewer === 'parent', admin = viewer === 'admin', guest = viewer === 'guest';
    if (page === 'membership') $('.breadcrumb').hidden = parent;
    if ($('.account-profile-link')) $('.account-profile-link').setAttribute('aria-label',parent?'支払いの管理を開く':'アカウントを開く');
    const name = parent ? '佐藤 美咲' : admin ? '契約管理担当' : '佐藤 蓮';
    const label = parent ? '保護者 / 支払いの管理' : admin ? '運営 / 二段階認証済み（見本）' : `選手 / ${stateLabels[state]}`;
    if ($('.side-person strong')) $('.side-person strong').textContent = name;
    if ($('.bar-person span')) $('.bar-person span').textContent = name;
    if ($('[data-plan-label]')) $('[data-plan-label]').textContent = label;
    if (!(parent || admin || guest)) {
      $('.side-nav').innerHTML = playerNav;
      if ($('.account-profile-link')) $('.account-profile-link').href = 'account.html';
    }
    if (parent || admin || guest) {
      $('.side-nav').innerHTML = admin ? '<a href="admin-members.html" aria-current="page">会員管理</a><a href="login.html">ログアウト</a>' : guest ? '<a href="login.html" aria-current="page">ログイン</a>' : '<a href="membership.html?viewer=parent">プラン・お支払い</a><a href="checkout-review.html">お子さまからの相談</a><a href="login.html">ログアウト</a>';
      if ($('.account-profile-link')) $('.account-profile-link').href = parent ? 'membership.html?viewer=parent' : 'login.html';
    }
  }
  identity();

  const infos = {
    recovery:['アカウントの回復','Googleで登録した方はGoogleの回復手順へ。メールで登録した方は、確認済みのメールに再設定用リンクを送る設計です。メールを使えない選手には、確認済みの保護者または運営による本人確認を用意します。この見本からメールは送信しません。'],
    register:['はじめての登録','選手・保護者・コーチを選び、Googleまたはメールで本人確認をします。保護者と選手は別のアカウントで登録し、招待と承認でつなぎます。この見本では実際の登録はできません。'],
    delete:['退会の前に確認','保存したい記録を書き出し、保護者が契約状況を確認します。更新停止と退会は別の操作です。契約終了や他の利用者への影響を確認したうえで、再認証と最終確認を経て手続きする設計です。この見本では削除しません。'],
    invoice:['お支払いの明細',`2026年10月${read('startedToday',false)?'25':'24'}日 · プレミアム月額 · 500円（税込・表示例）。支払い済み。本体では保護者ご本人のStripe画面から請求書・領収書を確認できます。この見本は領収書ではありません。`],
    webhook:['決済通知の再確認','決済側の最新の契約を照会し、会員の利用権限と突き合わせます。成功してから反映し、担当者・実行日時・結果を記録します。請求や返金を再実行する操作ではありません。この見本では外部通信しません。'],
  };
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close-account]');
    if (close) close.closest('dialog').close();
    const info = event.target.closest('[data-account-info]');
    if (info) {
      const value = infos[info.dataset.accountInfo];
      $('#account-info-title').textContent = value[0]; $('#account-info-body').textContent = value[1]; show('#account-info');
    }
    if (event.target.closest('[data-demo-login]')) location.href = 'account.html';
  });
  $('[data-account-action="sessions"]')?.addEventListener('click',()=>show('#sessions-dialog'));
  $('[data-revoke-sessions]')?.addEventListener('click',()=>{
    $('#other-device').textContent = 'ほかの端末はログアウト済み（見本）'; write('sessionsRevoked',true); $('#sessions-dialog').close();
  });
  if (page === 'account' && read('sessionsRevoked',false)) $('#other-device').textContent = 'ほかの端末はログアウト済み（見本）';

  if (page === 'family') {
    $('[data-family-request]').addEventListener('click',()=>{
      $('#family-confirm-message').textContent = $('#family-message').value.trim() || '動画ギャラリーとプレー動画の書き出しを使ってみたい。';
      show('#family-confirm');
    });
    $('[data-send-family]').addEventListener('click',()=>{
      write('request',$('#family-confirm-message').textContent); $('#family-confirm').close();
      $('#family-result').hidden = false; $('[data-family-request]').textContent = '相談する内容をもう一度確認';
    });
  }

  function membership() {
    identity();
    const parent = viewer === 'parent';
    const paid = ['active','past_due','cancel_scheduled'].includes(state);
    const title = paid ? 'プレミアム' : state==='trial'?'プレミアムを体験中':'無料プラン';
    const date = read('startedToday',false) ? '11月25日' : '11月24日';
    const billingDate = `2026年${date}`;
    let message = {
      free:'今日のテーマ・ふりかえり・プレー記録を、無料で続けられます。',
      trial:'11月8日まで体験できます。カード登録は不要で、自動で有料に切り替わることはありません。',
      active:'動画ギャラリーや書き出しを利用できます。',
      past_due:'今回のお支払いを確認できていません。保護者の方がお支払い方法をご確認ください。',
      cancel_scheduled:`次回の更新は停止済みです。${date}までプレミアムを利用できます。`,
      expired:'プレミアムの利用期間が終了しました。これまでのテーマ・ふりかえりは残っています。',
    }[state];
    const next = state==='cancel_scheduled' ? 'なし（更新停止済み）' : paid ? `500円 · ${billingDate}` : 'なし';
    const summary = facts([['利用する選手','佐藤 蓮 · 中学3年生'],['契約・支払い',parent?'佐藤 美咲（あなた）':'佐藤 美咲さん（保護者）'],['次回のお支払い',state==='past_due'?'支払いの確認待ち':next],...(paid?[['利用できる期間',`${billingDate}まで`]]:[])]);
    let action = '';
    if (state==='free' && !read('trialUsed',false)) action = button('14日間、無料で体験する','data-start-trial',true)+'<p class="small-text account-spaced">カード登録なし・自動課金なし。1アカウントにつき1回。</p>';
    else if (state==='active'||state==='past_due') action = parent ? button('お支払い方法を確認・変更','data-open-portal',true) : state==='past_due' ? link('保護者とのつながりを見る','family.html',true) : link('動画ギャラリーを開く','gallery.html?plan=premium',true);
    else if (state==='free'||state==='trial'||state==='expired') action = link(parent?'申し込み内容を確認':'保護者に相談する',parent?'checkout-review.html':'family.html',true);
    else action = link('動画ギャラリーを開く','gallery.html?plan=premium',true);
    let management = parent ? `<section class="surface account-panel"><h2>お支払いの管理</h2>${paid?facts([['お支払い方法',read('cardChanged',false)?'カード情報を更新済み（見本）':'Visa ···· 4242（見本）'],['明細のお届け先','misaki@example.com']]):'<p>有料プランへの申し込みは、保護者ご本人が行います。</p>'}${['active','past_due'].includes(state)?button('次回の更新を停止する','data-open-cancel'):''}${state==='cancel_scheduled'?'<p>次回の請求はありません。期間終了後は無料プランに戻ります。</p>':''}</section>` : '<section class="surface account-panel"><h2>お支払いは保護者が管理</h2><p>カードの変更や更新の停止は、保護者のアカウントから手続きできます。</p><p class="small-text">支払いの管理だけで、あなたのノートや動画が共有されることはありません。</p><a class="quiet-link" href="family.html">保護者とのつながりを見る</a></section>';
    if (parent && paid) management += `<section class="account-section"><h2>お支払い履歴</h2><div class="account-list"><div class="account-setting"><div><strong>10月${read('startedToday',false)?'25':'24'}日 · 500円</strong><p class="small-text">${state==='past_due'?'確認が必要':'支払い済み'} · プレミアム月額</p></div>${state==='past_due'?button('支払い方法を確認','data-open-portal'):button('明細を見る','data-account-info="invoice"')}</div></div></section>`;
    const caution = state==='past_due' ? '<p class="notice">新しい書き出しは、お支払いの確認が済むまでお待ちください。日々の記録はそのまま続けられます。</p>' : '';
    $('#membership-content').innerHTML = `<div class="account-columns"><section class="surface account-panel"><span class="account-badge">${stateLabels[state]}</span><h2 class="account-spaced">${title}</h2><p>${message}</p>${paid?'<p class="account-price">500<span>円 / 月（税込・表示例）</span></p>':''}${summary}${caution}${action}${state==='free'&&!read('trialUsed',false)?link(parent?'申し込み内容を確認':'保護者に相談する',parent?'checkout-review.html':'family.html'):''}</section><div>${management}<section class="account-section"><h2>安心して続けるために</h2><p class="small-text">プランを変更しても、テーマ・ふりかえり・プレー記録は削除されません。退会は別のお手続きです。</p>${parent?'<a class="quiet-link" href="checkout-review.html">お子さまからの相談を見る</a>':'<a class="quiet-link" href="record.html">今日のテーマに戻る</a>'}</section></div></div>`;
    $('#billing-viewer').value = parent ? 'parent' : 'player'; $('#billing-state').value = state;
    $('[data-start-trial]')?.addEventListener('click',()=>{state='trial';write('state',state);write('trialUsed',true);membership();});
    $$('[data-open-portal]').forEach(el=>el.addEventListener('click',()=>show('#portal-dialog')));
    $('[data-open-cancel]')?.addEventListener('click',()=>{
      $('#cancel-dialog p').innerHTML = `${date}までプレミアムを使えます。<br>次回以降の請求はありません。`;show('#cancel-dialog');
    });
  }
  if (page === 'membership') {
    membership();
    $('#billing-viewer').addEventListener('change',event=>{viewer=event.target.value;membership();});
    $('#billing-state').addEventListener('change',event=>{state=event.target.value;write('state',state);membership();});
    $('[data-cancel-membership]').addEventListener('click',()=>{state='cancel_scheduled';write('state',state);$('#cancel-dialog').close();membership();});
    $('[data-payment-updated]').addEventListener('click',()=>{
      write('cardChanged',true);$('#portal-dialog').close();membership();
      $('#account-info-title').textContent='お支払い方法を更新しました（見本）';
      $('#account-info-body').textContent=state==='past_due'?'決済の確認が完了するまで、契約状態は変わりません。二重に申し込まず、この画面から確認できます。':'次回から、新しいお支払い方法を使います。';show('#account-info');
    });
  }
  if (page === 'checkout-review') {
    const message = read('request',''); if (message) $('#request-message').textContent = message;
    $('#parent-consent').addEventListener('change',event=>$('#checkout-preview').disabled=!event.target.checked);
    $('#checkout-preview').addEventListener('click',()=>show('#checkout-dialog'));
  }
  if (page === 'payment-result') {
    let result = ['pending','active','failed'].includes(params.get('state')) ? params.get('state') : 'pending';
    if (result === 'active') {write('state','active');write('startedToday',true);}
    function renderResult() {
      const content = {
        pending:['お支払いを確認しています','確認できるまで、もう一度申し込まずにお待ちください。画面を閉じても、契約の確認は続きます。','確認が済むと、蓮さんの画面でもプレミアムを利用できます。'],
        active:['プレミアムをご利用いただけます','蓮さんの動画ギャラリーと書き出しが利用できるようになりました。','次回のお支払い：2026年11月25日 · 500円（税込・表示例）'],
        failed:['お支払いは完了していません','プレミアムの申し込みは完了していません。カードの本人認証や、お支払い方法をご確認ください。','記録はそのまま残っています。'],
      }[result];
      $('#payment-result').innerHTML=`<span class="account-badge">${result==='pending'?'確認中':result==='active'?'お支払い完了':'未完了'}</span><h1>${content[0]}</h1><p>${content[1]}</p><p class="small-text">${content[2]}</p>${link(result==='failed'?'申し込み内容に戻る':'プラン・お支払いへ',result==='failed'?'checkout-review.html':'membership.html?viewer=parent',true)}`;
      $('#payment-scenario').value = result;
    }
    $('#payment-scenario').addEventListener('change',event=>{
      result=event.target.value;
      if (result==='active') {write('state','active');write('startedToday',true);}
      renderResult();
    });
    renderResult();
  }
  if (page === 'admin-members') {
    const members=[
      {id:1001,name:'佐藤 蓮',parent:'佐藤 美咲',state:'active',next:'11月25日',note:'10月25日 09:08 · お支払いを確認'},
      {id:1002,name:'高橋 湊',parent:'高橋 直子',state:'past_due',next:'確認待ち',note:'10月25日 09:12 · 決済通知の再取得待ち'},
      {id:1003,name:'田中 悠',parent:'田中 健',state:'cancel_scheduled',next:'更新なし',note:'10月24日 18:20 · 保護者が更新を停止'},
      {id:1004,name:'鈴木 空',parent:'鈴木 佳奈',state:'trial',next:'請求なし',note:'10月24日 17:01 · カード登録なしの体験開始'},
      {id:1005,name:'伊藤 陽',parent:'伊藤 真紀',state:'free',next:'請求なし',note:'10月23日 19:30 · メールアドレス確認済み'},
    ];
    function listMembers() {
      const query=$('#member-search').value.trim().toLowerCase(), status=$('#member-state').value;
      const visible=members.filter(m=>(!status||m.state===status)&&`${m.id} ${m.name}`.toLowerCase().includes(query));
      $('#member-count').textContent=`${visible.length}名 · 架空の会員データ`;
      $('#member-list').innerHTML=visible.length?visible.map(m=>`<button type="button" class="admin-member" data-member="${m.id}"><span><strong>${m.name}</strong><small>会員 #${m.id} · 支払者：${m.parent}</small></span><span class="account-badge">${stateLabels[m.state]}</span><span class="small-text">${m.next}</span><span aria-hidden="true">›</span></button>`).join(''):'<p class="empty-copy">条件に合う会員がいません。名前や状態を変えてお試しください。</p>';
      $$('[data-member]').forEach(el=>el.addEventListener('click',()=>{
        const m=members.find(m=>m.id===Number(el.dataset.member));
        $('#member-title').textContent=`${m.name} · 会員 #${m.id}`;
        $('#member-detail').innerHTML=facts([['契約状況',stateLabels[m.state]],['契約・支払い',m.parent+'（確認済みの保護者）'],['次の更新',m.next],['プラン',m.state==='free'?'無料':'プレミアム'],['最終の確認',m.note]])+'<h3>操作の記録</h3><p class="small-text">'+h(m.note)+'</p><p>返金・支払い照会は、権限を持つ担当者がStripeの管理画面で行います。</p><p class="small-text">返金と解約は別の操作です。特例で利用期間を付与する場合は、理由・期限・承認者を記録します。</p>';
        show('#member-dialog');
      }));
    }
    $('#member-search').addEventListener('input',listMembers);$('#member-state').addEventListener('change',listMembers);listMembers();
  }
})();
