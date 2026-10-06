'use client';

import React, { useState } from 'react'
import {
  X,
  Settings,
  Database,
  Cloud,
  Download,
  Trash2,
  Copy,
  Check,
  Save,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import JSZip from 'jszip'
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
  getSupabase,
} from '../services/supabaseClient'

export default function HostSettingsModal({
  event,
  photos = [],
  onUpdateEvent,
  onClearPhotos,
  onClose,
  showToast,
}) {
  const [formData, setFormData] = useState({
    title: event.title || '',
    date: event.date || '',
    venue: event.venue || '',
    host_name: event.host_name || '',
    welcome_msg: event.welcome_msg || '',
  })

  // Supabase keys state
  const storedConfig = getStoredSupabaseConfig()
  const [supabaseUrl, setSupabaseUrl] = useState(storedConfig.url)
  const [supabaseKey, setSupabaseKey] = useState(storedConfig.key)
  const [copiedSql, setCopiedSql] = useState(false)
  const [isZipping, setIsZipping] = useState(false)

  const isSupabaseActive = Boolean(getSupabase())

  const handleSaveEvent = (e) => {
    e.preventDefault()
    onUpdateEvent(formData)
    showToast('Informasi acara berhasil diperbarui!', 'success')
  }

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey)
    showToast('Konfigurasi Supabase disimpan! Memuat ulang koneksi...', 'info')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA)
    setCopiedSql(true)
    showToast('Skrip SQL Supabase berhasil disalin!', 'success')
    setTimeout(() => setCopiedSql(false), 2500)
  }

  // Download all event photos as ZIP
  const handleDownloadAllZip = async () => {
    if (photos.length === 0) {
      showToast('Belum ada foto untuk diunduh', 'error')
      return
    }

    setIsZipping(true)
    showToast('Sedang menyiapkan arsip ZIP seluruh foto...', 'info')

    try {
      const zip = new JSZip()
      const folder = zip.folder(event.title.replace(/[^a-zA-Z0-9]/g, '_'))

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const base64Data = p.photo_url.split(',')[1]
        const filename = `${i + 1}_${p.guest_name.replace(/[^a-zA-Z0-9]/g, '_')}_${p.preset_id}.jpg`

        if (base64Data) {
          folder.file(filename, base64Data, { base64: true })
        } else if (p.photo_url.startsWith('http') || p.photo_url.startsWith('/')) {
          // Fetch remote/sample image
          const res = await fetch(p.photo_url)
          const blob = await res.blob()
          folder.file(filename, blob)
        }
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `Semua_Foto_${event.title.replace(/\s+/g, '_')}.zip`
      link.click()

      showToast('Arsip ZIP berhasil diunduh!', 'success')
    } catch (err) {
      console.error('ZIP creation error:', err)
      showToast('Gagal membuat file ZIP', 'error')
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog settings-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Settings size={22} color="#ff7a00" />
            <h2 className="modal-title">Pengaturan Host & Cloud Sync</h2>
          </div>
          <button id="close-settings-modal-btn" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body settings-body">
          {/* SECTION 1: Detail Acara */}
          <div className="settings-section">
            <h3 className="section-title">
              <span>Informasi Acara</span>
            </h3>
            <form onSubmit={handleSaveEvent} className="settings-form">
              <div className="form-group">
                <label>Nama Acara</label>
                <input
                  id="event-title-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Acara</label>
                  <input
                    id="event-date-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Lokasi / Venue</label>
                  <input
                    id="event-venue-input"
                    type="text"
                    placeholder="Contoh: Ballroom Hotel Mulia"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pesan Sambutan Tamu</label>
                <textarea
                  id="event-welcome-input"
                  rows={2}
                  value={formData.welcome_msg}
                  onChange={(e) => setFormData({ ...formData, welcome_msg: e.target.value })}
                />
              </div>

              <button id="save-event-info-btn" type="submit" className="btn-primary">
                <Save size={18} />
                <span>Simpan Perubahan Acara</span>
              </button>
            </form>
          </div>

          {/* SECTION 2: Supabase Cloud Sync */}
          <div className="settings-section">
            <div className="section-header-flex">
              <h3 className="section-title">
                <Cloud size={18} color="#06b6d4" />
                <span>Sinkronisasi Cloud Supabase (Opsional)</span>
              </h3>
              <span className={`status-pill ${isSupabaseActive ? 'online' : 'local'}`}>
                {isSupabaseActive ? '🟢 Cloud Aktif' : '🟡 Mode Browser Lokal'}
              </span>
            </div>

            <p className="section-desc">
              Secara default, foto tersimpan di browser (IndexedDB) dan tersinkronisasi antar tab.
              Untuk mengizinkan tamu dari berbagai jaringan internet mengunggah secara real-time,
              masukkan URL & Anon Key Supabase Anda di bawah ini:
            </p>

            <div className="supabase-config-box">
              <div className="form-group">
                <label>Supabase Project URL</label>
                <input
                  id="supabase-url-input"
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Supabase Anon Key</label>
                <input
                  id="supabase-key-input"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                />
              </div>

              <div className="supabase-actions-row">
                <button
                  id="save-supabase-config-btn"
                  className="btn-primary"
                  onClick={handleSaveSupabase}
                >
                  <Save size={18} />
                  <span>Simpan Kunci Cloud</span>
                </button>

                <button
                  id="copy-sql-schema-btn"
                  className="btn-secondary"
                  onClick={handleCopySql}
                  title="Salin Skrip SQL untuk Supabase SQL Editor"
                >
                  {copiedSql ? <Check size={18} /> : <Copy size={18} />}
                  <span>{copiedSql ? 'SQL Tersalin!' : 'Salin Skrip SQL Supabase'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Batch Actions */}
          <div className="settings-section">
            <h3 className="section-title">Aksi Batch Pemilik Acara</h3>
            <div className="batch-actions-grid">
              <button
                id="download-all-zip-btn"
                className="btn-secondary batch-btn"
                onClick={handleDownloadAllZip}
                disabled={isZipping || photos.length === 0}
              >
                <Download size={20} />
                <div>
                  <div className="batch-title">Download Semua Foto (.ZIP)</div>
                  <div className="batch-sub">Unduh {photos.length} foto resolusi penuh</div>
                </div>
              </button>

              <button
                id="clear-test-photos-btn"
                className="btn-danger batch-btn"
                onClick={() => {
                  if (window.confirm('Yakin ingin mereset/menghapus foto di album ini?')) {
                    onClearPhotos()
                    showToast('Album berhasil direset!', 'info')
                  }
                }}
              >
                <Trash2 size={20} />
                <div>
                  <div className="batch-title">Bersihkan Foto Album</div>
                  <div className="batch-sub">Hapus foto sebelum acara dimulai</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
