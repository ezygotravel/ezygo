(() => {
  'use strict';
  const C = window.EZYGO_CONFIG;
  const PHONE = '919656309061';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const apiHeaders = { apikey: C.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${C.SUPABASE_PUBLISHABLE_KEY}` };
  const BUILTIN_PACKAGES = Array.isArray(window.EZYGO_STARTER_PACKAGES) ? window.EZYGO_STARTER_PACKAGES : [];
  let cards = [], groups = [], packages = [];
  let currentCard = null, currentTour = null;
  let currentTourImageIndex = 0, currentTourImages = [];
  let currentVisaImageIndex = 0, currentVisaImages = [];
  let currentView = 'explorePane';
  let isLoadingCards = true;
  let activeType = '', activeDays = '';
  const preloadedMedia = new Set();
  let mediaObserver = null;
  function esc(v='') { return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function cleanGroupName(v=''){ return String(v).replace(/^[\s🌏🌍]+/u,'').trim(); }
  function svgPlaceholder(label='Travel') {
    const txt = esc(label).slice(0,28);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef1f4"/><stop offset="1" stop-color="#dfe4e9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="450" cy="470" r="88" fill="#fff" opacity=".8"/><path d="M382 470h136M450 402v136" stroke="#b5bdc6" stroke-width="14" stroke-linecap="round"/><text x="450" y="650" text-anchor="middle" font-family="Arial" font-size="34" fill="#7f8994">${txt}</text></svg>`)} `;
  }
  window.__ezyFallback = label => svgPlaceholder(label||'Travel').trim();
  function mediaUrl(path, label='Travel') {
    const raw=String(path||'').trim();
    if (!raw) return svgPlaceholder(label).trim();
    if (/^data:image\//i.test(raw)) return raw;

    // Initial prebuilt images live inside /assets. Prefer optimized WebP versions.
    const preferWebp = value => value.replace(/\.(?:jpe?g)$/i,'.webp');
    if (raw.startsWith('local:')) return preferWebp(raw.slice(6));
    if (raw.startsWith('/assets/')) return preferWebp(raw);

    // Future images uploaded from Admin are stored in Supabase Storage.
    if (/^https?:\/\//i.test(raw)) {
      if (raw.startsWith(C.SUPABASE_URL)) return raw;
      return svgPlaceholder(label).trim();
    }

    const clean=raw
      .replace(/^site-media\//,'')
      .replace(/^storage\/v1\/object\/public\/site-media\//,'')
      .replace(/^\/+/, '');

    return `${C.SUPABASE_URL}/storage/v1/object/public/${C.STORAGE_BUCKET}/${clean}`;
  }
  function imageFallback(img,label='Travel'){ img.onerror=null; img.src=svgPlaceholder(label).trim(); }
  function conciseAvailability(value=''){
    const t=String(value||'').trim();
    if(!t) return 'Check now';
    if(t.length<=22) return t;
    if(/available\s*now/i.test(t)) return 'Available now';
    if(/available/i.test(t) && t.length<=30) return 'Available';
    if(/contact|confirm|processing|current/i.test(t)) return 'Check now';
    return 'Check now';
  }
  function mergePackages(remote){
    const merged=new Map();
    for(const item of BUILTIN_PACKAGES) merged.set(String(item.id), item);
    for(const item of (Array.isArray(remote)?remote:[])){
      const key=String(item.id), starter=merged.get(key);
      if(starter){
        // Keep the supplied V16 itinerary/details authoritative while preserving any Admin-uploaded image and ordering.
        merged.set(key,{...item,...starter,
          cover_path:item.cover_path||starter.cover_path,
          image_paths:Array.isArray(item.image_paths)&&item.image_paths.length?item.image_paths:starter.image_paths,
          sort_order:Number.isFinite(Number(item.sort_order))?Number(item.sort_order):starter.sort_order,
          active:item.active!==false
        });
      }else merged.set(key,item);
    }
    return [...merged.values()].filter(x=>x && x.active!==false).sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0));
  }
  function flagMarkup(c,index=999){
    const id=String(c?.id||'').replace(/[^a-z0-9_-]/gi,'');
    const emoji=esc(c?.flag||'✈️');
    if(!id) return emoji;
    return `<img src="/assets/flags/${id}.png" width="32" height="24" loading="${index<10?'eager':'lazy'}" decoding="async" alt="${emoji}" onerror="this.parentElement.textContent='${emoji}'">`;
  }
  function loadingCards(count=8){
    return Array.from({length:count},()=>`
      <article class="skeletonCard" aria-hidden="true">
        <div class="skeletonPoster skeletonGlow"></div>
        <div class="skeletonLine skeletonGlow"></div>
        <div class="skeletonLine short skeletonGlow"></div>
      </article>`).join('');
  }
  function showCardLoading(){
    const grid=$('#cardGrid');
    if(grid) grid.innerHTML=loadingCards(window.innerWidth>=900?10:6);
  }
  function packageLoadingCards(count=3){
    return Array.from({length:count},()=>`<article class="tourSkeleton" aria-hidden="true"><div class="tourSkeletonMedia skeletonGlow"></div><div class="tourSkeletonBody"><div class="skeletonLine skeletonGlow"></div><div class="skeletonLine short skeletonGlow"></div></div></article>`).join('');
  }
  function showPackageLoading(){const grid=$('#packageGrid2');if(grid)grid.innerHTML=packageLoadingCards(window.innerWidth>=900?3:2)}
  function preloadMedia(paths,priority='low'){
    for(const path of paths||[]){
      const url=mediaUrl(path);
      if(!url||url.startsWith('data:')||preloadedMedia.has(url))continue;
      preloadedMedia.add(url);
      const img=new Image();
      img.decoding='async';
      try{img.fetchPriority=priority}catch(_){}
      img.src=url;
    }
  }
  function observeMediaAhead(){
    if(mediaObserver)mediaObserver.disconnect();
    if(!('IntersectionObserver' in window))return;
    mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;if(el.dataset.id){const card=cards.find(x=>String(x.id)===String(el.dataset.id));if(card)preloadMedia([card.cover_path],'low')}else if(el.dataset.tour){const tour=packages.find(x=>String(x.id)===String(el.dataset.tour));if(tour)preloadMedia([tour.cover_path],'low')}mediaObserver.unobserve(el)}},{rootMargin:'1200px 0px',threshold:.01});
    $$('[data-id],[data-tour]').forEach(el=>mediaObserver.observe(el));
  }
  function warmMediaAfterCovers(){
    const run=()=>{packages.slice(0,3).forEach(item=>preloadMedia(arr(item.image_paths).slice(0,1),'low'))};
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2200});else setTimeout(run,1400);
  }
  function warmTarget(target){
    const card=target.closest?.('[data-id]');if(card){const item=cards.find(x=>String(x.id)===String(card.dataset.id));if(item)preloadMedia([item.cover_path,...arr(item.detail_paths)],'high');return}
    const tour=target.closest?.('[data-tour]');if(tour){const item=packages.find(x=>String(x.id)===String(tour.dataset.tour));if(item)preloadMedia([item.cover_path,...arr(item.image_paths)],'high');return}
  }
  function revealApp(){document.body.classList.add('appReady');const splash=$('#bootSplash');if(splash)splash.classList.add('done')}
  async function rest(table, query='') {
    const r = await fetch(`${C.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: apiHeaders });
    if (!r.ok) throw new Error(`${table}: ${r.status}`);
    return r.json();
  }
  async function loadData() {
    try {
      const [g,c,p] = await Promise.all([
        rest('visa_groups','select=*&active=eq.true&order=sort_order.asc'),
        rest('visa_cards','select=*&active=eq.true&order=sort_order.asc'),
        rest('packages','select=*&active=eq.true&order=sort_order.asc')
      ]);
      groups=g; cards=c; packages=mergePackages(p);
      preloadMedia(cards.slice(0,10).map(x=>x.cover_path),'high');
      preloadMedia(packages.slice(0,4).map(x=>x.cover_path),'high');
      isLoadingCards=false;
      if(cards.length) renderCards(); else showCardLoading();
      renderPackages(); buildTypeChips(); syncContentNavigation();
      observeMediaAhead(); warmMediaAfterCovers();
    } catch (err) {
      console.error(err);
      packages=mergePackages([]);
      renderPackages(); syncContentNavigation();
      isLoadingCards=true; showCardLoading();
    } finally {
      revealApp();
    }
  }
  function syncContentNavigation() {
    const nav=document.querySelector('.nav');
    if(nav) nav.style.setProperty('--nav-columns','3');
    const filterBtn=$('#filterBtn');
    if(filterBtn) filterBtn.style.visibility=cards.length?'visible':'hidden';
  }
  function cardMarkup(c,index=999) {
    const valid=c.validity || (Number(c.days)?`${c.days} Days`:'Check details');
    return `<article class="card" data-id="${esc(c.id)}"><div class="poster"><img class="ezyMedia" loading="${index<10?'eager':'lazy'}" fetchpriority="${index<6?'high':'auto'}" decoding="async" src="${mediaUrl(c.cover_path,c.country)}" onload="this.classList.add('isLoaded')" onerror="this.onerror=null;this.src=window.__ezyFallback?window.__ezyFallback(this.alt):this.src;this.classList.add('isLoaded')" alt="${esc(c.country)}"><div class="identity"><div class="flagcircle">${flagMarkup(c,index)}</div><div class="country">${esc(c.country)}</div></div><div class="hoverpeek"><span>${esc(c.type||'Visa')}</span><b>${esc(valid)}${c.fee?' · '+esc(c.fee):''}</b><small>View full details</small></div><div class="cardmeta"><div class="metagrid"><div><span class="label">Type</span><span class="value">${esc(c.type||'Visa')}</span></div><div><span class="label">Valid</span><span class="value">${esc(valid)}</span></div></div></div></div><div class="below"><div class="line1">${esc(c.date_label||'Visa assistance')}</div><div class="line2">${esc(c.deadline||'Contact us for current processing details')}</div>${c.fee?`<div class="fee">${esc(c.fee)}</div>`:''}</div></article>`;
  }
  function renderCards() {
    const q=($('#search')?.value||'').trim().toLowerCase();
    let list=cards.filter(c=>!q || [c.country,c.type,c.group_name,c.description].join(' ').toLowerCase().includes(q));
    if(activeType) list=list.filter(c=>c.type===activeType);
    if(activeDays) { const n=Number(activeDays); list=list.filter(c=>n===0?Number(c.days||0)===0:Number(c.days||0)<=n); }
    const groupOrder = groups.length ? groups : [...new Set(cards.map(c=>c.group_name))].map((name,i)=>({name,sort_order:i}));
    let html='',visibleIndex=0;
    for(const g of groupOrder){const items=list.filter(c=>c.group_name===g.name);if(!items.length)continue;html+=`<div class="visaGroup">${esc(cleanGroupName(g.name))}</div>${items.map(c=>cardMarkup(c,visibleIndex++)).join('')}`;}
    if(!html){
      if(isLoadingCards || !cards.length){ showCardLoading(); return; }
      html='<div class="empty">No matching visa options.</div>';
    }
    $('#cardGrid').innerHTML=html;requestAnimationFrame(observeMediaAhead);
  }
  function renderPackages(){
    $('#packageGrid2').innerHTML=packages.map((p,i)=>`<article class="tourCard" data-tour="${esc(p.id)}"><div class="tourCardMedia"><img class="ezyMedia" loading="${i<4?'eager':'lazy'}" fetchpriority="${i<3?'high':'auto'}" decoding="async" src="${mediaUrl(p.cover_path,p.title)}" onload="this.classList.add('isLoaded')" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt);this.classList.add('isLoaded')" alt="${esc(p.title)}"><div class="tourOverlay"><span>${esc(p.tag||'Travel package')}</span><h2>${esc(p.title)}</h2></div></div><div class="tourCardBody"><p>${esc(p.destination||'')}</p><div class="tourCardFacts"><span>${esc(p.duration||'Check details')}</span><strong>Ask for price</strong></div></div></article>`).join('') || '<div class="empty">No packages available.</div>';requestAnimationFrame(observeMediaAhead);
  }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function setVisaSlide(index, animate=true){
    const track=$('#packageTrack');
    if(!track) return;
    const total=currentVisaImages.length || 1;
    currentVisaImageIndex=Math.max(0,Math.min(total-1,index));
    track.style.transition=animate?'transform .30s cubic-bezier(.22,.61,.36,1)':'none';
    track.style.transform=`translate3d(${-currentVisaImageIndex*100}%,0,0)`;
    $$('#packageDots [data-visa-dot]').forEach((dot,i)=>{
      dot.classList.toggle('active',i===currentVisaImageIndex);
      dot.setAttribute('aria-current',i===currentVisaImageIndex?'true':'false');
    });
  }
  function bindVisaSlider(){
    const track=$('#packageTrack');
    const dots=$('#packageDots');
    if(!track || track.dataset.sliderBound==='1') return;
    track.dataset.sliderBound='1';

    let startX=0,startY=0,active=false;
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      active=true; startX=e.clientX; startY=e.clientY;
      try{track.setPointerCapture(e.pointerId)}catch(_){}
    });
    track.addEventListener('pointerup',e=>{
      if(!active) return;
      active=false;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      if(Math.abs(dx)>38 && Math.abs(dx)>Math.abs(dy)){
        setVisaSlide(currentVisaImageIndex+(dx<0?1:-1));
      }else{
        setVisaSlide(currentVisaImageIndex);
      }
    });
    track.addEventListener('pointercancel',()=>{active=false;setVisaSlide(currentVisaImageIndex)});
    track.addEventListener('dragstart',e=>e.preventDefault());
    dots.addEventListener('click',e=>{
      const dot=e.target.closest('[data-visa-dot]');
      if(dot) setVisaSlide(Number(dot.dataset.visaDot));
    });
  }

  function openCardDetail(id,push=true){
    const c=cards.find(x=>String(x.id)===String(id)); if(!c)return; currentCard=c;
    currentVisaImages=[c.cover_path,...arr(c.detail_paths)].filter(Boolean);preloadMedia(currentVisaImages);
    const sliderItems=currentVisaImages.length?currentVisaImages:[''];

    $('#packageTrack').innerHTML=sliderItems.map((src,i)=>`
      <div class="detailSlide">
        <img class="ezyMedia" loading="${i===0?'eager':'lazy'}" fetchpriority="${i===0?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${c.country} ${i+1}`)}" onload="this.classList.add('isLoaded')" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt);this.classList.add('isLoaded')" alt="${esc(c.country)} image ${i+1}" draggable="false">
      </div>`).join('');
    $('#packageDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button type="button" class="detailDot ${i===0?'active':''}" data-visa-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#packageFlag').innerHTML=flagMarkup(c,0);
    $('#packageType').textContent=c.type||'Visa';
    $('#packageTitle').textContent=c.country||'';
    $('#packageDesc').textContent=c.description||'';
    $('#packageDays').textContent='Contact now';
    $('#packageDate').textContent='Check now';
    const packagePhone=$('#packagePhone');if(packagePhone)packagePhone.textContent='+91 96563 09061';
    $('#packageDocs').innerHTML=arr(c.documents).map(d=>`<div class="docItem"><span class="docTick">✓</span><span>${esc(d)}</span></div>`).join('');

    showOnly('cardDetail');
    bindVisaSlider();
    setVisaSlide(0,false);
    if(push) history.pushState({view:'cardDetail',id:c.id},'','#visa-'+c.id);
  }

  function setTourSlide(index, animate=true){
    const track=$('#tourTrack');
    if(!track) return;
    const total=currentTourImages.length || 1;
    currentTourImageIndex=Math.max(0,Math.min(total-1,index));
    track.style.transition=animate?'transform .30s cubic-bezier(.22,.61,.36,1)':'none';
    track.style.transform=`translate3d(${-currentTourImageIndex*100}%,0,0)`;
    $$('#tourDots [data-tour-dot]').forEach((dot,i)=>{
      dot.classList.toggle('active',i===currentTourImageIndex);
      dot.setAttribute('aria-current',i===currentTourImageIndex?'true':'false');
    });
  }
  function bindTourSlider(){
    const track=$('#tourTrack');
    const dots=$('#tourDots');
    if(!track || track.dataset.sliderBound==='1') return;
    track.dataset.sliderBound='1';

    let startX=0, startY=0, active=false;
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      active=true; startX=e.clientX; startY=e.clientY;
      try{ track.setPointerCapture(e.pointerId); }catch(_){}
    });
    track.addEventListener('pointerup',e=>{
      if(!active) return;
      active=false;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.abs(dx)>38 && Math.abs(dx)>Math.abs(dy)){
        setTourSlide(currentTourImageIndex+(dx<0?1:-1));
      }else{
        setTourSlide(currentTourImageIndex);
      }
    });
    track.addEventListener('pointercancel',()=>{ active=false; setTourSlide(currentTourImageIndex); });
    track.addEventListener('dragstart',e=>e.preventDefault());

    dots.addEventListener('click',e=>{
      const dot=e.target.closest('[data-tour-dot]');
      if(dot) setTourSlide(Number(dot.dataset.tourDot));
    });
  }

  function openTour(id,push=true){
    const p=packages.find(x=>String(x.id)===String(id)); if(!p)return; currentTour=p;
    currentTourImages=[p.cover_path,...arr(p.image_paths)].filter(Boolean);preloadMedia(currentTourImages);
    const sliderItems=currentTourImages.length?currentTourImages:[''];

    $('#tourTrack').innerHTML=sliderItems.map((src,i)=>`<div class="tourSlide"><img class="ezyMedia" loading="${i===0?'eager':'lazy'}" fetchpriority="${i===0?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${p.title} ${i+1}`)}" onload="this.classList.add('isLoaded')" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt);this.classList.add('isLoaded')" alt="${esc(p.title)} image ${i+1}" draggable="false"></div>`).join('');
    $('#tourDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button class="tourDot ${i===0?'active':''}" type="button" data-tour-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#tourTag').textContent=p.tag||'Travel package';
    $('#tourTitle').textContent=p.title||'';
    $('#tourDestination').textContent=p.destination||'';
    $('#tourSummary').textContent=p.summary||'';
    $('#tourDuration').textContent=p.duration||'Check details';
    $('#tourPrice').textContent='Ask for price';
    const factWrap=$('#tourFacts');
    if(factWrap){
      factWrap.querySelectorAll('.tourExtraFact').forEach(el=>el.remove());
      factWrap.insertAdjacentHTML('beforeend',arr(p.facts).map(x=>`<div class="tourFact tourExtraFact"><small>${esc(x.label||'Detail')}</small><strong>${esc(x.value||'')}</strong></div>`).join(''));
    }

    $('#tourHighlights').innerHTML=arr(p.highlights).map(x=>`<span class="highlightChip">${esc(x)}</span>`).join('');

    $('#tourItinerary').innerHTML=arr(p.itinerary).map((x,i)=>`
      <article class="dayCard">
        <div class="dayTop">
          <div>
            <div class="dayNo">DAY ${esc(x.day||i+1)}</div>
            <h3>${esc(x.title||'Day plan')}</h3>
          </div>
          ${(x.meal||x.meals)?`<span class="meal">${esc(x.meal||x.meals)}</span>`:''}
        </div>
        <p>${esc(x.text||x.description||'')}</p>
      </article>`).join('');

    $('#tourInclusions').innerHTML=arr(p.inclusions).map(x=>`<div class="cleanItem"><span class="cleanIcon">✓</span><span>${esc(x)}</span></div>`).join('');
    $('#tourExclusions').innerHTML=arr(p.exclusions).map(x=>`<div class="cleanItem"><span class="cleanIcon">✓</span><span>${esc(x)}</span></div>`).join('');
    const extraSections=$('#tourExtraSections');
    if(extraSections) extraSections.innerHTML=arr(p.sections).map(section=>`<section class="tourBlock"><h2>${esc(section.title||'More details')}</h2><div class="tourExtraList">${arr(section.items).map(x=>`<div class="tourExtraItem"><span>${esc(x)}</span></div>`).join('')}</div></section>`).join('');
    $('#tourTerms').innerHTML=arr(p.terms).map(x=>`<div class="tourTerm">${esc(x)}</div>`).join('');

    if($('#tourSourceNote')) $('#tourSourceNote').textContent='';
    showOnly('tourDetail');
    bindTourSlider();
    setTourSlide(0,false);

    if(push) history.pushState({view:'tourDetail',id:p.id},'','#tour-'+p.id);
  }
  function updateBackButton(){
    const btn=$('#backBtn');
    if(!btn) return;
    const shouldShow=currentView!=='explorePane' || window.scrollY>80;
    btn.classList.toggle('is-hidden',!shouldShow);
  }
  function showOnly(view,scrollTop=true){
    currentView=view;
    const ids=['explorePane','packagesPane','servicesPane','tourDetail','cardDetail'];
    ids.forEach(id=>{
      const el=$('#'+id);
      if(el) el.style.display=id===view?'block':'none';
    });
    $('#tools').style.display=view==='explorePane'?'grid':'none';
    $$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===({
      explorePane:'explore',packagesPane:'packages',servicesPane:'services'
    }[view]||'')));
    if(scrollTop) window.scrollTo({top:0,behavior:'auto'});
    requestAnimationFrame(updateBackButton);
  }
  function showTab(tab,push=true){
    const map={explore:'explorePane',packages:'packagesPane',services:'servicesPane'};
    const view=map[tab]||'explorePane';
    showOnly(view,true);
    if(push) history.pushState({view},'','#'+tab);
  }
  function handleBack(){
    if(window.scrollY>80){
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    if(currentView!=='explorePane'){
      history.back();
      return;
    }
    updateBackButton();
  }
  function buildTypeChips(){ const types=[...new Set(cards.map(c=>c.type).filter(Boolean))]; $('#typeChips').innerHTML=types.map(t=>`<button class="chip" data-type="${esc(t)}">${esc(t)}</button>`).join(''); $$('[data-type]').forEach(b=>b.onclick=()=>{activeType=activeType===b.dataset.type?'':b.dataset.type; $$('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===activeType));}); }
  async function submitFeedback(e){
    e.preventDefault(); const name=$('#fbName').value.trim(), phone=$('#fbPhone').value.trim(), message=$('#fbMessage').value.trim(); if(!message)return;
    const btn=$('#feedbackForm .send'); const old=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    try{ const r=await fetch(`${C.SUPABASE_URL}/rest/v1/feedback`,{method:'POST',headers:{...apiHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,phone,message})}); if(!r.ok) throw new Error(await r.text()); $('#feedbackForm').reset(); let s=$('#feedbackStatus'); if(!s){s=document.createElement('div');s.id='feedbackStatus';s.className='feedbackSuccess';$('#feedbackForm').appendChild(s)} s.textContent='Thank you. Your feedback has been sent.'; }
    catch(err){console.error(err); alert('Could not send feedback right now. Please try again.');} finally{btn.disabled=false;btn.textContent=old;}
  }
  document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('DOMContentLoaded',()=>{
    $('#year').textContent=new Date().getFullYear();showCardLoading();showPackageLoading();setTimeout(revealApp,900);loadData();
    document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')warmTarget(e.target)},{passive:true});document.addEventListener('touchstart',e=>warmTarget(e.target),{passive:true});
    $('#search').addEventListener('input',renderCards); $('#cardGrid').onclick=e=>{const c=e.target.closest('[data-id]');if(c)openCardDetail(c.dataset.id)}; $('#packageGrid2').onclick=e=>{const c=e.target.closest('[data-tour]');if(c)openTour(c.dataset.tour)};
    $$('.navbtn').forEach(b=>b.onclick=()=>showTab(b.dataset.tab)); $('#backBtn').onclick=handleBack; window.addEventListener('scroll',updateBackButton,{passive:true}); $('#filterBtn').onclick=()=>$('#filterModal').classList.add('open'); $('#closeFilter').onclick=()=>$('#filterModal').classList.remove('open'); $('#applyFilter').onclick=()=>{$('#filterModal').classList.remove('open');renderCards()}; $('#clearFilter').onclick=()=>{activeType='';activeDays='';$$('.chip').forEach(x=>x.classList.remove('active'));renderCards()}; $$('[data-days]').forEach(b=>b.onclick=()=>{activeDays=activeDays===b.dataset.days?'':b.dataset.days;$$('[data-days]').forEach(x=>x.classList.toggle('active',x.dataset.days===activeDays))});
    $('#feedbackForm').onsubmit=submitFeedback; $('#contactBtn').onclick=()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent('Hi EzyGo Travels, I would like to make a travel enquiry.')}`,'_blank'); $('#packageEnquire').onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentCard.country}.`)}`,'_blank'); const validityFact=$('#packageValidityFact');if(validityFact)validityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please confirm visa validity for ${currentCard.country}.`)}`,'_blank'); const availabilityFact=$('#packageAvailabilityFact');if(availabilityFact)availabilityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please check current availability/details for ${currentCard.country}.`)}`,'_blank'); $('#tourEnquire').onclick=()=>currentTour&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like to ask for the price and details of ${currentTour.title}.`)}`,'_blank');
    $$('.accBtn').forEach(btn=>btn.onclick=()=>btn.parentElement.classList.toggle('open'));
    window.addEventListener('popstate',e=>{const st=e.state;if(st?.view==='cardDetail')openCardDetail(st.id,false); else if(st?.view==='tourDetail')openTour(st.id,false); else showOnly(st?.view||'explorePane',true)}); history.replaceState({view:'explorePane'},'',location.pathname); currentView='explorePane'; updateBackButton();
  });
})();
