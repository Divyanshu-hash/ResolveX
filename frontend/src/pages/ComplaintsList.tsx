import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

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

export default function ComplaintsList() {
  const { user } = useAuth()
  const [list, setList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const url = user?.role === 'admin' || user?.role === 'super_admin' ? '/complaints/all' : '/complaints'

  useEffect(() => {
    const params: Record<string, string | number> = { limit: 100 }
    if (statusFilter) params.status = statusFilter
    API.get(url, { params })
      .then(({ data }) => setList(data))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [url, statusFilter])

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
        <h1 className="text-2xl font-bold text-slate-100">Complaints</h1>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="categorized">Categorized</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Link
            to="/complaints/new"
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium"
          >
            New complaint
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No complaints match your filters.{' '}
            <Link to="/complaints/new" className="text-primary-400 hover:underline">
              Create one
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                  <th className="p-4 font-medium">Title</th>
                  {user?.role !== 'user' && <th className="p-4 font-medium">Created by</th>}
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-4 text-slate-200 font-medium">{r.title}</td>
                    {user?.role !== 'user' && (
                      <td className="p-4 text-slate-400 text-sm">{r.user_name ?? '-'}</td>
                    )}
                    <td className="p-4 text-slate-400 text-sm">{r.category_name ?? 'Uncategorized'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          r.priority === 'critical' ? 'bg-red-600/30 text-red-300' :
                          r.priority === 'high' ? 'bg-amber-600/30 text-amber-300' :
                          'bg-primary-600/30 text-primary-300'
                        }`}
                      >
                        {r.priority}
                        {r.is_escalated && ' ⬆'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link to={`/complaints/${r.id}`} className="text-primary-400 hover:underline text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
