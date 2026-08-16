const sb = window.supabase.createClient(
  'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
  'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
)

let mode = 'login'
let role = 'client'
let session = null
let profile = null
let justAuthenticated = false
const $ = id => document.getElementById(id)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
const msg = (id,t,c='') => { const el=$(id); if(el) el.innerHTML=`<div class="notice ${c}">${esc(t)}</div>` }

window.closeModal = id => $(id)?.classList.remove('open')
window.setRole = r => {
  role = r
  $('clientRole')?.classList.toggle('active', r === 'client')
  $('artisanRole')?.classList.toggle('active', r === 'artisan')
}

window.openAuth = (m='login', r='client') => {
  mode = m
  setRole(r)
  $('authTitle').textContent = m === 'login' ? 'Connexion' : 'Créer mon compte'
  $('nameField').style.display = m === 'signup' ? 'grid' : 'none'
  $('roleChoice').style.display = m === 'signup' ? 'grid' : 'none'
  $('authSubmit').textContent = m === 'login' ? 'Se connecter' : 'Créer mon compte'
  $('authSwitch').innerHTML = m === 'login'
    ? 'Pas encore de compte ? <a href="#" id="switchAuth">Créer un compte</a>'
    : 'Déjà inscrit ? <a href="#" id="switchAuth">Se connecter</a>'
  $('authMsg').innerHTML = ''
  $('authModal').classList.add('open')
  setTimeout(() => {
    const sw = $('switchAuth')
    if(sw) sw.onclick = e => { e.preventDefault(); openAuth(m === 'login' ? 'signup' : 'login', role) }
  },0)
}

$('loginBtn').onclick = () => openAuth('login')
$('signupBtn').onclick = () => openAuth('signup')

$('authForm').onsubmit = async e => {
  e.preventDefault()
  const email = $('authEmail').value.trim().toLowerCase()
  const password = $('authPassword').value
  const button = $('authSubmit')
  button.disabled = true
  msg('authMsg', mode === 'signup' ? 'Création du compte…' : 'Connexion…')
  try {
    if(mode === 'signup') {
      const full_name = $('authName').value.trim()
      if(!full_name) return msg('authMsg','Indiquez votre nom complet.','error')
      if(password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return msg('authMsg','Le mot de passe doit contenir au moins 8 caractères, avec une lettre et un chiffre.','error')
      }
      const {data,error} = await sb.functions.invoke('register-user',{body:{email,password,full_name,role}})
      if(error) return msg('authMsg','Impossible de créer le compte. Réessayez.','error')
      if(!data?.ok) return msg('authMsg',data?.error || 'Impossible de créer le compte.','error')
      const login = await sb.auth.signInWithPassword({email,password})
      if(login.error) return msg('authMsg','Compte créé. Cliquez sur Connexion et utilisez vos identifiants.','success')
      session = login.data.session
      justAuthenticated = true
      msg('authMsg','Compte créé et connexion réussie.','success')
    } else {
      const {data,error} = await sb.auth.signInWithPassword({email,password})
      if(error) return msg('authMsg','E-mail ou mot de passe incorrect.','error')
      session = data.session
      justAuthenticated = true
      msg('authMsg','Connexion réussie.','success')
    }
    setTimeout(async()=>{
      closeModal('authModal')
      await state()
      await showDashboard()
      if(justAuthenticated && profile?.role === 'client') {
        justAuthenticated = false
        setTimeout(()=>startProject(),250)
      }
    },350)
  } catch(err) {
    console.error(err)
    msg('authMsg','Une erreur est survenue. Réessayez.','error')
  } finally {
    button.disabled = false
  }
}

async function boot(){
  const {data:{session:s}} = await sb.auth.getSession()
  session = s
  await state()
}

sb.auth.onAuthStateChange(async(_,s)=>{ session=s; await state() })

async function state(){
  if(!session){
    profile=null
    $('publicSite').style.display='block'
    $('app').classList.remove('show')
    $('loginBtn').style.display='inline-flex'
    $('signupBtn').style.display='inline-flex'
    $('dashBtn').style.display='none'
    if($('newProjectBtn')) $('newProjectBtn').style.display='none'
    return
  }
  const {data,error}=await sb.from('profiles').select('*').eq('id',session.user.id).single()
  if(error) console.error(error)
  profile=data
  $('loginBtn').style.display='none'
  $('signupBtn').style.display='none'
  $('dashBtn').style.display='inline-flex'
  if($('newProjectBtn')) $('newProjectBtn').style.display=profile?.role==='client'?'inline-flex':'none'
  if($('app').classList.contains('show')) await loadDashboard()
}

$('dashBtn').onclick = showDashboard
$('logoutBtn').onclick = async()=>{ await sb.auth.signOut(); location.reload() }
if($('newProjectBtn')) $('newProjectBtn').onclick = ()=>startProject()

async function showDashboard(){
  if(!session) return openAuth('login')
  $('publicSite').style.display='none'
  $('app').classList.add('show')
  await loadDashboard()
  window.scrollTo(0,0)
}
window.showDashboard=showDashboard

window.startProject = quick => {
  if(quick){
    $('pCat').value=$('qCat').value
    const q=$('qCity').value.trim()
    $('pCity').value=q.replace(/\d{5}/,'').trim()
    const m=q.match(/\d{5}/)
    $('pPostal').value=m?m[0]:''
    $('pWhen').value=$('qWhen').value
  }
  if(!session){
    localStorage.setItem('openProject','1')
    openAuth('signup','client')
    return
  }
  if(profile?.role!=='client'){
    alert('La création de demande est réservée aux particuliers.')
    return
  }
  $('projectMsg').innerHTML=''
  $('projectModal').classList.add('open')
}

$('projectForm').onsubmit=async e=>{
  e.preventDefault()
  if(!session) return openAuth('login')
  msg('projectMsg','Création de la demande…')
  const row={client_id:session.user.id,category:$('pCat').value,title:$('pTitle').value.trim(),description:$('pDesc').value.trim(),city:$('pCity').value.trim(),postal_code:$('pPostal').value.trim(),budget_min:$('pMin').value||null,budget_max:$('pMax').value||null,desired_start:$('pWhen').value,status:'open'}
  const {data,error}=await sb.from('projects').insert(row).select().single()
  if(error) return msg('projectMsg',error.message,'error')
  msg('projectMsg','Recherche automatique des artisans…')
  const {data:found,error:matchErr}=await sb.functions.invoke('match-project',{body:{project_id:data.id}})
  if(matchErr) msg('projectMsg','Demande créée. Le matching sera relancé depuis votre espace.','success')
  else msg('projectMsg',`${found?.matches?.length||0} artisan(s) correspondant(s) trouvé(s).`,'success')
  setTimeout(async()=>{ closeModal('projectModal'); await showDashboard() },700)
}

async function loadDashboard(){
  if(!profile) return
  $('hello').textContent=profile.role==='artisan'?`Espace artisan — ${profile.company_name||profile.full_name||''}`:`Bonjour ${profile.full_name||''}`
  $('projectsTab').textContent=profile.role==='artisan'?'Opportunités':'Mes demandes'
  if($('newProjectBtn')) $('newProjectBtn').style.display=profile.role==='client'?'inline-flex':'none'
  if(profile.role==='artisan') await loadArtisan(); else await loadClient()
  renderProfile()
}

async function loadClient(){
  const {data:projects=[]}=await sb.from('projects').select('*').eq('client_id',session.user.id).order('created_at',{ascending:false})
  const ids=projects.map(p=>p.id)
  let matches=[]
  if(ids.length){ const r=await sb.from('matches').select('*').in('project_id',ids); matches=r.data||[] }
  const aids=[...new Set(matches.map(m=>m.artisan_id))]
  let artisans=[]
  if(aids.length){ const r=await sb.from('profiles').select('id,full_name,company_name,city,postal_code,trades,verified').in('id',aids); artisans=r.data||[] }
  $('overview').innerHTML=`<div class="item" style="margin-bottom:16px"><h2>Besoin d’un artisan ?</h2><p>Déposez votre demande directement depuis votre espace. Vous n’avez pas besoin de revenir à l’accueil.</p><button class="btn primary" onclick="startProject()">+ Déposer une demande</button></div><div class="dashGrid"><div class="stat"><strong>${projects.length}</strong><span>demande(s)</span></div><div class="stat"><strong>${matches.length}</strong><span>match(s)</span></div><div class="stat"><strong>${matches.filter(m=>m.status==='interested').length}</strong><span>artisan(s) intéressé(s)</span></div></div>`
  $('projects').innerHTML=projects.length?`<div style="margin-bottom:14px"><button class="btn primary" onclick="startProject()">+ Nouvelle demande</button></div><div class="list">${projects.map(p=>{const ms=matches.filter(m=>m.project_id===p.id);return `<div class="item"><span class="badge ${p.status==='matched'?'ok':''}">${esc(p.status)}</span><h3>${esc(p.title)}</h3><div class="meta">${esc(p.category)} • ${esc(p.city)} ${esc(p.postal_code)}</div><p>${esc(p.description)}</p><b>Artisans proposés (${ms.length}/3)</b>${ms.map(m=>{const a=artisans.find(x=>x.id===m.artisan_id)||{};return `<div class="item" style="margin-top:8px"><b>${esc(a.company_name||a.full_name||'Artisan')}</b> ${a.verified?'✓':''}<div class="meta">${esc(a.city)} • score ${m.score}% • ${esc(m.status)}</div></div>`}).join('')}</div>`}).join('')}</div>`:'<div class="item"><h3>Aucune demande pour le moment</h3><p>Commencez en décrivant vos travaux.</p><button class="btn primary" onclick="startProject()">Déposer ma première demande</button></div>'
}

async function loadArtisan(){
  const {data:matches=[]}=await sb.from('matches').select('*').eq('artisan_id',session.user.id).order('created_at',{ascending:false})
  const ids=matches.map(m=>m.project_id)
  let projects=[]
  if(ids.length){ const r=await sb.from('projects').select('*').in('id',ids); projects=r.data||[] }
  $('overview').innerHTML=`<div class="dashGrid"><div class="stat"><strong>${matches.length}</strong><span>opportunité(s)</span></div><div class="stat"><strong>${matches.filter(m=>m.status==='interested').length}</strong><span>intérêt(s)</span></div><div class="stat"><strong>${profile.verified?'Oui':'Non'}</strong><span>profil vérifié</span></div></div>`
  $('projects').innerHTML=matches.length?`<div class="list">${matches.map(m=>{const p=projects.find(x=>x.id===m.project_id)||{};return `<div class="item"><span class="badge ${m.status==='interested'?'ok':''}">${esc(m.status)}</span><h3>${esc(p.title||'Projet')}</h3><div class="meta">${esc(p.category)} • ${esc(p.city)} ${esc(p.postal_code)} • score ${m.score}%</div><p>${esc(p.description)}</p><div class="actions"><button class="btn primary" onclick="answerMatch('${m.id}','interested')">Je suis intéressé</button><button class="btn ghost" onclick="answerMatch('${m.id}','declined')">Décliner</button></div></div>`}).join('')}</div>`:'<div class="notice">Aucune opportunité. Complétez vos métiers et votre ville.</div>'
}

window.answerMatch=async(id,status)=>{ const {error}=await sb.from('matches').update({status}).eq('id',id); if(error) alert(error.message); else loadDashboard() }

function renderProfile(){
  const artisan=profile.role==='artisan'
  $('profile').innerHTML=`<form id="profileForm" class="two"><div class="field"><label>Nom complet</label><input id="fName" value="${esc(profile.full_name)}"></div><div class="field"><label>Téléphone</label><input id="fPhone" value="${esc(profile.phone)}"></div><div class="field"><label>Ville</label><input id="fCity" value="${esc(profile.city)}"></div><div class="field"><label>Code postal</label><input id="fPostal" value="${esc(profile.postal_code)}"></div>${artisan?`<div class="field"><label>Entreprise</label><input id="fCompany" value="${esc(profile.company_name)}"></div><div class="field"><label>SIRET</label><input id="fSiret" value="${esc(profile.siret)}"></div><div class="field full"><label>Métiers, séparés par des virgules</label><input id="fTrades" value="${esc((profile.trades||[]).join(', '))}"></div><div class="field"><label>Rayon d'intervention (km)</label><input id="fRadius" type="number" value="${profile.service_radius_km||30}"></div>`:''}<button class="btn primary full">Enregistrer</button><div id="profileMsg" class="full"></div></form>`
  $('profileForm').onsubmit=async e=>{
    e.preventDefault()
    const patch={full_name:$('fName').value.trim(),phone:$('fPhone').value.trim(),city:$('fCity').value.trim(),postal_code:$('fPostal').value.trim(),updated_at:new Date().toISOString()}
    if(artisan){ patch.company_name=$('fCompany').value.trim(); patch.siret=$('fSiret').value.trim(); patch.trades=$('fTrades').value.split(',').map(x=>x.trim()).filter(Boolean); patch.service_radius_km=Number($('fRadius').value||30) }
    const {data,error}=await sb.from('profiles').update(patch).eq('id',session.user.id).select().single()
    if(error) return msg('profileMsg',error.message,'error')
    profile=data
    msg('profileMsg','Profil enregistré.','success')
  }
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'))
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'))
  b.classList.add('active')
  const panel=$(b.dataset.tab)
  if(panel) panel.classList.add('active')
})

boot().then(()=>{
  if(session&&localStorage.getItem('openProject')){
    localStorage.removeItem('openProject')
    setTimeout(async()=>{await showDashboard(); startProject()},300)
  }
}).catch(console.error)
