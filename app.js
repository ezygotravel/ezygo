(() => {
  'use strict';
  const C = window.EZYGO_CONFIG;
  const PHONE = '919656309061';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const apiHeaders = { apikey: C.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${C.SUPABASE_PUBLISHABLE_KEY}` };
  let cards = [], groups = [], packages = [], galleries = [];
  let currentCard = null, currentTour = null, currentGallery = null, currentImageIndex = 0;
  let currentTourImageIndex = 0, currentTourImages = [];
  let currentVisaImageIndex = 0, currentVisaImages = [];
  let currentView = 'explorePane';
  let isLoadingCards = true;
  let activeType = '', activeDays = '';
  const FIRST_COVER_COUNT = 10;
  const preloadedMedia = new Map();
  let mediaObserver = null;

  function esc(v='') { return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function cleanGroupName(v=''){ return String(v).replace(/^[\s🌏🌍]+/u,'').trim(); }
  function svgPlaceholder(label='Travel') {
    const txt = esc(label).slice(0,28);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef1f4"/><stop offset="1" stop-color="#dfe4e9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="450" cy="470" r="88" fill="#fff" opacity=".8"/><path d="M382 470h136M450 402v136" stroke="#b5bdc6" stroke-width="14" stroke-linecap="round"/><text x="450" y="650" text-anchor="middle" font-family="Arial" font-size="34" fill="#7f8994">${txt}</text></svg>`)} `;
  }
  function mediaUrl(path, label='Travel') {
    const raw=String(path||'').trim();
    if (!raw) return svgPlaceholder(label).trim();
    if (/^data:image\//i.test(raw)) return raw;

    // Initial prebuilt images live inside the deployed /assets folder.
    if (raw.startsWith('local:')) return raw.slice(6);
    if (raw.startsWith('/assets/')) return raw;

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
  function galleryLoadingCards(count=6){
    return Array.from({length:count},()=>`<div class="gallerySkeleton" aria-hidden="true"><div class="gallerySkeletonMedia skeletonGlow"></div><div class="skeletonLine short skeletonGlow"></div></div>`).join('');
  }
  function showPackageLoading(){const grid=$('#packageGrid2');if(grid)grid.innerHTML=packageLoadingCards(window.innerWidth>=900?3:2)}
  function showGalleryLoading(){const grid=$('#galleryGrid');if(grid)grid.innerHTML=galleryLoadingCards(window.innerWidth>=900?6:4)}
  function preloadMedia(paths,priority='low'){
    const rank={low:1,auto:2,high:3};
    for(const path of paths||[]){
      const url=mediaUrl(path);
      if(!url||url.startsWith('data:'))continue;
      const previous=preloadedMedia.get(url);
      if(previous && (rank[previous]||1)>=(rank[priority]||1)) continue;
      preloadedMedia.set(url,priority);
      const img=new Image();
      img.decoding='async';
      try{img.fetchPriority=priority}catch(_){}
      img.src=url;
    }
  }
  function orderedCards(){
    const ordered=[];
    const groupOrder=groups.length?groups:[...new Set(cards.map(c=>c.group_name))].map((name,i)=>({name,sort_order:i}));
    for(const group of groupOrder) ordered.push(...cards.filter(card=>card.group_name===group.name));
    return ordered.length?ordered:cards;
  }
  function preloadInitialCovers(){
    preloadMedia(orderedCards().slice(0,FIRST_COVER_COUNT).map(item=>item.cover_path),'high');
  }
  function warmRemainingCovers(){
    const queue=orderedCards().slice(FIRST_COVER_COUNT).map(item=>item.cover_path).filter(Boolean);
    let index=0;
    const schedule=fn=>{
      if('requestIdleCallback' in window) requestIdleCallback(fn,{timeout:1200});
      else setTimeout(()=>fn(null),180);
    };
    const run=deadline=>{
      let loaded=0;
      while(index<queue.length && loaded<6 && (!deadline || deadline.didTimeout || deadline.timeRemaining()>5)){
        preloadMedia([queue[index++]],'low');
        loaded++;
      }
      if(index<queue.length) schedule(run);
    };
    if(queue.length) schedule(run);
  }
  function observeMediaAhead(){
    if(mediaObserver)mediaObserver.disconnect();
    if(!('IntersectionObserver' in window))return;
    mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;if(el.dataset.id){const card=cards.find(x=>String(x.id)===String(el.dataset.id));if(card)preloadMedia([card.cover_path,...arr(card.detail_paths).slice(0,2)],'low')}else if(el.dataset.tour){const tour=packages.find(x=>String(x.id)===String(el.dataset.tour));if(tour)preloadMedia([tour.cover_path,...arr(tour.image_paths).slice(0,2)],'low')}else if(el.dataset.gallery){const gallery=galleries.find(x=>String(x.id)===String(el.dataset.gallery));if(gallery)preloadMedia([gallery.cover_path,...arr(gallery.image_paths).slice(0,2)],'low')}mediaObserver.unobserve(el)}},{rootMargin:'1800px 0px',threshold:.01});
    $$('[data-id],[data-tour],[data-gallery]').forEach(el=>mediaObserver.observe(el));
  }
  function warmMediaAfterCovers(){
    const run=()=>{
      cards.slice(0,FIRST_COVER_COUNT).forEach(item=>preloadMedia(arr(item.detail_paths).slice(0,2),'low'));
      packages.slice(0,3).forEach(item=>preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,2)],'low'));
      galleries.slice(0,6).forEach(item=>preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,1)],'low'));
      warmRemainingCovers();
    };
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:1400});else setTimeout(run,650);
  }
  function warmTarget(target){
    const card=target.closest?.('[data-id]');if(card){const item=cards.find(x=>String(x.id)===String(card.dataset.id));if(item){preloadMedia([item.cover_path,...arr(item.detail_paths).slice(0,2)],'high');preloadMedia(arr(item.detail_paths).slice(2),'low')}return}
    const tour=target.closest?.('[data-tour]');if(tour){const item=packages.find(x=>String(x.id)===String(tour.dataset.tour));if(item){preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,2)],'high');preloadMedia(arr(item.image_paths).slice(2),'low')}return}
    const gallery=target.closest?.('[data-gallery]');if(gallery){const item=galleries.find(x=>String(x.id)===String(gallery.dataset.gallery));if(item){preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,2)],'high');preloadMedia(arr(item.image_paths).slice(2),'low')}}
  }
  function revealApp(){document.body.classList.add('appReady');const splash=$('#bootSplash');if(splash)splash.classList.add('done')}
  async function rest(table, query='') {
    const r = await fetch(`${C.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: apiHeaders });
    if (!r.ok) throw new Error(`${table}: ${r.status}`);
    return r.json();
  }
  async function loadData() {
    const groupsRequest=rest('visa_groups','select=*&active=eq.true&order=sort_order.asc');
    const cardsRequest=rest('visa_cards','select=*&active=eq.true&order=sort_order.asc');
    const packagesRequest=rest('packages','select=*&active=eq.true&order=sort_order.asc');
    const galleriesRequest=rest('galleries','select=*&active=eq.true&order=sort_order.asc');
    const secondaryRequests=Promise.allSettled([packagesRequest,galleriesRequest]);

    try {
      const [g,c]=await Promise.all([groupsRequest,cardsRequest]);
      groups=g; cards=c; isLoadingCards=false;
      preloadInitialCovers();
      if(cards.length) renderCards(); else showCardLoading();
      buildTypeChips();
      observeMediaAhead();
      revealApp();
    } catch (err) {
      console.error(err);
      isLoadingCards=true; showCardLoading();
      revealApp();
    }

    const [packageResult,galleryResult]=await secondaryRequests;
    if(packageResult.status==='fulfilled'){packages=packageResult.value;renderPackages()}else console.error(packageResult.reason);
    if(galleryResult.status==='fulfilled'){galleries=galleryResult.value;renderGalleries()}else console.error(galleryResult.reason);
    syncContentNavigation();
    observeMediaAhead();
    warmMediaAfterCovers();
  }
  function syncContentNavigation() {
    const packageTab=document.querySelector('.navbtn[data-tab="packages"]');
    const galleryTab=document.querySelector('.navbtn[data-tab="gallery"]');
    if(packageTab) packageTab.hidden=packages.length===0;
    if(galleryTab) galleryTab.hidden=galleries.length===0;
    const filterBtn=$('#filterBtn');
    if(filterBtn) filterBtn.style.visibility=cards.length?'visible':'hidden';
  }
  function cardMarkup(c,index=999) {
    const valid=c.validity || (Number(c.days)?`${c.days} Days`:'Check details');
    return `<article class="card" data-id="${esc(c.id)}"><div class="poster"><img loading="${index<FIRST_COVER_COUNT?'eager':'lazy'}" fetchpriority="${index<FIRST_COVER_COUNT?'high':'auto'}" decoding="async" src="${mediaUrl(c.cover_path,c.country)}" onerror="this.onerror=null;this.src=window.__ezyFallback?window.__ezyFallback(this.alt):this.src" alt="${esc(c.country)}"><div class="identity"><div class="flagcircle">${esc(c.flag||'✈️')}</div><div class="country">${esc(c.country)}</div></div><div class="hoverpeek"><span>${esc(c.type||'Visa')}</span><b>${esc(valid)}${c.fee?' · '+esc(c.fee):''}</b><small>View full details</small></div><div class="cardmeta"><div class="metagrid"><div><span class="label">Type</span><span class="value">${esc(c.type||'Visa')}</span></div><div><span class="label">Valid</span><span class="value">${esc(valid)}</span></div></div></div></div><div class="below"><div class="line1">${esc(c.date_label||'Visa assistance')}</div><div class="line2">${esc(c.deadline||'Contact us for current processing details')}</div>${c.fee?`<div class="fee">${esc(c.fee)}</div>`:''}</div></article>`;
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
    $('#packageGrid2').innerHTML=packages.map(p=>`<article class="tourCard" data-tour="${esc(p.id)}"><div class="tourCardMedia"><img loading="eager" fetchpriority="auto" decoding="async" src="${mediaUrl(p.cover_path,p.title)}" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt)" alt="${esc(p.title)}"><div class="tourOverlay"><span>${esc(p.tag||'Travel package')}</span><h2>${esc(p.title)}</h2></div></div><div class="tourCardBody"><p>${esc(p.destination||'')}</p><div class="tourCardFacts"><span>${esc(p.duration||'')}</span>${p.price?`<strong>${esc(p.price)}</strong>`:''}</div></div></article>`).join('') || '<div class="empty">No packages available.</div>';requestAnimationFrame(observeMediaAhead);
  }
  function renderGalleries(){
    $('#galleryGrid').innerHTML=galleries.map(g=>`<button class="galleryCard" data-gallery="${esc(g.id)}"><img loading="lazy" decoding="async" src="${mediaUrl(g.cover_path,g.title)}" alt="${esc(g.title)}"><span>${esc(g.title)}</span></button>`).join('') || '<div class="empty">No gallery items available.</div>';requestAnimationFrame(observeMediaAhead);
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
    currentVisaImages=[c.cover_path,...arr(c.detail_paths)].filter(Boolean);preloadMedia(currentVisaImages.slice(0,3),'high');preloadMedia(currentVisaImages.slice(3),'low');
    const sliderItems=currentVisaImages.length?currentVisaImages:[''];

    $('#packageTrack').innerHTML=sliderItems.map((src,i)=>`
      <div class="detailSlide">
        <img loading="${i<2?'eager':'lazy'}" fetchpriority="${i<2?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${c.country} ${i+1}`)}" alt="${esc(c.country)} image ${i+1}" draggable="false">
      </div>`).join('');
    $('#packageDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button type="button" class="detailDot ${i===0?'active':''}" data-visa-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#packageFlag').textContent=c.flag||'✈️';
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
    currentTourImages=[p.cover_path,...arr(p.image_paths)].filter(Boolean);preloadMedia(currentTourImages.slice(0,3),'high');preloadMedia(currentTourImages.slice(3),'low');
    const sliderItems=currentTourImages.length?currentTourImages:[''];

    $('#tourTrack').innerHTML=sliderItems.map((src,i)=>`<div class="tourSlide"><img loading="${i<2?'eager':'lazy'}" fetchpriority="${i<2?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${p.title} ${i+1}`)}" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt)" alt="${esc(p.title)} image ${i+1}" draggable="false"></div>`).join('');
    $('#tourDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button class="tourDot ${i===0?'active':''}" type="button" data-tour-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#tourTag').textContent=p.tag||'Travel package';
    $('#tourTitle').textContent=p.title||'';
    $('#tourDestination').textContent=p.destination||'';
    $('#tourSummary').textContent=p.summary||'';
    $('#tourDuration').textContent=p.duration||'Check details';
    $('#tourPrice').textContent=p.price||'Ask for price';

    $('#tourHighlights').innerHTML=arr(p.highlights).map(x=>`<span class="highlightChip">${esc(x)}</span>`).join('');

    $('#tourItinerary').innerHTML=arr(p.itinerary).map((x,i)=>`
      <article class="dayCard">
        <div class="dayTop">
          <div>
            <div class="dayNo">DAY ${esc(x.day||i+1)}</div>
            <h3>${esc(x.title||'Day plan')}</h3>
          </div>
          ${x.meal?`<span class="meal">${esc(x.meal)}</span>`:''}
        </div>
        <p>${esc(x.text||x.description||'')}</p>
      </article>`).join('');

    $('#tourInclusions').innerHTML=arr(p.inclusions).map(x=>`<div class="cleanItem"><span class="cleanIcon">✓</span><span>${esc(x)}</span></div>`).join('');
    $('#tourExclusions').innerHTML=arr(p.exclusions).map(x=>`<div class="cleanItem"><span class="cleanIcon">✓</span><span>${esc(x)}</span></div>`).join('');
    $('#tourTerms').innerHTML=arr(p.terms).map(x=>`<div class="tourTerm">${esc(x)}</div>`).join('');

    if($('#tourSourceNote')) $('#tourSourceNote').textContent='';
    showOnly('tourDetail');
    bindTourSlider();
    setTourSlide(0,false);

    if(push) history.pushState({view:'tourDetail',id:p.id},'','#tour-'+p.id);
  }
  function openGallery(id,push=true){
    const g=galleries.find(x=>String(x.id)===String(id)); if(!g)return; currentGallery=g;preloadMedia([g.cover_path,...arr(g.image_paths).slice(0,4)],'high');preloadMedia(arr(g.image_paths).slice(4),'low'); $('#detailTitle').textContent=g.title||''; $('#detailDesc').textContent=g.description||'';
    const imgs=arr(g.image_paths); $('#photoGrid').innerHTML=imgs.map((src,i)=>`<button class="photo" data-photo="${i}"><img loading="${i<4?'eager':'lazy'}" decoding="async" fetchpriority="${i<4?'high':'auto'}" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)} image ${i+1}"></button>`).join('') || '<div class="empty">No photos uploaded yet.</div>';
    showOnly('galleryDetail'); if(push) history.pushState({view:'galleryDetail',id:g.id},'','#gallery-'+g.id);
  }
  function updateBackButton(){
    const btn=$('#backBtn');
    if(!btn) return;
    const shouldShow=currentView!=='explorePane' || window.scrollY>80;
    btn.classList.toggle('is-hidden',!shouldShow);
  }
  function showOnly(view,scrollTop=true){
    currentView=view;
    const ids=['explorePane','packagesPane','servicesPane','galleryPane','tourDetail','cardDetail','galleryDetail'];
    ids.forEach(id=>{
      const el=$('#'+id);
      if(el) el.style.display=id===view?'block':'none';
    });
    $('#tools').style.display=view==='explorePane'?'grid':'none';
    $$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===({
      explorePane:'explore',packagesPane:'packages',servicesPane:'services',galleryPane:'gallery'
    }[view]||'')));
    if(scrollTop) window.scrollTo(0,0);
    requestAnimationFrame(updateBackButton);
  }
  function showTab(tab,push=true){
    const map={explore:'explorePane',packages:'packagesPane',services:'servicesPane',gallery:'galleryPane'};
    const view=map[tab]||'explorePane';
    showOnly(view,true);
    if(push) history.pushState({view},'','#'+tab);
  }
  function handleBack(){
    if(currentView!=='explorePane'){
      history.back();
      return;
    }
    if(window.scrollY>80) window.scrollTo(0,0);
    updateBackButton();
  }
  function buildTypeChips(){ const types=[...new Set(cards.map(c=>c.type).filter(Boolean))]; $('#typeChips').innerHTML=types.map(t=>`<button class="chip" data-type="${esc(t)}">${esc(t)}</button>`).join(''); $$('[data-type]').forEach(b=>b.onclick=()=>{activeType=activeType===b.dataset.type?'':b.dataset.type; $$('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===activeType));}); }
  async function submitFeedback(e){
    e.preventDefault(); const name=$('#fbName').value.trim(), phone=$('#fbPhone').value.trim(), message=$('#fbMessage').value.trim(); if(!message)return;
    const btn=$('#feedbackForm .send'); const old=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    try{ const r=await fetch(`${C.SUPABASE_URL}/rest/v1/feedback`,{method:'POST',headers:{...apiHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,phone,message})}); if(!r.ok) throw new Error(await r.text()); $('#feedbackForm').reset(); let s=$('#feedbackStatus'); if(!s){s=document.createElement('div');s.id='feedbackStatus';s.className='feedbackSuccess';$('#feedbackForm').appendChild(s)} s.textContent='Thank you. Your feedback has been sent.'; }
    catch(err){console.error(err); alert('Could not send feedback right now. Please try again.');} finally{btn.disabled=false;btn.textContent=old;}
  }
  function openLightbox(g,index=0){currentGallery=g;currentImageIndex=index;$('#lbTitle').textContent=g.title;const imgs=arr(g.image_paths);$('#lbTrack').innerHTML=imgs.map((src,i)=>`<div class="lbSlide"><img loading="${i===index?'eager':'lazy'}" fetchpriority="${i===index?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)}"></div>`).join('');$('#lightbox').classList.add('open');document.body.style.overflow='hidden';requestAnimationFrame(()=>{$('#lbTrack').scrollLeft=$('#lbTrack').clientWidth*index;updateCount(index)})}
  function updateCount(i){currentImageIndex=i;$('#lbCount').textContent=`${i+1} / ${arr(currentGallery?.image_paths).length}`}
  function closeLightbox(){$('#lightbox').classList.remove('open');document.body.style.overflow=''}
  document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('DOMContentLoaded',()=>{
    $('#year').textContent=new Date().getFullYear();showCardLoading();showPackageLoading();showGalleryLoading();setTimeout(revealApp,900);loadData();
    document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')warmTarget(e.target)},{passive:true});document.addEventListener('touchstart',e=>warmTarget(e.target),{passive:true});
    $('#search').addEventListener('input',renderCards); $('#cardGrid').onclick=e=>{const c=e.target.closest('[data-id]');if(c)openCardDetail(c.dataset.id)}; $('#packageGrid2').onclick=e=>{const c=e.target.closest('[data-tour]');if(c)openTour(c.dataset.tour)}; $('#galleryGrid').onclick=e=>{const c=e.target.closest('[data-gallery]');if(c)openGallery(c.dataset.gallery)}; $('#photoGrid').onclick=e=>{const b=e.target.closest('[data-photo]');if(b&&currentGallery)openLightbox(currentGallery,Number(b.dataset.photo))};
    $$('.navbtn').forEach(b=>b.onclick=()=>showTab(b.dataset.tab)); $('#backBtn').onclick=handleBack; window.addEventListener('scroll',updateBackButton,{passive:true}); $('#filterBtn').onclick=()=>$('#filterModal').classList.add('open'); $('#closeFilter').onclick=()=>$('#filterModal').classList.remove('open'); $('#applyFilter').onclick=()=>{$('#filterModal').classList.remove('open');renderCards()}; $('#clearFilter').onclick=()=>{activeType='';activeDays='';$$('.chip').forEach(x=>x.classList.remove('active'));renderCards()}; $$('[data-days]').forEach(b=>b.onclick=()=>{activeDays=activeDays===b.dataset.days?'':b.dataset.days;$$('[data-days]').forEach(x=>x.classList.toggle('active',x.dataset.days===activeDays))});
    $('#feedbackForm').onsubmit=submitFeedback; $('#contactBtn').onclick=()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent('Hi EzyGo Travels, I would like to make a travel enquiry.')}`,'_blank'); $('#packageEnquire').onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentCard.country}.`)}`,'_blank'); const validityFact=$('#packageValidityFact');if(validityFact)validityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please confirm visa validity for ${currentCard.country}.`)}`,'_blank'); const availabilityFact=$('#packageAvailabilityFact');if(availabilityFact)availabilityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please check current availability/details for ${currentCard.country}.`)}`,'_blank'); $('#tourEnquire').onclick=()=>currentTour&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentTour.title}.`)}`,'_blank');
    $$('.accBtn').forEach(btn=>btn.onclick=()=>btn.parentElement.classList.toggle('open')); $('#lbClose').onclick=closeLightbox; $('#lbPrev').onclick=()=>{if(!currentGallery)return;const n=Math.max(0,currentImageIndex-1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'auto'});updateCount(n)}; $('#lbNext').onclick=()=>{if(!currentGallery)return;const n=Math.min(arr(currentGallery.image_paths).length-1,currentImageIndex+1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'auto'});updateCount(n)};
    window.addEventListener('popstate',e=>{const st=e.state;if(st?.view==='cardDetail')openCardDetail(st.id,false); else if(st?.view==='tourDetail')openTour(st.id,false); else if(st?.view==='galleryDetail')openGallery(st.id,false); else showOnly(st?.view||'explorePane',true)}); history.replaceState({view:'explorePane'},'',location.pathname); currentView='explorePane'; updateBackButton();
  });
})();
