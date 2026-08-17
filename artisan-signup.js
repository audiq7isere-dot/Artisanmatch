(() => {
  const $ = id => document.getElementById(id)
  const form = $('authForm')
  if (!form || !window.supabase) return

  const nameField = $('nameField')
  const phoneField = $('contactPhoneField')
  const companyField = $('artisanCompanyField')
  const siretField = $('artisanSiretField')
  const companyInput = $('authCompany')
  const siretInput = $('authSiret')

  function ensureClientAddressFields() {
    if (!$('clientAddressField')) {
      const block = document.createElement('div')
      block.id = 'clientAddressField'
      block.className = 'field'
      block.style.display = 'none'
      block.innerHTML = '<label>Adresse *</label><input id="authAddress" maxlength="220" autocomplete="street-address" placeholder="Ex. 12 rue de la République">'
      phoneField?.insertAdjacentElement('afterend', block)
    }
    if (!$('clientCityField')) {
      const block = document.createElement('div')
      block.id = 'clientCityField'
      block.className = 'field'
      block.style.display = 'none'
      block.innerHTML = '<label>Ville *</label><input id="authCity" maxlength="100" autocomplete="address-level2" placeholder="Ex. Chambéry">'
      $('clientAddressField')?.insertAdjacentElement('afterend', block)
    }
    if (!$('clientPostalField')) {
      const block = document.createElement('div')
      block.id = 'clientPostalField'
      block.className = 'field'
      block.style.display = 'none'
      block.innerHTML = '<label>Code postal *</label><input id="authPostal" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="73000" oninput="this.value=this.value.replace(/[^0-9]/g,\'\').slice(0,5)">'
      $('clientCityField')?.insertAdjacentElement('afterend', block)
    }
  }

  function ensureArtisanContactField() {
    if (!$('artisanContactField')) {
      const block = document.createElement('div')
      block.id = 'artisanContactField'
      block.className = 'field'
      block.style.display = 'none'
      block.innerHTML = '<label>Nom du contact *</label><input id="authContactName" maxlength="120" autocomplete="name" placeholder="Prénom et nom du responsable"><small>Personne à contacter pour les demandes de travaux.</small>'
      companyField?.insertAdjacentElement('afterend', block)
    }
  }

  ensureClientAddressFields()
  ensureArtisanContactField()

  function isSignup() { return $('roleChoice') && getComputedStyle($('roleChoice')).display !== 'none' }
  function isArtisan() { return $('artisanRole')?.classList.contains('active') }
  function syncFields() {
    ensureClientAddressFields(); ensureArtisanContactField()
    const signup = isSignup()
    const artisan = signup && isArtisan()
    const client = signup && !artisan

    if (nameField) nameField.style.display = client ? 'grid' : 'none'
    if (phoneField) phoneField.style.display = signup ? 'grid' : 'none'
    if (companyField) companyField.style.display = artisan ? 'grid' : 'none'
    if (siretField) siretField.style.display = artisan ? 'grid' : 'none'
    if ($('artisanContactField')) $('artisanContactField').style.display = artisan ? 'grid' : 'none'
    if ($('clientAddressField')) $('clientAddressField').style.display = client ? 'grid' : 'none'
    if ($('clientCityField')) $('clientCityField').style.display = client ? 'grid' : 'none'
    if ($('clientPostalField')) $('clientPostalField').style.display = client ? 'grid' : 'none'

    if ($('authName')) $('authName').required = client
    if ($('authPhone')) $('authPhone').required = signup
    if (companyInput) companyInput.required = artisan
    if (siretInput) siretInput.required = artisan
    if ($('authContactName')) $('authContactName').required = artisan
    if ($('authAddress')) $('authAddress').required = client
    if ($('authCity')) $('authCity').required = client
    if ($('authPostal')) $('authPostal').required = client
  }

  $('clientRole')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('artisanRole')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('signupBtn')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('loginBtn')?.addEventListener('click', () => setTimeout(syncFields, 0))
  document.addEventListener('click', e => { if (e.target?.id === 'switchAuth') setTimeout(syncFields, 0) })
  if (siretInput) siretInput.addEventListener('input', () => { siretInput.value = siretInput.value.replace(/\D/g, '').slice(0, 14) })

  const sbSignup = window.supabase.createClient(
    'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
    'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
  )

  async function extractFunctionError(error, data) {
    if (data?.error) return data.error
    try {
      const ctx = error?.context
      if (ctx && typeof ctx.json === 'function') {
        const payload = await ctx.json()
        if (payload?.error) return payload.error
      }
    } catch (_) {}
    return error?.message || 'Impossible de créer le compte pour le moment.'
  }

  form.addEventListener('submit', async e => {
    if (!isSignup()) return
    e.preventDefault(); e.stopImmediatePropagation()

    const artisan = isArtisan()
    const email = $('authEmail').value.trim().toLowerCase()
    const password = $('authPassword').value
    const phone = ($('authPhone')?.value || '').trim()
    const full_name = artisan ? (($('authContactName')?.value || '').trim()) : (($('authName')?.value || '').trim())
    const button = $('authSubmit')
    const out = $('authMsg')
    const showMsg = (text, cls='') => { if(out) out.innerHTML = `<div class="notice ${cls}">${String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</div>` }

    if (!full_name) return showMsg(artisan ? 'Le nom du contact est obligatoire.' : 'Votre nom complet est obligatoire.', 'error')
    if (phone.replace(/\D/g, '').length < 10) return showMsg('Indiquez un numéro de téléphone valide.', 'error')
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return showMsg('Le mot de passe doit contenir au moins 8 caractères, avec une lettre et un chiffre.', 'error')

    const body = { email, password, full_name, phone, role: artisan ? 'artisan' : 'client' }
    if (artisan) {
      const company_name = ($('authCompany')?.value || '').trim()
      const siret = ($('authSiret')?.value || '').replace(/\D/g, '')
      if (!company_name) return showMsg('Le nom de la société est obligatoire.', 'error')
      if (!/^\d{14}$/.test(siret)) return showMsg('Le SIRET doit contenir exactement 14 chiffres.', 'error')
      Object.assign(body, { contact_name: full_name, company_name, siret })
    } else {
      const address = ($('authAddress')?.value || '').trim()
      const city = ($('authCity')?.value || '').trim()
      const postal_code = ($('authPostal')?.value || '').replace(/\D/g, '')
      if (!address) return showMsg('Votre adresse est obligatoire.', 'error')
      if (!city) return showMsg('Votre ville est obligatoire.', 'error')
      if (!/^\d{5}$/.test(postal_code)) return showMsg('Le code postal doit contenir 5 chiffres.', 'error')
      Object.assign(body, { address, city, postal_code })
    }

    button.disabled = true
    button.textContent = artisan ? 'Vérification du SIRET…' : 'Création du compte…'
    showMsg(artisan ? 'Vérification du SIRET et du nom de société…' : 'Création de votre compte…')
    try {
      const { data, error } = await sbSignup.functions.invoke('register-user', { body })
      if (error || !data?.ok) return showMsg(await extractFunctionError(error, data), 'error')
      const login = await sbSignup.auth.signInWithPassword({ email, password })
      if (login.error) return showMsg('Compte créé. Utilisez maintenant le bouton Connexion.', 'success')
      showMsg('Compte créé et connexion réussie.', 'success')
      setTimeout(() => location.reload(), 700)
    } catch (err) {
      console.error(err); showMsg('Une erreur est survenue. Réessayez.', 'error')
    } finally {
      button.disabled = false; button.textContent = 'Créer mon compte'
    }
  }, true)

  syncFields()
})()
