(() => {
  const el = document.getElementById('openProjectsList')
  if (!el || !window.supabase) return

  if (!document.getElementById('categoryStyles')) {
    document.head.insertAdjacentHTML('beforeend', `<style id="categoryStyles">
      .categorySection{background:#fff;padding:66px 0}.categoryGrid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}.categoryCard{position:relative;min-height:220px;border:0;border-radius:22px;overflow:hidden;padding:18px;color:#fff;text-align:left;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;background-size:cover;background-position:center;box-shadow:0 12px 32px rgba(15,35,75,.13);transition:.22s}.categoryCard:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,17,38,.04) 20%,rgba(7,17,38,.82) 100%)}.categoryCard>*{position:relative;z-index:1}.categoryCard:hover{transform:translateY(-5px);box-shadow:0 18px 42px rgba(15,35,75,.22)}.categoryCard span{font-size:25px;margin-bottom:auto;background:rgba(255,255,255,.9);width:42px;height:42px;border-radius:13px;display:grid;place-items:center}.categoryCard strong{font-size:18px;margin-bottom:3px}.categoryCard small{font-size:12px;color:#dce5f4}.catKitchen{background-image:url('https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=800&q=78')}.catBath{background-image:url('https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=78')}.catElec{background-image:url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=78')}.catPaint{background-image:url('https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=78')}.catRoof{background-image:url('https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=800&q=78')}.catRenov{background-image:url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=78')}.clientPrivate{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#7b7b7b;background:#f4f4f2;border:1px solid #e4e4df;border-radius:999px;padding:7px 10px;margin:2px 0 8px}.clientPrivate .blurName{filter:blur(4px);user-select:none}@media(max-width:1000px){.categoryGrid{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.categorySection{padding:52px 0}.categoryGrid{display:flex;overflow-x:auto;gap:12px;padding-bottom:8px;scroll-snap-type:x mandatory}.categoryCard{min-width:72vw;min-height:210px;scroll-snap-align:start}}
    </style>`)
  }

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
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'
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
        <div class="clientPrivate">🔒 Client : <span class="blurName">Nom masqué</span></div>
        <p><b>📍 ${esc(p.city || 'Localisation à préciser')}</b></p>
        <p>Budget : ${esc(budget)}</p>
        <p>Démarrage : ${esc(p.desired_start || 'À définir')}</p>
        <button class="btn primary" onclick="openAuth('signup','artisan')">Je suis intéressé</button>
      </article>`
    }).join('')
  }

  loadOpenProjects()
})()
