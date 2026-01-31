import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

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
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  const canEdit = user?.role === 'admin' || user?.role === 'super_admin' || (user?.role === 'staff' && complaint.assigned_staff_name === user?.full_name)
  const isCreator = complaint.user_name === user?.full_name
  const canGiveFeedback = isCreator && ['resolved', 'closed'].includes(complaint.status) && !feedback

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-200 text-sm mb-4">
        ← Back
      </button>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{complaint.title}</h1>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
          {complaint.status.replace('_', ' ')}
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium capitalize bg-primary-600/30 text-primary-300">
          {complaint.priority}
          {complaint.is_escalated && ' ⬆ Escalated'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Details</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{complaint.description}</p>
          {complaint.location && (
            <p className="text-slate-400 text-sm mt-2">Location: {complaint.location}</p>
          )}
          <p className="text-slate-500 text-sm mt-2">
            Category: {complaint.category_name ?? 'Uncategorized'} · Created by {complaint.user_name} ·{' '}
            {new Date(complaint.created_at).toLocaleString()}
          </p>
          {complaint.assigned_staff_name && (
            <p className="text-slate-400 text-sm mt-1">Assigned to: {complaint.assigned_staff_name}</p>
          )}
        </div>

        <div className="space-y-6">
          {canEdit && (user?.role === 'admin' || user?.role === 'super_admin') && complaint.status !== 'closed' && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Assign to staff</h3>
              <div className="flex gap-2">
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm"
                >
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!assignStaffId}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {canEdit && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm"
                >
                  <option value="">Update status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={!statusUpdate}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm disabled:opacity-50"
                >
                  Update
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={priorityUpdate}
                  onChange={(e) => setPriorityUpdate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm"
                >
                  <option value="">Change priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <button
                  onClick={handlePriorityChange}
                  disabled={!priorityUpdate}
                  className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Evidence</h3>
            {evidence.length === 0 && !uploading && <p className="text-slate-500 text-sm">No files</p>}
            <ul className="space-y-1 mb-2">
              {evidence.map((e) => (
                <li key={e.id} className="text-sm flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const { data } = await API.get(`/evidence/file/${e.id}`, { responseType: 'blob' })
                      const url = URL.createObjectURL(data)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = e.file_name
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="text-primary-400 hover:underline"
                  >
                    {e.file_name}
                  </button>
                </li>
              ))}
            </ul>
            {user && (isCreator || canEdit) && (
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="text-sm text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary-600 file:text-white"
              />
            )}
          </div>

          {canGiveFeedback && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Rate resolution</h3>
              <form onSubmit={handleFeedback} className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFeedbackRating(n)}
                      className={`w-8 h-8 rounded text-sm ${feedbackRating >= n ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-400'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Comment (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm">
                  Submit feedback
                </button>
              </form>
            </div>
          )}

          {feedback && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-1">Your feedback</h3>
              <p className="text-amber-400">Rating: {feedback.rating}/5</p>
              {feedback.comment && <p className="text-slate-400 text-sm mt-1">{feedback.comment}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Timeline</h2>
        <ul className="space-y-4">
          {logs.length === 0 && <p className="text-slate-500 text-sm">No activity yet</p>}
          {logs.map((l) => (
            <li key={l.id} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-slate-200 text-sm">
                  <span className="font-medium capitalize">{l.action.replace('_', ' ')}</span>
                  {l.old_value && l.new_value && (
                    <span className="text-slate-500"> {l.old_value} → {l.new_value}</span>
                  )}
                  {l.message && <span className="text-slate-400"> — {l.message}</span>}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {l.user_name ?? 'System'} · {new Date(l.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
