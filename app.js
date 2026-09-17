(() => {
  'use strict';
  const C = window.EZYGO_CONFIG;
  const PHONE = '919656309061';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const apiHeaders = { apikey: C.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${C.SUPABASE_PUBLISHABLE_KEY}` };
  let cards = [], groups = [], packages = [], galleries = [];
  let currentCard = null, currentTour = null, currentGallery = null, currentImageIndex = 0;
  let activeType = '', activeDays = '';

  function esc(v='') { return String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function svgPlaceholder(label='Travel') {
    const txt = esc(label).slice(0,28);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef1f4"/><stop offset="1" stop-color="#dfe4e9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="450" cy="470" r="88" fill="#fff" opacity=".8"/><path d="M382 470h136M450 402v136" stroke="#b5bdc6" stroke-width="14" stroke-linecap="round"/><text x="450" y="650" text-anchor="middle" font-family="Arial" font-size="34" fill="#7f8994">${txt}</text></svg>`)} `;
  }
  function mediaUrl(path, label='Travel') {
    if (!path) return svgPlaceholder(label).trim();
    if (/^data:image\//i.test(path)) return path;
    if (/^https:\/\/eqtitceuapjuwockosnm\.supabase\.co\/storage\/v1\/object\/public\/site-media\//i.test(path)) return path;
    if (/^https?:\/\//i.test(path)) return svgPlaceholder(label).trim();
    return `${C.SUPABASE_URL}/storage/v1/object/public/${C.STORAGE_BUCKET}/${String(path).replace(/^\/+/, '')}`;
  }
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
      renderCards(); renderPackages(); renderGalleries(); buildTypeChips();
    } catch (err) {
      console.error(err);
      const grid=$('#cardGrid'); if(grid) grid.innerHTML='<div class="empty">Content is being prepared. Please check again shortly.</div>';
    }
  }
  function cardMarkup(c) {
    const valid=c.validity || (Number(c.days)?`${c.days} Days`:'Check details');
    return `<article class="card" data-id="${esc(c.id)}"><div class="poster"><img loading="lazy" decoding="async" src="${mediaUrl(c.cover_path,c.country)}" alt="${esc(c.country)}"><div class="identity"><div class="flagcircle">${esc(c.flag||'✈️')}</div><div class="country">${esc(c.country)}</div></div><div class="hoverpeek"><span>${esc(c.type||'Visa')}</span><b>${esc(valid)} · ${esc(c.fee||'Contact us')}</b><small>View full details</small></div><div class="cardmeta"><div class="metagrid"><div><span class="label">Type</span><span class="value">${esc(c.type||'Visa')}</span></div><div><span class="label">Valid</span><span class="value">${esc(valid)}</span></div></div></div></div><div class="below"><div class="line1">${esc(c.date_label||'Visa assistance')}</div><div class="line2">${esc(c.deadline||'Contact us for current processing details')}</div><div class="fee">${esc(c.fee==='Contact us'?'Fee: Contact us':'Fees: '+(c.fee||'Contact us'))}</div></div></article>`;
  }
  function renderCards() {
    const q=($('#search')?.value||'').trim().toLowerCase();
    let list=cards.filter(c=>!q || [c.country,c.type,c.group_name,c.description].join(' ').toLowerCase().includes(q));
    if(activeType) list=list.filter(c=>c.type===activeType);
    if(activeDays) { const n=Number(activeDays); list=list.filter(c=>n===0?Number(c.days||0)===0:Number(c.days||0)<=n); }
    const groupOrder = groups.length ? groups : [...new Set(cards.map(c=>c.group_name))].map((name,i)=>({name,sort_order:i}));
    let html='';
    for(const g of groupOrder){ const items=list.filter(c=>c.group_name===g.name); if(!items.length) continue; html += `<div class="visaGroup">${esc(g.name)}</div>${items.map(cardMarkup).join('')}`; }
    if(!html) html='<div class="empty">No matching visa option found.</div>';
    $('#cardGrid').innerHTML=html;
  }
  function renderPackages(){
    $('#packageGrid2').innerHTML=packages.map(p=>`<article class="tourCard" data-tour="${esc(p.id)}"><div class="tourCardMedia"><img loading="lazy" src="${mediaUrl(p.cover_path,p.title)}" alt="${esc(p.title)}"><div class="tourOverlay"><span>${esc(p.tag||'Travel package')}</span><h2>${esc(p.title)}</h2></div></div><div class="tourCardBody"><p>${esc(p.destination||'')}</p><div class="tourCardFacts"><span>${esc(p.duration||'')}</span><strong>${esc(p.price||'Ask for price')}</strong></div></div></article>`).join('') || '<div class="empty">No packages available right now.</div>';
  }
  function renderGalleries(){
    $('#galleryGrid').innerHTML=galleries.map(g=>`<button class="galleryCard" data-gallery="${esc(g.id)}"><img loading="lazy" src="${mediaUrl(g.cover_path,g.title)}" alt="${esc(g.title)}"><span>${esc(g.title)}</span></button>`).join('') || '<div class="empty">No gallery items yet.</div>';
  }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function openCardDetail(id,push=true){
    const c=cards.find(x=>String(x.id)===String(id)); if(!c)return; currentCard=c;
    const imgs=[c.cover_path,...arr(c.detail_paths)].filter(Boolean);
    $('#packageTrack').innerHTML=(imgs.length?imgs:['']).map((src,i)=>`<div class="detailSlide"><img src="${mediaUrl(src,`${c.country} ${i+1}`)}" alt="${esc(c.country)} image ${i+1}"></div>`).join('');
    $('#packageDots').innerHTML=(imgs.length?imgs:['']).map((_,i)=>`<i class="detailDot ${i===0?'active':''}"></i>`).join('');
    $('#packageFlag').textContent=c.flag||'✈️'; $('#packageType').textContent=c.type||'Visa'; $('#packageTitle').textContent=c.country||''; $('#packageDesc').textContent=c.description||'';
    $('#packageDays').textContent=c.validity||(Number(c.days)?`${c.days} Days`:'Check details'); $('#packageFee').textContent=c.fee||'Contact us'; $('#packageDate').textContent=c.deadline||'Please confirm';
    $('#packageDocs').innerHTML=arr(c.documents).map(d=>`<div class="docItem"><span class="docTick">✓</span><span>${esc(d)}</span></div>`).join('');
    showOnly('cardDetail'); if(push) history.pushState({view:'cardDetail',id:c.id},'','#visa-'+c.id);
  }
  function openTour(id,push=true){
    const p=packages.find(x=>String(x.id)===String(id)); if(!p)return; currentTour=p;
    const imgs=[p.cover_path,...arr(p.image_paths)].filter(Boolean);
    $('#tourTrack').innerHTML=(imgs.length?imgs:['']).map((src,i)=>`<div class="tourSlide"><img src="${mediaUrl(src,`${p.title} ${i+1}`)}" alt="${esc(p.title)}"></div>`).join('');
    $('#tourDots').innerHTML=(imgs.length?imgs:['']).map((_,i)=>`<i class="tourDot ${i===0?'active':''}"></i>`).join('');
    $('#tourTag').textContent=p.tag||'Travel package'; $('#tourTitle').textContent=p.title||''; $('#tourDestination').textContent=p.destination||''; $('#tourSummary').textContent=p.summary||''; $('#tourDuration').textContent=p.duration||''; $('#tourPrice').textContent=p.price||'Ask for price';
    $('#tourHighlights').innerHTML=arr(p.highlights).map(x=>`<div class="tourListItem">${esc(x)}</div>`).join('');
    $('#tourItinerary').innerHTML=arr(p.itinerary).map((x,i)=>`<div class="day"><div class="dayTop"><strong>Day ${esc(x.day||i+1)} · ${esc(x.title||'')}</strong>${x.meal?`<span class="meal">${esc(x.meal)}</span>`:''}</div><p>${esc(x.text||x.description||'')}</p></div>`).join('');
    $('#tourInclusions').innerHTML=arr(p.inclusions).map(x=>`<div class="tourListItem">${esc(x)}</div>`).join(''); $('#tourExclusions').innerHTML=arr(p.exclusions).map(x=>`<div class="tourListItem">${esc(x)}</div>`).join(''); $('#tourTerms').innerHTML=arr(p.terms).map(x=>`<div class="tourListItem">${esc(x)}</div>`).join('');
    if($('#tourSourceNote')) $('#tourSourceNote').textContent=''; showOnly('tourDetail'); if(push) history.pushState({view:'tourDetail',id:p.id},'','#tour-'+p.id);
  }
  function openGallery(id,push=true){
    const g=galleries.find(x=>String(x.id)===String(id)); if(!g)return; currentGallery=g; $('#detailTitle').textContent=g.title||''; $('#detailDesc').textContent=g.description||'';
    const imgs=arr(g.image_paths); $('#photoGrid').innerHTML=imgs.map((src,i)=>`<button class="photo" data-photo="${i}"><img loading="lazy" src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)} image ${i+1}"></button>`).join('') || '<div class="empty">No photos uploaded yet.</div>';
    showOnly('galleryDetail'); if(push) history.pushState({view:'galleryDetail',id:g.id},'','#gallery-'+g.id);
  }
  function showOnly(view){
    const ids=['explorePane','packagesPane','servicesPane','galleryPane','tourDetail','cardDetail','galleryDetail']; ids.forEach(id=>{const el=$('#'+id); if(el) el.style.display=id===view?'block':'none'}); $('#tools').style.display=view==='explorePane'?'grid':'none'; $$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.tab===({explorePane:'explore',packagesPane:'packages',servicesPane:'services',galleryPane:'gallery'}[view]||''))); window.scrollTo({top:0,behavior:'smooth'});
  }
  function showTab(tab,push=true){ const map={explore:'explorePane',packages:'packagesPane',services:'servicesPane',gallery:'galleryPane'}; showOnly(map[tab]||'explorePane'); if(push) history.pushState({view:map[tab]||'explorePane'},'','#'+tab); }
  function buildTypeChips(){ const types=[...new Set(cards.map(c=>c.type).filter(Boolean))]; $('#typeChips').innerHTML=types.map(t=>`<button class="chip" data-type="${esc(t)}">${esc(t)}</button>`).join(''); $$('[data-type]').forEach(b=>b.onclick=()=>{activeType=activeType===b.dataset.type?'':b.dataset.type; $$('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===activeType));}); }
  async function submitFeedback(e){
    e.preventDefault(); const name=$('#fbName').value.trim(), phone=$('#fbPhone').value.trim(), message=$('#fbMessage').value.trim(); if(!message)return;
    const btn=$('#feedbackForm .send'); const old=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    try{ const r=await fetch(`${C.SUPABASE_URL}/rest/v1/feedback`,{method:'POST',headers:{...apiHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,phone,message})}); if(!r.ok) throw new Error(await r.text()); $('#feedbackForm').reset(); let s=$('#feedbackStatus'); if(!s){s=document.createElement('div');s.id='feedbackStatus';s.className='feedbackSuccess';$('#feedbackForm').appendChild(s)} s.textContent='Thank you. Your feedback has been sent.'; }
    catch(err){console.error(err); alert('Could not send feedback right now. Please try again.');} finally{btn.disabled=false;btn.textContent=old;}
  }
  function openLightbox(g,index=0){currentGallery=g;currentImageIndex=index;$('#lbTitle').textContent=g.title;const imgs=arr(g.image_paths);$('#lbTrack').innerHTML=imgs.map((src,i)=>`<div class="lbSlide"><img src="${mediaUrl(src,`${g.title} ${i+1}`)}" alt="${esc(g.title)}"></div>`).join('');$('#lightbox').classList.add('open');document.body.style.overflow='hidden';requestAnimationFrame(()=>{$('#lbTrack').scrollLeft=$('#lbTrack').clientWidth*index;updateCount(index)})}
  function updateCount(i){currentImageIndex=i;$('#lbCount').textContent=`${i+1} / ${arr(currentGallery?.image_paths).length}`}
  function closeLightbox(){$('#lightbox').classList.remove('open');document.body.style.overflow=''}
  document.addEventListener('DOMContentLoaded',()=>{
    $('#year').textContent=new Date().getFullYear(); loadData();
    $('#search').addEventListener('input',renderCards); $('#cardGrid').onclick=e=>{const c=e.target.closest('[data-id]');if(c)openCardDetail(c.dataset.id)}; $('#packageGrid2').onclick=e=>{const c=e.target.closest('[data-tour]');if(c)openTour(c.dataset.tour)}; $('#galleryGrid').onclick=e=>{const c=e.target.closest('[data-gallery]');if(c)openGallery(c.dataset.gallery)}; $('#photoGrid').onclick=e=>{const b=e.target.closest('[data-photo]');if(b&&currentGallery)openLightbox(currentGallery,Number(b.dataset.photo))};
    $$('.navbtn').forEach(b=>b.onclick=()=>showTab(b.dataset.tab)); $('#backBtn').onclick=()=>history.back(); $('#filterBtn').onclick=()=>$('#filterModal').classList.add('open'); $('#closeFilter').onclick=()=>$('#filterModal').classList.remove('open'); $('#applyFilter').onclick=()=>{$('#filterModal').classList.remove('open');renderCards()}; $('#clearFilter').onclick=()=>{activeType='';activeDays='';$$('.chip').forEach(x=>x.classList.remove('active'));renderCards()}; $$('[data-days]').forEach(b=>b.onclick=()=>{activeDays=activeDays===b.dataset.days?'':b.dataset.days;$$('[data-days]').forEach(x=>x.classList.toggle('active',x.dataset.days===activeDays))});
    $('#feedbackForm').onsubmit=submitFeedback; $('#contactBtn').onclick=()=>window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent('Hi EzyGo Travels, I would like to make a travel enquiry.')}`,'_blank'); $('#packageEnquire').onclick=()=>currentCard&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentCard.country}.`)}`,'_blank'); $('#tourEnquire').onclick=()=>currentTour&&window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(`Hi EzyGo Travels, I would like details about ${currentTour.title}.`)}`,'_blank');
    $$('.accBtn').forEach(btn=>btn.onclick=()=>btn.parentElement.classList.toggle('open')); $('#lbClose').onclick=closeLightbox; $('#lbPrev').onclick=()=>{if(!currentGallery)return;const n=Math.max(0,currentImageIndex-1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'smooth'});updateCount(n)}; $('#lbNext').onclick=()=>{if(!currentGallery)return;const n=Math.min(arr(currentGallery.image_paths).length-1,currentImageIndex+1);$('#lbTrack').scrollTo({left:$('#lbTrack').clientWidth*n,behavior:'smooth'});updateCount(n)};
    window.addEventListener('popstate',e=>{const st=e.state;if(st?.view==='cardDetail')openCardDetail(st.id,false); else if(st?.view==='tourDetail')openTour(st.id,false); else if(st?.view==='galleryDetail')openGallery(st.id,false); else showOnly(st?.view||'explorePane')}); history.replaceState({view:'explorePane'},'',location.pathname);
  });
})();
