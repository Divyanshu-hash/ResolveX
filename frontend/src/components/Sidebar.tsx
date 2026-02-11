import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    ClipboardList,
    PlusCircle,
    BarChart3,
    Users,
    LogOut,
    Hexagon
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const nav = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/complaints', label: 'Complaints', icon: ClipboardList },
    { to: '/complaints/new', label: 'New Ticket', icon: PlusCircle },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'super_admin'] },
    { to: '/users', label: 'Team', icon: Users, roles: ['admin', 'super_admin'] },
]

export function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const links = nav.filter((l) => !l.roles || (user && l.roles.includes(user.role)))

    return (
        <aside className="w-72 h-screen bg-background/50 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-64 bg-primary/10 blur-[80px] pointer-events-none" />

            <div className="p-8 relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg shadow-primary/25">
                        <Hexagon className="text-white w-6 h-6 fill-white/20" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-heading tracking-tight text-white">ResolveX</h1>
                        <p className="text-xs text-muted-foreground font-medium tracking-wide">ENTERPRISE EDITION</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 relative z-10">
                {links.map((l) => (
                    <NavLink
                        key={l.to}
                        to={l.to}
                        className={({ isActive }) =>
                            cn(
                                "group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <l.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "fill-primary/20")} />
                                <span className="font-medium text-sm">{l.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute inset-0 rounded-xl bg-primary/5 border border-primary/10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 relative z-10 m-4 rounded-2xl bg-white/5 glass-card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-white/10 ring-2 ring-background">
                        <span className="text-sm font-bold text-white uppercase">{user?.full_name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all duration-300"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    DISCONNECT SESSION
                </button>
            </div>
        </aside>
    )
}
