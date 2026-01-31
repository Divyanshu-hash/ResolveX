import { useEffect, useState } from 'react'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

type UserRow = {
  id: number
  email: string
  full_name: string
  role: string
  department_id: number | null
  is_active: boolean
  created_at: string
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'staff' })
  const [error, setError] = useState('')

  const isSuperAdmin = currentUser?.role === 'super_admin'

  useEffect(() => {
    API.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await API.post('/users', form)
      setForm({ email: '', password: '', full_name: '', role: 'staff' })
      setShowForm(false)
      const { data } = await API.get('/users')
      setUsers(data)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create user')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Users</h1>
        {isSuperAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium"
          >
            {showForm ? 'Cancel' : 'Add user'}
          </button>
        )}
      </div>

      {showForm && isSuperAdmin && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Create user (staff / admin)</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium">
              Create
            </button>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4 text-slate-200">{u.full_name}</td>
                  <td className="p-4 text-slate-400 text-sm">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
