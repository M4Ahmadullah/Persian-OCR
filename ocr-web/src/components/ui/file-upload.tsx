'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, FileImage, X } from 'lucide-react'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onChange: (files: FileList | null) => void
  value?: FileList | null
  maxSize?: number // in MB
}

export function FileUpload({
  accept = 'image/*',
  multiple = false,
  onChange,
  value,
  maxSize = 16,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validateFiles = (files: FileList): FileList | null => {
    setError(null)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`فایل ${file.name} بزرگ‌تر از ${maxSize}MB است`)
        return null
      }
      
      // Check type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError(`فرمت ${file.name} پشتیبانی نمی‌شود`)
        return null
      }
    }
    
    return files
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const validated = validateFiles(files)
      if (validated) {
        onChange(validated)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const validated = validateFiles(files)
      if (validated) {
        onChange(validated)
      }
    }
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const file = value && value.length > 0 ? value[0] : null

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed p-8 text-center',
          isDragging
            ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/30',
          error && 'border-red-500/50 bg-red-500/10'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ y: isDragging ? -5 : 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center"
              >
                <Upload className="w-10 h-10 text-cyan-400" />
              </motion.div>
              <div>
                <p className="text-lg font-bold text-white">
                  {isDragging ? 'رها کنید!' : 'کلیک کنید یا فایل را بکشید'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  فرمت‌های مجاز: JPG, PNG, TIFF, BMP, GIF
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  حداکثر حجم: {maxSize}MB
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-24 h-24 object-cover rounded-xl border-2 border-slate-600"
                />
                <button
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="font-bold text-white truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-sm text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm mt-2 flex items-center gap-2"
        >
          <span>⚠️</span> {error}
        </motion.p>
      )}
    </div>
  )
}