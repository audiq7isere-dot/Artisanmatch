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

  async function redirectIfAdmin() {
    if (await getAdminState()) {
      if (!location.pathname.endsWith('/admin.html')) location.href = '/admin.html'
      return true
    }
    return false
  }

  const dashBtn = document.getElementById('dashBtn')
  if (dashBtn) {
    const normalDashboard = dashBtn.onclick
    dashBtn.onclick = async e => {
      e.preventDefault()
      if (await redirectIfAdmin()) return
      if (typeof normalDashboard === 'function') return normalDashboard.call(dashBtn, e)
      if (typeof window.showDashboard === 'function') return window.showDashboard()
    }
  }

  sbAdminRoute.auth.onAuthStateChange(async (event, session) => {
    if (!session || event === 'SIGNED_OUT') return
    setTimeout(() => redirectIfAdmin(), 150)
  })

  setTimeout(() => redirectIfAdmin(), 250)
})()
