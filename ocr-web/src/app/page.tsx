'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Image, FileImage, Download, Copy, Trash2, 
  CheckCircle, XCircle, AlertCircle, Loader2, Sparkles,
  Cpu, Zap, Globe, Settings, Info, ChevronRight,
  Brain, Lock, Eye, Clock, Layers, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileUpload } from '@/components/ui/file-upload'
import { generatePersianMessage } from '@/lib/utils'

interface OCRResult {
  text: string
  confidence: number
  segments: number
  processing_time: number
}

interface BatchResult {
  name: string
  text: string
  success: boolean
}

const API_URL = 'http://localhost:8080'

export default function Home() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [file, setFile] = useState<FileList | null>(null)
  const [batchFiles, setBatchFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [batchProgress, setBatchProgress] = useState<{ processed: number; total: number; percentage: number } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSingleOCR = async () => {
    if (!file || file.length === 0) return

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file[0])

    try {
      const response = await fetch(`${API_URL}/ocr`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          text: data.text,
          confidence: data.confidence,
          segments: data.segments,
          processing_time: data.processing_time,
        })
      } else {
        setError(`${data.error}\n\nکد خطا: ${data.code}\n${data.hint || ''}`)
      }
    } catch (err) {
      setError('اتصال به سرور برقرار نشد. مطمئن شوید Flask در حال اجرا است.')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchOCR = async () => {
    if (!batchFiles || batchFiles.length === 0) return

    setLoading(true)
    setError(null)
    setBatchResults([])
    const total = batchFiles.length
    let processed = 0
    const results: BatchResult[] = []

    setBatchProgress({ processed: 0, total, percentage: 0 })

    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch(`${API_URL}/ocr`, {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        
        results.push({
          name: file.name,
          text: data.success ? data.text : '',
          success: data.success,
        })
      } catch {
        results.push({
          name: file.name,
          text: '',
          success: false,
        })
      }

      processed++
      setBatchProgress({ processed, total, percentage: Math.round((processed / total) * 100) })
    }

    setBatchResults(results)
    setLoading(false)
    setBatchProgress({ processed: total, total, percentage: 100 })
  }

  const downloadResults = () => {
    const content = batchResults.map(r => 
      `=== ${r.name} ===\n${r.success ? (r.text || '(خالی)') : '(خطا در پردازش)'}\n\n`
    ).join('')
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ocr-results.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const reset = () => {
    setFile(null)
    setBatchFiles(null)
    setResult(null)
    setError(null)
    setBatchResults([])
    setBatchProgress(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-3xl">🖼️</span>
            </div>
            <div className="text-right">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                تشخیص متن فارسی
              </h1>
              <p className="text-slate-400 text-lg">Persian OCR System</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-slate-500"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>آماده به کار • Powered by EasyOCR</span>
          </motion.div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 pb-16">
          {/* Mode Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'batch')}>
              <TabsList className="w-full justify-center">
                <TabsTrigger value="single" activeValue={mode}>
                  <Image className="w-4 h-4 mr-2" />
                  تک تصویر
                </TabsTrigger>
                <TabsTrigger value="batch" activeValue={mode}>
                  <Layers className="w-4 h-4 mr-2" />
                  پردازش انبوه
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <AnimatePresence mode="wait">
            {mode === 'single' ? (
              <motion.div
                key="single"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card variant="glass" className="border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-cyan-400" />
                      بارگذاری تصویر
                    </CardTitle>
                    <CardDescription>
                      تصویری حاوی متن فارسی را آپلود کنید
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <FileUpload
                      accept="image/*,.tif,.tiff"
                      onChange={setFile}
                      value={file}
                      maxSize={16}
                    />

                    {file && file.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6"
                      >
                        <Button onClick={handleSingleOCR} loading={loading} className="w-full" size="lg">
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              در حال پردازش...
                            </>
                          ) : (
                            <>
                              <Eye className="w-5 h-5" />
                              تشخیص متن فارسی
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {/* Loading State */}
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 text-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500"
                        />
                        <p className="text-cyan-400 font-bold animate-pulse">
                          در حال تشخیص متن...
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                          از CPU/GPU شما استفاده می‌شود
                        </p>
                      </motion.div>
                    )}

                    {/* Error State */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div className="text-right">
                            <p className="text-red-400 font-bold">خطا در پردازش</p>
                            <pre className="text-red-300/80 text-sm mt-2 whitespace-pre-wrap font-mono">{error}</pre>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Result State */}
                    {result && !loading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            تکمیل شد
                          </Badge>
                          <div className="flex gap-2">
                            <Badge variant="purple">{result.segments} بخش</Badge>
                            <Badge variant="cyan">اعتماد: {result.confidence}%</Badge>
                            <Badge variant="secondary">{result.processing_time}s</Badge>
                          </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-slate-200 text-lg leading-relaxed font-medium">
                            {result.text || '( متنی تشخیص داده نشد )'}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button variant="secondary" onClick={copyToClipboard} className="flex-1">
                            {copied ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                کپی شد!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                کپی متن
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={reset}>
                            <Trash2 className="w-4 h-4" />
                            پاک کردن
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="batch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card variant="glass" className="border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      پردازش انبوه
                    </CardTitle>
                    <CardDescription>
                      چندین تصویر را همزمان پردازش کنید
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <FileUpload
                      accept="image/*,.tif,.tiff"
                      multiple
                      onChange={setBatchFiles}
                      value={batchFiles}
                      maxSize={16}
                    />

                    {/* Progress */}
                    {batchProgress && !loading && batchResults.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8"
                      >
                        <div className="text-center mb-4">
                          <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {batchProgress.percentage}%
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            {batchProgress.processed} از {batchProgress.total}
                          </p>
                        </div>
                        <Progress value={batchProgress.percentage} variant="glow" />
                        <p className="text-center text-cyan-400/80 text-sm mt-4">
                          {generatePersianMessage(batchProgress.processed, batchProgress.total)}
                        </p>
                      </motion.div>
                    )}

                    {/* Loading */}
                    {loading && batchProgress && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8"
                      >
                        <div className="text-center mb-4">
                          <motion.p
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                          >
                            {batchProgress.percentage}%
                          </motion.p>
                        </div>
                        <Progress value={batchProgress.percentage} variant="glow" animated />
                        <p className="text-center text-cyan-400 font-bold mt-4">
                          {generatePersianMessage(batchProgress.processed, batchProgress.total)}
                        </p>
                        <p className="text-center text-slate-500 text-sm mt-2">
                          {batchProgress.processed} / {batchProgress.total} تصویر
                        </p>
                      </motion.div>
                    )}

                    {/* Results */}
                    {batchResults.length > 0 && !loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            پردازش تکمیل شد
                          </Badge>
                          <Button onClick={downloadResults} size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            دانلود همه
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {batchResults.map((r, i) => (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={i}
                              className={`p-3 rounded-xl border ${
                                r.success 
                                  ? 'bg-slate-900/50 border-slate-700/50' 
                                  : 'bg-red-500/10 border-red-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {r.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm text-slate-300 font-mono truncate">
                                  {r.name}
                                </span>
                              </div>
                              {r.success && r.text && (
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {r.text.substring(0, 80)}...
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>

                        <Button variant="secondary" onClick={reset} className="w-full mt-4">
                          <Trash2 className="w-4 h-4 mr-2" />
                          شروع مجدد
                        </Button>
                      </motion.div>
                    )}

                    {/* Start Button */}
                    {!loading && batchFiles && batchResults.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6"
                      >
                        <Button onClick={handleBatchOCR} className="w-full" size="lg">
                          <Zap className="w-5 h-5 mr-2" />
                          شروع پردازش انبوه
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-4 mt-8"
          >
            <Card variant="glass" className="border-slate-700/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Performance</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• GPU (M3): ~0.5-1s per page</li>
                      <li>• CPU: ~3-5s per page</li>
                      <li>• 10K pages: ~1.5-3 hours</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-slate-700/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Privacy & Offline</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• 100% Local processing</li>
                      <li>• No internet required</li>
                      <li>• No data leaves your device</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Troubleshooting */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                <AlertCircle className="w-4 h-4" />
                <span>عیب‌یابی و راهنما</span>
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
              </summary>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800"
              >
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>• اگر اولین بار است، EasyOCR دانلود می‌شود (~100MB)</li>
                  <li>• مطمئن شوید Flask روی پورت 8080 اجرا است</li>
                  <li>• برای تست: curl http://localhost:8080/health</li>
                  <li>• تصاویر با کیفیت بالاتر = دقت بهتر</li>
                </ul>
              </motion.div>
            </details>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-slate-600 text-sm">
          <p>ساخته شده با ❤️ برای تشخیص متن فارسی</p>
          <p className="mt-1">EasyOCR + Next.js + Shadcn UI</p>
        </footer>
      </div>
    </div>
  )
}