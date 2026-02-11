import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  MapPin,
  Type,
  AlignLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

export default function ComplaintCreate() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected?.length) return
    setFiles((prev) => [...prev, ...Array.from(selected)])
  }

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await API.post('/complaints', {
        title,
        description,
        location: location || undefined,
      })
      const complaintId = data.id
      for (const file of files) {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        if (!allowed.includes(file.type)) continue
        const form = new FormData()
        form.append('file', file)
        await API.post(`/evidence/${complaintId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      navigate(`/complaints/${complaintId}`)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create complaint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-white text-zinc-400" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Report an Issue</h1>
        <p className="text-zinc-400 mt-1 text-lg">Submit a new ticket for maintenance or support</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Ticket Details</CardTitle>
            <CardDescription className="text-zinc-400">
              Provide as much detail as possible to help us resolve the issue quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Title</label>
                <div className="relative group">
                  <Type className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="pl-10"
                    placeholder="Brief summary of the issue"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Description</label>
                <div className="relative group">
                  <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={cn(
                      "flex w-full rounded-md border border-zinc-800 bg-zinc-900/50 pl-10 pr-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-white/20 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm resize-none text-white",
                      "hover:bg-zinc-900 focus:bg-zinc-950"
                    )}
                    placeholder="Describe the issue in detail..."
                    required
                  />
                </div>
                <p className="text-xs text-zinc-500 ml-1">
                  Tip: Mention keywords like <span className="text-zinc-300">water</span>, <span className="text-zinc-300">electric</span>, or <span className="text-zinc-300">security</span> for faster auto-categorization.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Location <span className="text-zinc-500 lowercase font-normal">(optional)</span></label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                    placeholder="e.g. Block A, 2nd Floor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Evidence</label>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2 border-2 border-dashed border-zinc-700 bg-zinc-900/30 rounded-xl p-8 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all text-center group"
                >
                  <div className="p-4 rounded-full bg-zinc-800 text-zinc-400 mb-1 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-white">Click to upload files</span>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400">Supported: Images, PDF</span>
                </label>

                {files.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {files.map((f, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-4 h-4 text-white shrink-0" />
                          <span className="text-sm text-zinc-200 truncate">{f.name}</span>
                          <span className="text-xs text-zinc-500 shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
