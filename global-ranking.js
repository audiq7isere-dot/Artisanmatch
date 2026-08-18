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
    root.innerHTML=rows.slice(0,10).map((r,i)=>`<div class="global-rank-row" style="display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center;padding:9px 2px;border-bottom:1px solid #ffffff12"><div style="font-size:19px;text-align:center">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div><div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.full_name||r.username||'Joueur')}</b><span style="font-size:10px;color:#8fa297">🎬 ${r.video_points||0} · ❤️ ${r.like_points||0} · 🏆 ${r.contest_points||0} · 🔥 ${r.daily_points||0} · 🧠 ${r.quiz_points||0} · 🎮 ${r.game_points||0}</span></div><b style="color:#4ade80;font-size:17px">${r.total_points} pts</b></div>`).join('');
  }catch(e){
    root.innerHTML='<div class="msg">Classement global en attente de l’activation Supabase.</div>';
    if(mine)mine.innerHTML='<b>—</b>';
  }
}
window.loadGlobalRanking=loadGlobalRanking;
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(loadGlobalRanking,1800);
  if(!document.querySelector('script[data-engagement]')){const s=document.createElement('script');s.src='/engagement.js';s.defer=true;s.dataset.engagement='1';document.body.appendChild(s)}
});
document.addEventListener('click',e=>{if(e.target.closest('#homeContestBtn,#homeQuizBtn,#homeGameBtn,#publishActionBtn,#dailySubmit'))setTimeout(loadGlobalRanking,1800)});
})();