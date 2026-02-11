import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Tag,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Download,
  Send,
  History,
  MessageSquare,
  HelpCircle,
  Paperclip,
  Loader2,
  Inbox
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

type Complaint = {
  id: number
  title: string
  description: string
  status: string
  priority: string
  location: string | null
  is_escalated: boolean
  escalated_at: string | null
  due_date: string | null
  resolved_at: string | null
  created_at: string
  user_name: string | null
  category_name: string | null
  assigned_staff_name: string | null
}

type Log = {
  id: number
  action: string
  old_value: string | null
  new_value: string | null
  message: string | null
  created_at: string
  user_name: string | null
}

type Evidence = { id: number; file_name: string; file_type: string; created_at: string }

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

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [feedback, setFeedback] = useState<{ rating: number; comment: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignStaffId, setAssignStaffId] = useState('')
  const [staffList, setStaffList] = useState<Array<{ id: number; full_name: string }>>([])
  const [statusUpdate, setStatusUpdate] = useState('')
  const [priorityUpdate, setPriorityUpdate] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = () => {
    if (!id) return
    API.get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data))
      .catch(() => setComplaint(null))
    API.get(`/complaints/${id}/logs`)
      .then(({ data }) => setLogs(data))
      .catch(() => setLogs([]))
    API.get(`/evidence/${id}`)
      .then(({ data }) => setEvidence(data))
      .catch(() => setEvidence([]))
    API.get(`/feedback/${id}`)
      .then(({ data }) => setFeedback(data))
      .catch(() => setFeedback(null))
  }

  useEffect(() => {
    load()
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      API.get('/users/staff').then(({ data }) => setStaffList(data))
    }
    setLoading(false)
  }, [id, user?.role])

  useEffect(() => {
    if (!id) return
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [id])

  const handleAssign = async () => {
    if (!id || !assignStaffId) return
    await API.post(`/complaints/${id}/assign`, { staff_id: parseInt(assignStaffId, 10) })
    load()
    setAssignStaffId('')
  }

  const handleStatusChange = async () => {
    if (!id || !statusUpdate) return
    await API.patch(`/complaints/${id}`, { status: statusUpdate })
    load()
    setStatusUpdate('')
  }

  const handlePriorityChange = async () => {
    if (!id || !priorityUpdate) return
    await API.patch(`/complaints/${id}`, { priority: priorityUpdate })
    load()
    setPriorityUpdate('')
  }

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || feedbackRating < 1) return
    await API.post(`/feedback/${id}`, { rating: feedbackRating, comment: feedbackComment || undefined })
    load()
    setFeedbackRating(0)
    setFeedbackComment('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      await API.post(`/evidence/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      load()
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading || !complaint) {
    return (
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-700" />
          <p className="text-zinc-500 animate-pulse text-sm">Loading details...</p>
        </div>
      </div>
    )
  }

  const canEdit = user?.role === 'admin' || user?.role === 'super_admin' || (user?.role === 'staff' && complaint.assigned_staff_name === user?.full_name)
  const isCreator = complaint.user_name === user?.full_name
  const canGiveFeedback = isCreator && ['resolved', 'closed'].includes(complaint.status) && !feedback

  const StatusIcon = (statusConfig[complaint.status] || statusConfig.default).icon

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-white text-zinc-400 transition-colors" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Complaints
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold font-heading text-white tracking-tight">{complaint.title}</h1>
              <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-bold uppercase tracking-wide border", (statusConfig[complaint.status] || statusConfig.default).color)}>
                <StatusIcon className="w-4 h-4" />
                {(statusConfig[complaint.status] || statusConfig.default).label}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>{complaint.category_name || 'Uncategorized'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Created by <span className="text-zinc-200">{complaint.user_name}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{new Date(complaint.created_at).toLocaleString()}</span>
              </div>
              {complaint.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{complaint.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border bg-zinc-900/50 backdrop-blur-sm", (priorityConfig[complaint.priority] || priorityConfig.low).color)}>
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-xs">Priority: {complaint.priority}</span>
            </div>
            {complaint.is_escalated && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-red-500/10 border-red-500/20 text-red-500">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider text-xs">Escalated</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <motion.div
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-white/70" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <History className="w-5 h-5 text-white/70" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 border-l border-zinc-800 space-y-8 ml-2">
                {logs.length === 0 && <p className="text-zinc-500 text-sm italic">No activity recorded yet.</p>}
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700 ring-4 ring-zinc-950" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-zinc-200 capitalize">{log.action.replace('_', ' ')}</span>
                        <span className="text-xs text-zinc-500">• {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {log.user_name ?? 'System'}
                        {log.old_value && log.new_value && (
                          <span className="text-zinc-500"> changed from <span className="text-zinc-300">{log.old_value}</span> to <span className="text-zinc-300">{log.new_value}</span></span>
                        )}
                        {log.message && <span className="text-zinc-400"> — {log.message}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Assigned Staff Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-zinc-200">
                <User className="w-4 h-4 text-white/70" /> Assigned Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complaint.assigned_staff_name ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold border border-zinc-700">
                    {complaint.assigned_staff_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{complaint.assigned_staff_name}</p>
                    <p className="text-xs text-zinc-500">Staff Member</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No staff assigned yet.</p>
              )}

              {canEdit && (user?.role === 'admin' || user?.role === 'super_admin') && complaint.status !== 'closed' && (
                <div className="flex gap-2 pt-2">
                  <select
                    value={assignStaffId}
                    onChange={(e) => setAssignStaffId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white/20"
                  >
                    <option value="">Select staff...</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={handleAssign} disabled={!assignStaffId} className="bg-white text-black hover:bg-zinc-200">Assign</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-white/70" /> Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Status</label>
                  <div className="flex gap-2">
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white/20"
                    >
                      <option value="">Update Status...</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <Button size="sm" onClick={handleStatusChange} disabled={!statusUpdate} className="bg-white text-black hover:bg-zinc-200">Update</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase">Priority</label>
                  <div className="flex gap-2">
                    <select
                      value={priorityUpdate}
                      onChange={(e) => setPriorityUpdate(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white/20"
                    >
                      <option value="">Change Priority...</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <Button size="sm" variant="secondary" onClick={handlePriorityChange} disabled={!priorityUpdate}>Update</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-zinc-200">
                <Paperclip className="w-4 h-4 text-white/70" /> Evidence & Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {evidence.length === 0 && !uploading && <p className="text-sm text-zinc-500 italic">No evidence uploaded.</p>}
              <ul className="space-y-2">
                {evidence.map((e) => (
                  <li key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-300 truncate">{e.file_name}</span>
                    </div>
                    <button
                      onClick={async () => {
                        const { data } = await API.get(`/evidence/file/${e.id}`, { responseType: 'blob' })
                        const url = URL.createObjectURL(data)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = e.file_name
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="text-white hover:text-primary-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {user && (isCreator || canEdit) && (
                <div className="pt-2">
                  <label className="flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-all cursor-pointer group">
                    <span className="flex items-center gap-2 text-sm text-zinc-500 group-hover:text-white">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Card */}
          {canGiveFeedback && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                  <MessageSquare className="w-4 h-4" /> Rate Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFeedback} className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFeedbackRating(n)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-bold transition-all",
                          feedbackRating >= n ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-110' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="bg-zinc-900/50 border-amber-500/20 focus:border-amber-500/50 placeholder:text-zinc-600"
                    />
                    <Button type="submit" size="icon" className="bg-amber-500 hover:bg-amber-600 text-black">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {feedback && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-4 h-4" /> User Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(feedback.rating)].map((_, i) => (
                      <span key={i} className="text-amber-500 text-lg">★</span>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-white">{feedback.rating}/5</span>
                </div>
                {feedback.comment && <p className="text-zinc-300 text-sm italic">"{feedback.comment}"</p>}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
