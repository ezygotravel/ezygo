(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let adminId=sessionStorage.getItem('ezygo_admin_id')||'';
let data={visa_groups:[],visa_cards:[],packages:[],galleries:[],feedback:[]};
let edit={visa:null,package:null,gallery:null};
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
async function fileData(file){if(!file)return null;const img=await new Promise((res,rej)=>{const i=new Image;i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)});let w=img.width,h=img.height,max=1600;if(Math.max(w,h)>max){const s=max/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s)}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);return c.toDataURL('image/jpeg',.84)}
async function upload(file,folder){if(!file)return'';const dataUrl=await fileData(file);return (await call('upload',{folder,name:file.name,dataUrl})).path}
async function uploadMany(files,folder){const out=[];for(const f of files)out.push(await upload(f,folder));return out}
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
function renderAll(){renderGroups();renderVisas();renderPackages();renderGallery();renderFeedback()}
function renderGroups(){
  const opts=data.visa_groups.length?data.visa_groups.map(g=>`<option value="${esc(g.name)}">${esc(cleanGroupName(g.name))}</option>`).join(''):'<option value="">Create a visa section first</option>';
  $('#vGroup').innerHTML=opts;
  $('#groupList').innerHTML=data.visa_groups.map((g,i)=>`<div class="orderItem"><div><strong>${esc(cleanGroupName(g.name))}</strong> <span class="badge">${data.visa_cards.filter(v=>v.group_name===g.name).length} cards</span></div><div class="mini"><button class="btn ghost" data-gup="${g.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-gdown="${g.id}" ${i===data.visa_groups.length-1?'disabled':''}>↓</button><button class="btn danger" data-gdel="${g.id}">Delete</button></div></div>`).join('');
}
function renderVisas(){
  const q=($('#visaAdminSearch')?.value||'').trim().toLowerCase();
  const groups=data.visa_groups.length?data.visa_groups.map(g=>g.name):[...new Set(data.visa_cards.map(v=>v.group_name))];
  $('#visaList').innerHTML=groups.map(group=>{const items=data.visa_cards.filter(v=>v.group_name===group&&(!q||[v.country,v.type,v.validity,v.description].join(' ').toLowerCase().includes(q)));if(!items.length)return'';return `<div class="visaAdminGroup"><div class="visaAdminGroupTitle">${esc(cleanGroupName(group))} <span class="badge">${items.length}</span></div>${items.map((v,i)=>`<div class="item"><img src="${v.cover_path?mediaUrl(v.cover_path):''}"><div><h3>${esc(v.country)}</h3><p>${esc(v.type)}</p><p>${esc(v.validity)}${v.fee?' · '+esc(v.fee):''}</p></div><div class="mini"><button class="btn ghost" data-vup="${v.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-vdown="${v.id}" ${i===items.length-1?'disabled':''}>↓</button><button class="btn ghost" data-vedit="${v.id}">Edit</button><button class="btn danger" data-vdel="${v.id}">Delete</button></div></div>`).join('')}</div>`}).join('')||'<div class="muted">No matching visa cards.</div>';
}
function renderPackages(){const q=($('#packageAdminSearch')?.value||'').trim().toLowerCase();const list=data.packages.filter(p=>!q||[p.title,p.destination,p.duration,p.tag,p.summary].join(' ').toLowerCase().includes(q));$('#packageList').innerHTML=list.map((p,i)=>`<div class="item"><img src="${p.cover_path?mediaUrl(p.cover_path):''}"><div><h3>${esc(p.title)}</h3><p>${esc(p.destination)} · ${esc(p.duration)}</p></div><div class="mini"><button class="btn ghost" data-pup="${p.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-pdown="${p.id}" ${i===list.length-1?'disabled':''}>↓</button><button class="btn ghost" data-pedit="${p.id}">Edit</button><button class="btn danger" data-pdel="${p.id}">Delete</button></div></div>`).join('')||'<div class="muted">No matching packages.</div>'}
function renderGallery(){const q=($('#galleryAdminSearch')?.value||'').trim().toLowerCase();const list=data.galleries.filter(g=>!q||[g.title,g.description].join(' ').toLowerCase().includes(q));$('#galleryList').innerHTML=list.map((g,i)=>`<div class="item"><img src="${g.cover_path?mediaUrl(g.cover_path):''}"><div><h3>${esc(g.title)}</h3><p>${esc(g.description||'')}</p></div><div class="mini"><button class="btn ghost" data-aup="${g.id}" ${i===0?'disabled':''}>↑</button><button class="btn ghost" data-adown="${g.id}" ${i===list.length-1?'disabled':''}>↓</button><button class="btn ghost" data-aedit="${g.id}">Edit</button><button class="btn danger" data-adel="${g.id}">Delete</button></div></div>`).join('')||'<div class="muted">No matching gallery items.</div>'}
function renderFeedback(){$('#feedbackList').innerHTML=data.feedback.map(f=>`<div class="feedback"><strong>${esc(f.name||'Anonymous')}</strong><small>${esc(f.phone||'No phone')} · ${new Date(f.created_at).toLocaleString()}</small><p>${esc(f.message)}</p><button class="btn danger" data-fdel="${f.id}">Delete</button></div>`).join('')||'<div class="muted">No feedback yet.</div>'}
function resetFileStates(){[['vCoverName','No new image selected'],['vDetailsName','No new images selected'],['pCoverName','No new image selected'],['pImagesName','No new images selected'],['gCoverName','No new image selected'],['gImagesName','No new images selected']].forEach(([id,t])=>{const e=$('#'+id);if(e)e.textContent=t})}
function clearVisa(){edit.visa=null;$('#visaFormTitle').textContent='Add visa card';['#vCountry','#vFlag','#vType','#vValidity','#vFee','#vDateLabel','#vDeadline','#vDesc','#vDocs'].forEach(s=>$(s).value='');$('#vCover').value='';$('#vDetails').value='';resetFileStates()}
function clearPackage(){edit.package=null;$('#packageFormTitle').textContent='Add package';['#pTitle','#pTag','#pDestination','#pDuration','#pPrice','#pSummary','#pHighlights','#pItinerary','#pInclusions','#pExclusions','#pTerms'].forEach(s=>$(s).value='');$('#pCover').value='';$('#pImages').value='';resetFileStates()}
function clearGallery(){edit.gallery=null;$('#galleryFormTitle').textContent='Add gallery';['#gTitle','#gDesc'].forEach(s=>$(s).value='');$('#gCover').value='';$('#gImages').value='';resetFileStates()}
async function saveVisa(){const btn=$('#saveVisa'),country=$('#vCountry').value.trim();if(!country)return alert('Add country.');if(!$('#vGroup').value)return alert('Create a visa section first.');setButtonBusy(btn,true);try{const old=data.visa_cards.find(x=>x.id===edit.visa);let cover=old?.cover_path||'',details=[...(old?.detail_paths||[])];if($('#vCover').files[0])cover=await upload($('#vCover').files[0],`visas/${slug(country)}`);if($('#vDetails').files.length)details.push(...await uploadMany($('#vDetails').files,`visas/${slug(country)}/details`));await call('upsert',{table:'visa_cards',record:{id:edit.visa||slug(country)+'-'+Date.now(),country,flag:$('#vFlag').value.trim(),group_name:$('#vGroup').value,type:$('#vType').value.trim()||'Visa',validity:$('#vValidity').value.trim()||'Check details',fee:$('#vFee').value.trim()||'Contact us',date_label:$('#vDateLabel').value.trim()||'Visa assistance',deadline:$('#vDeadline').value.trim()||'Contact us for current processing details',description:$('#vDesc').value.trim(),documents:lines('#vDocs'),cover_path:cover,detail_paths:details,active:true}});clearVisa();await refresh()}catch(e){alert(e.message||'Could not save visa.')}finally{setButtonBusy(btn,false,'Save visa')}}
async function savePackage(){const btn=$('#savePackage'),title=$('#pTitle').value.trim();if(!title)return alert('Add package title.');setButtonBusy(btn,true);try{const old=data.packages.find(x=>x.id===edit.package);let cover=old?.cover_path||'',imgs=[...(old?.image_paths||[])];if($('#pCover').files[0])cover=await upload($('#pCover').files[0],`packages/${slug(title)}`);if($('#pImages').files.length)imgs.push(...await uploadMany($('#pImages').files,`packages/${slug(title)}/gallery`));const itinerary=$('#pItinerary').value.split('\n').map((x,i)=>{const [title2,text,meal]=x.split('|').map(a=>a.trim());return x.trim()?{day:i+1,title:title2,text,meal}:null}).filter(Boolean);await call('upsert',{table:'packages',record:{id:edit.package||slug(title)+'-'+Date.now(),title,tag:$('#pTag').value.trim()||'Travel package',destination:$('#pDestination').value.trim(),duration:$('#pDuration').value.trim(),price:$('#pPrice').value.trim()||'Ask for price',summary:$('#pSummary').value.trim(),highlights:lines('#pHighlights'),itinerary,inclusions:lines('#pInclusions'),exclusions:lines('#pExclusions'),terms:lines('#pTerms'),cover_path:cover,image_paths:imgs,active:true}});clearPackage();await refresh()}catch(e){alert(e.message||'Could not save package.')}finally{setButtonBusy(btn,false,'Save package')}}
async function saveGallery(){const btn=$('#saveGallery'),title=$('#gTitle').value.trim();if(!title)return alert('Add gallery title.');setButtonBusy(btn,true);try{const old=data.galleries.find(x=>x.id===edit.gallery);let cover=old?.cover_path||'',imgs=[...(old?.image_paths||[])];if($('#gCover').files[0])cover=await upload($('#gCover').files[0],`galleries/${slug(title)}`);if($('#gImages').files.length)imgs.push(...await uploadMany($('#gImages').files,`galleries/${slug(title)}/images`));await call('upsert',{table:'galleries',record:{id:edit.gallery||slug(title)+'-'+Date.now(),title,description:$('#gDesc').value.trim(),cover_path:cover,image_paths:imgs,active:true}});clearGallery();await refresh()}catch(e){alert(e.message||'Could not save gallery.')}finally{setButtonBusy(btn,false,'Save gallery')}}
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function reorderVisa(id,dir){const current=data.visa_cards.find(x=>x.id===id);if(!current)return;const arr=data.visa_cards.filter(x=>x.group_name===current.group_name);const i=arr.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];await call('reorder',{table:'visa_cards',ids:arr.map(x=>x.id)});await refresh()}
async function reorder(table,id,dir){const arr=[...data[table]];const i=arr.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];await call('reorder',{table,ids:arr.map(x=>x.id)});await refresh()}
function editVisa(id){const v=data.visa_cards.find(x=>x.id===id);edit.visa=id;$('#visaFormTitle').textContent='Edit visa card';$('#vCountry').value=v.country||'';$('#vFlag').value=v.flag||'';$('#vGroup').value=v.group_name||'';$('#vType').value=v.type||'';$('#vValidity').value=v.validity||'';$('#vFee').value=v.fee||'';$('#vDateLabel').value=v.date_label||'';$('#vDeadline').value=v.deadline||'';$('#vDesc').value=v.description||'';$('#vDocs').value=(v.documents||[]).join('\n');const s=$('#vDetailsName');if(s)s.textContent=`${(v.detail_paths||[]).length} existing image(s) · new images will be added`;scrollTo({top:0,behavior:'smooth'})}
function editPackage(id){const p=data.packages.find(x=>x.id===id);edit.package=id;$('#packageFormTitle').textContent='Edit package';$('#pTitle').value=p.title||'';$('#pTag').value=p.tag||'';$('#pDestination').value=p.destination||'';$('#pDuration').value=p.duration||'';$('#pPrice').value=p.price||'';$('#pSummary').value=p.summary||'';$('#pHighlights').value=(p.highlights||[]).join('\n');$('#pItinerary').value=(p.itinerary||[]).map(x=>`${x.title||''} | ${x.text||''} | ${x.meal||''}`).join('\n');$('#pInclusions').value=(p.inclusions||[]).join('\n');$('#pExclusions').value=(p.exclusions||[]).join('\n');$('#pTerms').value=(p.terms||[]).join('\n');const s=$('#pImagesName');if(s)s.textContent=`${(p.image_paths||[]).length} existing image(s) · new images will be added`;scrollTo({top:0,behavior:'smooth'})}
function editGallery(id){const g=data.galleries.find(x=>x.id===id);edit.gallery=id;$('#galleryFormTitle').textContent='Edit gallery';$('#gTitle').value=g.title||'';$('#gDesc').value=g.description||'';const s=$('#gImagesName');if(s)s.textContent=`${(g.image_paths||[]).length} existing image(s) · new images will be added`;scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault()});
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;for(const [attr,fn] of [['vup',()=>reorderVisa(b.dataset.vup,-1)],['vdown',()=>reorderVisa(b.dataset.vdown,1)],['pup',()=>reorder('packages',b.dataset.pup,-1)],['pdown',()=>reorder('packages',b.dataset.pdown,1)],['aup',()=>reorder('galleries',b.dataset.aup,-1)],['adown',()=>reorder('galleries',b.dataset.adown,1)],['gup',()=>reorder('visa_groups',b.dataset.gup,-1)],['gdown',()=>reorder('visa_groups',b.dataset.gdown,1)]])if(b.dataset[attr]!==undefined)return fn();if(b.dataset.vedit)return editVisa(b.dataset.vedit);if(b.dataset.pedit)return editPackage(b.dataset.pedit);if(b.dataset.aedit)return editGallery(b.dataset.aedit);for(const [attr,table] of [['vdel','visa_cards'],['pdel','packages'],['adel','galleries'],['gdel','visa_groups'],['fdel','feedback']])if(b.dataset[attr]){if(confirm('Delete this item?')){await call('delete',{table,id:b.dataset[attr]});await refresh()}return}});

$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});
$('#loginBtn').onclick=login;$('#loginId').onkeydown=e=>{if(e.key==='Enter')login()};$('#logoutBtn').onclick=()=>{sessionStorage.clear();location.reload()};$('#saveVisa').onclick=saveVisa;$('#clearVisa').onclick=clearVisa;$('#savePackage').onclick=savePackage;$('#clearPackage').onclick=clearPackage;$('#saveGallery').onclick=saveGallery;$('#clearGallery').onclick=clearGallery;$('#addGroup').onclick=async()=>{const name=cleanGroupName($('#newGroup').value.trim());if(!name)return;await call('upsert',{table:'visa_groups',record:{id:slug(name)+'-'+Date.now(),name,active:true}});$('#newGroup').value='';await refresh()};
const visaSearch=$('#visaAdminSearch');if(visaSearch)visaSearch.oninput=renderVisas;
const packageSearch=$('#packageAdminSearch');if(packageSearch)packageSearch.oninput=renderPackages;
const gallerySearch=$('#galleryAdminSearch');if(gallerySearch)gallerySearch.oninput=renderGallery;
[['vCover','vCoverName'],['vDetails','vDetailsName'],['pCover','pCoverName'],['pImages','pImagesName'],['gCover','gCoverName'],['gImages','gImagesName']].forEach(([input,state])=>{const el=$('#'+input);if(el)el.onchange=()=>updateFileState(input,state)});
tryAutoLogin();
})();