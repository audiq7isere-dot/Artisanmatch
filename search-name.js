(()=>{
function setupNameSearch(){
 const postal=document.getElementById('filterDepartment');
 if(!postal||document.getElementById('filterName'))return;
 const wrap=document.createElement('div');
 wrap.innerHTML='<label>Nom ou pseudo</label><input id="filterName" class="input" type="search" placeholder="Ex. Mbappé, Karim…" autocomplete="off">';
 postal.parentElement?.insertAdjacentElement('beforebegin',wrap);
 const btn=document.getElementById('applyFilters'),reset=document.getElementById('resetFilters');
 async function search(){
  const name=document.getElementById('filterName')?.value.trim()||'';
  const cp=postal.value.trim(),pos=document.getElementById('filterPosition')?.value||'',cat=document.getElementById('filterCategory')?.value||'';
  let q=sb.from('profiles').select('id,full_name,username,avatar_url,position,category,postal_code,city').eq('account_type','player').order('full_name',{ascending:true});
  if(name)q=q.or(`full_name.ilike.%${name.replace(/[%_,()]/g,'')}%,username.ilike.%${name.replace(/[%_,()]/g,'')}%`);
  if(cp)q=q.eq('postal_code',cp);if(pos)q=q.eq('position',pos);if(cat)q=q.eq('category',cat);
  const {data,error}=await q.limit(250),root=document.getElementById('playersList');if(!root)return;
  if(error){root.innerHTML='<div class="panel">Erreur de recherche.</div>';return}
  if(!data?.length){root.innerHTML='<div class="panel">Aucun joueur trouvé.</div>';return}
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const media=(bucket,path)=>path?sb.storage.from(bucket).getPublicUrl(path).data.publicUrl:'';
  root.innerHTML=data.map(x=>`<div class="player-row" data-id="${x.id}" onclick="openPlayer('${x.id}')"><div class="player-name"><img class="mini-avatar" src="${esc(media('avatars',x.avatar_url))}" onerror="this.style.visibility='hidden'"><span>${esc(x.full_name||x.username||'Joueur')}</span></div><div>${esc(x.position||'—')}</div><div>${esc(x.category||'—')}</div><div class="arrow">›</div></div>`).join('');
 }
 if(btn)btn.onclick=search;
 document.getElementById('filterName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search()}});
 if(reset)reset.addEventListener('click',()=>{document.getElementById('filterName').value=''});
}
document.addEventListener('DOMContentLoaded',()=>{setTimeout(setupNameSearch,1800);const s=document.createElement('script');s.src='/footshow-music-library.js';document.body.appendChild(s)});
})();