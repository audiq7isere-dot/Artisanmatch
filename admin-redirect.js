(() => {
  if (!window.supabase) return

  const sbAdminRoute = window.supabase.createClient(
    'https://nbhkvxfovrzhvdbdyxmy.supabase.co',
    'sb_publishable_VTcWIZ2ibkOP8coT-GiPXw_XLqiacbZ'
  )

  async function getAdminState() {
    const { data: { session } } = await sbAdminRoute.auth.getSession()
    if (!session) return false
    const { data, error } = await sbAdminRoute
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (error) {
      console.error('Admin role check failed', error)
      return false
    }
    return data?.role === 'admin'
  }

  async function openDashboard() {
    if (await getAdminState()) {
      location.href = '/admin.html'
      return true
    }
    return false
  }

  // An admin is allowed to stay on the public homepage.
  // Only the "Mon espace" button sends an admin to the admin dashboard.
  const dashBtn = document.getElementById('dashBtn')
  if (dashBtn) {
    const normalDashboard = dashBtn.onclick
    dashBtn.onclick = async e => {
      e.preventDefault()
      if (await openDashboard()) return
      if (typeof normalDashboard === 'function') return normalDashboard.call(dashBtn, e)
      if (typeof window.showDashboard === 'function') return window.showDashboard()
    }
  }
})()
