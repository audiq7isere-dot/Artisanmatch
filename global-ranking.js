(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function loadGlobalRanking(){
  const root=document.getElementById('globalRanking');
  const mine=document.getElementById('myGlobalPoints');
  if(!root)return;
  root.innerHTML='<div class="msg">Calcul du classement…</div>';
  try{
    const {data,error}=await sb.rpc('get_global_ranking');
    if(error)throw error;
    const rows=data||[];
    if(!rows.length){root.innerHTML='<div class="msg">Le classement commencera dès les premiers points.</div>';return;}
    const uid=window.user?.id||(typeof user!=='undefined'?user?.id:null);
    const my=rows.find(r=>r.user_id===uid);
    if(mine)mine.innerHTML=my?`<b style="font-size:30px;color:#4ade80">${my.total_points}</b><span style="font-size:11px;color:#9fb0a4"> pts · #${rows.indexOf(my)+1}</span>`:'<b>0 pt</b>';
    root.innerHTML=rows.slice(0,30).map((r,i)=>`<div class="global-rank-row" style="display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center;padding:11px 2px;border-bottom:1px solid #ffffff12"><div style="font-size:19px;text-align:center">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div><div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.full_name||r.username||'Joueur')}</b><span style="font-size:10px;color:#8fa297">🎬 ${r.video_points||0} · ❤️ ${r.like_points||0} · 🏆 ${r.contest_points||0} · 🔥 ${r.daily_points||0} · 🧠 ${r.quiz_points||0} · 🎮 ${r.game_points||0}</span></div><b style="color:#4ade80;font-size:17px">${r.total_points} pts</b></div>`).join('');
  }catch(e){root.innerHTML='<div class="msg">Classement global en attente de l’activation Supabase.</div>';if(mine)mine.innerHTML='<b>—</b>';}
}
window.loadGlobalRanking=loadGlobalRanking;

function setupMobileV2(){
  if(document.body.dataset.navV2==='1')return;
  const nav=document.getElementById('bottomNav'),left=document.querySelector('.leftcol'),filters=document.querySelector('.filters'),ranking=document.querySelector('.global-rank-card');
  if(!nav||!left||!filters||!ranking)return;
  document.body.dataset.navV2='1';
  const homeBtn=nav.querySelector('[data-view="home"]'),contestsBtn=document.getElementById('contestsNav'),profileBtn=nav.querySelector('[data-view="profile"]'),logoutBtn=document.getElementById('logoutBtn');
  const searchDrawer=document.createElement('section');searchDrawer.id='searchDrawer';searchDrawer.className='drawer hidden';searchDrawer.innerHTML='<div class="drawer-inner fs-v2-sheet"><button id="closeSearchV2" class="close">×</button><div class="fs-v2-kicker">RECHERCHE JOUEURS</div><h2>🔎 Trouver un talent</h2><p class="msg">Filtre par nom, code postal, poste et catégorie.</p><div id="searchFormSlot"></div></div>';document.body.appendChild(searchDrawer);searchDrawer.querySelector('#searchFormSlot').appendChild(filters);filters.querySelector('h2')?.remove();
  const rankDrawer=document.createElement('section');rankDrawer.id='rankDrawer';rankDrawer.className='drawer hidden';rankDrawer.innerHTML='<div class="drawer-inner fs-v2-sheet"><button id="closeRankV2" class="close">×</button><div class="fs-v2-kicker">FOOTSHOW LEAGUE</div><h2>🥇 Classement</h2><div id="rankSlot"></div></div>';document.body.appendChild(rankDrawer);rankDrawer.querySelector('#rankSlot').appendChild(ranking);
  const hero=document.createElement('div');hero.className='fs-v2-home';hero.innerHTML=`<div class="fs-v2-welcome"><div><div class="fs-v2-kicker">FOOTSHOW</div><h1>Montre ton talent.</h1><p>Publie tes actions, relève les défis et grimpe au classement.</p></div><div class="fs-v2-ball">⚽</div></div><div class="fs-v2-actions"><button id="openSearchV2"><span>🔎</span><b>Rechercher</b><small>Trouver un joueur</small></button><button id="openFeedV2"><span>📹</span><b>Feed</b><small>Meilleures actions</small></button><button id="openQuizV2"><span>🧠</span><b>Quiz</b><small>Teste-toi</small></button><button id="openGameV2"><span>🎮</span><b>Arcade</b><small>Jeux 3D</small></button><button id="openMessagesV2"><span>💬</span><b>Messages</b><small>Discussions privées</small></button><button id="openStatsV2"><span>📊</span><b>Mes stats</b><small>Ta progression</small></button></div>`;left.prepend(hero);
  const publishBtn=document.createElement('button');publishBtn.id='publishV2';publishBtn.className='nav fs-publish-nav';publishBtn.innerHTML='<span>＋</span><small>Publier</small>';
  const rankBtn=document.createElement('button');rankBtn.id='rankV2';rankBtn.className='nav';rankBtn.innerHTML='🥇<small>Classement</small>';
  nav.replaceChildren();if(homeBtn){homeBtn.innerHTML='⌂<small>Accueil</small>';nav.appendChild(homeBtn)}if(contestsBtn){contestsBtn.innerHTML='🏆<small>Concours</small>';nav.appendChild(contestsBtn)}nav.appendChild(publishBtn,rankBtn);if(profileBtn){profileBtn.innerHTML='👤<small>Profil</small>';nav.appendChild(profileBtn)}
  if(logoutBtn){logoutBtn.className='secondary full fs-profile-logout';logoutBtn.innerHTML='↪ Se déconnecter';document.querySelector('#myProfile .drawer-inner')?.appendChild(logoutBtn)}
  const openSearch=()=>{searchDrawer.classList.remove('hidden');setTimeout(()=>document.getElementById('filterName')?.focus()||document.getElementById('filterDepartment')?.focus(),250)};const openRank=()=>{rankDrawer.classList.remove('hidden');loadGlobalRanking()};
  document.getElementById('openSearchV2').onclick=openSearch;document.getElementById('closeSearchV2').onclick=()=>searchDrawer.classList.add('hidden');document.getElementById('closeRankV2').onclick=()=>rankDrawer.classList.add('hidden');rankBtn.onclick=openRank;
  publishBtn.onclick=()=>{profileBtn?.click();setTimeout(()=>{const el=document.getElementById('actionFile');el?.scrollIntoView({behavior:'smooth',block:'center'});el?.focus()},350)};
  document.getElementById('applyFilters')?.addEventListener('click',()=>{searchDrawer.classList.add('hidden');setTimeout(()=>document.getElementById('playersList')?.scrollIntoView({behavior:'smooth',block:'start'}),120)});
  document.getElementById('openQuizV2').onclick=()=>document.getElementById('homeQuizBtn')?.click();document.getElementById('openGameV2').onclick=()=>document.getElementById('homeGameBtn')?.click();
  ['homeContestBtn','homeQuizBtn','homeGameBtn'].forEach(id=>{const b=document.getElementById(id);if(b)b.closest('.panel')?.classList.add('fs-v2-secondary-card')});
  const css=document.createElement('style');css.textContent=`.fs-v2-home{margin-bottom:14px}.fs-v2-welcome{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:22px;border:1px solid #245a3a;border-radius:25px;background:radial-gradient(circle at 92% 10%,#3cef8760,transparent 32%),linear-gradient(145deg,#102b1b,#07120d);box-shadow:0 18px 45px #0007}.fs-v2-welcome h1{margin:3px 0 7px;font-size:31px;letter-spacing:-1.3px}.fs-v2-welcome p{margin:0;color:#a9bcb0;font-size:13px;line-height:1.45}.fs-v2-kicker{font-size:10px;letter-spacing:1.8px;font-weight:950;color:#4ade80}.fs-v2-ball{font-size:52px;filter:drop-shadow(0 10px 18px #0009)}.fs-v2-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:10px}.fs-v2-actions button{min-height:103px;text-align:left;border:1px solid #203e2d;border-radius:19px;background:linear-gradient(145deg,#102019,#09130e);color:#fff;padding:13px;box-shadow:0 9px 24px #0004}.fs-v2-actions span{display:block;font-size:25px;margin-bottom:7px}.fs-v2-actions b{display:block;font-size:13px}.fs-v2-actions small{display:block;color:#85998d;font-size:9px;margin-top:3px}.bottom-nav{gap:2px!important;justify-content:space-around!important;padding-left:6px!important;padding-right:6px!important}.bottom-nav .nav{min-width:0!important;width:20%!important;font-size:19px!important;padding:7px 2px!important}.bottom-nav .nav small{font-size:9px!important;white-space:nowrap}.fs-publish-nav span{display:grid;width:46px;height:46px;margin:-22px auto 2px;place-items:center;border-radius:50%;font-size:28px;background:linear-gradient(135deg,#4ade80,#25c966);color:#03160a;border:4px solid #07120d;box-shadow:0 5px 20px #30df7870}.fs-profile-logout{margin-top:26px!important;color:#ffb5b5!important;border-color:#5a2929!important;background:#2a1414!important}.fs-v2-secondary-card{margin-top:10px!important}.players-head{margin-top:15px}@media(max-width:600px){.page{padding:10px 12px 100px!important}.fs-v2-welcome{padding:18px}.fs-v2-welcome h1{font-size:27px}.fs-v2-ball{font-size:43px}.fs-v2-actions{grid-template-columns:repeat(3,1fr)}.fs-v2-actions button{padding:11px 9px;min-height:96px}.fs-v2-secondary-card{display:none!important}.bottom-nav{left:10px!important;right:10px!important;bottom:8px!important;border:1px solid #1d3829!important;border-radius:22px!important}.drawer-inner.fs-v2-sheet{padding-top:22px!important}}`;document.head.appendChild(css);
}
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(loadGlobalRanking,1800);
  if(!document.querySelector('script[data-engagement]')){const s=document.createElement('script');s.src='/engagement.js';s.defer=true;s.dataset.engagement='1';document.body.appendChild(s)}
  if(!document.querySelector('script[data-mobile-actions]')){const s=document.createElement('script');s.src='/mobile-actions.js';s.defer=true;s.dataset.mobileActions='1';document.body.appendChild(s)}
  if(!document.querySelector('script[data-detections]')){const s=document.createElement('script');s.src='/detections.js';s.defer=true;s.dataset.detections='1';document.body.appendChild(s)}
  setTimeout(setupMobileV2,1500);
});
document.addEventListener('click',e=>{if(e.target.closest('#homeContestBtn,#homeQuizBtn,#homeGameBtn,#publishActionBtn,#dailySubmit'))setTimeout(loadGlobalRanking,1800)});
})();