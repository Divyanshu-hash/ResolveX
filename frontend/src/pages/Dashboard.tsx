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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" />
          <p className="text-muted-foreground animate-pulse text-sm">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Tickets',
      value: summary?.total_complaints ?? recent.length,
      icon: Activity,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20'
    },
    {
      label: 'Open Issues',
      value: summary?.open_complaints ?? '-',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20'
    },
    {
      label: 'Resolved',
      value: summary?.resolved_complaints ?? '-',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20'
    },
    {
      label: 'Escalated',
      value: summary?.escalated_complaints ?? '-',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20'
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Dashboard Web</h1>
          <p className="text-muted-foreground mt-1 text-lg">Overview of system health and recent tickets</p>
        </div>
        <Link
          to="/complaints/new"
          className={cn(buttonVariants({ variant: "glass", size: "lg" }), "group")}
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          New Ticket
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
            <Card className="hover:bg-slate-800/60 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold font-heading text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl border backdrop-blur-md", stat.bg, stat.color, stat.border)}>
                    <stat.icon className="w-6 h-6" />
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
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link
                to="/complaints"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary hover:text-primary-300")}
              >
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No recent activity found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recent.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            r.priority === 'high' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                              r.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{r.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border",
                          r.status === 'open' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            r.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {r.status.replace('_', ' ')}
                        </span>
                        <Link
                          to={`/complaints/${r.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-primary")}
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
            <Card className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/20">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/20 blur-[50px] rounded-full" />
                <p className="text-sm font-medium text-primary-200">Avg Resolution Time</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-heading text-white">{Math.round(summary.avg_resolution_hours)}</span>
                  <span className="text-sm text-primary-200">hours</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Database</span>
                <span className="flex items-center text-emerald-400 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Gateway</span>
                <span className="flex items-center text-emerald-400 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="flex items-center text-emerald-400 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
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
