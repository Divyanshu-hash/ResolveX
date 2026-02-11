import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
import { Sparkles, BarChart3, PieChart as PieChartIcon, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { cn } from '../lib/utils'

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

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const theme = {
  background: '#0f172a',
  text: '#94a3b8',
  tooltipBg: '#1e293b',
  tooltipBorder: '#334155',
  grid: '#334155',
}

export default function Analytics() {
  const [data, setData] = useState<Summary | null>(null)
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      API.get('/analytics/summary'),
      API.get('/analytics/insights').catch(() => ({ data: 'AI Insights unavailable.' }))
    ])
      .then(([summaryRes, insightsRes]) => {
        setData(summaryRes.data)
        setInsights(insightsRes.data)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" />
          <p className="text-muted-foreground animate-pulse text-sm">Generating analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load analytics data.
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1 text-lg">Data-driven performance metrics</p>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
          <Card className="bg-slate-900/50 border-white/5">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
              <p className="text-3xl font-bold font-heading text-white mt-2">{data.total_complaints}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="bg-amber-500/5 border-amber-500/10">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-amber-500/80">Open Issues</p>
              <p className="text-3xl font-bold font-heading text-amber-500 mt-2">{data.open_complaints}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="bg-emerald-500/5 border-emerald-500/10">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-emerald-500/80">Resolved</p>
              <p className="text-3xl font-bold font-heading text-emerald-500 mt-2">{data.resolved_complaints}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="bg-red-500/5 border-red-500/10">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-red-500/80">Escalated</p>
              <p className="text-3xl font-bold font-heading text-red-500 mt-2">{data.escalated_complaints}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* AI Insights Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-2xl shadow-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

          <CardHeader className="relative z-10 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 text-xl">AI Executive Insights</CardTitle>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Automated Intelligence Report</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-li:text-slate-300 font-sans leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h4 className="text-base font-semibold text-white mt-3 mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h5 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                }}
              >
                {insights || "Generating insights..."}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </motion.div>


      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-8 lg:grid-cols-2"
      >
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Complaints by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {data.complaints_by_category.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.complaints_by_category}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, borderRadius: '8px', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {data.complaints_by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {data.complaints_by_priority.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.complaints_by_priority}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {data.complaints_by_priority.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, borderRadius: '8px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-8 lg:grid-cols-2"
      >
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {data.complaints_by_month.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.complaints_by_month}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, borderRadius: '8px', color: '#fff' }} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={4}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Users className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">Staff Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {data.staff_performance.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.staff_performance}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                      <XAxis type="number" tick={{ fill: theme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="staff_name" type="category" width={100} tick={{ fill: theme.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="resolved_count" fill="#ec4899" radius={[0, 4, 4, 0]} name="Resolved" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
