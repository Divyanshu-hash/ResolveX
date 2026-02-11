import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex bg-background overflow-hidden relative selection:bg-primary/30">
      {/* Global Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
