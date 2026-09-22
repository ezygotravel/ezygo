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
  const preloadedMedia = new Set();
  let mediaObserver = null;
  const SITE_ORIGIN = 'https://ezygotravel.in';
  const HOME_SEO = Object.freeze({
    title: 'EzyGo Travels | Visa Services & Tour Packages in Kerala',
    description: 'Visa assistance, tour packages, flight, train and bus tickets, certificate attestation and Umrah travel support from EzyGo Travels in Edavannappara, Kerala.'
  });

  function absoluteUrl(value=''){
    const raw=String(value||'').trim();
    if(!raw || /^data:/i.test(raw)) return `${SITE_ORIGIN}/logo.png`;
    if(/^https?:\/\//i.test(raw)) return raw;
    return `${SITE_ORIGIN}${raw.startsWith('/')?'':'/'}${raw}`;
  }
  function ensureMeta(selector,attrs={}){
    let el=document.head.querySelector(selector);
    if(!el){
      el=document.createElement('meta');
      Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
      document.head.appendChild(el);
    }
    return el;
  }
  function setMetaName(name,content){
    const el=ensureMeta(`meta[name="${name}"]`,{name});
    el.setAttribute('content',content);
  }
  function setMetaProperty(property,content){
    const el=ensureMeta(`meta[property="${property}"]`,{property});
    el.setAttribute('content',content);
  }
  function setCanonical(path='/'){
    let el=document.head.querySelector('link[rel="canonical"]');
    if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el)}
    el.href=`${SITE_ORIGIN}${path==='/'?'':path}`;
  }
  function setDynamicSchema(nodes=[]){
    const el=$('#dynamic-schema');
    if(!el) return;
    el.textContent=JSON.stringify({"@context":"https://schema.org","@graph":nodes});
  }
  function seoText(value='',fallback=''){
    const clean=String(value||fallback||'').replace(/\s+/g,' ').trim();
    return clean.length>165?`${clean.slice(0,162).replace(/\s+\S*$/,'')}...`:clean;
  }
  function setSeo({title=HOME_SEO.title,description=HOME_SEO.description,path='/',image='/logo.png',type='website',schema=[]}={}){
    const canonicalPath=path.startsWith('/')?path:`/${path}`;
    const url=`${SITE_ORIGIN}${canonicalPath==='/'?'':canonicalPath}`;
    const img=absoluteUrl(image);
    document.title=title;
    setMetaName('description',seoText(description,HOME_SEO.description));
    setMetaProperty('og:type',type);
    setMetaProperty('og:title',title);
    setMetaProperty('og:description',seoText(description,HOME_SEO.description));
    setMetaProperty('og:url',url);
    setMetaProperty('og:image',img);
    setMetaProperty('og:image:alt',title);
    setMetaName('twitter:title',title);
    setMetaName('twitter:description',seoText(description,HOME_SEO.description));
    setMetaName('twitter:image',img);
    setCanonical(canonicalPath);
    setDynamicSchema(schema);
  }
  function breadcrumbSchema(items){
    return {
      "@type":"BreadcrumbList",
      "itemListElement":items.map((item,index)=>({
        "@type":"ListItem",
        "position":index+1,
        "name":item.name,
        "item":`${SITE_ORIGIN}${item.path==='/'?'':item.path}`
      }))
    };
  }
  function sectionSeo(view){
    if(view==='packagesPane'){
      setSeo({
        title:'Tour Packages from Kerala | EzyGo Travels',
        description:'Explore domestic and international tour packages from EzyGo Travels with trip itineraries, inclusions, exclusions and travel enquiry support.',
        path:'/packages',
        schema:[breadcrumbSchema([{name:'Home',path:'/'},{name:'Tour Packages',path:'/packages'}])]
      });
      return;
    }
    if(view==='servicesPane'){
      setSeo({
        title:'Travel Services in Kerala | EzyGo Travels',
        description:'Visa assistance, tour planning, flight, train and bus ticket booking, certificate attestation and Umrah travel support from EzyGo Travels.',
        path:'/services',
        schema:[breadcrumbSchema([{name:'Home',path:'/'},{name:'Travel Services',path:'/services'}])]
      });
      return;
    }
    if(view==='galleryPane'){
      setSeo({
        title:'Travel Gallery | EzyGo Travels',
        description:'Browse travel photos and destination highlights from EzyGo Travels.',
        path:'/gallery',
        schema:[breadcrumbSchema([{name:'Home',path:'/'},{name:'Travel Gallery',path:'/gallery'}])]
      });
      return;
    }
    setSeo({
      title:HOME_SEO.title,
      description:HOME_SEO.description,
      path:'/'
    });
  }
  function internalClick(e){
    return e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey;
  }

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
    mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;if(el.dataset.id){const card=cards.find(x=>String(x.id)===String(el.dataset.id));if(card)preloadMedia([card.cover_path,...arr(card.detail_paths).slice(0,2)],'low')}else if(el.dataset.tour){const tour=packages.find(x=>String(x.id)===String(el.dataset.tour));if(tour)preloadMedia([tour.cover_path,...arr(tour.image_paths).slice(0,2)],'low')}else if(el.dataset.gallery){const gallery=galleries.find(x=>String(x.id)===String(el.dataset.gallery));if(gallery)preloadMedia([gallery.cover_path,...arr(gallery.image_paths).slice(0,2)],'low')}mediaObserver.unobserve(el)}},{rootMargin:'1800px 0px',threshold:.01});
    $$('[data-id],[data-tour],[data-gallery]').forEach(el=>mediaObserver.observe(el));
  }
  function warmMediaAfterCovers(){
    const run=()=>{packages.slice(0,3).forEach(item=>preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,2)],'low'));galleries.slice(0,6).forEach(item=>preloadMedia([item.cover_path,...arr(item.image_paths).slice(0,1)],'low'))};
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2200});else setTimeout(run,1400);
  }
  function warmTarget(target){
    const card=target.closest?.('[data-id]');if(card){const item=cards.find(x=>String(x.id)===String(card.dataset.id));if(item)preloadMedia([item.cover_path,...arr(item.detail_paths)],'high');return}
    const tour=target.closest?.('[data-tour]');if(tour){const item=packages.find(x=>String(x.id)===String(tour.dataset.tour));if(item)preloadMedia([item.cover_path,...arr(item.image_paths)],'high');return}
    const gallery=target.closest?.('[data-gallery]');if(gallery){const item=galleries.find(x=>String(x.id)===String(gallery.dataset.gallery));if(item)preloadMedia([item.cover_path,...arr(item.image_paths)],'high')}
  }
  function revealApp(){document.body.classList.add('appReady');const splash=$('#bootSplash');if(splash)splash.classList.add('done')}
  async function rest(table, query='') {
    const r = await fetch(`${C.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: apiHeaders });
    if (!r.ok) throw new Error(`${table}: ${r.status}`);
    return r.json();
  }
  async function loadData() {
    try {
      const [g,c,p,ga] = await Promise.all([
        rest('visa_groups','select=*&active=eq.true&order=sort_order.asc'),
        rest('visa_cards','select=*&active=eq.true&order=sort_order.asc'),
        rest('packages','select=*&active=eq.true&order=sort_order.asc'),
        rest('galleries','select=*&active=eq.true&order=sort_order.asc')
      ]);
      groups=g; cards=c; packages=p; galleries=ga;
      isLoadingCards=false;
      if(cards.length) renderCards(); else showCardLoading();
      renderPackages(); renderGalleries(); buildTypeChips(); syncContentNavigation();
      applyLocationRoute(false);
      observeMediaAhead(); warmMediaAfterCovers();
    } catch (err) {
      console.error(err);
      isLoadingCards=true; showCardLoading();
    } finally {
      revealApp();
    }
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
    return `<a class="card" href="/visa/${encodeURIComponent(c.id)}" data-id="${esc(c.id)}" aria-label="${esc(c.country)} visa details"><div class="poster"><img loading="${index<20?'eager':'lazy'}" fetchpriority="${index<8?'high':'auto'}" decoding="async" src="${mediaUrl(c.cover_path,c.country)}" onerror="this.onerror=null;this.src=window.__ezyFallback?window.__ezyFallback(this.alt):this.src" alt="${esc(c.country)} visa assistance"><div class="identity"><div class="flagcircle">${esc(c.flag||'✈️')}</div><h3 class="country">${esc(c.country)}</h3></div><div class="hoverpeek"><span>${esc(c.type||'Visa')}</span><b>${esc(valid)}</b><small>View full details</small></div><div class="cardmeta"><div class="metagrid"><div><span class="label">Type</span><span class="value">${esc(c.type||'Visa')}</span></div><div><span class="label">Valid</span><span class="value">${esc(valid)}</span></div></div></div></div><div class="below"><div class="line1">VISA</div><div class="line2">Fast &amp; reliable visa assistance for a smooth travel experience</div><div class="fee">More details</div></div></a>`;
  }
  function renderCards() {
    const q=($('#search')?.value||'').trim().toLowerCase();
    let list=cards.filter(c=>!q || [c.country,c.type,c.group_name,c.description].join(' ').toLowerCase().includes(q));
    if(activeType) list=list.filter(c=>c.type===activeType);
    if(activeDays) { const n=Number(activeDays); list=list.filter(c=>n===0?Number(c.days||0)===0:Number(c.days||0)<=n); }
    const groupOrder = groups.length ? groups : [...new Set(cards.map(c=>c.group_name))].map((name,i)=>({name,sort_order:i}));
    let html='',visibleIndex=0;
    for(const g of groupOrder){const items=list.filter(c=>c.group_name===g.name);if(!items.length)continue;html+=`<h2 class="visaGroup">${esc(cleanGroupName(g.name))}</h2>${items.map(c=>cardMarkup(c,visibleIndex++)).join('')}`;}
    if(!html){
      if(isLoadingCards || !cards.length){ showCardLoading(); return; }
      html='<div class="empty">No matching visa options.</div>';
    }
    $('#cardGrid').innerHTML=html;requestAnimationFrame(observeMediaAhead);
  }
  function renderPackages(){
    $('#packageGrid2').innerHTML=packages.map(p=>`<a class="tourCard" href="/package/${encodeURIComponent(p.id)}" data-tour="${esc(p.id)}" aria-label="${esc(p.title)} tour package"><div class="tourCardMedia"><img loading="eager" fetchpriority="auto" decoding="async" src="${mediaUrl(p.cover_path,p.title)}" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt)" alt="${esc(p.title)} tour package"><div class="tourOverlay"><span>${esc(p.tag||'Travel package')}</span><h2>${esc(p.title)}</h2></div></div><div class="tourCardBody"><p>${esc(p.destination||'')}</p><div class="tourCardFacts"><span>${esc(p.duration||'')}</span>${p.price?`<strong>${esc(p.price)}</strong>`:''}</div></div></a>`).join('') || '<div class="empty">No packages available.</div>';requestAnimationFrame(observeMediaAhead);
  }
  function renderGalleries(){
    $('#galleryGrid').innerHTML=galleries.map(g=>`<a class="galleryCard" href="/gallery/${encodeURIComponent(g.id)}" data-gallery="${esc(g.id)}" aria-label="${esc(g.title)} gallery"><img loading="lazy" decoding="async" src="${mediaUrl(g.cover_path,g.title)}" alt="${esc(g.title)} travel gallery"><h3>${esc(g.title)}</h3></a>`).join('') || '<div class="empty">No gallery items available.</div>';requestAnimationFrame(observeMediaAhead);
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
        <img loading="${i===0?'eager':'lazy'}" fetchpriority="${i===0?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${c.country} ${i+1}`)}" alt="${esc(c.country)} image ${i+1}" draggable="false">
      </div>`).join('');
    $('#packageDots').innerHTML=sliderItems.length>1
      ? sliderItems.map((_,i)=>`<button type="button" class="detailDot ${i===0?'active':''}" data-visa-dot="${i}" aria-label="Show image ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('')
      : '';

    $('#packageFlag').textContent=c.flag||'✈️';
    $('#packageType').textContent=c.type||'Visa';
    $('#packageTitle').textContent=c.country||'';
    $('#packageDesc').textContent=c.description||'';
    const valid=c.validity || (Number(c.days)?`${c.days} Days`:'Check details');
    $('#packageDays').textContent=valid;
    $('#packageDate').textContent='Check now';
    const packagePhone=$('#packagePhone');if(packagePhone)packagePhone.textContent='+91 96563 09061';
    const dummyTicket=$('#packageDummyTicket');
    if(dummyTicket) dummyTicket.innerHTML=c.dummy_ticket!==false?`<div class="dummyTicketDetail"><div class="dummyTicketIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7.25a1.75 1.75 0 0 1 1.75-1.75h11.5a1.75 1.75 0 0 1 1.75 1.75v2a2.75 2.75 0 0 0 0 5.5v2A1.75 1.75 0 0 1 17.75 18.5H6.25A1.75 1.75 0 0 1 4.5 16.75v-2a2.75 2.75 0 0 0 0-5.5v-2Z"/><path d="M12 8.25v1.5M12 11.25v1.5M12 14.25v1.5"/></svg></div><div><strong>Dummy Ticket</strong><p>Temporary flight itinerary support available for this visa application.</p></div></div>`:'';
    $('#packageDocs').innerHTML=arr(c.documents).map(d=>`<div class="docItem"><span class="docTick">✓</span><span>${esc(d)}</span></div>`).join('');

    showOnly('cardDetail');
    bindVisaSlider();
    setVisaSlide(0,false);
    const visaPath=`/visa/${encodeURIComponent(c.id)}`;
    setSeo({
      title:`${c.country} Visa Assistance | EzyGo Travels`,
      description:seoText(c.description,`${c.country} visa assistance, document guidance and travel support from EzyGo Travels in Kerala.`),
      path:visaPath,
      image:mediaUrl(c.cover_path,c.country),
      type:'article',
      schema:[
        {
          "@type":"Service",
          "name":`${c.country} Visa Assistance`,
          "serviceType":c.type||'Visa assistance',
          "description":seoText(c.description,`${c.country} visa assistance from EzyGo Travels.`),
          "provider":{"@id":`${SITE_ORIGIN}/#travelagency`},
          "areaServed":{"@type":"Country","name":"India"},
          "url":`${SITE_ORIGIN}${visaPath}`,
          "image":absoluteUrl(mediaUrl(c.cover_path,c.country))
        },
        breadcrumbSchema([{name:'Home',path:'/'},{name:`${c.country} Visa`,path:visaPath}])
      ]
    });
    if(push) history.pushState({view:'cardDetail',id:c.id},'',visaPath);
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

    $('#tourTrack').innerHTML=sliderItems.map((src,i)=>`<div class="tourSlide"><img loading="${i===0?'eager':'lazy'}" fetchpriority="${i===0?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${p.title} ${i+1}`)}" onerror="this.onerror=null;this.src=window.__ezyFallback(this.alt)" alt="${esc(p.title)} image ${i+1}" draggable="false"></div>`).join('');
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

    const tourPath=`/package/${encodeURIComponent(p.id)}`;
    setSeo({
      title:`${p.title} Tour Package | EzyGo Travels`,
      description:seoText(p.summary,`${p.title} tour package from EzyGo Travels with itinerary and travel support.`),
      path:tourPath,
      image:mediaUrl(p.cover_path,p.title),
      type:'article',
      schema:[
        {
          "@type":"TouristTrip",
          "name":p.title||'Travel package',
          "description":seoText(p.summary,`${p.title} travel package from EzyGo Travels.`),
          "touristType":"Leisure travellers",
          "provider":{"@id":`${SITE_ORIGIN}/#travelagency`},
          "url":`${SITE_ORIGIN}${tourPath}`,
          "image":absoluteUrl(mediaUrl(p.cover_path,p.title))
        },
        breadcrumbSchema([{name:'Home',path:'/'},{name:'Tour Packages',path:'/packages'},{name:p.title||'Package',path:tourPath}])
      ]
    });
    if(push) history.pushState({view:'tourDetail',id:p.id},'',tourPath);
  }
  function openGallery(id,push=true){
    const g=galleries.find(x=>String(x.id)===String(id)); if(!g)return; currentGallery=g;preloadMedia([g.cover_path,...arr(g.image_paths)]); $('#detailTitle').textContent=g.title||''; $('#detailDesc').textContent=g.description||'';
    const imgs=arr(g.image_paths); $('#photoGrid').innerHTML=imgs.map((src,i)=>`<button class="photo" data-photo="${i}"><img loading="lazy" decoding="async" fetchpriority="auto" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)} image ${i+1}"></button>`).join('') || '<div class="empty">No photos uploaded yet.</div>';
    showOnly('galleryDetail');
    const galleryPath=`/gallery/${encodeURIComponent(g.id)}`;
    setSeo({
      title:`${g.title} Travel Gallery | EzyGo Travels`,
      description:seoText(g.description,`Travel photos and destination highlights from ${g.title} by EzyGo Travels.`),
      path:galleryPath,
      image:mediaUrl(g.cover_path,g.title),
      type:'article',
      schema:[
        {
          "@type":"ImageGallery",
          "name":g.title||'Travel Gallery',
          "description":seoText(g.description,`${g.title} travel gallery from EzyGo Travels.`),
          "url":`${SITE_ORIGIN}${galleryPath}`,
          "image":[g.cover_path,...arr(g.image_paths)].filter(Boolean).slice(0,12).map(x=>absoluteUrl(mediaUrl(x,g.title)))
        },
        breadcrumbSchema([{name:'Home',path:'/'},{name:'Travel Gallery',path:'/gallery'},{name:g.title||'Gallery',path:galleryPath}])
      ]
    });
    if(push) history.pushState({view:'galleryDetail',id:g.id},'',galleryPath);
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
    if(scrollTop) window.scrollTo({top:0,behavior:'auto'});
    requestAnimationFrame(updateBackButton);
  }
  function showTab(tab,push=true){
    const map={explore:'explorePane',packages:'packagesPane',services:'servicesPane',gallery:'galleryPane'};
    const paths={explore:'/',packages:'/packages',services:'/services',gallery:'/gallery'};
    const view=map[tab]||'explorePane';
    showOnly(view,true);
    sectionSeo(view);
    if(push) history.pushState({view},'',paths[tab]||'/');
  }
  function applyLocationRoute(){
    let path=(location.pathname||'/').replace(/\/+$/,'')||'/';
    const hash=location.hash||'';
    if(hash){
      let migrated='';
      if(/^#visa-/i.test(hash)) migrated=`/visa/${encodeURIComponent(hash.replace(/^#visa-/i,''))}`;
      else if(/^#tour-/i.test(hash)) migrated=`/package/${encodeURIComponent(hash.replace(/^#tour-/i,''))}`;
      else if(/^#gallery-/i.test(hash)) migrated=`/gallery/${encodeURIComponent(hash.replace(/^#gallery-/i,''))}`;
      else if(hash==='#packages') migrated='/packages';
      else if(hash==='#services') migrated='/services';
      else if(hash==='#gallery') migrated='/gallery';
      else if(hash==='#explore') migrated='/';
      if(migrated){history.replaceState(history.state||{},'',migrated);path=migrated}
    }
    const decodeId=v=>{try{return decodeURIComponent(v)}catch(_){return v}};
    let m=path.match(/^\/visa\/([^/]+)$/i);
    if(m){const id=decodeId(m[1]);if(cards.some(x=>String(x.id)===String(id))){openCardDetail(id,false);return}}
    m=path.match(/^\/package\/([^/]+)$/i);
    if(m){const id=decodeId(m[1]);if(packages.some(x=>String(x.id)===String(id))){openTour(id,false);return}}
    m=path.match(/^\/gallery\/([^/]+)$/i);
    if(m){const id=decodeId(m[1]);if(galleries.some(x=>String(x.id)===String(id))){openGallery(id,false);return}}
    if(path==='/packages'){showTab('packages',false);return}
    if(path==='/services'){showTab('services',false);return}
    if(path==='/gallery'){showTab('gallery',false);return}
    showTab('explore',false);
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
  function openLightbox(g,index=0){currentGallery=g;currentImageIndex=index;$('#lbTitle').textContent=g.title;const imgs=arr(g.image_paths);$('#lbTrack').innerHTML=imgs.map((src,i)=>`<div class="lbSlide"><img loading="${i===index?'eager':'lazy'}" fetchpriority="${i===index?'high':'auto'}" decoding="async" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)}"></div>`).join('');$('#lightbox').classList.add('open');document.body.style.overflow='hidden';requestAnimationFrame(()=>{$('#lbTrack').scrollLeft=$('#lbTrack').clientWidth*index;updateCount(index)})}
  function updateCount(i){currentImageIndex=i;$('#lbCount').textContent=`${i+1} / ${arr(currentGallery?.image_paths).length}`}
  function closeLightbox(){$('#lightbox').classList.remove('open');document.body.style.overflow=''}
  document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault()});
  document.addEventListener('DOMContentLoaded',()=>{
    $('#year').textContent=new Date().getFullYear();showCardLoading();showPackageLoading();showGalleryLoading();setTimeout(revealApp,900);loadData();
    document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')warmTarget(e.target)},{passive:true});document.addEventListener('touchstart',e=>warmTarget(e.target),{passive:true});
    $('#search').addEventListener('input',renderCards); $('#cardGrid').onclick=e=>{const c=e.target.closest('[data-id]');if(c&&internalClick(e)){e.preventDefault();openCardDetail(c.dataset.id)}}; $('#packageGrid2').onclick=e=>{const c=e.target.closest('[data-tour]');if(c&&internalClick(e)){e.preventDefault();openTour(c.dataset.tour)}}; $('#galleryGrid').onclick=e=>{const c=e.target.closest('[data-gallery]');if(c&&internalClick(e)){e.preventDefault();openGallery(c.dataset.gallery)}}; $('#photoGrid').onclick=e=>{const b=e.target.closest('[data-photo]');if(b&&currentGallery)openLightbox(currentGallery,Number(b.dataset.photo))};
    $$('.navbtn').forEach(b=>b.onclick=e=>{if(!internalClick(e))return;e.preventDefault();showTab(b.dataset.tab)}); $('#backBtn').onclick=handleBack; window.addEventListener('scroll',updateBackButton,{passive:true}); $('#filterBtn').onclick=()=>$('#filterModal').classList.add('open'); $('#closeFilter').onclick=()=>$('#filterModal').classList.remove('open'); $('#applyFilter').onclick=()=>{$('#filterModal').classList.remove('open');renderCards()}; $('#clearFilter').onclick=()=>{activeType='';activeDays='';$$('.chip').forEach(x=>x.classList.remove('active'));renderCards()}; $$('[data-days]').forEach(b=>b.onclick=()=>{activeDays=activeDays===b.dataset.days?'':b.dataset.days;$$('[data-days]').forEach(x=>x.classList.toggle('active',x.dataset.days===activeDays))});
    $('#feedbackForm').onsubmit=submitFeedback; $('#contactBtn').onclick=()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent('Hi EzyGo Travels, I would like to make a travel enquiry.')}`,'_blank'); $('#packageEnquire').onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentCard.country}.`)}`,'_blank'); const validityFact=$('#packageValidityFact');if(validityFact)validityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please confirm visa validity for ${currentCard.country}.`)}`,'_blank'); const availabilityFact=$('#packageAvailabilityFact');if(availabilityFact)availabilityFact.onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, please check current availability/details for ${currentCard.country}.`)}`,'_blank'); $('#tourEnquire').onclick=()=>currentTour&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentTour.title}.`)}`,'_blank');
    $$('.accBtn').forEach(btn=>btn.onclick=()=>btn.parentElement.classList.toggle('open')); $('#lbClose').onclick=closeLightbox; $('#lbPrev').onclick=()=>{if(!currentGallery)return;const n=Math.max(0,currentImageIndex-1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'smooth'});updateCount(n)}; $('#lbNext').onclick=()=>{if(!currentGallery)return;const n=Math.min(arr(currentGallery.image_paths).length-1,currentImageIndex+1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'smooth'});updateCount(n)};
    window.addEventListener('popstate',()=>applyLocationRoute()); currentView='explorePane'; sectionSeo('explorePane'); updateBackButton();
  });
})();
