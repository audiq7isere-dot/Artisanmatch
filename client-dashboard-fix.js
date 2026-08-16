(async function(){
  const supa = window.supabase.createClient(
    'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
    'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
  )
  const $ = id => document.getElementById(id)
  let currentProfile = null

  async function refreshClientUI(){
    const {data:{session}} = await supa.auth.getSession()
    if(!session) return
    const {data:prof} = await supa.from('profiles').select('*').eq('id',session.user.id).maybeSingle()
    currentProfile = prof || {id:session.user.id, role:'client', full_name:'Client'}
    if(currentProfile.role !== 'client') return

    const btn = $('newProjectBtn')
    if(btn){
      btn.style.display='inline-flex'
      btn.textContent='+ Déposer une demande'
      btn.onclick=()=>window.startProject()
    }

    if($('hello') && (!$('hello').textContent || $('hello').textContent==='Mon espace')){
      $('hello').textContent=`Bonjour ${currentProfile.full_name||''}`.trim()
    }

    const overview=$('overview')
    if(overview && !overview.innerHTML.trim()){
      overview.innerHTML='<div class="item"><h2>Besoin d’un artisan ?</h2><p>Déposez votre demande directement depuis votre espace.</p><button class="btn primary" id="fallbackProjectBtn">+ Déposer une demande</button></div>'
      $('fallbackProjectBtn').onclick=()=>window.startProject()
    }
  }

  window.startProject = async function(quick){
    const {data:{session}} = await supa.auth.getSession()
    if(!session){
      if(typeof window.openAuth==='function') window.openAuth('signup','client')
      return
    }
    const {data:prof} = await supa.from('profiles').select('role').eq('id',session.user.id).maybeSingle()
    if(prof?.role === 'artisan'){
      alert('La création de demande est réservée aux particuliers.')
      return
    }
    if(quick){
      if($('qCat')&&$('pCat')) $('pCat').value=$('qCat').value
      const q=$('qCity')?.value?.trim()||''
      if($('pCity')) $('pCity').value=q.replace(/\d{5}/,'').trim()
      const m=q.match(/\d{5}/)
      if($('pPostal')) $('pPostal').value=m?m[0]:''
      if($('qWhen')&&$('pWhen')) $('pWhen').value=$('qWhen').value
    }
    if($('projectMsg')) $('projectMsg').innerHTML=''
    $('projectModal')?.classList.add('open')
  }

  document.addEventListener('click',e=>{
    const tab=e.target.closest('.tab')
    if(tab) setTimeout(refreshClientUI,100)
  })

  await refreshClientUI()
  setTimeout(refreshClientUI,500)
  setTimeout(refreshClientUI,1500)
})();