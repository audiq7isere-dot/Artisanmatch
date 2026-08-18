(()=>{
  const defaultContests=[
    {slug:'100-jongles',icon:'⚽',title:'100 jongles',description:'Réalise 100 jongles sans que le ballon touche le sol.',rules:'Une seule séquence continue. Les 100 jongles doivent être visibles.'},
    {slug:'tour-du-monde',icon:'🌍',title:'Tour du monde',description:'Réalise un tour du monde propre autour du ballon.',rules:'Le geste doit être clairement visible et sans coupe vidéo.'},
    {slug:'crossbar-challenge',icon:'🎯',title:'Crossbar Challenge',description:'Touche la barre transversale depuis l’extérieur de la surface.',rules:'Une séquence continue. Le ballon doit toucher clairement la barre.'},
    {slug:'lucarne-challenge',icon:'🥅',title:'Lucarne Challenge',description:'Place une frappe dans la lucarne avec précision.',rules:'La frappe et le but doivent apparaître dans la même séquence.'},
    {slug:'pied-faible',icon:'🦶',title:'Pied faible',description:'Montre ta technique avec ton pied faible.',rules:'30 jongles, un dribble ou une frappe uniquement avec le pied faible.'},
    {slug:'10-jongles-tete',icon:'🧠',title:'10 jongles de la tête',description:'Enchaîne 10 jongles de la tête sans laisser tomber le ballon.',rules:'Les 10 touches doivent être consécutives et visibles.'},
    {slug:'controle-frappe',icon:'💥',title:'Contrôle + frappe',description:'Contrôle orienté puis frappe précise.',rules:'La passe, le contrôle et la frappe doivent être visibles sans coupe.'},
    {slug:'slalom-technique',icon:'🚀',title:'Slalom technique',description:'Passe entre 6 plots le plus proprement et rapidement possible.',rules:'6 plots, départ arrêté et séquence continue.'},
    {slug:'meilleur-geste',icon:'✨',title:'Meilleur geste technique',description:'Publie ton geste technique le plus créatif.',rules:'Une seule action par vidéo. Le geste doit être réalisé par le participant.'},
    {slug:'meilleur-but',icon:'🔥',title:'Meilleur but',description:'Publie ton plus beau but en match ou à l’entraînement.',rules:'Le but doit avoir été marqué par le joueur qui participe.'},
    {slug:'meilleur-arret',icon:'🧤',title:'Meilleur arrêt',description:'Défi spécial gardiens : montre ton arrêt le plus impressionnant.',rules:'La vidéo doit montrer clairement l’arrêt du gardien participant.'},
    {slug:'freestyle-challenge',icon:'🎬',title:'Freestyle Challenge',description:'Crée un enchaînement freestyle original.',rules:'Créativité, maîtrise technique et fluidité sont privilégiées.'}
  ];
  const x=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let contests=[],current=null;

  async function loadContests(){
    const {data,error}=await sb.from('contests').select('*').eq('active',true).order('created_at',{ascending:true});
    contests=(!error&&data?.length)?data:defaultContests;
    renderContestList();
  }

  function openContests(){
    document.getElementById('myProfile')?.classList.add('hidden');
    document.getElementById('messagesDrawer')?.classList.add('hidden');
    document.getElementById('profilePane')?.classList.remove('open');
    document.getElementById('contestsDrawer')?.classList.remove('hidden');
    loadContests();
  }

  function renderContestList(){
    const root=document.getElementById('contestsContent');
    if(!root)return;
    root.innerHTML=`<div style="padding:4px 0 10px"><div style="font-size:12px;color:#4ade80;font-weight:900">FOOTSHOW CHALLENGES</div><h2 style="font-size:30px;margin:4px 0">🏆 Concours</h2><p class="msg">Relève un défi, publie ta vidéo et tente de devenir numéro 1 du classement.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">${contests.map(c=>`<button data-contest="${x(c.slug||c.id)}" style="text-align:left;background:linear-gradient(145deg,#10251a,#09150f);border:1px solid #274632;color:white;border-radius:18px;padding:16px;min-height:155px"><div style="font-size:34px">${x(c.icon||'🏆')}</div><b style="display:block;font-size:18px;margin:8px 0 5px">${x(c.title)}</b><div style="font-size:13px;color:#9ab0a1;line-height:1.35">${x(c.description)}</div><div style="margin-top:12px;color:#4ade80;font-weight:900;font-size:12px">Voir le concours →</div></button>`).join('')}</div>`;
    root.querySelectorAll('[data-contest]').forEach(b=>b.onclick=()=>openContest(b.dataset.contest));
  }

  async function openContest(key){
    current=contests.find(c=>(c.slug||c.id)===key);
    if(!current)return;
    const root=document.getElementById('contestsContent');
    root.innerHTML='<p class="msg">Chargement du concours…</p>';
    let entries=[];
    if(current.id){
      const {data}=await sb.from('contest_entries').select('*,profiles:user_id(id,full_name,username,avatar_url,position,category),contest_entry_likes(user_id),contest_entry_comments(id,user_id,body,created_at)').eq('contest_id',current.id).order('created_at',{ascending:false});
      entries=data||[];
    }
    entries.sort((a,b)=>(b.contest_entry_likes?.length||0)-(a.contest_entry_likes?.length||0));
    root.innerHTML=`<button id="contestBack" class="secondary" style="margin-bottom:12px">← Tous les concours</button><div style="background:linear-gradient(135deg,#132d1f,#09150f);border:1px solid #31563f;border-radius:20px;padding:18px"><div style="font-size:44px">${x(current.icon||'🏆')}</div><h2 style="margin:5px 0;font-size:28px">${x(current.title)}</h2><p style="color:#d9eee0">${x(current.description)}</p><div style="background:#07120d;border:1px solid #20372a;border-radius:13px;padding:12px"><b>Règle du défi</b><div class="msg" style="margin-top:4px">${x(current.rules)}</div></div><button id="participateContest" class="primary full">🎥 Participer à ce concours</button></div><div style="display:flex;align-items:center;justify-content:space-between;margin:22px 0 10px"><h3 style="margin:0">🏅 Classement</h3><span class="msg">${entries.length} participant${entries.length>1?'s':''}</span></div><div id="contestEntries">${entries.length?entries.map((e,i)=>entryCard(e,i)).join(''):'<div class="panel" style="text-align:center;color:#9ab0a1">Aucune participation pour le moment.<br>Sois le premier à relever le défi !</div>'}</div>`;
    document.getElementById('contestBack').onclick=renderContestList;
    document.getElementById('participateContest').onclick=showParticipationForm;
    root.querySelectorAll('[data-entry-like]').forEach(b=>b.onclick=()=>toggleEntryLike(b.dataset.entryLike,b.dataset.liked==='1'));
    root.querySelectorAll('[data-entry-comment]').forEach(b=>b.onclick=()=>commentEntry(b.dataset.entryComment));
  }

  function entryCard(e,i){
    const likes=e.contest_entry_likes||[],liked=likes.some(l=>l.user_id===user?.id),src=media('footshow-videos',e.storage_path),p=e.profiles||{};
    return `<div style="background:#0d1b14;border:1px solid #20372a;border-radius:17px;overflow:hidden;margin-bottom:12px"><div style="display:flex;align-items:center;gap:10px;padding:11px 12px"><div style="font-size:22px;width:28px;text-align:center">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div><img src="${x(p.avatar_url?media('avatars',p.avatar_url):'')}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;background:#203329"><div style="flex:1"><b>${x(p.full_name||p.username||'Joueur')}</b><div class="msg">${x([p.position,p.category].filter(Boolean).join(' · '))}</div></div><b style="color:#4ade80">${likes.length} ❤️</b></div><video controls playsinline preload="metadata" src="${x(src)}" style="width:100%;max-height:430px;background:#000"></video>${e.caption?`<div style="padding:10px 12px">${x(e.caption)}</div>`:''}<div style="display:flex;gap:8px;padding:0 12px 12px"><button class="secondary" data-entry-like="${e.id}" data-liked="${liked?'1':'0'}">${liked?'❤️':'♡'} J’aime · ${likes.length}</button><button class="secondary" data-entry-comment="${e.id}">💬 ${(e.contest_entry_comments||[]).length}</button></div></div>`;
  }

  function showParticipationForm(){
    if(!current?.id){alert('Le concours sera participable dès que la base Concours sera activée dans Supabase.');return;}
    const old=document.getElementById('contestParticipateModal');old?.remove();
    const m=document.createElement('div');m.id='contestParticipateModal';m.style.cssText='position:fixed;inset:0;z-index:180;background:rgba(2,8,5,.96);display:grid;place-items:end center;color:white';
    m.innerHTML=`<div style="width:min(680px,100%);background:#09150f;border:1px solid #284633;border-radius:24px 24px 0 0;padding:18px 18px 30px"><button id="closeContestParticipate" class="close">×</button><div style="font-size:12px;color:#4ade80;font-weight:900">PARTICIPER</div><h2 style="margin:4px 0 15px">${x(current.title)}</h2><label>Ta vidéo</label><input id="contestVideoFile" type="file" accept="video/*" class="input"><label>Description (facultatif)</label><textarea id="contestCaption" class="input" rows="3" placeholder="Ajoute un petit commentaire…"></textarea><button id="submitContestEntry" class="primary full">Publier ma participation</button><p id="contestSubmitMsg" class="msg"></p></div>`;
    document.body.appendChild(m);
    document.getElementById('closeContestParticipate').onclick=()=>m.remove();
    document.getElementById('submitContestEntry').onclick=submitEntry;
  }

  async function submitEntry(){
    const f=document.getElementById('contestVideoFile')?.files[0],msg=document.getElementById('contestSubmitMsg');
    if(!f){msg.textContent='Choisis une vidéo.';return}
    if(f.size>200*1024*1024){msg.textContent='La vidéo doit faire moins de 200 Mo.';return}
    const btn=document.getElementById('submitContestEntry');btn.disabled=true;msg.textContent='Envoi de la vidéo…';
    const ext=f.name.split('.').pop()||'mp4',path=`${user.id}/contests/${current.slug||current.id}-${Date.now()}.${ext}`;
    const up=await sb.storage.from('footshow-videos').upload(path,f,{contentType:f.type});
    if(up.error){msg.textContent=up.error.message;btn.disabled=false;return}
    const {error}=await sb.from('contest_entries').insert({contest_id:current.id,user_id:user.id,storage_path:path,caption:document.getElementById('contestCaption').value.trim()||null});
    btn.disabled=false;
    if(error){msg.textContent=error.message;return}
    document.getElementById('contestParticipateModal')?.remove();
    openContest(current.slug||current.id);
  }

  async function toggleEntryLike(id,liked){
    const r=liked?await sb.from('contest_entry_likes').delete().eq('entry_id',id).eq('user_id',user.id):await sb.from('contest_entry_likes').insert({entry_id:id,user_id:user.id});
    if(r.error)alert(r.error.message);else openContest(current.slug||current.id);
  }

  async function commentEntry(id){
    const body=prompt('Écrire un commentaire');if(!body?.trim())return;
    const {error}=await sb.from('contest_entry_comments').insert({entry_id:id,user_id:user.id,body:body.trim()});
    if(error)alert(error.message);else openContest(current.slug||current.id);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('contestsNav')?.addEventListener('click',openContests);
    document.getElementById('homeContestBtn')?.addEventListener('click',openContests);
    document.getElementById('closeContests')?.addEventListener('click',()=>document.getElementById('contestsDrawer').classList.add('hidden'));
  });
})();