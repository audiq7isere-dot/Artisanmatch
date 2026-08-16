import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const sb = createClient(
  'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
  'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
)

const $ = id => document.getElementById(id)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
const show = (text, type='') => {
  const el = $('authMsg')
  if (el) el.innerHTML = `<div class="notice ${type}">${esc(text)}</div>`
}

function currentMode(){
  return ($('authTitle')?.textContent || '').toLowerCase().includes('créer') ? 'signup' : 'login'
}
function currentRole(){
  return $('artisanRole')?.classList.contains('active') ? 'artisan' : 'client'
}

const form = $('authForm')
if (form) {
  form.onsubmit = async (e) => {
    e.preventDefault()
    const mode = currentMode()
    const email = $('authEmail').value.trim().toLowerCase()
    const password = $('authPassword').value
    const btn = $('authSubmit')

    btn.disabled = true
    show(mode === 'signup' ? 'Création du compte…' : 'Connexion…')

    try {
      if (mode === 'signup') {
        const full_name = $('authName').value.trim()
        const role = currentRole()
        if (!full_name) return show('Indiquez votre nom complet.', 'error')
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
          return show('Le mot de passe doit contenir au moins 8 caractères, avec des lettres et un chiffre.', 'error')
        }

        const { data, error } = await sb.functions.invoke('register-user', {
          body: { email, password, full_name, role }
        })
        if (error) {
          let detail = 'Impossible de créer le compte.'
          try {
            const ctx = await error.context?.json?.()
            if (ctx?.error) detail = ctx.error
          } catch (_) {}
          return show(detail, 'error')
        }
        if (!data?.ok) return show(data?.error || 'Impossible de créer le compte.', 'error')

        const login = await sb.auth.signInWithPassword({ email, password })
        if (login.error) return show('Compte créé, mais la connexion automatique a échoué. Essayez de vous connecter.', 'error')

        show('Compte créé et connexion réussie.', 'success')
        setTimeout(() => {
          window.closeModal?.('authModal')
          location.reload()
        }, 500)
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) {
          const m = error.message.toLowerCase()
          if (m.includes('invalid login credentials')) return show('E-mail ou mot de passe incorrect.', 'error')
          if (m.includes('email not confirmed')) return show('Votre adresse e-mail n’est pas encore confirmée.', 'error')
          return show('Connexion impossible pour le moment. Réessayez.', 'error')
        }
        show('Connexion réussie.', 'success')
        setTimeout(() => {
          window.closeModal?.('authModal')
          location.reload()
        }, 300)
      }
    } catch (_) {
      show('Une erreur de connexion est survenue. Vérifiez votre réseau puis réessayez.', 'error')
    } finally {
      btn.disabled = false
    }
  }
}

const password = $('authPassword')
if (password) password.minLength = 8
