(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid=()=>window.user?.id||(typeof user!=='undefined'?user?.id:null);
const media=(bucket,path)=>path?sb.storage.from(bucket).getPublicUrl(path).data.publicUrl:'';
function ensureDrawer(id,title,max='620px'){
 let d=$(id);if(d)return d;
 d=document.createElement('section');d.id=id;d.className='drawer hidden';
 d.innerHTML=`<div class="drawer-inner" style="max-width:${max}"><button class="close" data-close-${id}>×</button><div class="fs-v2-kicker">FOOTSHOW</div><h2>${title}</h2><div id="${id}Content"></div></div>`;
 document.body.appendChild(d);d.querySelector(`[data-close-${id}]`).onclick=()=>d.classList.add('hidden');return d;
}
async function openFeed(){
 const d=ensureDrawer('feedV2Drawer','📹 Feed','520px'),root=$('feedV2DrawerContent');d.classList.remove('hidden');root.innerHTML='<div class="msg">Chargement du feed…</div>';
 const {data,error}=await sb.from('videos').select('id,user_id,storage_path,action_type,caption,created_at,profiles:user_id(full_name,username,position,category),likes(user_id),comments(id)').order('created_at',{ascending:false}).limit(40);
 if(error){root.innerHTML=`<div class="msg">${esc(error.message)}</div>`;return}
 root.innerHTML=`<style>.feedv2{display:grid;gap:10px}.feedv2-card{background:#000;border-radius:18px;overflow:hidden;border:1px solid #244633}.feedv2-card video{width:100%;max-height:68vh;background:#000;display:block}.feedv2-meta{padding:12px}.feedv2-actions{display:flex;gap:8px;margin-top:9px}.feedv2-actions button{flex:1}</style><div class="feedv2">${(data||[]).map(v=>{const p=v.profiles||{},liked=(v.likes||[]).some(x=>x.user_id===uid());return `<article class="feedv2-card"><video controls playsinline preload="metadata" src="${esc(media('footshow-videos',v.storage_path))}"></video><div class="feedv2-meta"><b>${esc(p.full_name||p.username||'Joueur')}</b><div class="msg">${esc([p.position,p.category].filter(Boolean).join(' · '))}</div><div>${esc(v.caption||v.action_type||'Action')}</div><div class="feedv2-actions"><button class="secondary" data-fv-like="${v.id}" data-liked="${liked?'1':'0'}">${liked?'❤️':'♡'} ${(v.likes||[]).length}</button><button class="secondary" data-fv-profile="${v.user_id}">👤 Profil</button><button class="secondary" data-fv-comment="${v.id}">💬 ${(v.comments||[]).length}</button></div></div></article>`}).join('')||'<div class="msg">Aucune vidéo publiée.</div>'}</div>`;
 root.querySelectorAll('[data-fv-profile]').forEach(b=>b.onclick=()=>{d.classList.add('hidden');window.openPlayer?.(b.dataset.fvProfile)});
 root.querySelectorAll('[data-fv-comment]').forEach(b=>b.onclick=()=>window.commentOn?.(b.dataset.fvComment));
 root.querySelectorAll('[data-fv-like]').forEach(b=>b.onclick=async()=>{const liked=b.dataset.liked==='1',id=b.dataset.fvLike;const r=liked?await sb.from('likes').delete().eq('video_id',id).eq('user_id',uid()):await sb.from('likes').insert({video_id:id,user_id:uid()});if(!r.error){b.dataset.liked=liked?'0':'1';openFeed();window.loadGlobalRanking?.()}});
}
async function openStats(){
 const d=ensureDrawer('statsV2Drawer','📊 Mes statistiques','650px'),root=$('statsV2DrawerContent');d.classList.remove('hidden');root.innerHTML='<div class="msg">Calcul de tes statistiques…</div>';
 try{const {data,error}=await sb.rpc('get_player_stats',{p_user_id:uid()});if(error)throw error;const s=data?.[0]||{};root.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="panel"><div class="msg">Points</div><b style="font-size:30px;color:#4ade80">${s.total_points||0}</b></div><div class="panel"><div class="msg">Classement global</div><b style="font-size:30px">#${s.global_rank||'—'}</b></div><div class="panel"><div class="msg">Classement ${esc(s.category||'catégorie')}</div><b style="font-size:30px">#${s.category_rank||'—'}</b></div><div class="panel"><div class="msg">Classement zone</div><b style="font-size:30px">#${s.zone_rank||'—'}</b></div><div class="panel"><div class="msg">Vues vidéos</div><b style="font-size:30px">${s.total_views||0}</b></div><div class="panel"><div class="msg">Likes reçus</div><b style="font-size:30px">${s.total_likes||0}</b></div></div><div class="panel" style="margin-top:10px"><b>🎬 ${s.video_count||0} vidéos</b><div class="msg">🔥 ${s.daily_count||0} défis · 🏆 ${s.contest_count||0} concours · 🧠 ${s.quiz_points||0} pts quiz · 🎮 ${s.game_points||0} pts jeu</div></div>`;}catch(e){root.innerHTML=`<div class="msg">Impossible de charger les statistiques : ${esc(e.message||'erreur')}</div>`}
}
async function openInbox(){
 const d=$('messagesDrawer');if(!d)return;d.classList.remove('hidden');const root=$('conversationsList');if(!root)return;root.innerHTML='<p class="msg">Chargement…</p>';
 const me=uid();if(!me){root.innerHTML='<p class="msg">Reconnecte-toi pour voir tes messages.</p>';return}
 const {data,error}=await sb.from('messages').select('*').or(`sender_id.eq.${me},receiver_id.eq.${me}`).order('created_at',{ascending:false}).limit(500);
 if(error){root.innerHTML=`<p class="msg">${esc(error.message)}</p>`;return}
 const by=new Map();for(const m of data||[]){const other=m.sender_id===me?m.receiver_id:m.sender_id;if(!by.has(other))by.set(other,{last:m,unread:0});if(m.receiver_id===me&&!m.read_at)by.get(other).unread++}
 if(!by.size){root.innerHTML='<div class="msg" style="padding:30px;text-align:center">Aucun message pour le moment.</div>';return}
 const ids=[...by.keys()];const {data:profiles}=await sb.from('profiles').select('id,full_name,username,avatar_url,position,category').in('id',ids);const pm=new Map((profiles||[]).map(p=>[p.id,p]));
 root.innerHTML=ids.map(id=>{const c=by.get(id),p=pm.get(id);return `<button data-v2-chat="${id}" style="width:100%;display:flex;gap:12px;align-items:center;text-align:left;background:#0d1b14;border:1px solid #20372a;color:#fff;border-radius:15px;padding:12px;margin:8px 0"><img src="${esc(media('avatars',p?.avatar_url))}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;background:#203329" onerror="this.style.visibility='hidden'"><div style="flex:1;min-width:0"><b>${esc(p?.full_name||p?.username||'Membre')}</b><div class="msg" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.last.body)}</div></div>${c.unread?`<span class="badge">${c.unread}</span>`:''}</button>`}).join('');
 root.querySelectorAll('[data-v2-chat]').forEach(b=>b.onclick=()=>{d.classList.add('hidden');window.openFootShowConversation?.(b.dataset.v2Chat)});
}
window.openFootShowFeedV2=openFeed;window.openFootShowStatsV2=openStats;window.openFootShowInboxV2=openInbox;
document.addEventListener('click',e=>{
  if(e.target.closest('#openFeedV2')){e.preventDefault();openFeed();}
  if(e.target.closest('#openMessagesV2')){e.preventDefault();openInbox();}
  if(e.target.closest('#openStatsV2')){e.preventDefault();openStats();}
});
// Intercepte la déconnexion avant l'ancien gestionnaire qui rechargeait la page.
document.addEventListener('click',async e=>{
 const btn=e.target.closest('#logoutBtn');
 if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();
 try{await sb.auth.signOut()}catch(_){ }
 try{user=null;me=null;selectedPlayer=null}catch(_){ }
 document.querySelectorAll('.drawer').forEach(d=>d.classList.add('hidden'));
 document.getElementById('profilePane')?.classList.remove('open');
 document.getElementById('app')?.classList.add('hidden');
 document.getElementById('bottomNav')?.classList.add('hidden');
 const auth=document.getElementById('auth');if(auth)auth.classList.remove('hidden');
 document.getElementById('loginForm')?.classList.remove('hidden');
 document.getElementById('signupForm')?.classList.add('hidden');
 document.getElementById('loginTab')?.classList.add('active');
 document.getElementById('signupTab')?.classList.remove('active');
 const msg=document.getElementById('authMsg');if(msg)msg.textContent='';
 window.scrollTo({top:0,behavior:'auto'});
},true);
})();