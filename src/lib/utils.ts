import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  const minute = 60
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365
  
  if (diffInSeconds < minute) {
    return "just now"
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else if (diffInSeconds < year) {
    const months = Math.floor(diffInSeconds / month)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  } else {
    const years = Math.floor(diffInSeconds / year)
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + "..."
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  return imageExtensions.includes(getFileExtension(filename))
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf'
}

export function isDocumentFile(filename: string): boolean {
  const docExtensions = ['doc', 'docx', 'txt', 'rtf', 'odt']
  return docExtensions.includes(getFileExtension(filename))
}

export function isSpreadsheetFile(filename: string): boolean {
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv', 'ods']
  return spreadsheetExtensions.includes(getFileExtension(filename))
}

export function isPresentationFile(filename: string): boolean {
  const presentationExtensions = ['ppt', 'pptx', 'odp']
  return presentationExtensions.includes(getFileExtension(filename))
}

export function isArchiveFile(filename: string): boolean {
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz']
  return archiveExtensions.includes(getFileExtension(filename))
}

export function getFileIcon(filename: string): string {
  if (isImageFile(filename)) return '🖼️'
  if (isPdfFile(filename)) return '📄'
  if (isDocumentFile(filename)) return '📝'
  if (isSpreadsheetFile(filename)) return '📊'
  if (isPresentationFile(filename)) return '📑'
  if (isArchiveFile(filename)) return '🗄️'
  return '📎' // Default file icon
}
