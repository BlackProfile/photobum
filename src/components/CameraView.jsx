'use client';

import React, { useState, useEffect, useRef } from 'react'
import {
  Camera,
  RotateCcw,
  Zap,
  ZapOff,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Grid,
  Image as ImageIcon,
  Check,
  X,
  Download,
  Share2,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react'
import { DAZZ_PRESETS, getPresetById } from '../filters/presets'
import { renderPhotoWithPreset, formatRetroDate } from '../filters/filterRenderer'
import { playShutterSound, playCountdownBeep, playFilmWindingSound } from '../services/audio'
import confetti from 'canvas-confetti'

export default function CameraView({
  event,
  onPhotoSaved,
  onClose,
  showToast,
}) {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  // Camera state
  const [stream, setStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' (back) or 'user' (front)
  const [selectedPresetId, setSelectedPresetId] = useState('cpm35')
  const [isCapturing, setIsCapturing] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0) // 0 (off), 3, 5
  const [countdown, setCountdown] = useState(null)
  const [flashMode, setFlashMode] = useState('screen') // 'screen' | 'off'
  const [enableSound, setEnableSound] = useState(true)
  const [enableDateStamp, setEnableDateStamp] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [screenFlashing, setScreenFlashing] = useState(false)

  // Captured photo review state
  const [capturedImage, setCapturedImage] = useState(null)
  const [guestName, setGuestName] = useState(() => localStorage.getItem('dazzevent_guest_name') || '')
  const [guestNote, setGuestNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const activePreset = getPresetById(selectedPresetId)

  // Initialize camera stream
  useEffect(() => {
    let currentStream = null

    async function initCamera() {
      try {
        setCameraError(null)
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop())
        }

        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        currentStream = newStream
        setStream(newStream)

        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }
      } catch (err) {
        console.error('Kamera gagal diakses:', err)
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.'
            : 'Tidak dapat menemukan kamera pada perangkat ini. Anda tetap bisa upload foto dari galeri!'
        )
      }
    }

    initCamera()

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  // Flip camera (rear <-> selfie)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  // Toggle flash mode
  const cycleFlash = () => {
    setFlashMode((prev) => (prev === 'screen' ? 'off' : 'screen'))
    showToast(flashMode === 'screen' ? 'Flash dimatikan' : 'Flash layar diaktifkan', 'info')
  }

  // Toggle timer (0 -> 3 -> 5 -> 0)
  const cycleTimer = () => {
    const next = timerSeconds === 0 ? 3 : timerSeconds === 3 ? 5 : 0
    setTimerSeconds(next)
    showToast(next === 0 ? 'Timer mati' : `Timer diatur: ${next} detik`, 'info')
  }

  // Take photo trigger (with timer countdown if configured)
  const handleShutterClick = () => {
    if (isCapturing || countdown !== null) return

    if (timerSeconds > 0) {
      let count = timerSeconds
      setCountdown(count)
      if (enableSound) playCountdownBeep(false)

      const interval = setInterval(() => {
        count -= 1
        if (count > 0) {
          setCountdown(count)
          if (enableSound) playCountdownBeep(false)
        } else {
          clearInterval(interval)
          setCountdown(null)
          if (enableSound) playCountdownBeep(true)
          captureFrame()
        }
      }, 1000)
    } else {
      captureFrame()
    }
  }

  // Actual capture execution
  const captureFrame = async () => {
    if (!videoRef.current) return
    setIsCapturing(true)

    // Flash animation & audio
    if (flashMode === 'screen') {
      setScreenFlashing(true)
      setTimeout(() => setScreenFlashing(false), 350)
    }

    if (enableSound) {
      playShutterSound()
    }

    try {
      // Render through Dazz Cam Canvas Pipeline
      const finalDataUrl = await renderPhotoWithPreset({
        sourceElement: videoRef.current,
        presetId: selectedPresetId,
        enableDateStamp,
        customDate: new Date(),
        guestNote,
      })

      setCapturedImage(finalDataUrl)
    } catch (err) {
      console.error('Gagal merender foto:', err)
      showToast('Gagal memproses foto filter', 'error')
    } finally {
      setIsCapturing(false)
    }
  }

  // Handle upload from phone gallery/files
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new Image()
      img.onload = async () => {
        if (enableSound) playShutterSound()
        try {
          const processed = await renderPhotoWithPreset({
            sourceElement: img,
            presetId: selectedPresetId,
            enableDateStamp,
            customDate: new Date(),
            guestNote,
          })
          setCapturedImage(processed)
        } catch (err) {
          showToast('Gagal menerapkan preset pada file', 'error')
        }
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // Save photo to event album
  const handleSaveToAlbum = async () => {
    if (!capturedImage) return
    const nameToSave = guestName.trim() || 'Tamu Istimewa'
    localStorage.setItem('dazzevent_guest_name', nameToSave)

    setIsSaving(true)
    try {
      if (enableSound) playFilmWindingSound()

      const newPhoto = await onPhotoSaved({
        photo_url: capturedImage,
        guest_name: nameToSave,
        guest_note: guestNote.trim(),
        preset_id: selectedPresetId,
      })

      // Celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ff7a00', '#f59e0b', '#f43f5e', '#06b6d4'],
        })
      } catch (e) {
        // ignore
      }

      showToast('📸 Foto berhasil ditambahkan ke album acara!', 'success')
      setCapturedImage(null)
      setGuestNote('')
    } catch (err) {
      console.error('Gagal menyimpan foto:', err)
      showToast('Gagal menyimpan foto', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Download high-res photo to device
  const handleDownloadSingle = () => {
    if (!capturedImage) return
    const link = document.createElement('a')
    link.href = capturedImage
    link.download = `dazzevent_${selectedPresetId}_${Date.now()}.jpg`
    link.click()
    showToast('Foto berhasil diunduh ke galeri perangkat!', 'success')
  }

  return (
    <div className="camera-screen">
      {screenFlashing && <div className="screen-flash" />}

      {/* =========================================================================
          REVIEW & UPLOAD SCREEN (Appears after taking a photo)
          ========================================================================= */}
      {capturedImage ? (
        <div className="review-container">
          <div className="review-header">
            <button
              id="retake-photo-btn"
              className="glass-pill-btn"
              onClick={() => setCapturedImage(null)}
            >
              <ArrowLeft size={18} />
              <span>Foto Ulang</span>
            </button>
            <div className="review-title-badge">
              <span className="preset-chip" style={{ backgroundColor: activePreset.badgeColor }}>
                {activePreset.name}
              </span>
              <span>Hasil Jepretan</span>
            </div>
            <button
              id="download-preview-btn"
              className="glass-pill-btn icon-only"
              onClick={handleDownloadSingle}
              title="Simpan ke Perangkat"
            >
              <Download size={18} />
            </button>
          </div>

          <div className="review-body">
            {/* Photo preview */}
            <div className="review-photo-wrapper">
              <img src={capturedImage} alt="Hasil Foto Dazz Cam" className="review-photo-img" />
            </div>

            {/* Guest note & details form */}
            <div className="review-form-card glass-panel">
              <div className="form-title">
                <Sparkles size={18} color="#ff7a00" />
                <span>Bagikan ke Album Acara</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Foto oleh:</span>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{guestName || 'Tamu'}</span>
              </div>

              <div className="form-group">
                <label htmlFor="guest-note-input">Pesan & Doa / Caption Ucapan</label>
                <textarea
                  id="guest-note-input"
                  rows={2}
                  placeholder="Tulis ucapan selamat atau cerita di balik foto ini..."
                  value={guestNote}
                  onChange={(e) => setGuestNote(e.target.value)}
                  maxLength={160}
                />
              </div>

              <div className="review-action-row">
                <button
                  id="submit-to-album-btn"
                  className="btn-primary w-full"
                  disabled={isSaving}
                  onClick={handleSaveToAlbum}
                >
                  <Check size={20} />
                  <span>{isSaving ? 'Menyimpan...' : 'Kirim ke Album Acara'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           LIVE CAMERA VIEWFINDER (Dazz Cam Experience)
           ========================================================================= */
        <div className="viewfinder-container">
          {/* Top HUD Bar */}
          <div className="camera-top-hud">
            <button
              id="close-camera-btn"
              className="hud-icon-btn"
              onClick={onClose}
              title="Tutup & Kembali ke Album"
            >
              <X size={22} />
            </button>

            <div className="top-hud-controls">
              {/* Flash toggle */}
              <button
                id="toggle-flash-btn"
                className={`hud-icon-btn ${flashMode === 'screen' ? 'active' : ''}`}
                onClick={cycleFlash}
                title="Flash Layar"
              >
                {flashMode === 'screen' ? <Zap size={20} /> : <ZapOff size={20} />}
              </button>

              {/* Timer toggle */}
              <button
                id="toggle-timer-btn"
                className={`hud-icon-btn ${timerSeconds > 0 ? 'active' : ''}`}
                onClick={cycleTimer}
                title="Timer Kamera"
              >
                <Clock size={20} />
                {timerSeconds > 0 && <span className="hud-badge">{timerSeconds}s</span>}
              </button>

              {/* Date stamp toggle */}
              <button
                id="toggle-datestamp-btn"
                className={`hud-icon-btn ${enableDateStamp ? 'active' : ''}`}
                onClick={() => setEnableDateStamp((p) => !p)}
                title="Stempel Tanggal Retro 35mm"
              >
                <Calendar size={20} />
              </button>

              {/* Sound toggle */}
              <button
                id="toggle-sound-btn"
                className={`hud-icon-btn ${enableSound ? 'active' : ''}`}
                onClick={() => setEnableSound((p) => !p)}
                title="Suara Shutter Mekanikal"
              >
                {enableSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

              {/* Grid toggle */}
              <button
                id="toggle-grid-btn"
                className={`hud-icon-btn ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid((p) => !p)}
                title="Garis Bantu Komposisi"
              >
                <Grid size={20} />
              </button>

              {/* Flip camera */}
              <button
                id="flip-camera-btn"
                className="hud-icon-btn"
                onClick={toggleFacingMode}
                title="Balik Kamera Depan/Belakang"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          {/* Viewfinder Frame with Video Stream */}
          <div className="viewfinder-frame">
            {cameraError ? (
              <div className="camera-error-box glass-panel">
                <Camera size={48} color="#ff7a00" />
                <h3>Kamera Tidak Aktif</h3>
                <p>{cameraError}</p>
                <button
                  id="error-upload-fallback-btn"
                  className="btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={18} />
                  <span>Pilih Foto dari Galeri</span>
                </button>
              </div>
            ) : (
              <div className="video-stream-wrapper">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`camera-video ${facingMode === 'user' ? 'mirror' : ''}`}
                  style={{
                    filter: activePreset.cssFilter,
                  }}
                />

                {/* Grid Overlay */}
                {showGrid && (
                  <div className="viewfinder-grid">
                    <div className="grid-line horizontal top" />
                    <div className="grid-line horizontal bottom" />
                    <div className="grid-line vertical left" />
                    <div className="grid-line vertical right" />
                  </div>
                )}

                {/* Center Focus Reticle */}
                <div className="focus-reticle">
                  <div className="reticle-corner tl" />
                  <div className="reticle-corner tr" />
                  <div className="reticle-corner bl" />
                  <div className="reticle-corner br" />
                </div>

                {/* Dazz Cam Vintage Viewfinder HUD Indicators */}
                <div className="viewfinder-analog-hud">
                  <div className="hud-top-info">
                    <span className="analog-lcd">ISO 400</span>
                    <span className="analog-lcd">F/2.8</span>
                    <span className="analog-lcd">1/125s</span>
                  </div>

                  <div className="hud-bottom-info">
                    <span className="preset-indicator" style={{ color: activePreset.badgeColor }}>
                      {activePreset.name} • {activePreset.brand}
                    </span>

                    {enableDateStamp && activePreset.dateStamp.format !== 'none' && (
                      <span className="analog-lcd date-indicator">
                        {formatRetroDate(new Date(), activePreset.dateStamp.format)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Countdown Timer Display */}
                {countdown !== null && (
                  <div className="countdown-overlay">
                    <span className="countdown-number">{countdown}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preset Selector Carousel (Dazz Cam Presets) */}
          <div className="preset-selector-bar">
            <div className="presets-scroll-track">
              {DAZZ_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId
                return (
                  <button
                    key={preset.id}
                    id={`preset-${preset.id}`}
                    className={`preset-tab-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPresetId(preset.id)}
                  >
                    <span
                      className="preset-tab-indicator"
                      style={{ backgroundColor: preset.badgeColor }}
                    />
                    <span className="preset-tab-name">{preset.name}</span>
                    <span className="preset-tab-sub">{preset.brand}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Shutter Controls */}
          <div className="camera-bottom-controls">
            {/* Gallery Upload Button */}
            <div className="control-slot left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                id="gallery-upload-btn"
                className="gallery-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload dari Galeri HP"
              >
                <ImageIcon size={22} />
                <span className="gallery-btn-label">Galeri</span>
              </button>
            </div>

            {/* Analog Shutter Button */}
            <div className="control-slot center">
              <button
                id="camera-shutter-btn"
                className={`shutter-button ${isCapturing ? 'capturing' : ''}`}
                onClick={handleShutterClick}
                disabled={isCapturing}
                title="Ambil Foto"
              >
                <div className="shutter-inner-ring">
                  <div className="shutter-center-core" />
                </div>
              </button>
            </div>

            {/* Preset Info / Close */}
            <div className="control-slot right">
              <button
                id="back-album-quick-btn"
                className="album-return-btn"
                onClick={onClose}
                title="Kembali ke Album"
              >
                <span>Album</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
