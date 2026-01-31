import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/complaints', label: 'Complaints', icon: '📋' },
  { to: '/complaints/new', label: 'New Complaint', icon: '➕' },
  { to: '/analytics', label: 'Analytics', icon: '📈', roles: ['admin', 'super_admin'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['admin', 'super_admin'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = nav.filter((l) => !l.roles || (user && l.roles.includes(user.role)))

  return (
    <div className="min-h-screen flex bg-slate-950">
      <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-primary-400">ResolveX</h1>
          <p className="text-slate-400 text-sm mt-0.5">Issue Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600/30 text-primary-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <span>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <div className="px-3 py-2 text-sm text-slate-400 truncate" title={user?.email}>
            {user?.full_name}
          </div>
          <div className="px-3 py-1 text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
