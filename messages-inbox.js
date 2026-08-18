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

(()=>{
  const GEO_URL='https://geo.api.gouv.fr/communes';
  let lastProfilePostal='';

  function setPostalUi(){
    const fields=[
      ['signupDepartment','Code postal','Ex. 73000'],
      ['filterDepartment','Code postal','Ex. 73000'],
      ['profileDepartment','Code postal','Ex. 73000']
    ];
    fields.forEach(([id,label,placeholder])=>{
      const input=document.getElementById(id);if(!input)return;
      const lab=input.previousElementSibling;
      if(lab&&lab.tagName==='LABEL')lab.textContent=label;
      input.removeAttribute('list');input.maxLength=5;input.inputMode='numeric';input.placeholder=placeholder;
      input.setAttribute('autocomplete','postal-code');
      input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,5)});
    });
    document.getElementById('departmentsList')?.remove();

    const signupPostal=document.getElementById('signupDepartment');
    if(signupPostal&&!document.getElementById('signupCity')){
      const wrap=document.createElement('div');
      wrap.innerHTML='<label>Ville</label><input id="signupCity" class="input" placeholder="Remplie automatiquement" autocomplete="address-level2"><datalist id="signupCities"></datalist>';
      signupPostal.parentElement?.parentElement?.insertAdjacentElement('afterend',wrap);
    }
    const profileCity=document.getElementById('profileCity');
    if(profileCity){profileCity.setAttribute('list','profileCities');profileCity.placeholder='Remplie automatiquement';if(!document.getElementById('profileCities'))profileCity.insertAdjacentHTML('afterend','<datalist id="profileCities"></datalist>');}
  }

  async function citiesForPostal(postal){
    if(!/^\d{5}$/.test(postal))return [];
    try{
      const r=await fetch(`${GEO_URL}?codePostal=${encodeURIComponent(postal)}&fields=nom,codesPostaux,population&format=json`);
      if(!r.ok)return [];
      const rows=await r.json();
      return [...new Set((rows||[]).sort((a,b)=>(b.population||0)-(a.population||0)).map(x=>x.nom).filter(Boolean))];
    }catch{return []}
  }

  async function autofill(postalId,cityId,listId){
    const postal=document.getElementById(postalId)?.value.trim();
    if(!/^\d{5}$/.test(postal))return;
    const cities=await citiesForPostal(postal);
    const city=document.getElementById(cityId),list=document.getElementById(listId);
    if(list)list.innerHTML=cities.map(x=>`<option value="${String(x).replace(/"/g,'&quot;')}"></option>`).join('');
    if(city&&cities.length){if(!cities.includes(city.value))city.value=cities[0];city.setAttribute('list',listId);}
  }

  async function loadPlayersPostal(){
    const postal=document.getElementById('filterDepartment')?.value.trim();
    const pos=document.getElementById('filterPosition')?.value||'';
    const cat=document.getElementById('filterCategory')?.value||'';
    let q=sb.from('profiles').select('id,full_name,username,avatar_url,position,category,postal_code,city').eq('account_type','player').order('full_name',{ascending:true});
    if(postal)q=q.eq('postal_code',postal);
    if(pos)q=q.eq('position',pos);
    if(cat)q=q.eq('category',cat);
    const {data,error}=await q.limit(250),root=document.getElementById('playersList');
    if(error){root.innerHTML=`<div class="panel">${esc(error.message)}</div>`;return}
    if(!data?.length){root.innerHTML='<div class="panel">Aucun joueur trouvé.</div>';return}
    root.innerHTML=data.map(x=>`<div class="player-row" data-id="${x.id}" onclick="openPlayer('${x.id}')"><div class="player-name"><img class="mini-avatar" src="${esc(media('avatars',x.avatar_url))}" onerror="this.style.visibility='hidden'"><span>${esc(x.full_name||x.username||'Joueur')}</span></div><div>${esc(x.position||'—')}</div><div>${esc(x.category||'—')}</div><div class="arrow">›</div></div>`).join('');
  }

  function patchHandlers(){
    const signupPostal=document.getElementById('signupDepartment');
    signupPostal?.addEventListener('input',()=>{if(signupPostal.value.length===5)autofill('signupDepartment','signupCity','signupCities')});
    const profilePostal=document.getElementById('profileDepartment');
    profilePostal?.addEventListener('input',()=>{if(profilePostal.value.length===5)autofill('profileDepartment','profileCity','profileCities')});

    const filterBtn=document.getElementById('applyFilters');if(filterBtn)filterBtn.onclick=loadPlayersPostal;
    const reset=document.getElementById('resetFilters');if(reset)reset.onclick=()=>{document.getElementById('filterDepartment').value='';document.getElementById('filterPosition').value='';document.getElementById('filterCategory').value='';loadPlayersPostal()};

    const signup=document.getElementById('signupBtn');if(signup)signup.onclick=async()=>{
      const postal=document.getElementById('signupDepartment').value.trim();
      if(document.getElementById('signupType').value==='player'&&postal&&!/^\d{5}$/.test(postal)){document.getElementById('authMsg').textContent='Entre un code postal à 5 chiffres.';return}
      if(postal)await autofill('signupDepartment','signupCity','signupCities');
      const meta={full_name:document.getElementById('signupName').value.trim(),username:document.getElementById('signupUsername').value.trim(),account_type:document.getElementById('signupType').value,position:document.getElementById('signupPosition').value||null,category:document.getElementById('signupCategory').value||null,postal_code:postal||null,city:document.getElementById('signupCity')?.value.trim()||null,department:null};
      const {data,error}=await sb.auth.signUp({email:document.getElementById('signupEmail').value.trim(),password:document.getElementById('signupPassword').value,options:{data:meta}});
      if(error){document.getElementById('authMsg').textContent=error.message;return}
      if(data.session){user=data.user;await enterApp()}else document.getElementById('authMsg').textContent='Compte créé. Vérifie ton e-mail de confirmation.';
    };

    const save=document.getElementById('saveProfileBtn');if(save)save.onclick=async()=>{
      try{
        const postal=document.getElementById('profileDepartment').value.trim();
        if(postal&&!/^\d{5}$/.test(postal))throw new Error('Entre un code postal à 5 chiffres');
        if(postal)await autofill('profileDepartment','profileCity','profileCities');
        let avatar=me.avatar_url,intro=me.intro_video_path;
        const af=document.getElementById('avatarFile').files[0],vf=document.getElementById('introFile').files[0];
        if(af){const ext=af.name.split('.').pop()||'jpg';avatar=await uploadFile('avatars',af,`${user.id}/${Date.now()}.${ext}`)}
        if(vf){if(vf.size>80*1024*1024)throw new Error('Vidéo de présentation : 80 Mo maximum');const ext=vf.name.split('.').pop()||'mp4';intro=await uploadFile('footshow-videos',vf,`${user.id}/intro-${Date.now()}.${ext}`)}
        const patch={position:document.getElementById('profilePosition').value||null,category:document.getElementById('profileCategory').value||null,postal_code:postal||null,department:null,club:document.getElementById('profileClub').value.trim()||null,city:document.getElementById('profileCity').value.trim()||null,level:document.getElementById('profileLevel').value.trim()||null,foot:document.getElementById('profileFoot').value||null,height_cm:document.getElementById('profileHeight').value?Number(document.getElementById('profileHeight').value):null,bio:document.getElementById('profileBio').value.trim()||null,avatar_url:avatar,intro_video_path:intro};
        const {error}=await sb.from('profiles').update(patch).eq('id',user.id);if(error)throw error;
        await loadMe();window.openMyProfile?.();loadPlayersPostal();toast('Profil enregistré');
      }catch(err){toast(err.message)}
    };
  }

  const originalOpenMyProfile=window.openMyProfile;
  if(originalOpenMyProfile)window.openMyProfile=function(){originalOpenMyProfile();const p=document.getElementById('profileDepartment');if(p)p.value=me?.postal_code||'';const c=document.getElementById('profileCity');if(c)c.value=me?.city||'';if(p?.value.length===5)autofill('profileDepartment','profileCity','profileCities')};

  const originalOpenPlayer=window.openPlayer;
  if(originalOpenPlayer)window.openPlayer=async function(id){await originalOpenPlayer(id);const {data:p}=await sb.from('profiles').select('postal_code,city').eq('id',id).single();const chips=document.querySelector('#profilePane .chips');if(chips){[...chips.children].forEach(ch=>{if((ch.textContent||'').startsWith('Département '))ch.remove()});if(p?.postal_code){const chip=document.createElement('span');chip.className='chip';chip.textContent=`📍 ${p.postal_code}${p.city?' '+p.city:''}`;chips.prepend(chip)}}};

  document.addEventListener('DOMContentLoaded',()=>{
    setPostalUi();patchHandlers();
    const nav=document.querySelector('.nav[data-view="profile"]');
    if(nav)nav.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===nav));window.openMyProfile?.()};
  });
})();