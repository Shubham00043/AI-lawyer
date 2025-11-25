'use client'

import * as React from 'react'

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  onDismiss: (id: string) => void
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-white border-gray-200',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  onDismiss,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      className={`relative mb-2 flex w-full max-w-sm flex-col rounded-lg border p-4 shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <button
          onClick={() => onDismiss(id)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  )
}

export function SimpleToaster() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    title: string
    description?: string
    variant?: ToastVariant
  }>>([])

  const toast = React.useCallback(
    ({
      title,
      description,
      variant = 'default',
      duration = 5000,
    }: {
      title: string
      description?: string
      variant?: ToastVariant
      duration?: number
    }) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant }])

      if (duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }

      return id
    },
    []
  )

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Expose toast function for use in other components
  React.useEffect(() => {
    // @ts-ignore - Adding to window for global access
    window.toast = toast
    return () => {
      // @ts-ignore
      window.toast = undefined
    }
  }, [toast])

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-xs space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  )
}

// Global toast function
declare global {
  interface Window {
    toast: (options: {
      title: string
      description?: string
      variant?: ToastVariant
      duration?: number
    }) => string
  }
}
