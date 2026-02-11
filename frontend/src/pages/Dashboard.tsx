import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button, buttonVariants } from '../components/ui/Button'
import { cn } from '../lib/utils'

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
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" />
          <p className="text-zinc-400 animate-pulse text-sm">Initializing System...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Tickets',
      value: summary?.total_complaints ?? recent.length,
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      shadow: 'shadow-cyan-500/10'
    },
    {
      label: 'Open Issues',
      value: summary?.open_complaints ?? '-',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      shadow: 'shadow-amber-500/10'
    },
    {
      label: 'Resolved',
      value: summary?.resolved_complaints ?? '-',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      shadow: 'shadow-emerald-500/10'
    },
    {
      label: 'Escalated',
      value: summary?.escalated_complaints ?? '-',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      shadow: 'shadow-red-500/10'
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">System Overview</h1>
          <p className="text-zinc-300 mt-1 text-lg">Real-time monitoring and ticket management</p>
        </div>
        <Link
          to="/complaints/new"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "group border-none bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5")}
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          Create Ticket
        </Link>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className={cn(
              "hover:-translate-y-1 transition-all duration-300 bg-zinc-900/80 border-zinc-800",
              `hover:${stat.border} hover:shadow-lg ${stat.shadow}`
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">{stat.label}</p>
                    <p className="text-3xl font-bold font-heading text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl border transition-colors", stat.bg, stat.color, stat.border)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full bg-zinc-900/60 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <CardTitle className="text-lg text-white">Recent Tickets</CardTitle>
              <Link
                to="/complaints"
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "text-cyan-400 hover:text-cyan-300")}
              >
                View Changes <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                    <Activity className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400">No recent activity found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recent.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="group flex items-center justify-between p-4 rounded-lg hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full ring-2 ring-zinc-950",
                            r.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                              r.priority === 'medium' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          )} />
                          <h4 className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{r.title}</h4>
                        </div>
                        <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                          {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                          r.status === 'open' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            r.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {r.status.replace('_', ' ')}
                        </span>
                        <Link
                          to={`/complaints/${r.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          {summary?.avg_resolution_hours != null && (
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded bg-zinc-800 text-white group-hover:bg-zinc-700 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">Resolution Time</p>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold font-heading text-white tracking-tight">{Math.round(summary.avg_resolution_hours)}</span>
                  <span className="text-sm text-zinc-500">hr avg</span>
                </div>
                <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[65%] shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="border-b border-zinc-800 pb-4">
              <CardTitle className="text-base text-zinc-200">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm group hover:bg-zinc-900/40 p-2 rounded -mx-2 transition-colors">
                <span className="text-zinc-400 group-hover:text-zinc-300">Database</span>
                <span className="flex items-center text-emerald-400 gap-2 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-sm group hover:bg-zinc-900/40 p-2 rounded -mx-2 transition-colors">
                <span className="text-zinc-400 group-hover:text-zinc-300">API Gateway</span>
                <span className="flex items-center text-emerald-400 gap-2 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-sm group hover:bg-zinc-900/40 p-2 rounded -mx-2 transition-colors">
                <span className="text-zinc-400 group-hover:text-zinc-300">Search Engine</span>
                <span className="flex items-center text-emerald-400 gap-2 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Operational
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
