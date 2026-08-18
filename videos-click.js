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

  function closeMessages(){
    document.getElementById('privateMessageViewer')?.remove();
  }

  async function loadConversation(otherId){
    const list=document.getElementById('privateMessageList');
    if(!list)return;
    list.innerHTML='<div style="color:#9ab0a1;padding:20px;text-align:center">Chargement…</div>';
    const {data,error}=await sb.from('messages')
      .select('id,sender_id,receiver_id,body,created_at')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at',{ascending:true})
      .limit(200);
    if(error){
      list.innerHTML=`<div style="color:#fca5a5;padding:16px">${esc(error.message)}</div>`;
      return;
    }
    if(!data?.length){
      list.innerHTML='<div style="color:#9ab0a1;padding:20px;text-align:center">Aucun message pour le moment.<br>Envoie le premier message.</div>';
      return;
    }
    list.innerHTML=data.map(m=>{
      const mine=m.sender_id===user.id;
      return `<div style="display:flex;justify-content:${mine?'flex-end':'flex-start'};margin:8px 0"><div style="max-width:82%;background:${mine?'#1f6a3a':'#13251a'};border:1px solid #2b4935;border-radius:16px;padding:10px 12px"><div style="white-space:pre-wrap;word-break:break-word">${esc(m.body)}</div><div style="font-size:10px;color:#9ab0a1;margin-top:5px;text-align:${mine?'right':'left'}">${new Date(m.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div></div></div>`;
    }).join('');
    list.scrollTop=list.scrollHeight;
  }

  async function openMessages(){
    const otherId=selectedPlayer;
    if(!otherId||!user||otherId===user.id)return;
    const pane=document.getElementById('profilePane');
    const playerName=pane?.querySelector('.profile-title h2')?.childNodes?.[0]?.textContent?.trim()||'Joueur';
    closeMessages();
    const box=document.createElement('div');
    box.id='privateMessageViewer';
    box.style.cssText='position:fixed;inset:0;z-index:140;background:rgba(3,10,6,.96);display:flex;align-items:flex-end;justify-content:center;color:white';
    box.innerHTML=`<div style="width:min(720px,100%);height:min(82vh,760px);background:#09150f;border:1px solid #284633;border-radius:24px 24px 0 0;display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #20372a;background:#0d1b14">
        <div><div style="font-size:11px;color:#9ab0a1">MESSAGE PRIVÉ</div><h2 style="margin:2px 0 0;font-size:20px">${esc(playerName)}</h2></div>
        <button id="closePrivateMessages" aria-label="Fermer" style="background:#11231a;border:1px solid #31563f;color:white;width:42px;height:42px;border-radius:50%;font-size:25px">×</button>
      </div>
      <div id="privateMessageList" style="flex:1;overflow:auto;padding:12px 14px"></div>
      <div style="display:flex;gap:8px;padding:12px;border-top:1px solid #20372a;background:#0d1b14">
        <textarea id="privateMessageText" rows="2" maxlength="2000" placeholder="Écrire un message…" style="flex:1;resize:none;background:#07120d;border:1px solid #31503c;color:white;border-radius:14px;padding:11px"></textarea>
        <button id="sendPrivateMessage" style="align-self:stretch;background:#4ade80;color:#05220f;border:0;border-radius:14px;padding:0 18px;font-weight:900">Envoyer</button>
      </div>
    </div>`;
    document.body.appendChild(box);
    document.getElementById('closePrivateMessages').onclick=closeMessages;
    box.addEventListener('click',e=>{if(e.target===box)closeMessages()});
    document.getElementById('sendPrivateMessage').onclick=async()=>{
      const input=document.getElementById('privateMessageText');
      const body=input.value.trim();
      if(!body)return;
      const btn=document.getElementById('sendPrivateMessage');
      btn.disabled=true;
      const {error}=await sb.from('messages').insert({sender_id:user.id,receiver_id:otherId,body});
      btn.disabled=false;
      if(error){alert(error.message);return;}
      input.value='';
      await loadConversation(otherId);
    };
    await loadConversation(otherId);
  }

  function wireMessageButton(){
    const pane=document.getElementById('profilePane');
    if(!pane||!user||!selectedPlayer||selectedPlayer===user.id)return;
    const content=pane.querySelector('.profile-content');
    if(!content||content.querySelector('#sendPrivateMessageBtn'))return;
    const actions=content.querySelector('.profile-actions');
    const button=document.createElement('button');
    button.id='sendPrivateMessageBtn';
    button.className='primary';
    button.textContent='✉️ Envoyer un message';
    button.style.cssText='width:100%;margin:10px 0 4px;padding:12px 14px;border:0;border-radius:12px;font-weight:900;background:#4ade80;color:#05220f';
    button.onclick=openMessages;
    if(actions)actions.insertAdjacentElement('afterend',button);
    else content.querySelector('.stats')?.insertAdjacentElement('afterend',button);
  }

  function wireAll(){wireVideoStat();wireMessageButton();}
  const pane=document.getElementById('profilePane');
  if(pane)new MutationObserver(wireAll).observe(pane,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',wireAll);
  window.closePlayerVideosViewer=closeViewer;
  window.closePrivateMessages=closeMessages;
})();