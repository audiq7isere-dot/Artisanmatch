document.addEventListener('click',function(e){
  const stat=e.target.closest('.stats .stat:first-child');
  if(!stat)return;
  const pane=stat.closest('.profile-card')||document.getElementById('profilePane');
  if(!pane)return;
  const title=[...pane.querySelectorAll('.section-title')].find(x=>x.textContent.includes('Meilleures actions'));
  const actions=title?.nextElementSibling;
  if(title){
    title.scrollIntoView({behavior:'smooth',block:'start'});
    title.classList.add('video-target-flash');
    setTimeout(()=>title.classList.remove('video-target-flash'),900);
  }
  if(actions && actions.querySelector('.action-card')){
    setTimeout(()=>actions.querySelector('.action-card').scrollIntoView({behavior:'smooth',block:'center'}),250);
  }
});
