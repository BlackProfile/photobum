'use client';

import React, { useState, useMemo } from 'react'
import {
  Camera,
  Heart,
  Download,
  Share2,
  QrCode,
  Tv,
  Calendar,
  MapPin,
  Sparkles,
  Search,
  Filter,
  Eye,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'
import { DAZZ_PRESETS, getPresetById } from '../filters/presets'
import { toggleLikePhoto, isPhotoLiked } from '../services/storage'

export default function AlbumFeed({
  event,
  photos = [],
  onOpenCamera,
  onOpenQR,
  onOpenProjector,
  onPhotoDelete,
  showToast,
  isHost = false,
}) {
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'popular' | presetId
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [likedPhotoIds, setLikedPhotoIds] = useState(() => {
    const map = {}
    photos.forEach((p) => {
      map[p.id] = isPhotoLiked(p.id)
    })
    return map
  })
  const [localLikesCount, setLocalLikesCount] = useState(() => {
    const map = {}
    photos.forEach((p) => {
      map[p.id] = p.likes || 0
    })
    return map
  })

  // Format relative timestamp
  const formatTimeAgo = (dateStr) => {
    try {
      const now = new Date()
      const d = new Date(dateStr)
      const diffSec = Math.floor((now - d) / 1000)
      if (diffSec < 60) return 'Baru saja'
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin}m lalu`
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour < 24) return `${diffHour}j lalu`
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    } catch {
      return 'Baru saja'
    }
  }

  // Handle Like click with animation
  const handleLike = async (e, photo) => {
    e.stopPropagation()
    const currentLikes = localLikesCount[photo.id] ?? (photo.likes || 0)
    const res = await toggleLikePhoto(photo.id, currentLikes)

    setLikedPhotoIds((prev) => ({ ...prev, [photo.id]: res.isLiked }))
    setLocalLikesCount((prev) => ({ ...prev, [photo.id]: res.likes }))

    if (res.isLiked) {
      // Spawn floating heart
      const target = e.currentTarget
      const heart = document.createElement('span')
      heart.className = 'floating-heart'
      heart.innerHTML = '❤️'
      heart.style.left = `${e.clientX - 10}px`
      heart.style.top = `${e.clientY - 20}px`
      document.body.appendChild(heart)
      setTimeout(() => heart.remove(), 700)
    }
  }

  // Filter and search logic
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = photo.guest_name?.toLowerCase().includes(q)
        const matchNote = photo.guest_note?.toLowerCase().includes(q)
        if (!matchName && !matchNote) return false
      }

      // Filter matching
      if (activeFilter === 'all') return true
      if (activeFilter === 'popular') return (localLikesCount[photo.id] ?? photo.likes ?? 0) > 0
      return photo.preset_id === activeFilter
    })
  }, [photos, activeFilter, searchQuery, localLikesCount])

  // Aggregate stats
  const totalLikes = useMemo(() => {
    return photos.reduce((acc, p) => acc + (localLikesCount[p.id] ?? p.likes ?? 0), 0)
  }, [photos, localLikesCount])

  const uniqueGuests = useMemo(() => {
    const set = new Set(photos.map((p) => p.guest_name?.toLowerCase()))
    return set.size
  }, [photos])

  // Download photo file
  const handleDownload = (e, photo) => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = photo.photo_url
    link.download = `dazzevent_${photo.id}.jpg`
    link.click()
    showToast('Foto sedang diunduh!', 'success')
  }

  // Lightbox Navigation
  const openNextPhoto = () => {
    if (!selectedPhoto) return
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id)
    if (idx !== -1 && idx < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[idx + 1])
    } else {
      setSelectedPhoto(filteredPhotos[0])
    }
  }

  const openPrevPhoto = () => {
    if (!selectedPhoto) return
    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id)
    if (idx > 0) {
      setSelectedPhoto(filteredPhotos[idx - 1])
    } else {
      setSelectedPhoto(filteredPhotos[filteredPhotos.length - 1])
    }
  }

  return (
    <div className="album-feed-container">
      {/* =========================================================================
          HERO EVENT BANNER (Streamlined for Guests)
          ========================================================================= */}
      <section className="event-hero-banner glass-panel" style={{ padding: isHost ? '36px 32px' : '28px 24px', marginBottom: '24px' }}>
        <div className="hero-content">
          <div className="hero-badge-row">
            {event.date && (
              <span className="event-date-pill">
                <Calendar size={14} />
                <span>{new Date(event.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
              </span>
            )}
            {event.venue && (
              <span className="event-venue-pill">
                <MapPin size={14} />
                <span>{event.venue}</span>
              </span>
            )}
          </div>

          <h1 className="hero-title" style={{ fontSize: isHost ? '2.4rem' : '2.1rem', marginBottom: '8px' }}>
            {event.title}
          </h1>
          <p className="hero-welcome" style={{ marginBottom: isHost ? '24px' : '20px', maxWidth: '600px' }}>
            {event.welcome_msg}
          </p>

          {/* Stats shown only in Host mode */}
          {isHost && (
            <div className="hero-stats-row" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <span className="stat-number">{photos.length}</span>
                <span className="stat-label">Total Foto</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{uniqueGuests}</span>
                <span className="stat-label">Tamu Berkontribusi</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{totalLikes}</span>
                <span className="stat-label">Total Suka</span>
              </div>
            </div>
          )}

          {/* Call-to-action bar */}
          <div className="hero-cta-group">
            <button
              id="hero-camera-btn"
              className="btn-primary hero-btn-lg"
              onClick={onOpenCamera}
            >
              <Camera size={22} />
              <span>Jepret Foto (Dazz Cam)</span>
            </button>

            {isHost && (
              <>
                <button
                  id="hero-qr-btn"
                  className="btn-secondary"
                  onClick={onOpenQR}
                >
                  <QrCode size={18} />
                  <span>Undang Tamu (QR Code)</span>
                </button>

                <button
                  id="hero-projector-btn"
                  className="btn-secondary"
                  onClick={onOpenProjector}
                >
                  <Tv size={18} />
                  <span>Layar Proyektor</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FILTER & PRESET TOOLBAR
          ========================================================================= */}
      <div className="feed-toolbar glass-panel">
        <div className="filter-scroll-wrapper">
          <button
            id="filter-all"
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Semua ({photos.length})
          </button>
          <button
            id="filter-popular"
            className={`filter-pill ${activeFilter === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveFilter('popular')}
          >
            🔥 Terpopuler
          </button>

          <span className="filter-divider" />

          {DAZZ_PRESETS.map((preset) => {
            const count = photos.filter((p) => p.preset_id === preset.id).length
            if (count === 0 && activeFilter !== preset.id) return null
            return (
              <button
                key={preset.id}
                id={`filter-${preset.id}`}
                className={`filter-pill ${activeFilter === preset.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(preset.id)}
              >
                <span
                  className="preset-dot"
                  style={{ backgroundColor: preset.badgeColor }}
                />
                {preset.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="search-box">
          <Search size={16} color="#94a3b8" />
          <input
            id="search-photos-input"
            type="text"
            placeholder="Cari nama atau pesan tamu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          PHOTO GALLERY GRID
          ========================================================================= */}
      {filteredPhotos.length === 0 ? (
        <div className="empty-feed-card glass-panel">
          <Camera size={54} color="#ff7a00" />
          <h3>Belum Ada Foto di Kategori Ini</h3>
          <p>
            Jadilah yang pertama mengabadikan momen berharga di acara ini dengan kamera filter retro!
          </p>
          <button id="empty-state-camera-btn" className="btn-primary" onClick={onOpenCamera}>
            <Camera size={18} />
            <span>Buka Kamera Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="photos-masonry-grid">
          {filteredPhotos.map((photo) => {
            const preset = getPresetById(photo.preset_id)
            const isLiked = likedPhotoIds[photo.id] || false
            const likesCount = localLikesCount[photo.id] ?? (photo.likes || 0)
            const isPolaroid = preset.frame === 'polaroid'

            return (
              <article
                key={photo.id}
                id={`photo-card-${photo.id}`}
                className={`photo-card glass-panel ${isPolaroid ? 'polaroid-style' : ''}`}
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Photo Image Slot */}
                <div className="photo-media-box">
                  <img
                    src={photo.photo_url}
                    alt={`Foto dari ${photo.guest_name}`}
                    loading="lazy"
                    className="photo-card-img"
                  />

                  {/* Preset Badge */}
                  <span
                    className="photo-preset-chip"
                    style={{ backgroundColor: preset.badgeColor }}
                  >
                    {preset.name}
                  </span>

                  {/* Hover Overlay Button */}
                  <div className="photo-hover-overlay">
                    <button className="quick-view-btn">
                      <Eye size={18} />
                      <span>Perbesar</span>
                    </button>
                  </div>
                </div>

                {/* Photo Meta & Guest Info */}
                <div className="photo-meta-info">
                  <div className="guest-info-row">
                    <div className="guest-avatar">
                      {photo.guest_name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    <div className="guest-text-col">
                      <div className="guest-name">{photo.guest_name}</div>
                      <div className="photo-time">{formatTimeAgo(photo.created_at)}</div>
                    </div>

                    {/* Like button */}
                    <button
                      id={`like-btn-${photo.id}`}
                      className={`photo-like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, photo)}
                      title="Sukai Foto Ini"
                    >
                      <Heart
                        size={18}
                        className={isLiked ? 'heart-icon-filled' : 'heart-icon-outline'}
                        fill={isLiked ? '#f43f5e' : 'none'}
                        color={isLiked ? '#f43f5e' : '#cbd5e1'}
                      />
                      <span className="like-counter">{likesCount}</span>
                    </button>
                  </div>

                  {/* Guest Greeting Note */}
                  {photo.guest_note && (
                    <p className="photo-caption-note">
                      "{photo.guest_note}"
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL (Full Photo View)
          ========================================================================= */}
      {selectedPhoto && (
        <div className="lightbox-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              id="close-lightbox-btn"
              className="lightbox-close-btn"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>

            {/* Previous & Next navigation */}
            <button
              id="prev-lightbox-btn"
              className="lightbox-nav-btn prev"
              onClick={openPrevPhoto}
              title="Foto Sebelumnya"
            >
              <ChevronLeft size={30} />
            </button>

            <button
              id="next-lightbox-btn"
              className="lightbox-nav-btn next"
              onClick={openNextPhoto}
              title="Foto Selanjutnya"
            >
              <ChevronRight size={30} />
            </button>

            {/* Photo Viewport */}
            <div className="lightbox-photo-area">
              <img
                src={selectedPhoto.photo_url}
                alt={`Foto oleh ${selectedPhoto.guest_name}`}
                className="lightbox-main-img"
              />
            </div>

            {/* Info Sidebar / Bottom Drawer */}
            <div className="lightbox-info-drawer">
              <div className="lightbox-header-row">
                <div className="drawer-user-group">
                  <div className="guest-avatar large">
                    {selectedPhoto.guest_name?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <h3 className="drawer-guest-name">{selectedPhoto.guest_name}</h3>
                    <span className="drawer-timestamp">
                      {new Date(selectedPhoto.created_at).toLocaleString('id-ID', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Preset Tag */}
                <div className="drawer-preset-badge">
                  <span
                    className="preset-dot"
                    style={{
                      backgroundColor: getPresetById(selectedPhoto.preset_id).badgeColor,
                    }}
                  />
                  <span>Preset: {getPresetById(selectedPhoto.preset_id).name}</span>
                </div>
              </div>

              {selectedPhoto.guest_note && (
                <div className="drawer-note-quote">
                  <MessageCircle size={18} color="#ff7a00" />
                  <p>"{selectedPhoto.guest_note}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="drawer-actions-row">
                <button
                  id="lightbox-like-btn"
                  className={`btn-secondary like-btn ${
                    likedPhotoIds[selectedPhoto.id] ? 'liked' : ''
                  }`}
                  onClick={(e) => handleLike(e, selectedPhoto)}
                >
                  <Heart
                    size={20}
                    fill={likedPhotoIds[selectedPhoto.id] ? '#f43f5e' : 'none'}
                    color={likedPhotoIds[selectedPhoto.id] ? '#f43f5e' : '#fff'}
                  />
                  <span>
                    {likedPhotoIds[selectedPhoto.id] ? 'Disukai' : 'Suka'} (
                    {localLikesCount[selectedPhoto.id] ?? selectedPhoto.likes ?? 0})
                  </span>
                </button>

                <button
                  id="lightbox-download-btn"
                  className="btn-primary"
                  onClick={(e) => handleDownload(e, selectedPhoto)}
                >
                  <Download size={18} />
                  <span>Download Resolusi Penuh</span>
                </button>

                {isHost && onPhotoDelete && (
                  <button
                    id="lightbox-delete-btn"
                    className="btn-danger-icon"
                    onClick={() => {
                      if (window.confirm('Hapus foto ini dari album?')) {
                        onPhotoDelete(selectedPhoto.id)
                        setSelectedPhoto(null)
                      }
                    }}
                    title="Hapus Foto (Host)"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
