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
        <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Report an Issue</h1>
        <p className="text-muted-foreground mt-1 text-lg">Submit a new ticket for maintenance or support</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>
              Provide as much detail as possible to help us resolve the issue quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Title</label>
                <div className="relative group">
                  <Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Description</label>
                <div className="relative group">
                  <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={cn(
                      "flex w-full rounded-md border border-input bg-background/50 pl-10 pr-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm resize-none",
                      "hover:bg-accent/5 focus:bg-accent/10"
                    )}
                    placeholder="Describe the issue in detail..."
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground ml-1">
                  Tip: Mention keywords like <span className="text-primary-400">water</span>, <span className="text-primary-400">electric</span>, or <span className="text-primary-400">security</span> for faster auto-categorization.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Location <span className="text-muted-foreground/50 lowercase font-normal">(optional)</span></label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                    placeholder="e.g. Block A, 2nd Floor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Evidence</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-primary/50 hover:bg-white/5 transition-all text-center">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-slate-800 text-primary mb-1">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-white">Click to upload files</span>
                    <span className="text-xs text-muted-foreground">Supported: Images, PDF</span>
                  </label>
                </div>

                {files.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {files.map((f, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-slate-200 truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-red-400 p-1 transition-colors"
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
                  className="flex-1"
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
