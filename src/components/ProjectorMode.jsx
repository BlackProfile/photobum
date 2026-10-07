'use client';

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Heart,
  QrCode,
  MessageCircle,
} from 'lucide-react'
import QRCode from 'qrcode'
import { getPresetById } from '../filters/presets'

export default function ProjectorMode({
  event,
  photos = [],
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSec, setIntervalSec] = useState(5)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [newPhotoAlert, setNewPhotoAlert] = useState(null)
  const [floatingReactions, setFloatingReactions] = useState([])
  const prevCountRef = useRef(photos.length)

  // Floating reaction spawner
  const spawnReaction = (emoji) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4)
    const left = Math.floor(Math.random() * 70) + 15 // 15% to 85% width
    setFloatingReactions((prev) => [...prev, { id, emoji, left }])
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id))
    }, 2800)
  }

  // Generate QR Code for projector corner
  useEffect(() => {
    let currentUrl = window.location.href
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      currentUrl = currentUrl.replace('localhost', '192.168.1.7').replace('127.0.0.1', '192.168.1.7')
    }
    QRCode.toDataURL(currentUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#ffffff',
        light: '#00000000',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR gen error:', err))
  }, [])

  // Detect newly added photo and jump to it
  useEffect(() => {
    if (photos.length > prevCountRef.current) {
      const latest = photos[0]
      if (latest) {
        setNewPhotoAlert(`📸 Foto baru dari ${latest.guest_name}!`)
        setCurrentIndex(0)
        setTimeout(() => setNewPhotoAlert(null), 4500)
      }
    }
    prevCountRef.current = photos.length
  }, [photos])

  // Slideshow timer
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }, intervalSec * 1000)

    return () => clearInterval(timer)
  }, [isPlaying, intervalSec, photos.length])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const currentPhoto = photos[currentIndex] || photos[0]
  const preset = currentPhoto ? getPresetById(currentPhoto.preset_id) : null

  return (
    <div className="projector-overlay">
      {/* Top Floating Header */}
      <div className="projector-header">
        <div className="projector-brand">
          <span className="rec-dot" />
          <span className="projector-event-title">{event.title}</span>
          <span className="projector-photo-index">
            {photos.length > 0 ? `${currentIndex + 1} / ${photos.length}` : '0 / 0'}
          </span>
        </div>

        {/* New photo notification toast */}
        {newPhotoAlert && (
          <div className="projector-alert-banner">
            <Sparkles size={18} color="#ff7a00" />
            <span>{newPhotoAlert}</span>
          </div>
        )}

        <div className="projector-header-actions">
          <button
            id="projector-fs-btn"
            className="projector-icon-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            id="projector-close-btn"
            className="projector-icon-btn close-btn"
            onClick={onClose}
            title="Keluar Mode Proyektor"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Slideshow Stage */}
      <div className="projector-stage">
        {currentPhoto ? (
          <div className="projector-slide" key={currentPhoto.id}>
            <div className="projector-photo-frame">
              <img
                src={currentPhoto.photo_url}
                alt={`Momen oleh ${currentPhoto.guest_name}`}
                className="projector-image ken-burns"
              />
            </div>

            {/* Floating Guest & Preset Card */}
            <div className="projector-caption-box glass-panel">
              <div className="caption-top">
                <span className="caption-guest-name">
                  Foto oleh <strong>{currentPhoto.guest_name}</strong>
                </span>
                {preset && (
                  <span
                    className="preset-chip"
                    style={{ backgroundColor: preset.badgeColor }}
                  >
                    Preset {preset.name}
                  </span>
                )}
              </div>

              {currentPhoto.guest_note && (
                <div className="caption-quote">
                  <MessageCircle size={16} color="#ff7a00" />
                  <span>"{currentPhoto.guest_note}"</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="projector-empty">
            <h2>Belum Ada Foto Terunggah</h2>
            <p>Scan QR di bawah untuk mengabadikan momen pertama!</p>
          </div>
        )}
      </div>

      {/* Floating QR Code in Corner for Guests in the Room */}
      <div className="projector-qr-corner glass-panel">
        <div className="corner-qr-box">
          {qrDataUrl && <img src={qrDataUrl} alt="Scan QR Tamu" className="corner-qr-img" />}
        </div>
        <div className="corner-qr-info">
          <div className="qr-callout-bold">Scan untuk Gabung!</div>
          <div className="qr-callout-sub">Jepret foto langsung dari HP Anda</div>
        </div>
      </div>

      {/* Floating Live Reactions Layer */}
      <div className="projector-reactions-container">
        {floatingReactions.map((item) => (
          <span
            key={item.id}
            className="floating-projector-emoji"
            style={{ left: `${item.left}%` }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* Bottom Control Bar with Live Reaction Triggers */}
      <div className="projector-bottom-bar glass-panel">
        {/* Quick Reaction Emitter for Host/Crowd */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>REAKSI:</span>
          {['❤️', '🔥', '🎉', '👏', '✨'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => spawnReaction(emoji)}
              style={{
                fontSize: '1.25rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="slideshow-controls">
          <button
            id="proj-prev-btn"
            className="proj-ctrl-btn"
            onClick={() => setCurrentIndex((p) => (p > 0 ? p - 1 : photos.length - 1))}
            title="Foto Sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            id="proj-play-btn"
            className="proj-ctrl-btn play-active"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Jeda Slideshow' : 'Mulai Putar'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            id="proj-next-btn"
            className="proj-ctrl-btn"
            onClick={() => setCurrentIndex((p) => (p + 1) % photos.length)}
            title="Foto Selanjutnya"
          >
            <ChevronRight size={20} />
          </button>

          <div className="proj-speed-selector">
            <span className="speed-label">Kecepatan:</span>
            {[3, 5, 8].map((s) => (
              <button
                key={s}
                className={`speed-pill ${intervalSec === s ? 'active' : ''}`}
                onClick={() => setIntervalSec(s)}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
