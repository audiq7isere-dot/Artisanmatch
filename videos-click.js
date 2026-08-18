(()=>{
  function closeViewer(){
    const old=document.getElementById('playerVideosViewer');
    if(old)old.remove();
  }

  function openViewer(){
    const pane=document.getElementById('profilePane');
    if(!pane)return;
    const actions=pane.querySelector('.actions-grid');
    if(!actions)return;
    const cards=actions.querySelectorAll('.action-card');
    const playerName=pane.querySelector('.profile-title h2')?.childNodes?.[0]?.textContent?.trim()||'Joueur';

    closeViewer();
    const viewer=document.createElement('div');
    viewer.id='playerVideosViewer';
    viewer.style.cssText='position:fixed;inset:0;z-index:120;background:rgba(3,10,6,.97);overflow:auto;padding:18px 14px 90px;color:white';
    viewer.innerHTML=`
      <div style="max-width:720px;margin:auto">
        <div style="position:sticky;top:0;z-index:2;background:rgba(3,10,6,.96);display:flex;align-items:center;justify-content:space-between;padding:10px 0 14px;border-bottom:1px solid #20372a">
          <div><div style="font-size:12px;color:#9ab0a1">${cards.length} vidéo${cards.length>1?'s':''}</div><h2 style="margin:2px 0 0">Meilleures actions de ${playerName}</h2></div>
          <button id="closePlayerVideosViewer" aria-label="Fermer" style="background:#11231a;border:1px solid #31563f;color:white;width:44px;height:44px;border-radius:50%;font-size:27px">×</button>
        </div>
        <div style="display:grid;gap:16px;margin-top:16px">${cards.length?actions.innerHTML:'<p style="color:#9ab0a1">Aucune vidéo publiée.</p>'}</div>
      </div>`;
    document.body.appendChild(viewer);
    document.getElementById('closePlayerVideosViewer').onclick=closeViewer;
    viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
  }

  function wireVideoStat(){
    const pane=document.getElementById('profilePane');
    if(!pane)return;
    const videoStat=pane.querySelector('.stats .stat:first-child');
    if(!videoStat)return;
    videoStat.style.cursor='pointer';
    videoStat.setAttribute('role','button');
    videoStat.setAttribute('tabindex','0');
    videoStat.setAttribute('aria-label','Voir les vidéos du joueur');
    if(!videoStat.querySelector('.video-link-label')){
      videoStat.insertAdjacentHTML('beforeend','<span class="video-link-label" style="display:block;margin-top:4px;font-size:12px;color:#4ade80">Voir les vidéos ›</span>');
    }
    if(videoStat.dataset.videoLinked==='1')return;
    videoStat.dataset.videoLinked='1';
    videoStat.addEventListener('click',openViewer);
    videoStat.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openViewer();}});
  }

  const pane=document.getElementById('profilePane');
  if(pane)new MutationObserver(wireVideoStat).observe(pane,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',wireVideoStat);
  window.closePlayerVideosViewer=closeViewer;
})();