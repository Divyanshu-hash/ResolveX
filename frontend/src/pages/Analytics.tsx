import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { API } from '../context/AuthContext'

type Summary = {
  total_complaints: number
  open_complaints: number
  resolved_complaints: number
  escalated_complaints: number
  avg_resolution_hours: number | null
  complaints_by_category: Array<{ name: string; count: number }>
  complaints_by_priority: Array<{ name: string; count: number }>
  complaints_by_month: Array<{ month: string; count: number }>
  staff_performance: Array<{ staff_name: string; resolved_count: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Analytics() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/analytics/summary')
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-slate-500">
        Failed to load analytics.
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Total complaints</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{data.total_complaints}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Open</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{data.open_complaints}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{data.resolved_complaints}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Escalated</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{data.escalated_complaints}</p>
        </div>
      </div>

      {data.avg_resolution_hours != null && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-8">
          <p className="text-slate-400 text-sm font-medium">Average resolution time</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {Math.round(data.avg_resolution_hours)} hours
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">By category</h2>
          {data.complaints_by_category.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.complaints_by_category} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm">No data</p>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">By priority</h2>
          {data.complaints_by_priority.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.complaints_by_priority}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {data.complaints_by_priority.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm">No data</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Monthly trend</h2>
          {data.complaints_by_month.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.complaints_by_month} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm">No data</p>
          )}
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Staff performance</h2>
          {data.staff_performance.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.staff_performance}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="staff_name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="resolved_count" fill="#10b981" radius={[0, 4, 4, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm">No data</p>
          )}
        </div>
      </div>
    </div>
  )
}
