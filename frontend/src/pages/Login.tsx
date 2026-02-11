import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Hexagon, Lock, Mail, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        setLoading(true)
        await googleLogin(credentialResponse.credential)
        navigate('/')
      } catch {
        setError("Google Login Failed")
        setLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Stealth Ambient Background */}
      <div className="bg-stealth-curves absolute inset-0 z-0 opacity-40 mix-blend-screen" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-6"
          >
            <Hexagon className="text-white w-6 h-6 fill-white" />
          </motion.div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-white">Welcome Back</h1>
          <p className="text-zinc-500 mt-2">Enter your credentials to access ResolveX</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-center text-white">Sign In</CardTitle>
            <CardDescription className="text-center text-zinc-500">Authenticate with your enterprise account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-zinc-950/50 border-zinc-800 focus:border-white/20 text-white placeholder:text-zinc-700"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-500 ml-1 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-zinc-950/50 border-zinc-800 focus:border-white/20 text-white placeholder:text-zinc-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-white text-black hover:bg-zinc-200"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed")}
                theme="filled_black"
                shape="pill"
                width="320"
              />
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-zinc-500">Don't have an account? </span>
              <Link to="/register" className="text-white hover:underline underline-offset-4 font-medium">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
