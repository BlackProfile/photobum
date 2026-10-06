import React from 'react'
import { Camera, QrCode, Tv, Settings, Image as ImageIcon, Sparkles } from 'lucide-react'

export default function Navbar({
  event,
  photoCount,
  activeTab,
  setActiveTab,
  onOpenQR,
  onOpenProjector,
  onOpenSettings,
  isHost = false,
}) {
  return (
    <header className="glass-nav sticky-top">
      <div className="nav-container">
        {/* Logo / Brand */}
        <div className="brand-group" onClick={() => setActiveTab('album')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Camera size={22} color="#ff7a00" />
            <span className="brand-dot" />
          </div>
          <div>
            <div className="brand-title">
              DAZZ<span>EVENT</span>
            </div>
            <div className="brand-sub">{isHost ? 'Host Manager' : 'Album Tamu'}</div>
          </div>
        </div>

        {/* Current Event Badge */}
        <div className="event-pill-badge" title="Acara Aktif">
          <span className="rec-dot" />
          <span className="event-name-text">{event.title}</span>
          <span className="photo-pill-count">{photoCount} Foto</span>
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Quick QR Share (Only for Host) */}
          {isHost && (
            <button
              id="nav-qr-btn"
              className="nav-btn"
              onClick={onOpenQR}
              title="Scan QR & Bagikan Link"
            >
              <QrCode size={18} />
              <span className="nav-btn-text">QR Tamu</span>
            </button>
          )}

          {/* Projector Mode (Host Only) */}
          {isHost && (
            <button
              id="nav-projector-btn"
              className="nav-btn projector-glow"
              onClick={onOpenProjector}
              title="Mode Proyektor Layar Acara"
            >
              <Tv size={18} />
              <span className="nav-btn-text">Proyektor</span>
            </button>
          )}

          {/* Host / Settings Link (Host Only) */}
          {isHost && (
            <a
              id="nav-settings-btn"
              href={`/host?event=${event.id}`}
              className="nav-btn icon-only"
              title="Panel Host & Pengaturan Acara"
            >
              <Settings size={18} />
            </a>
          )}

          {/* Prominent Camera Launcher */}
          <button
            id="nav-camera-launch-btn"
            className="camera-launch-btn"
            onClick={() => setActiveTab('camera')}
          >
            <Camera size={19} />
            <span>Jepret Foto</span>
          </button>
        </div>
      </div>
    </header>
  )
}
