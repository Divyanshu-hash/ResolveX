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
        <aside className="w-72 h-screen bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 relative overflow-hidden z-20">

            <div className="p-8 relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Hexagon className="text-white w-6 h-6 fill-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-heading tracking-tight text-white">ResolveX</h1>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">ENTERPRISE EDITION</p>
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
                                "group relative flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300",
                                isActive
                                    ? "text-white"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <l.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "text-white" : "text-zinc-500 group-hover:text-white")} />
                                <span className="font-medium text-sm">{l.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute inset-0 rounded-lg bg-white/5 border border-white/10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 relative z-10 m-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                        <span className="text-xs font-bold text-white uppercase">{user?.full_name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-zinc-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
