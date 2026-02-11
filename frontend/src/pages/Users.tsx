import { useEffect, useState } from 'react'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  User,
  Mail,
  Shield,
  Calendar,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

type UserRow = {
  id: number
  email: string
  full_name: string
  role: string
  department_id: number | null
  is_active: boolean
  created_at: string
}

const roleConfig: Record<string, { label: string, color: string }> = {
  'user': { label: 'User', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  'staff': { label: 'Staff', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  'admin': { label: 'Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  'super_admin': { label: 'Super Admin', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'staff' })
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [creating, setCreating] = useState(false)

  const isSuperAdmin = currentUser?.role === 'super_admin'

  const load = () => {
    API.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await API.post('/users', form)
      setForm({ email: '', password: '', full_name: '', role: 'staff' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" />
          <p className="text-muted-foreground animate-pulse text-sm">Loading Team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage users and access controls</p>
        </div>
        {isSuperAdmin && (
          <Button variant="glass" size="lg" className="group shrink-0" onClick={() => setShowForm(!showForm)}>
            {showForm ? <XCircle className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />}
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        )}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* User List Section */}
        <motion.div
          className={cn("space-y-6 transition-all duration-500", showForm && isSuperAdmin ? "lg:col-span-2" : "lg:col-span-3")}
          layout
        >
          <Card className="min-h-[600px] flex flex-col">
            <CardHeader className="border-b border-white/5 pb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 max-w-md bg-white/5 border-white/10 focus:border-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-white">No users found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="p-6 font-medium">User</th>
                        <th className="p-6 font-medium">Role</th>
                        <th className="p-6 font-medium">Status</th>
                        <th className="p-6 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {filteredUsers.map((u, index) => (
                          <motion.tr
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="group border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-white/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                  <span className="text-sm font-bold text-white uppercase">{u.full_name?.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white group-hover:text-primary transition-colors">{u.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border capitalize", (roleConfig[u.role] || roleConfig.user).color)}>
                                {u.role.replace('_', ' ')}
                              </div>
                            </td>
                            <td className="p-6">
                              {u.is_active ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                  <XCircle className="w-3.5 h-3.5" /> Inactive
                                </div>
                              )}
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(u.created_at).toLocaleDateString()}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Create User Form Section */}
        <AnimatePresence>
          {showForm && isSuperAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-6 border-primary/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/50">
                <CardHeader>
                  <CardTitle>Add New User</CardTitle>
                  <CardDescription>Create a new account for a staff member or admin.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                      <Input
                        placeholder="John Doe"
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                      <Input
                        type="password"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/50 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                        </>
                      ) : (
                        "Create User"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
