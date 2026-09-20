(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let adminId=sessionStorage.getItem('ezygo_admin_id')||'';
let data={visa_groups:[],visa_cards:[],packages:[],feedback:[]};
let edit={visa:null,package:null};
let mediaDraft={
  visa:{cover:'',images:[],newCover:null,newImages:[]},
  package:{cover:'',images:[],newCover:null,newImages:[]}
};
const endpoint='/api/admin';
let busyCount=0;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cleanGroupName=v=>String(v||'').replace(/^[\s🌏🌍]+/u,'').trim();
const lines=id=>$(id).value.split('\n').map(x=>x.trim()).filter(Boolean);
const mediaUrl=p=>{
  if(!p)return'';
  const raw=String(p).trim();
  if(raw.startsWith('local:'))return raw.slice(6);
  if(raw.startsWith('/assets/'))return raw;
  if(/^https?:\/\//i.test(raw))return raw;
  return `${window.EZYGO_CONFIG.SUPABASE_URL}/storage/v1/object/public/${window.EZYGO_CONFIG.STORAGE_BUCKET}/${raw.replace(/^\/+/, '')}`;
};


function setGlobalBusy(active){busyCount=Math.max(0,busyCount+(active?1:-1));const el=$('#adminBusy');if(el)el.classList.toggle('show',busyCount>0)}
function dotsHtml(){return '<span class="loadingDots"><i></i><i></i><i></i></span>'}
function setButtonBusy(btn,active,label='Save'){if(!btn)return;if(active){if(!btn.dataset.oldHtml)btn.dataset.oldHtml=btn.innerHTML;btn.disabled=true;btn.innerHTML=dotsHtml()}else{btn.disabled=false;btn.innerHTML=btn.dataset.oldHtml||label;delete btn.dataset.oldHtml}}
function updateFileState(inputId,stateId){const input=$('#'+inputId),state=$('#'+stateId);if(!input||!state)return;const files=[...input.files];state.textContent=!files.length?'No new image selected':files.length===1?files[0].name:`${files.length} images selected`}

function setLoginStatus(message='', type=''){
  const el=$('#loginStatus'); if(!el) return;
  el.textContent=message; el.className='status'+(type?` ${type}`:'');
}
function setLoginLoading(loading){
  const btn=$('#loginBtn'), input=$('#loginId');
  if(btn){ btn.disabled=loading; btn.textContent=loading?'Checking…':'Continue'; }
  if(input) input.disabled=loading;
}
function openAdminView(){
  const loginView=$('#loginView'), adminView=$('#adminView');
  if(loginView){ loginView.hidden=true; loginView.style.display='none'; }
  if(adminView){ adminView.hidden=false; adminView.style.display='block'; }
  setLoginStatus('');
  window.scrollTo({top:0,left:0,behavior:'auto'});
}
function openLoginView(){
  const loginView=$('#loginView'), adminView=$('#adminView');
  if(adminView){ adminView.hidden=true; adminView.style.display='none'; }
  if(loginView){ loginView.hidden=false; loginView.style.display='grid'; }
}
async function call(action,payload={}){
  setGlobalBusy(true);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(), 12000);
  try{
    const r=await fetch(endpoint,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({action,adminId,...payload}),signal:controller.signal});
    const text=await r.text();
    let j={};
    try{ j=text?JSON.parse(text):{}; }catch{ j={ error:text || 'Unexpected server response' }; }
    if(!r.ok) throw new Error(j.error||`Request failed (${r.status})`);
    return j;
  }catch(err){
    if(err.name==='AbortError') throw new Error('Request timed out. Check Cloudflare deployment and secrets.');
    throw err;
  }finally{ clearTimeout(timer); setGlobalBusy(false); }
}
async function fileData(file){if(!file)return null;const objectUrl=URL.createObjectURL(file);try{const img=await new Promise((res,rej)=>{const i=new Image;i.onload=()=>res(i);i.onerror=rej;i.src=objectUrl});let w=img.width,h=img.height,max=1400;if(Math.max(w,h)>max){const scale=max/Math.max(w,h);w=Math.round(w*scale);h=Math.round(h*scale)}const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,w,h);return canvas.toDataURL('image/jpeg',.8)}finally{URL.revokeObjectURL(objectUrl)}}
async function upload(file,folder){if(!file)return'';const dataUrl=await fileData(file);return (await call('upload',{folder,name:file.name,dataUrl})).path}
async function uploadMany(files,folder){const input=[...files];const out=new Array(input.length);let cursor=0;const worker=async()=>{while(cursor<input.length){const i=cursor++;out[i]=await upload(input[i],folder)}};await Promise.all(Array.from({length:Math.min(3,input.length)},worker));return out}
function revokePending(item){if(item?.url?.startsWith('blob:'))URL.revokeObjectURL(item.url)}
function resetDraft(kind,cover='',images=[]){const d=mediaDraft[kind];revokePending(d.newCover);d.newImages.forEach(revokePending);d.cover=cover||'';d.images=[...(images||[])];d.newCover=null;d.newImages=[];renderMediaDraft(kind)}
function mediaIds(kind){return kind==='visa'?{cover:'vCoverPreview',images:'vDetailsPreview',coverState:'vCoverName',imagesState:'vDetailsName'}:{cover:'pCoverPreview',images:'pImagesPreview',coverState:'pCoverName',imagesState:'pImagesName'}}
function thumb(url,kind,role,index,pending=false,label=''){return `<div class="mediaThumb ${pending?'isNew':''}"><img loading="lazy" decoding="async" src="${esc(url)}" alt="Image preview"><button type="button" class="mediaRemove" aria-label="Remove image" data-media-kind="${kind}" data-media-role="${role}" data-media-index="${index}" data-media-pending="${pending?'1':'0'}">×</button>${label?`<span class="mediaTag">${esc(label)}</span>`:''}</div>`}
function renderMediaDraft(kind){const d=mediaDraft[kind],ids=mediaIds(kind),coverEl=$('#'+ids.cover),imagesEl=$('#'+ids.images);if(coverEl){let html='';if(d.cover)html+=thumb(mediaUrl(d.cover),kind,'cover',0,false,'Current');if(d.newCover)html+=thumb(d.newCover.url,kind,'cover',0,true,'New');coverEl.innerHTML=html||'<div class="mediaEmpty">No cover image</div>'}if(imagesEl){const current=d.images.map((path,i)=>thumb(mediaUrl(path),kind,'images',i,false,'')).join('');const pending=d.newImages.map((item,i)=>thumb(item.url,kind,'images',i,true,'New')).join('');imagesEl.innerHTML=current+pending||'<div class="mediaEmpty">No detail images</div>'}const cs=$('#'+ids.coverState),is=$('#'+ids.imagesState);if(cs)cs.textContent=d.newCover?'1 new cover selected':d.cover?'Current cover shown below':'No new image selected';if(is)is.textContent=d.newImages.length?`${d.newImages.length} new image(s) selected`:`${d.images.length} existing image(s)`}
function addPendingCover(kind,file){if(!file)return;const d=mediaDraft[kind];revokePending(d.newCover);d.newCover={file,url:URL.createObjectURL(file)};renderMediaDraft(kind)}
function addPendingImages(kind,files){const d=mediaDraft[kind];for(const file of files)d.newImages.push({file,url:URL.createObjectURL(file)});renderMediaDraft(kind)}
function removeDraftMedia(kind,role,index,pending){const d=mediaDraft[kind];if(role==='cover'){if(pending){revokePending(d.newCover);d.newCover=null}else d.cover=''}else if(pending){const [item]=d.newImages.splice(index,1);revokePending(item)}else d.images.splice(index,1);renderMediaDraft(kind)}
function removableStoragePath(path){const raw=String(path||'').trim();if(!raw||raw.startsWith('local:')||raw.startsWith('/assets/'))return false;if(/^https?:\/\//i.test(raw))return raw.startsWith(window.EZYGO_CONFIG.SUPABASE_URL);return true}
async function cleanupRemovedMedia(paths){
  const list=[...new Set(paths.filter(removableStoragePath))];
  if(!list.length)return {removed:0};
  const result=await call('delete_media',{paths:list});
  if(result?.failed?.length){
    throw new Error(`Storage cleanup failed for ${result.failed.length} image(s). Click Save again to retry.`);
  }
  return result;
}

async function showAdmin(){ await refresh(); openAdminView(); }
async function login(){
  const entered=$('#loginId').value.trim();
  if(!entered){ setLoginStatus('Please enter the Admin Login ID.','error'); return; }
  adminId=entered;
  setLoginLoading(true); setLoginStatus('Checking…');
  try{
    await call('login');
    await refresh();
    sessionStorage.setItem('ezygo_admin_id',adminId);
    openAdminView();
  }catch(e){
    sessionStorage.removeItem('ezygo_admin_id');
    adminId='';
    setLoginStatus(e.message || 'Unable to log in.','error');
  }finally{ setLoginLoading(false); }
}
async function tryAutoLogin(){
  if(!adminId) return;
  try{ await showAdmin(); }
  catch(e){ sessionStorage.removeItem('ezygo_admin_id'); adminId=''; openLoginView(); setLoginStatus('Please log in again. '+(e.message||''),'error'); }
}
async function refresh(){const j=await call('list');data=j.data;renderAll()}
function renderAll(){renderGroups();renderVisas();renderPackages();renderFeedback()}
function renderGroups(){
  const opts=data.visa_groups.length?data.visa_groups.map(g=>`<option value="${esc(g.name)}">${esc(cleanGroupName(g.name))}</option>`).join(''):'<option value="">Create a visa section first</option>';
  $('#vGroup').innerHTML=opts;
  $('#groupList').innerHTML=data.visa_groups.map((g,i)=>`<div class="orderItem"><div><strong>${esc(cleanGroupName(g.name))}</strong> <span class="badge">${data.visa_cards.filter(v=>v.group_name===g.name).length} cards</span></div><div class="mini"><button class="btn ghost" data-gup="${g.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-gdown="${g.id}" ${i===data.visa_groups.length-1?'disabled':''}>↓</button><button class="btn danger" data-gdel="${g.id}">Delete</button></div></div>`).join('');
}
function renderVisas(){
  const q=($('#visaAdminSearch')?.value||'').trim().toLowerCase();
  const groups=data.visa_groups.length?data.visa_groups.map(g=>g.name):[...new Set(data.visa_cards.map(v=>v.group_name))];
  $('#visaList').innerHTML=groups.map(group=>{const items=data.visa_cards.filter(v=>v.group_name===group&&(!q||[v.country,v.type,v.validity,v.description].join(' ').toLowerCase().includes(q)));if(!items.length)return'';return `<div class="visaAdminGroup"><div class="visaAdminGroupTitle">${esc(cleanGroupName(group))} <span class="badge">${items.length}</span></div>${items.map((v,i)=>`<div class="item"><img loading="lazy" decoding="async" src="${v.cover_path?mediaUrl(v.cover_path):''}"><div><h3>${esc(v.country)}</h3><p>${esc(v.type)}</p><p>${esc(v.validity)}${v.fee?' · '+esc(v.fee):''}</p></div><div class="mini"><button class="btn ghost" data-vup="${v.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-vdown="${v.id}" ${i===items.length-1?'disabled':''}>↓</button><button class="btn ghost" data-vedit="${v.id}">Edit</button><button class="btn danger" data-vdel="${v.id}">Delete</button></div></div>`).join('')}</div>`}).join('')||'<div class="muted">No matching visa cards.</div>';
}
function renderPackages(){const q=($('#packageAdminSearch')?.value||'').trim().toLowerCase();const list=data.packages.filter(p=>!q||[p.title,p.destination,p.duration,p.tag,p.summary].join(' ').toLowerCase().includes(q));$('#packageList').innerHTML=list.map((p,i)=>`<div class="item"><img loading="lazy" decoding="async" src="${p.cover_path?mediaUrl(p.cover_path):''}"><div><h3>${esc(p.title)}</h3><p>${esc(p.destination)} · ${esc(p.duration)}</p></div><div class="mini"><button class="btn ghost" data-pup="${p.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-pdown="${p.id}" ${i===list.length-1?'disabled':''}>↓</button><button class="btn ghost" data-pedit="${p.id}">Edit</button><button class="btn danger" data-pdel="${p.id}">Delete</button></div></div>`).join('')||'<div class="muted">No matching packages.</div>'}
function renderFeedback(){$('#feedbackList').innerHTML=data.feedback.map(f=>`<div class="feedback"><strong>${esc(f.name||'Anonymous')}</strong><small>${esc(f.phone||'No phone')} · ${new Date(f.created_at).toLocaleString()}</small><p>${esc(f.message)}</p><button class="btn danger" data-fdel="${f.id}">Delete</button></div>`).join('')||'<div class="muted">No feedback yet.</div>'}
function resetFileStates(){[['vCoverName','No new image selected'],['vDetailsName','No new images selected'],['pCoverName','No new image selected'],['pImagesName','No new images selected']].forEach(([id,t])=>{const e=$('#'+id);if(e)e.textContent=t})}
function clearVisa(){edit.visa=null;$('#visaFormTitle').textContent='Add visa card';['#vCountry','#vFlag','#vType','#vValidity','#vFee','#vDateLabel','#vDeadline','#vDesc','#vDocs'].forEach(sel=>$(sel).value='');$('#vCover').value='';$('#vDetails').value='';resetFileStates();resetDraft('visa')}
function clearPackage(){edit.package=null;$('#packageFormTitle').textContent='Add package';['#pTitle','#pTag','#pDestination','#pDuration','#pPrice','#pSummary','#pHighlights','#pItinerary','#pInclusions','#pExclusions','#pTerms'].forEach(sel=>$(sel).value='');$('#pCover').value='';$('#pImages').value='';resetFileStates();resetDraft('package')}
async function saveVisa(){const btn=$('#saveVisa'),country=$('#vCountry').value.trim();if(!country)return alert('Add country.');if(!$('#vGroup').value)return alert('Create a visa section first.');setButtonBusy(btn,true);try{const old=data.visa_cards.find(x=>x.id===edit.visa),d=mediaDraft.visa;let cover=d.cover||'',details=[...d.images];if(d.newCover)cover=await upload(d.newCover.file,`visas/${slug(country)}`);if(d.newImages.length)details.push(...await uploadMany(d.newImages.map(x=>x.file),`visas/${slug(country)}/details`));const removed=[];if(old?.cover_path&&old.cover_path!==cover)removed.push(old.cover_path);for(const path of old?.detail_paths||[])if(!details.includes(path))removed.push(path);await call('upsert',{table:'visa_cards',record:{id:edit.visa||slug(country)+'-'+Date.now(),country,flag:$('#vFlag').value.trim(),group_name:$('#vGroup').value,type:$('#vType').value.trim()||'Visa',validity:$('#vValidity').value.trim()||'Check details',fee:$('#vFee').value.trim()||'Contact us',date_label:$('#vDateLabel').value.trim()||'Visa assistance',deadline:$('#vDeadline').value.trim()||'Contact us for current processing details',description:$('#vDesc').value.trim(),documents:lines('#vDocs'),cover_path:cover,detail_paths:details,active:true}});try{await cleanupRemovedMedia(removed)}catch(cleanErr){throw new Error(`Visa was saved, but removed Supabase image cleanup did not finish. ${cleanErr.message}`)}clearVisa();await refresh()}catch(e){alert(e.message||'Could not save visa.')}finally{setButtonBusy(btn,false,'Save visa')}}
async function savePackage(){const btn=$('#savePackage'),title=$('#pTitle').value.trim();if(!title)return alert('Add package title.');setButtonBusy(btn,true);try{const old=data.packages.find(x=>x.id===edit.package),d=mediaDraft.package;let cover=d.cover||'',imgs=[...d.images];if(d.newCover)cover=await upload(d.newCover.file,`packages/${slug(title)}`);if(d.newImages.length)imgs.push(...await uploadMany(d.newImages.map(x=>x.file),`packages/${slug(title)}/gallery`));const removed=[];if(old?.cover_path&&old.cover_path!==cover)removed.push(old.cover_path);for(const path of old?.image_paths||[])if(!imgs.includes(path))removed.push(path);const itinerary=$('#pItinerary').value.split('\n').map((x,i)=>{const [title2,text,meal]=x.split('|').map(a=>a.trim());return x.trim()?{day:i+1,title:title2,text,meal}:null}).filter(Boolean);await call('upsert',{table:'packages',record:{id:edit.package||slug(title)+'-'+Date.now(),title,tag:$('#pTag').value.trim()||'Travel package',destination:$('#pDestination').value.trim(),duration:$('#pDuration').value.trim(),price:$('#pPrice').value.trim()||'Ask for price',summary:$('#pSummary').value.trim(),highlights:lines('#pHighlights'),itinerary,inclusions:lines('#pInclusions'),exclusions:lines('#pExclusions'),terms:lines('#pTerms'),cover_path:cover,image_paths:imgs,active:true}});try{await cleanupRemovedMedia(removed)}catch(cleanErr){throw new Error(`Package was saved, but removed Supabase image cleanup did not finish. ${cleanErr.message}`)}clearPackage();await refresh()}catch(e){alert(e.message||'Could not save package.')}finally{setButtonBusy(btn,false,'Save package')}}
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function reorderVisa(id,dir){const current=data.visa_cards.find(x=>x.id===id);if(!current)return;const arr=data.visa_cards.filter(x=>x.group_name===current.group_name);const i=arr.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];await call('reorder',{table:'visa_cards',ids:arr.map(x=>x.id)});await refresh()}
async function reorder(table,id,dir){const arr=[...data[table]];const i=arr.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];await call('reorder',{table,ids:arr.map(x=>x.id)});await refresh()}
function editVisa(id){const v=data.visa_cards.find(x=>x.id===id);if(!v)return;edit.visa=id;$('#visaFormTitle').textContent='Edit visa card';$('#vCountry').value=v.country||'';$('#vFlag').value=v.flag||'';$('#vGroup').value=v.group_name||'';$('#vType').value=v.type||'';$('#vValidity').value=v.validity||'';$('#vFee').value=v.fee||'';$('#vDateLabel').value=v.date_label||'';$('#vDeadline').value=v.deadline||'';$('#vDesc').value=v.description||'';$('#vDocs').value=(v.documents||[]).join('\n');resetDraft('visa',v.cover_path,v.detail_paths);scrollTo({top:0,behavior:'smooth'})}
function editPackage(id){const p=data.packages.find(x=>x.id===id);if(!p)return;edit.package=id;$('#packageFormTitle').textContent='Edit package';$('#pTitle').value=p.title||'';$('#pTag').value=p.tag||'';$('#pDestination').value=p.destination||'';$('#pDuration').value=p.duration||'';$('#pPrice').value=p.price||'';$('#pSummary').value=p.summary||'';$('#pHighlights').value=(p.highlights||[]).join('\n');$('#pItinerary').value=(p.itinerary||[]).map(x=>`${x.title||''} | ${x.text||''} | ${x.meal||''}`).join('\n');$('#pInclusions').value=(p.inclusions||[]).join('\n');$('#pExclusions').value=(p.exclusions||[]).join('\n');$('#pTerms').value=(p.terms||[]).join('\n');resetDraft('package',p.cover_path,p.image_paths);scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault()});
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mediaKind){removeDraftMedia(b.dataset.mediaKind,b.dataset.mediaRole,Number(b.dataset.mediaIndex||0),b.dataset.mediaPending==='1');return;}for(const [attr,fn] of [['vup',()=>reorderVisa(b.dataset.vup,-1)],['vdown',()=>reorderVisa(b.dataset.vdown,1)],['pup',()=>reorder('packages',b.dataset.pup,-1)],['pdown',()=>reorder('packages',b.dataset.pdown,1)],['gup',()=>reorder('visa_groups',b.dataset.gup,-1)],['gdown',()=>reorder('visa_groups',b.dataset.gdown,1)]])if(b.dataset[attr]!==undefined)return fn();if(b.dataset.vedit)return editVisa(b.dataset.vedit);if(b.dataset.pedit)return editPackage(b.dataset.pedit);for(const [attr,table] of [['vdel','visa_cards'],['pdel','packages'],['gdel','visa_groups'],['fdel','feedback']])if(b.dataset[attr]){if(confirm('Delete this item?')){await call('delete',{table,id:b.dataset[attr]});await refresh()}return}});

$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});
$('#loginBtn').onclick=login;$('#loginId').onkeydown=e=>{if(e.key==='Enter')login()};$('#logoutBtn').onclick=()=>{sessionStorage.clear();location.reload()};$('#saveVisa').onclick=saveVisa;$('#clearVisa').onclick=clearVisa;$('#savePackage').onclick=savePackage;$('#clearPackage').onclick=clearPackage;$('#addGroup').onclick=async()=>{const name=cleanGroupName($('#newGroup').value.trim());if(!name)return;await call('upsert',{table:'visa_groups',record:{id:slug(name)+'-'+Date.now(),name,active:true}});$('#newGroup').value='';await refresh()};
const visaSearch=$('#visaAdminSearch');if(visaSearch)visaSearch.oninput=renderVisas;
const packageSearch=$('#packageAdminSearch');if(packageSearch)packageSearch.oninput=renderPackages;
[['vCover','visa'],['pCover','package']].forEach(([input,kind])=>{const el=$('#'+input);if(el)el.onchange=()=>{const file=el.files[0];if(file)addPendingCover(kind,file);el.value=''}});
[['vDetails','visa'],['pImages','package']].forEach(([input,kind])=>{const el=$('#'+input);if(el)el.onchange=()=>{if(el.files.length)addPendingImages(kind,[...el.files]);el.value=''}});
resetDraft('visa');resetDraft('package');
tryAutoLogin();
})();