(() => {
  const el = document.getElementById('openProjectsList')
  if (!el || !window.supabase) return

  const openSection = document.getElementById('openProjects')
  if (openSection && !document.getElementById('popularCategories')) {
    openSection.insertAdjacentHTML('beforebegin', `
      <section id="popularCategories" class="categorySection">
        <div class="wrap">
          <div class="title"><span class="pill">Trouvez le bon pro</span><h2>Quel projet avez-vous en tête ?</h2><p>Choisissez votre besoin et déposez votre demande en quelques minutes.</p></div>
          <div class="categoryGrid">
            <button class="categoryCard catKitchen" onclick="prefillProject('Cuisine')"><span>🍽️</span><strong>Cuisine</strong><small>Pose & rénovation</small></button>
            <button class="categoryCard catBath" onclick="prefillProject('Salle de bain')"><span>🚿</span><strong>Salle de bain</strong><small>Création & rénovation</small></button>
            <button class="categoryCard catElec" onclick="prefillProject('Électricité')"><span>⚡</span><strong>Électricité</strong><small>Installation & dépannage</small></button>
            <button class="categoryCard catPaint" onclick="prefillProject('Peinture')"><span>🎨</span><strong>Peinture</strong><small>Intérieur & extérieur</small></button>
            <button class="categoryCard catRoof" onclick="prefillProject('Toiture')"><span>🏠</span><strong>Toiture</strong><small>Réparation & rénovation</small></button>
            <button class="categoryCard catRenov" onclick="prefillProject('Rénovation générale')"><span>🔨</span><strong>Rénovation</strong><small>Projet complet</small></button>
          </div>
        </div>
      </section>`)
  }

  window.prefillProject = category => {
    if (typeof window.startProject === 'function') window.startProject()
    setTimeout(() => {
      const select = document.getElementById('pCat')
      if (select) select.value = category
    }, 30)
  }

  const client = window.supabase.createClient(
    'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
    'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
  )

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]))

  const money = n => n === null || n === undefined || n === ''
    ? null
    : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(n)) + ' €'

  async function loadOpenProjects() {
    const { data, error } = await client.rpc('list_public_open_projects')
    if (error) {
      console.error(error)
      el.innerHTML = '<div class="notice">Impossible de charger les projets pour le moment.</div>'
      return
    }

    if (!data || !data.length) {
      el.innerHTML = '<div class="notice">Aucune demande en attente pour le moment.</div>'
      return
    }

    el.innerHTML = data.map(p => {
      const min = money(p.budget_min)
      const max = money(p.budget_max)
      const budget = min && max ? `${min} – ${max}` : (max ? `Jusqu’à ${max}` : (min ? `À partir de ${min}` : 'Budget à définir'))
      return `<article class="card">
        <span class="pill">${esc(p.category || 'Travaux')}</span>
        <h3>${esc(p.title || 'Projet de travaux')}</h3>
        <p><b>📍 ${esc(p.city || 'Localisation à préciser')}</b></p>
        <p>Budget : ${esc(budget)}</p>
        <p>Démarrage : ${esc(p.desired_start || 'À définir')}</p>
        <button class="btn primary" onclick="openAuth('signup','artisan')">Je suis intéressé</button>
      </article>`
    }).join('')
  }

  loadOpenProjects()
})()
