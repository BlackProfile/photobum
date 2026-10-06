'use client';

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  QrCode,
  Calendar,
  MapPin,
} from 'lucide-react'
import QRCode from 'qrcode'

export default function QRShareModal({
  event,
  onClose,
  showToast,
}) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)

  const defaultUrl = typeof window !== 'undefined' ? window.location.href : ''
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  // Provide smart network URL suggestion if on localhost
  const suggestedNetworkUrl = isLocalhost 
    ? window.location.href.replace('localhost', '192.168.1.7').replace('127.0.0.1', '192.168.1.7')
    : defaultUrl

  const [shareUrl, setShareUrl] = useState(suggestedNetworkUrl)

  useEffect(() => {
    QRCode.toDataURL(shareUrl || defaultUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0d1017',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err))
  }, [shareUrl, defaultUrl])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    showToast('Tautan album berhasil disalin ke clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  // Download printable card as PNG
  const handleDownloadCard = () => {
    if (!qrDataUrl) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const width = 800
    const height = 1100

    canvas.width = width
    canvas.height = height

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
    bgGrad.addColorStop(0, '#0d1017')
    bgGrad.addColorStop(1, '#151b26')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)

    // Gold/Amber decorative border
    ctx.strokeStyle = '#ff7a00'
    ctx.lineWidth = 3
    ctx.strokeRect(30, 30, width - 60, height - 60)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(40, 40, width - 80, height - 80)

    // Top Header
    ctx.fillStyle = '#ff7a00'
    ctx.font = "bold 20px 'Space Grotesk', sans-serif"
    ctx.textAlign = 'center'
    ctx.fillText('DAZZEVENT • LIVE GUEST CAMERA', width / 2, 90)

    // Event Title
    ctx.fillStyle = '#ffffff'
    ctx.font = "bold 34px 'Plus Jakarta Sans', sans-serif"
    ctx.fillText(event.title, width / 2, 160)

    // Event Date & Venue
    ctx.fillStyle = '#94a3b8'
    ctx.font = "18px 'Plus Jakarta Sans', sans-serif"
    const dateStr = event.date
      ? new Date(event.date).toLocaleDateString('id-ID', { dateStyle: 'full' })
      : ''
    ctx.fillText(`${dateStr} ${event.venue ? '• ' + event.venue : ''}`, width / 2, 205)

    // QR Image drawing
    const qrImg = new Image()
    qrImg.onload = () => {
      // White container box for QR
      const qrBoxSize = 420
      const qrBoxX = (width - qrBoxSize) / 2
      const qrBoxY = 260

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24)
      ctx.fill()

      // Draw QR
      ctx.drawImage(qrImg, qrBoxX + 25, qrBoxY + 25, qrBoxSize - 50, qrBoxSize - 50)

      // Instructions below QR
      ctx.fillStyle = '#ff7a00'
      ctx.font = "bold 24px 'Space Grotesk', sans-serif"
      ctx.fillText('SCAN UNTUK MASUK & AMBIL FOTO', width / 2, 740)

      ctx.fillStyle = '#cbd5e1'
      ctx.font = "18px 'Plus Jakarta Sans', sans-serif"
      ctx.fillText('Arahkan kamera smartphone Anda ke kode QR di atas', width / 2, 785)
      ctx.fillText('Langsung jepret foto dengan filter retro Dazz Cam!', width / 2, 815)

      // Vintage Bottom Stamp
      ctx.fillStyle = '#ff7a00'
      ctx.font = "18px 'Share Tech Mono', monospace"
      ctx.fillText(`'${new Date().getFullYear().toString().slice(-2)} RETRO MOMENTS • NO APP INSTALL REQUIRED`, width / 2, 980)

      // Trigger download
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `Kartu_Undangan_${event.title.replace(/\s+/g, '_')}.png`
      link.click()
      showToast('Kartu undangan QR berhasil diunduh (PNG)!', 'success')
    }
    qrImg.src = qrDataUrl
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog qr-share-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <QrCode size={22} color="#ff7a00" />
            <h2 className="modal-title">Kode QR & Undangan Tamu</h2>
          </div>
          <button id="close-qr-modal-btn" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Printable Card Preview */}
          <div className="invitation-card-preview" ref={cardRef}>
            <div className="invitation-card-border">
              <div className="card-top-tag">DAZZEVENT • LIVE CAMERA</div>
              <h3 className="card-event-title">{event.title}</h3>
              <p className="card-event-meta">
                {event.date && (
                  <span>
                    {new Date(event.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </span>
                )}
                {event.venue && <span> • {event.venue}</span>}
              </p>

              {/* QR Code Container */}
              <div className="qr-image-wrapper">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Acara" className="modal-qr-img" />
                ) : (
                  <div className="qr-loading">Membuat QR Code...</div>
                )}
              </div>

              <div className="qr-instruction-callout">
                <span className="qr-inst-bold">Scan dengan Kamera HP</span>
                <span className="qr-inst-sub">
                  Tamu dapat langsung mengambil foto dengan filter Dazz Cam tanpa perlu unduh aplikasi!
                </span>
              </div>

              <div className="card-vintage-footer">
                <span className="analog-lcd">● RETRO FILM EXPERIENCE</span>
              </div>
            </div>
          </div>

          {/* Share Link Field */}
          <div className="share-link-box">
            <input
              id="share-link-input"
              type="text"
              value={shareUrl}
              onChange={(e) => setShareUrl(e.target.value)}
              placeholder="Masukkan tautan album acara..."
              className="share-link-input"
            />
            <button
              id="copy-link-btn"
              className={`btn-primary copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyLink}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="qr-actions-row">
            <button
              id="download-qr-card-btn"
              className="btn-secondary w-full"
              onClick={handleDownloadCard}
            >
              <Download size={18} />
              <span>Download Kartu Undangan Siap Cetak (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
