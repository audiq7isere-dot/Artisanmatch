(()=>{
  const e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const currentId=()=>window.user?.id || (typeof user!=='undefined'&&user?.id) || null;
  let activeOther=null;

  function profileIdFromPane(){
    const active=document.querySelector('.player-row.active');
    return active?.dataset?.id||null;
  }

  async function getProfile(id){
    const {data}=await sb.from('profiles').select('id,full_name,username,avatar_url,position,category').eq('id',id).single();
    return data;
  }

  async function getConversation(otherId){
    const uid=currentId();
    if(!uid)return [];
    const {data,error}=await sb.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid})`)
      .order('created_at',{ascending:true});
    if(error)throw error;
    return data||[];
  }

  async function openConversation(otherId){
    const uid=currentId();
    if(!uid)return;
    activeOther=otherId;
    const [p,msgs]=await Promise.all([getProfile(otherId),getConversation(otherId)]);
    let box=document.getElementById('privateChat');
    if(box)box.remove();
    box=document.createElement('div');
    box.id='privateChat';
    box.style.cssText='position:fixed;inset:0;z-index:150;background:rgba(2,8,5,.96);display:flex;flex-direction:column;color:white';
    box.innerHTML=`
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #20372a;background:#07120d">
        <button id="chatBack" style="background:none;border:0;color:white;font-size:28px">‹</button>
        <img src="${e(p?.avatar_url?media('avatars',p.avatar_url):'')}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;background:#203329" onerror="this.style.visibility='hidden'">
        <div style="flex:1"><b style="font-size:17px">${e(p?.full_name||p?.username||'Joueur')}</b><div style="font-size:12px;color:#9ab0a1">${e([p?.position,p?.category].filter(Boolean).join(' · '))}</div></div>
        <button id="chatClose" style="background:none;border:0;color:white;font-size:28px">×</button>
      </div>
      <div id="chatMessages" style="flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:9px;max-width:760px;width:100%;margin:auto">
        ${msgs.length?msgs.map(m=>`<div style="max-width:82%;align-self:${m.sender_id===uid?'flex-end':'flex-start'};background:${m.sender_id===uid?'#1f6f42':'#11231a'};border:1px solid #31563f;border-radius:16px;padding:10px 12px"><div>${e(m.body)}</div><div style="font-size:10px;opacity:.65;margin-top:4px;text-align:right">${new Date(m.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div></div>`).join(''):'<div style="color:#9ab0a1;text-align:center;margin-top:30px">Commence la conversation 👋</div>'}
      </div>
      <div style="padding:10px 12px max(12px,env(safe-area-inset-bottom));border-top:1px solid #20372a;background:#07120d">
        <div style="display:flex;gap:8px;max-width:760px;margin:auto"><input id="chatInput" maxlength="2000" placeholder="Écrire un message…" style="flex:1;background:#09150f;border:1px solid #20372a;color:white;border-radius:14px;padding:13px"><button id="chatSend" style="border:0;border-radius:14px;padding:0 18px;background:#4ade80;color:#05220f;font-weight:900">Envoyer</button></div>
      </div>`;
    document.body.appendChild(box);
    const list=document.getElementById('chatMessages');list.scrollTop=list.scrollHeight;
    document.getElementById('chatClose').onclick=()=>box.remove();
    document.getElementById('chatBack').onclick=()=>{box.remove();openInbox();};
    document.getElementById('chatSend').onclick=sendCurrent;
    document.getElementById('chatInput').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();sendCurrent();}});
    // Tente de marquer comme lus si la politique Supabase le permet.
    await sb.from('messages').update({read_at:new Date().toISOString()}).eq('sender_id',otherId).eq('receiver_id',uid).is('read_at',null);
    refreshBadge();
  }

  async function sendCurrent(){
    const uid=currentId(),input=document.getElementById('chatInput');
    const body=input?.value.trim();
    if(!uid||!activeOther||!body)return;
    const {error}=await sb.from('messages').insert({sender_id:uid,receiver_id:activeOther,body});
    if(error){alert(error.message);return;}
    input.value='';
    openConversation(activeOther);
  }

  async function loadConversations(){
    const uid=currentId(),root=document.getElementById('conversationsList');
    if(!uid||!root)return;
    root.innerHTML='<p class="msg">Chargement…</p>';
    const {data,error}=await sb.from('messages').select('*').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).order('created_at',{ascending:false}).limit(500);
    if(error){root.innerHTML=`<p class="msg">${e(error.message)}</p>`;return;}
    const byOther=new Map();
    for(const m of data||[]){
      const other=m.sender_id===uid?m.receiver_id:m.sender_id;
      if(!byOther.has(other))byOther.set(other,{last:m,unread:0});
      if(m.receiver_id===uid&&!m.read_at)byOther.get(other).unread++;
    }
    if(!byOther.size){root.innerHTML='<div style="padding:30px 10px;text-align:center;color:#9ab0a1">Aucun message pour le moment.</div>';return;}
    const ids=[...byOther.keys()];
    const {data:profiles}=await sb.from('profiles').select('id,full_name,username,avatar_url,position,category').in('id',ids);
    const pmap=new Map((profiles||[]).map(p=>[p.id,p]));
    root.innerHTML=ids.map(id=>{const c=byOther.get(id),p=pmap.get(id),last=c.last;return `<button data-chat="${id}" style="width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:#0d1b14;border:1px solid #20372a;color:white;border-radius:15px;padding:12px;margin:8px 0"><img src="${e(p?.avatar_url?media('avatars',p.avatar_url):'')}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;background:#203329" onerror="this.style.visibility='hidden'"><div style="min-width:0;flex:1"><div style="font-weight:900">${e(p?.full_name||p?.username||'Membre')}</div><div style="font-size:13px;color:#9ab0a1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e(last.body)}</div><div style="font-size:10px;color:#718276;margin-top:3px">${new Date(last.created_at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div></div>${c.unread?`<span style="background:#4ade80;color:#05220f;border-radius:999px;min-width:24px;height:24px;display:grid;place-items:center;font-size:11px;font-weight:900">${c.unread}</span>`:''}</button>`}).join('');
    root.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>{document.getElementById('messagesDrawer').classList.add('hidden');openConversation(b.dataset.chat)});
  }

  function openInbox(){
    const drawer=document.getElementById('messagesDrawer');
    if(!drawer)return;
    document.getElementById('myProfile')?.classList.add('hidden');
    document.getElementById('profilePane')?.classList.remove('open');
    drawer.classList.remove('hidden');
    loadConversations();
  }

  async function refreshBadge(){
    const uid=currentId(),badge=document.getElementById('messagesBadge');
    if(!uid||!badge)return;
    const {count}=await sb.from('messages').select('*',{count:'exact',head:true}).eq('receiver_id',uid).is('read_at',null);
    if(count){badge.textContent=count>99?'99+':String(count);badge.classList.remove('hidden')}else badge.classList.add('hidden');
  }

  function wireProfileMessageButton(){
    const pane=document.getElementById('profilePane');
    if(!pane)return;
    const activeId=profileIdFromPane();
    if(!activeId||activeId===currentId())return;
    const actions=pane.querySelector('.profile-actions');
    if(!actions||actions.querySelector('.private-message-btn'))return;
    const b=document.createElement('button');
    b.className='secondary private-message-btn';
    b.textContent='✉️ Envoyer un message';
    b.onclick=()=>openConversation(activeId);
    actions.appendChild(b);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('messagesNav')?.addEventListener('click',openInbox);
    document.getElementById('closeMessages')?.addEventListener('click',()=>document.getElementById('messagesDrawer').classList.add('hidden'));
    const pane=document.getElementById('profilePane');
    if(pane)new MutationObserver(wireProfileMessageButton).observe(pane,{childList:true,subtree:true});
    setTimeout(refreshBadge,1200);
    setInterval(refreshBadge,30000);
  });

  window.openFootShowConversation=openConversation;
})();