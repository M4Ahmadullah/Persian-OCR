import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export function generatePersianMessage(processed: number, total: number): string {
  const messages = [
    `در حال تحلیل تصاویر شما با هوش مصنوعی 🧠`,
    `قفل کردن حروف فارسی... 🔒`,
    `در حال تشخیص متن از تصویر... ✍️`,
    `کمی صبر کن، دارم فارسی یاد میگیرم... 📚`,
    `در حال رمزگشایی متن فارسی... 🔐`,
    `تصویر ${processed + 1} از ${total} 📄`,
    `فقط ${total - processed} صفحه موند! 🎯`,
    `دارم آخرشو میدم، فقط یکم صبر کن... 💪`,
    `وووووو! تقریباً تمومه! 🚀`,
    `داریم سریع پیش میریم! ⚡`,
    `این یکی هم رفت! ✅`,
    `عالی داری پیش میری! 🌟`,
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}