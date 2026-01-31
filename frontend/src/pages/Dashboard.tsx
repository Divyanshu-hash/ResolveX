import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

type Summary = {
  total_complaints: number
  open_complaints: number
  resolved_complaints: number
  escalated_complaints: number
  avg_resolution_hours: number | null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [recent, setRecent] = useState<Array<{ id: number; title: string; status: string; priority: string; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'admin' || user?.role === 'super_admin') {
          const { data } = await API.get('/analytics/summary')
          setSummary(data)
        }
        const listUrl = user?.role === 'admin' || user?.role === 'super_admin' ? '/complaints/all' : '/complaints'
        const { data: list } = await API.get(listUrl, { params: { limit: 5 } })
        setRecent(list)
      } catch {
        setRecent([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.role])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Complaints', value: summary?.total_complaints ?? recent.length, color: 'primary' },
    { label: 'Open', value: summary?.open_complaints ?? '-', color: 'amber' },
    { label: 'Resolved', value: summary?.resolved_complaints ?? '-', color: 'emerald' },
    { label: 'Escalated', value: summary?.escalated_complaints ?? '-', color: 'red' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
          >
            <p className="text-slate-400 text-sm font-medium">{c.label}</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {summary?.avg_resolution_hours != null && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-8">
          <p className="text-slate-400 text-sm font-medium">Average resolution time</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {Math.round(summary.avg_resolution_hours)} hours
          </p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Recent complaints</h2>
          <Link
            to="/complaints"
            className="text-sm text-primary-400 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No complaints yet.{' '}
              <Link to="/complaints/new" className="text-primary-400 hover:underline">
                Create one
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Priority</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-4 text-slate-200">{r.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300 capitalize">
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium capitalize bg-primary-600/30 text-primary-300">
                        {r.priority}
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
          )}
        </div>
      </div>
    </div>
  )
}
