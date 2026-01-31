import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ComplaintsList from './pages/ComplaintsList'
import ComplaintCreate from './pages/ComplaintCreate'
import ComplaintDetail from './pages/ComplaintDetail'
import Analytics from './pages/Analytics'
import Users from './pages/Users'

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { token, user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }
  if (!token || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="complaints" element={<ComplaintsList />} />
        <Route path="complaints/new" element={<ComplaintCreate />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route
          path="analytics"
          element={
            <PrivateRoute roles={['admin', 'super_admin']}>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="users"
          element={
            <PrivateRoute roles={['admin', 'super_admin']}>
              <Users />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
