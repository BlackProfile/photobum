'use client';

import React, { useState, useRef } from 'react';
import { X, Download, Sparkles, Check, Layout, Palette, RefreshCw } from 'lucide-react';

const STRIP_THEMES = [
  { id: 'dark', name: 'Noir Minimal', bg: '#12151f', border: '#252a3d', text: '#ffffff', sub: '#94a3b8' },
  { id: 'classic-white', name: 'Classic White', bg: '#fdfdfd', border: '#e2e8f0', text: '#0f172a', sub: '#64748b' },
  { id: 'vintage-kraft', name: 'Vintage Film', bg: '#1c1917', border: '#44403c', text: '#f59e0b', sub: '#a8a29e' },
  { id: 'cyber-neon', name: 'Cyber Party', bg: '#090a10', border: '#3b82f6', text: '#38bdf8', sub: '#f43f5e' },
  { id: 'wedding-blush', name: 'Wedding Blush', bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', sub: '#fb7185' },
  { id: 'lavender-dream', name: 'Dreamy Lilac', bg: '#2e1065', border: '#581c87', text: '#e9d5ff', sub: '#c084fc' },
];

export default function PhotoboothStripModal({
  event,
  photos = [],
  onClose,
  showToast = () => {},
}) {
  const [selectedPhotos, setSelectedPhotos] = useState(() => {
    // Pick the latest 3 or 4 photos as initial selection
    return photos.slice(0, 3);
  });
  const [theme, setTheme] = useState(STRIP_THEMES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);

  const toggleSelectPhoto = (photo) => {
    const isSelected = selectedPhotos.some((p) => p.id === photo.id);
    if (isSelected) {
      if (selectedPhotos.length <= 2) {
        showToast('Pilih minimal 2 foto untuk strip photobooth', 'info');
        return;
      }
      setSelectedPhotos(selectedPhotos.filter((p) => p.id !== photo.id));
    } else {
      if (selectedPhotos.length >= 4) {
        showToast('Maksimal 4 foto per lembar strip', 'info');
        return;
      }
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };

  const handleDownloadStrip = async () => {
    if (selectedPhotos.length < 2) {
      showToast('Pilih setidaknya 2 foto terlebih dahulu', 'error');
      return;
    }

    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Strip Dimensions (High Resolution 1200x3600 ratio)
      const width = 1200;
      const padding = 60;
      const photoWidth = width - (padding * 2);
      const photoHeight = Math.round(photoWidth * (3 / 4)); // 4:3 photo ratio
      const photoGap = 40;
      const headerHeight = 120;
      const footerHeight = 220;

      const totalHeight = headerHeight + (selectedPhotos.length * photoHeight) + ((selectedPhotos.length - 1) * photoGap) + footerHeight;

      canvas.width = width;
      canvas.height = totalHeight;

      // Draw background
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, totalHeight);

      // Draw top header brand
      ctx.fillStyle = theme.sub;
      ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((event?.title || 'PHOTO BOOTH').toUpperCase(), width / 2, 80);

      // Load all images
      const loadedImages = await Promise.all(
        selectedPhotos.map((item) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = item.photo_url;
          });
        })
      );

      // Draw each photo
      let currentY = headerHeight;
      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];
        if (img) {
          // Draw image
          ctx.save();
          // Rounded corners for photo
          const r = 24;
          ctx.beginPath();
          ctx.moveTo(padding + r, currentY);
          ctx.lineTo(padding + photoWidth - r, currentY);
          ctx.quadraticCurveTo(padding + photoWidth, currentY, padding + photoWidth, currentY + r);
          ctx.lineTo(padding + photoWidth, currentY + photoHeight - r);
          ctx.quadraticCurveTo(padding + photoWidth, currentY + photoHeight, padding + photoWidth - r, currentY + photoHeight);
          ctx.lineTo(padding + r, currentY + photoHeight);
          ctx.quadraticCurveTo(padding, currentY + photoHeight, padding, currentY + photoHeight - r);
          ctx.lineTo(padding, currentY + r);
          ctx.quadraticCurveTo(padding, currentY, padding + r, currentY);
          ctx.closePath();
          ctx.clip();

          // Cover crop
          const srcAspect = img.width / img.height;
          const targetAspect = photoWidth / photoHeight;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;

          if (srcAspect > targetAspect) {
            sw = img.height * targetAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / targetAspect;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, padding, currentY, photoWidth, photoHeight);
          ctx.restore();

          // Subtle photo border
          ctx.strokeStyle = theme.border;
          ctx.lineWidth = 4;
          ctx.strokeRect(padding, currentY, photoWidth, photoHeight);
        }

        currentY += photoHeight + photoGap;
      }

      // Draw Footer
      const footerY = currentY + 30;

      // Event Date & Venue
      ctx.fillStyle = theme.text;
      ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(event?.title || 'DAZZ EVENT', width / 2, footerY + 40);

      ctx.fillStyle = theme.sub;
      ctx.font = '500 30px "Inter", sans-serif';
      const eventDateStr = event?.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      const venueStr = event?.venue ? ` • ${event.venue}` : '';
      ctx.fillText(`${eventDateStr}${venueStr}`, width / 2, footerY + 90);

      // Brand Watermark
      ctx.fillStyle = theme.sub;
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('DAZZ EVENT • 35MM RETRO PHOTOBOOTH', width / 2, footerY + 150);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `photobooth_strip_${event?.id || 'event'}_${Date.now()}.png`;
      link.click();

      showToast('Photo strip berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Strip generation error:', err);
      showToast('Gagal membuat photo strip', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 120 }}>
      <div
        className="glass-panel"
        style={{
          width: '95%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          background: '#0d0f16',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Layout size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Photobooth Strip Studio
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Gabungkan foto menjadi photostrip vertikal ala Korea
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="hud-icon-btn"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 280px',
            gap: '24px',
          }}
        >
          {/* Left Column: Photo Selection */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                Pilih Foto ({selectedPhotos.length}/4)
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Klik pada foto untuk memilih/melepas
              </span>
            </div>

            {photos.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                Belum ada foto yang tersedia di acara ini.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '12px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                }}
              >
                {photos.map((photo) => {
                  const isSelected = selectedPhotos.some((p) => p.id === photo.id);
                  const selectedIndex = selectedPhotos.findIndex((p) => p.id === photo.id);

                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleSelectPhoto(photo)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4 / 3',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <img
                        src={photo.photo_url}
                        alt="Photo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#f59e0b',
                            color: '#000',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {selectedIndex + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Theme Picker */}
            <div style={{ marginTop: '24px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '10px' }}>
                Pilih Tema Bingkai
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {STRIP_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: t.bg,
                      border: theme.id === t.id ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: t.text,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                  >
                    <span>{t.name}</span>
                    {theme.id === t.id && <Check size={16} color="#f59e0b" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Strip Mini Preview */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '12px', fontWeight: 600 }}>
              PREVIEW STRIP
            </span>

            {/* Strip Mockup */}
            <div
              style={{
                width: '180px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                padding: '14px 10px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: theme.sub, letterSpacing: '0.5px' }}>
                {(event?.title || 'PHOTO BOOTH').toUpperCase()}
              </div>

              {selectedPhotos.map((p) => (
                <div
                  key={p.id}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#000',
                  }}
                >
                  <img
                    src={p.photo_url}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.text }}>
                  {event?.title || 'DAZZ EVENT'}
                </div>
                <div style={{ fontSize: '0.55rem', color: theme.sub }}>
                  {event?.date || '2026'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            background: 'rgba(8, 9, 14, 0.8)',
          }}
        >
          <button onClick={onClose} className="nav-btn">
            Tutup
          </button>

          <button
            onClick={handleDownloadStrip}
            disabled={isGenerating || selectedPhotos.length < 2}
            className="btn-primary"
            style={{ opacity: isGenerating || selectedPhotos.length < 2 ? 0.6 : 1 }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="spin-slow" />
                <span>Memproses Strip...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Photo Strip (PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
