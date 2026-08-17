(() => {
  const $ = id => document.getElementById(id)
  const form = $('authForm')
  if (!form || !window.supabase) return

  const nameField = $('nameField')
  const companyField = $('artisanCompanyField')
  const siretField = $('artisanSiretField')
  const companyInput = $('authCompany')
  const siretInput = $('authSiret')

  function ensureContactFields() {
    if (!$('artisanContactField')) {
      const block = document.createElement('div')
      block.id = 'artisanContactField'
      block.className = 'field'
      block.style.display = 'none'
      block.innerHTML = '<label>Nom du contact *</label><input id="authContactName" maxlength="120" autocomplete="name" placeholder="Prénom et nom du responsable"><small>Personne à contacter pour les demandes de travaux.</small>'
      companyField?.insertAdjacentElement('afterend', block)
    }
    if (!$('artisanPhoneField')) {
      const block = document.createElement('div')
      block.id = 'artisanPhoneField'
      block.className = 'field'
      block.style.display = 'none'
      block.innerHTML = '<label>Téléphone du contact *</label><input id="authPhone" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="Ex. 06 12 34 56 78"><small>Numéro utilisé pour joindre l’entreprise.</small>'
      $('artisanContactField')?.insertAdjacentElement('afterend', block)
    }
  }

  ensureContactFields()

  function isSignup() { return $('roleChoice') && getComputedStyle($('roleChoice')).display !== 'none' }
  function isArtisan() { return $('artisanRole')?.classList.contains('active') }
  function syncFields() {
    ensureContactFields()
    const artisan = isSignup() && isArtisan()
    if (nameField) nameField.style.display = artisan ? 'none' : 'grid'
    if (companyField) companyField.style.display = artisan ? 'grid' : 'none'
    if (siretField) siretField.style.display = artisan ? 'grid' : 'none'
    if ($('artisanContactField')) $('artisanContactField').style.display = artisan ? 'grid' : 'none'
    if ($('artisanPhoneField')) $('artisanPhoneField').style.display = artisan ? 'grid' : 'none'
    if ($('authName')) $('authName').required = !artisan && isSignup()
    if (companyInput) companyInput.required = artisan
    if (siretInput) siretInput.required = artisan
    if ($('authContactName')) $('authContactName').required = artisan
    if ($('authPhone')) $('authPhone').required = artisan
  }

  $('clientRole')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('artisanRole')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('signupBtn')?.addEventListener('click', () => setTimeout(syncFields, 0))
  $('loginBtn')?.addEventListener('click', () => setTimeout(syncFields, 0))
  document.addEventListener('click', e => { if (e.target?.id === 'switchAuth') setTimeout(syncFields, 0) })

  if (siretInput) siretInput.addEventListener('input', () => { siretInput.value = siretInput.value.replace(/\D/g, '').slice(0, 14) })

  const sbArtisan = window.supabase.createClient(
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
    return error?.message || 'Impossible de vérifier le SIRET pour le moment. Réessayez.'
  }

  form.addEventListener('submit', async e => {
    if (!isSignup() || !isArtisan()) return
    e.preventDefault()
    e.stopImmediatePropagation()

    const email = $('authEmail').value.trim().toLowerCase()
    const password = $('authPassword').value
    const company_name = ($('authCompany')?.value || '').trim()
    const contact_name = ($('authContactName')?.value || '').trim()
    const phone = ($('authPhone')?.value || '').trim()
    const siret = ($('authSiret')?.value || '').replace(/\D/g, '')
    const button = $('authSubmit')
    const out = $('authMsg')
    const showMsg = (text, cls='') => { if(out) out.innerHTML = `<div class="notice ${cls}">${String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</div>` }

    if (!company_name) return showMsg('Le nom de la société est obligatoire.', 'error')
    if (!contact_name) return showMsg('Le nom du contact est obligatoire.', 'error')
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) return showMsg('Indiquez un numéro de téléphone valide pour le contact.', 'error')
    if (!/^\d{14}$/.test(siret)) return showMsg('Le SIRET doit contenir exactement 14 chiffres.', 'error')
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return showMsg('Le mot de passe doit contenir au moins 8 caractères, avec une lettre et un chiffre.', 'error')

    button.disabled = true
    button.textContent = 'Vérification du SIRET…'
    showMsg('Vérification du SIRET et du nom de société auprès du registre officiel…')
    try {
      const { data, error } = await sbArtisan.functions.invoke('register-user', {
        body: { email, password, full_name: contact_name, contact_name, phone, role: 'artisan', company_name, siret }
      })
      if (error || !data?.ok) {
        const message = await extractFunctionError(error, data)
        return showMsg(message, 'error')
      }

      const login = await sbArtisan.auth.signInWithPassword({ email, password })
      if (login.error) return showMsg('Compte vérifié et créé. Utilisez maintenant le bouton Connexion.', 'success')
      showMsg(`SIRET vérifié ✓ — ${data.company_name || company_name}. Compte créé.`, 'success')
      setTimeout(() => location.reload(), 700)
    } catch (err) {
      console.error(err)
      showMsg('Une erreur est survenue pendant la vérification. Réessayez.', 'error')
    } finally {
      button.disabled = false
      button.textContent = 'Créer mon compte'
    }
  }, true)

  const observer = new MutationObserver(() => {
    const company = $('fCompany'), siret = $('fSiret')
    if (company && !company.readOnly) { company.readOnly = true; company.title = 'Nom vérifié lors de la création du compte' }
    if (siret && !siret.readOnly) {
      siret.readOnly = true
      siret.title = 'SIRET vérifié lors de la création du compte'
      const parent = siret.closest('.field')
      if (parent && !parent.querySelector('.legal-verified-note')) parent.insertAdjacentHTML('beforeend','<small class="legal-verified-note">🔒 SIRET vérifié lors de la création du compte. Contactez ArtisanMatch pour le modifier.</small>')
    }
  })
  observer.observe(document.body,{subtree:true,childList:true})

  syncFields()
})()
