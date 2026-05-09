'use client'

import { useState } from 'react'
import { Upload, Loader2, Copy, Download, CheckCircle, XCircle } from 'lucide-react'

const API_URL = 'http://localhost:8080'

interface OCRResult {
  text: string
  confidence: number
  processing_time: number
}

export default function Home() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [file, setFile] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{name: string; text: string; success: boolean}[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  const handleSingleOCR = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/ocr`, { method: 'POST', body: formData })
      const data = await response.json()

      if (data.success) {
        setResult({ text: data.text, confidence: data.confidence, processing_time: data.processing_time })
      } else {
        setError(data.error || 'Processing failed')
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure Flask is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchOCR = async () => {
    if (files.length === 0) return

    setLoading(true)
    setError(null)
    setResults([])
    const newResults: {name: string; text: string; success: boolean}[] = []

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('file', files[i])

      try {
        const response = await fetch(`${API_URL}/ocr`, { method: 'POST', body: formData })
        const data = await response.json()
        newResults.push({ name: files[i].name, text: data.text || '', success: data.success })
      } catch {
        newResults.push({ name: files[i].name, text: '', success: false })
      }
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setResults(newResults)
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadResults = () => {
    const content = results.map(r => `${r.name}\n${r.success ? r.text : 'Error'}\n`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ocr-results.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-wide mb-2">Persian OCR</h1>
          <p className="text-gray-500 text-sm">Extract text from Persian images</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => { setMode('single'); setResult(null); setError(null) }}
            className={`flex-1 py-3 px-6 rounded-lg transition-all ${mode === 'single' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
          >
            Single Image
          </button>
          <button
            onClick={() => { setMode('batch'); setResults([]); setError(null) }}
            className={`flex-1 py-3 px-6 rounded-lg transition-all ${mode === 'batch' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
          >
            Batch Processing
          </button>
        </div>

        {/* Single Mode */}
        {mode === 'single' && (
          <div className="space-y-6">
            <label className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-gray-700 transition-colors cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0])
                  }
                }}
                className="hidden"
              />
              {file ? (
                <div className="py-2">
                  <p className="text-white font-medium mb-1">{file.name}</p>
                  <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-gray-600 text-sm mt-2">Click to change</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Click or drag image here</p>
                </>
              )}
            </label>

            {file && (
              <button
                onClick={handleSingleOCR}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Processing...' : 'Extract Text'}
              </button>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 text-sm">Confidence: {Math.round(result.confidence)}% | {result.processing_time?.toFixed(2)}s</span>
                  <div className="flex gap-2">
                    <button onClick={copyToClipboard} className="p-2 hover:bg-gray-800 rounded-lg">
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <p dir="rtl" className="whitespace-pre-wrap text-lg leading-relaxed text-right" style={{ fontFamily: 'Tahoma, Arial, sans-serif', letterSpacing: '0.05em' }}>{result.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Batch Mode */}
        {mode === 'batch' && (
          <div className="space-y-6">
            <label className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-gray-700 transition-colors cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
                className="hidden"
              />
              {files.length > 0 ? (
                <div className="py-2">
                  <p className="text-white font-medium mb-2">{files.length} files selected</p>
                  <div className="max-h-32 overflow-y-auto text-sm text-gray-400">
                    {files.slice(0, 5).map((f, i) => (
                      <p key={i}>{f.name}</p>
                    ))}
                    {files.length > 5 && <p>...and {files.length - 5} more</p>}
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Click to change</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Click or drag images here</p>
                </>
              )}
            </label>

            {files.length > 0 && (
              <button
                onClick={handleBatchOCR}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? `Processing ${progress}%` : `Process ${files.length} Images`}
              </button>
            )}

            {loading && progress > 0 && (
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{results.filter(r => r.success).length}/{results.length} successful</span>
                  <button onClick={downloadResults} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
                {results.map((r, i) => (
                  <div key={i} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">{r.name}</span>
                      {r.success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    {r.success && <p className="text-sm truncate">{r.text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </div>
    </div>
  )
}