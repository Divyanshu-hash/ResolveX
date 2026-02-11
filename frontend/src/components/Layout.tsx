import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex bg-background overflow-hidden relative selection:bg-white/20">
      {/* Global Stealth Background */}
      <div className="fixed inset-0 bg-background pointer-events-none z-0" />
      <div className="curve-overlay pointer-events-none z-0" />
      <div className="bg-stealth-curves absolute inset-0 z-0 opacity-40 mix-blend-screen" />

      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} // Custom cubic bezier for "sleek" feel
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
