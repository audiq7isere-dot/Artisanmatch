(()=>{
  function wireVideoStat(){
    const pane=document.getElementById('profilePane');
    if(!pane)return;
    const stats=pane.querySelectorAll('.stat');
    const videoStat=stats[0];
    const actions=pane.querySelector('.actions-grid');
    const title=[...pane.querySelectorAll('.section-title')].find(x=>/Meilleures actions/i.test(x.textContent||''));
    if(!videoStat||!actions)return;
    videoStat.style.cursor='pointer';
    videoStat.setAttribute('role','button');
    videoStat.setAttribute('tabindex','0');
    videoStat.setAttribute('aria-label','Voir les vidéos du joueur');
    if(!videoStat.dataset.videoLinked){
      videoStat.dataset.videoLinked='1';
      videoStat.insertAdjacentHTML('beforeend','<span style="display:block;margin-top:4px;font-size:12px;color:#4ade80">Voir les vidéos ›</span>');
      const go=()=>{
        const target=title||actions;
        target.scrollIntoView({behavior:'smooth',block:'start'});
        actions.animate([{opacity:.45,transform:'scale(.99)'},{opacity:1,transform:'scale(1)'}],{duration:450,easing:'ease-out'});
      };
      videoStat.addEventListener('click',go);
      videoStat.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    }
  }
  const pane=document.getElementById('profilePane');
  if(pane)new MutationObserver(wireVideoStat).observe(pane,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',wireVideoStat);
})();