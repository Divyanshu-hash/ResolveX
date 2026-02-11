import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Inbox
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

type Complaint = {
  id: number
  title: string
  status: string
  priority: string
  created_at: string
  user_name?: string
  category_name?: string
  is_escalated: boolean
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  'open': { label: 'Open', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Clock },
  'submitted': { label: 'Submitted', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', icon: Inbox },
  'in_progress': { label: 'In Progress', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock },
  'resolved': { label: 'Resolved', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  'closed': { label: 'Closed', color: 'text-zinc-600 bg-zinc-500/5 border-zinc-500/10', icon: CheckCircle2 },
  'default': { label: 'Unknown', color: 'text-zinc-500', icon: HelpCircle }
}

const priorityConfig: Record<string, { label: string, color: string }> = {
  'low': { label: 'Low', color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' },
  'medium': { label: 'Medium', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  'high': { label: 'High', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  'critical': { label: 'Critical', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
}

export default function ComplaintsList() {
  const { user } = useAuth()
  const [list, setList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const url = user?.role === 'admin' || user?.role === 'super_admin' ? '/complaints/all' : '/complaints'

  useEffect(() => {
    const params: Record<string, string | number> = { limit: 100 }
    if (statusFilter) params.status = statusFilter
    API.get(url, { params })
      .then(({ data }) => setList(data))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [url, statusFilter])

  const filteredList = list.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-700" />
          <p className="text-zinc-500 animate-pulse text-sm">Loading Tickets...</p>
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
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">System Tickets</h1>
          <p className="text-zinc-400 mt-1 text-lg">Manage and track reported issues</p>
        </div>
        <Link to="/complaints/new">
          <Button variant="default" size="lg" className="group shrink-0 bg-white text-black hover:bg-zinc-200">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            New Ticket
          </Button>
        </Link>
      </motion.div>

      <Card className="min-h-[600px] flex flex-col border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row gap-4 border-b border-zinc-800 pb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search tickets..."
              className="pl-10 max-w-md bg-zinc-950/50 border-zinc-800 focus:border-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 pl-10 pr-8 rounded-lg bg-zinc-950/50 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer hover:bg-zinc-900 transition-colors"
              >
                <option value="" className="bg-zinc-900">All Statuses</option>
                <option value="submitted" className="bg-zinc-900">Submitted</option>
                <option value="in_progress" className="bg-zinc-900">In Progress</option>
                <option value="resolved" className="bg-zinc-900">Resolved</option>
                <option value="closed" className="bg-zinc-900">Closed</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-white">No tickets found</h3>
              <p className="text-zinc-500 mt-1 max-w-xs">
                Try adjusting your filters or search terms.
              </p>
              <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('') }} className="mt-4 text-white">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="p-6 font-medium">Ticket Details</th>
                    <th className="p-6 font-medium">Category</th>
                    <th className="p-6 font-medium">Status</th>
                    <th className="p-6 font-medium">Priority</th>
                    {user?.role !== 'user' && <th className="p-6 font-medium">Reported By</th>}
                    <th className="p-6 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filteredList.map((ticket, index) => {
                      const StatusIcon = (statusConfig[ticket.status] || statusConfig.default).icon
                      return (
                        <motion.tr
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="group border-b border-zinc-800/50 hover:bg-zinc-900/80 transition-colors"
                        >
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="font-medium text-white group-hover:text-zinc-200 transition-colors">{ticket.title}</span>
                              <span className="text-xs text-zinc-500 mt-1">
                                ID: #{ticket.id.toString().padStart(4, '0')} • {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {ticket.category_name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border", (statusConfig[ticket.status] || statusConfig.default).color)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {ticket.status.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border", (priorityConfig[ticket.priority] || priorityConfig.low).color)}>
                                {ticket.priority}
                              </span>
                              {ticket.is_escalated && (
                                <span className="text-xs text-red-500 flex items-center gap-1 font-medium animate-pulse">
                                  <AlertTriangle className="w-3 h-3" /> Escalated
                                </span>
                              )}
                            </div>
                          </td>
                          {user?.role !== 'user' && (
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                                  {ticket.user_name?.charAt(0)}
                                </div>
                                <span className="text-sm text-zinc-400">{ticket.user_name}</span>
                              </div>
                            </td>
                          )}
                          <td className="p-6 text-right">
                            <Link to={`/complaints/${ticket.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 hover:text-white text-zinc-500">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
