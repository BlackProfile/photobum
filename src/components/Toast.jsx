import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info
        let iconColor = '#06b6d4'
        if (toast.type === 'success') {
          Icon = CheckCircle2
          iconColor = '#10b981'
        } else if (toast.type === 'error') {
          Icon = AlertCircle
          iconColor = '#f43f5e'
        } else if (toast.type === 'info') {
          Icon = Info
          iconColor = '#ff7a00'
        }

        return (
          <div key={toast.id} className={`toast-card glass-panel toast-${toast.type}`}>
            <Icon size={20} color={iconColor} className="toast-icon" />
            <span className="toast-text">{toast.message}</span>
            <button
              className="toast-close-btn"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
