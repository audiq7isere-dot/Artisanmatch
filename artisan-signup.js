(() => {
  const $ = id => document.getElementById(id)
  const form = $('authForm')
  if (!form || !window.supabase) return

  const nameField = $('nameField')
  if (nameField && !$('artisanCompanyField')) {
    nameField.insertAdjacentHTML('afterend', `
      <div class="field" id="artisanCompanyField" style="display:none">
        <label>Nom de la société *</label>
        <input id="authCompany" autocomplete="organization" placeholder="Raison sociale officielle">
      </div>
      <div class="field" id="artisanSiretField" style="display:none">
        <label>SIRET *</label>
        <input id="authSiret" inputmode="numeric" maxlength="17" autocomplete="off" placeholder="14 chiffres">
        <small>Le SIRET sera vérifié automatiquement dans le registre public des entreprises.</small>
      </div>`)
  }

  const companyField = $('artisanCompanyField')
  const siretField = $('artisanSiretField')
  const companyInput = $('authCompany')
  const siretInput = $('authSiret')

  function isSignup() {
    return $('roleChoice') && getComputedStyle($('roleChoice')).display !== 'none'
  }
  function isArtisan() {
    return $('artisanRole')?.classList.contains('active')
  }
  function syncFields() {
    const show = isSignup() && isArtisan()
    if (companyField) companyField.style.display = show ? 'grid' : 'none'
    if (siretField) siretField.style.display = show ? 'grid' : 'none'
    if (companyInput) companyInput.required = show
    if (siretInput) siretInput.required = show
  }

  $('clientRole')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('artisanRole')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('signupBtn')?.addEventListener('click', () => setTimeout(syncFields, 0))
  document.addEventListener('click', e => {
    if (e.target?.id === 'switchAuth') setTimeout(syncFields, 0)
  })

  if (siretInput) {
    siretInput.addEventListener('input', () => {
      const digits = siretInput.value.replace(/\D/g, '').slice(0, 14)
      siretInput.value = digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
    })
  }

  const sbArtisan = window.supabase.createClient(
    'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
    'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
  )

  form.addEventListener('submit', async e => {
    if (!isSignup() || !isArtisan()) return
    e.preventDefault()
    e.stopImmediatePropagation()

    const email = $('authEmail').value.trim().toLowerCase()
    const password = $('authPassword').value
    const full_name = $('authName').value.trim()
    const company_name = (companyInput?.value || '').trim()
    const siret = (siretInput?.value || '').replace(/\D/g, '')
    const button = $('authSubmit')
    const out = $('authMsg')
    const showMsg = (text, cls='') => { if(out) out.innerHTML = `<div class="notice ${cls}">${String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</div>` }

    if (!company_name) return showMsg('Le nom de la société est obligatoire.', 'error')
    if (!/^\d{14}$/.test(siret)) return showMsg('Le SIRET doit contenir exactement 14 chiffres.', 'error')
    if (!full_name) return showMsg('Indiquez votre nom complet.', 'error')
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return showMsg('Le mot de passe doit contenir au moins 8 caractères, avec une lettre et un chiffre.', 'error')

    button.disabled = true
    showMsg('Vérification du SIRET et de la société…')
    try {
      const { data, error } = await sbArtisan.functions.invoke('register-user', {
        body: { email, password, full_name, role: 'artisan', company_name, siret }
      })
      if (error && !data) return showMsg('Impossible de vérifier le SIRET pour le moment. Réessayez.', 'error')
      if (!data?.ok) return showMsg(data?.error || 'Le SIRET ou le nom de société ne correspondent pas.', 'error')

      const login = await sbArtisan.auth.signInWithPassword({ email, password })
      if (login.error) return showMsg('Compte créé. Utilisez maintenant le bouton Connexion.', 'success')
      showMsg(`SIRET vérifié ✓ — ${data.company_name || company_name}. Compte créé.`, 'success')
      setTimeout(() => {
        window.closeModal?.('authModal')
        window.showDashboard?.()
      }, 700)
    } catch (err) {
      console.error(err)
      showMsg('Une erreur est survenue pendant la vérification. Réessayez.', 'error')
    } finally {
      button.disabled = false
    }
  }, true)

  syncFields()
})()
