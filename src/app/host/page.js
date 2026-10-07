'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  QrCode,
  Tv,
  Settings,
  Download,
  Trash2,
  ExternalLink,
  Sparkles,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Save,
  Cloud,
  Check,
  Copy,
  Plus,
  ArrowRight,
  ArrowLeft,
  Share2,
  Layers,
  Heart,
  Eye,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  getAllEvents,
  getEventDetails,
  saveEventDetails,
  deleteEvent,
  getPhotos,
  deletePhoto,
  DEFAULT_EVENT,
} from '../../services/storage';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
  getSupabase,
} from '../../services/supabaseClient';
import Toast from '../../components/Toast';
import QRShareModal from '../../components/QRShareModal';
import ProjectorMode from '../../components/ProjectorMode';

function HostMultiEventHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeEventId = searchParams.get('event');

  const [eventsList, setEventsList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'settings' | 'photos' | 'cloud'

  // New Event Modal
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    id: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    host_name: '',
    welcome_msg: 'Terima kasih telah hadir! Abadikan momen Anda dengan kamera retro Dazz Cam.',
  });

  // Edit Event Form
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    venue: '',
    host_name: '',
    welcome_msg: '',
  });

  // Supabase state
  const storedConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(storedConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(storedConfig.key);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Modals
  const [isQROpen, setIsQROpen] = useState(false);
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const isSupabaseActive = Boolean(getSupabase());

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load all events
  const refreshEvents = useCallback(async () => {
    const all = await getAllEvents();
    setEventsList(all);
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // When activeEventId changes or events load, set current selected event
  useEffect(() => {
    if (activeEventId) {
      getEventDetails(activeEventId).then((data) => {
        if (data) {
          setSelectedEvent(data);
          setEditForm({
            title: data.title || '',
            date: data.date || '',
            venue: data.venue || '',
            host_name: data.host_name || '',
            welcome_msg: data.welcome_msg || '',
          });
          getPhotos(data.id).then((p) => setPhotos(p));
        }
      });
    } else {
      setSelectedEvent(null);
    }
  }, [activeEventId]);

  // Create new event handler
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const cleanId = (newEventForm.id || newEventForm.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    if (!cleanId) {
      showToast('Harap masukkan nama atau ID acara', 'error');
      return;
    }

    const payload = {
      ...newEventForm,
      id: cleanId,
    };

    await saveEventDetails(payload);
    showToast(`Acara "${payload.title}" berhasil dibuat!`, 'success');
    setIsCreatingEvent(false);
    setNewEventForm({
      id: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      venue: '',
      host_name: '',
      welcome_msg: 'Terima kasih telah hadir! Abadikan momen Anda dengan kamera retro Dazz Cam.',
    });
    await refreshEvents();
    router.push(`/host?event=${cleanId}`);
  };

  // Update event handler
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const updated = await saveEventDetails({
      ...selectedEvent,
      ...editForm,
    });
    setSelectedEvent(updated);
    await refreshEvents();
    showToast('Perubahan acara berhasil disimpan!', 'success');
  };

  // Delete event handler
  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Yakin ingin menghapus acara "${title}" beserta semua fotonya?`)) {
      await deleteEvent(id);
      showToast(`Acara "${title}" telah dihapus`, 'info');
      await refreshEvents();
      if (activeEventId === id) {
        router.push('/host');
      }
    }
  };

  // Download all photos in ZIP
  const handleDownloadAllZip = async () => {
    if (photos.length === 0) {
      showToast('Belum ada foto untuk diunduh', 'error');
      return;
    }
    setIsZipping(true);
    showToast('Sedang menyiapkan file ZIP...', 'info');
    try {
      const zip = new JSZip();
      const folder = zip.folder(selectedEvent.title.replace(/[^a-zA-Z0-9]/g, '_'));

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const base64Data = p.photo_url.split(',')[1];
        const filename = `${i + 1}_${p.guest_name.replace(/[^a-zA-Z0-9]/g, '_')}_${p.preset_id}.jpg`;

        if (base64Data) {
          folder.file(filename, base64Data, { base64: true });
        } else if (p.photo_url.startsWith('http') || p.photo_url.startsWith('/')) {
          const res = await fetch(p.photo_url);
          const blob = await res.blob();
          folder.file(filename, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Foto_Acara_${selectedEvent.title.replace(/\s+/g, '_')}.zip`;
      link.click();
      showToast('Arsip ZIP berhasil diunduh!', 'success');
    } catch (err) {
      showToast('Gagal membuat file ZIP', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Export Guestbook & Photos Metadata as CSV
  const handleExportCSV = () => {
    if (photos.length === 0) {
      showToast('Belum ada data untuk diekspor', 'error');
      return;
    }

    const headers = ['ID', 'Nama Tamu', 'Ucapan & Doa', 'Preset Kamera', 'Jumlah Like', 'Waktu'];
    const rows = photos.map((p, idx) => [
      idx + 1,
      `"${(p.guest_name || '').replace(/"/g, '""')}"`,
      `"${(p.guest_note || '').replace(/"/g, '""')}"`,
      p.preset_id || 'none',
      p.likes || 0,
      `"${new Date(p.created_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Buku_Tamu_${selectedEvent.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    showToast('Buku Tamu (.CSV) berhasil diunduh!', 'success');
  };

  // Reset photos in event
  const handleClearPhotos = async () => {
    if (window.confirm('Yakin ingin mereset seluruh foto di album acara ini?')) {
      for (const p of photos) {
        await deletePhoto(p.id);
      }
      localStorage.setItem(`dazzevent_cleaned_${selectedEvent.id}`, 'true');
      setPhotos([]);
      showToast('Semua foto acara telah dibersihkan', 'info');
    }
  };

  // Save Supabase credentials
  const handleSaveSupabase = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    showToast('Kredensial Supabase disimpan!', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast('Skrip SQL Supabase berhasil disalin!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="app-root">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header Navbar */}
      <header className="glass-nav sticky-top">
        <div className="nav-container">
          <Link href="/host" className="brand-group" style={{ textDecoration: 'none' }}>
            <div className="brand-icon">
              <Camera size={22} color="#ff7a00" />
              <span className="brand-dot" />
            </div>
            <div>
              <div className="brand-title">
                DAZZ<span>EVENT</span>
              </div>
              <div className="brand-sub">Host Multi-Event Hub</div>
            </div>
          </Link>

          <div className="nav-actions">
            <Link href="/" className="nav-btn">
              <span>Landing Page</span>
            </Link>

            <button
              id="create-event-top-btn"
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setIsCreatingEvent(true)}
            >
              <Plus size={16} />
              <span>Buat Acara Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {selectedEvent ? (
          /* =========================================================================
             DETAIL EVENT VIEW (Settings, Sharelink, Proyektor, Photos, Cloud)
             ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Navigation Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <button
                id="back-to-events-btn"
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => router.push('/host')}
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Daftar Acara</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href={`/event/${selectedEvent.id}`}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  target="_blank"
                >
                  <Camera size={16} />
                  <span>Buka Kamera Tamu</span>
                  <ExternalLink size={14} />
                </Link>

                <button
                  id="open-qr-btn"
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  onClick={() => setIsQROpen(true)}
                >
                  <QrCode size={16} />
                  <span>Undangan QR & Link</span>
                </button>

                <button
                  id="open-projector-btn"
                  className="btn-secondary projector-glow"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  onClick={() => setIsProjectorOpen(true)}
                >
                  <Tv size={16} />
                  <span>Layar Proyektor</span>
                </button>
              </div>
            </div>

            {/* Event Header Banner */}
            <div className="glass-panel" style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span className="live-event-badge" style={{ marginBottom: '8px' }}>
                    <span className="rec-dot" /> ID: {selectedEvent.id}
                  </span>
                  <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px' }}>
                    {selectedEvent.title}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
                    {selectedEvent.venue && <span>📍 {selectedEvent.venue} • </span>}
                    {selectedEvent.date && <span>📅 {new Date(selectedEvent.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>}
                  </p>
                </div>

                <div className="hero-stats-row" style={{ margin: 0 }}>
                  <div className="stat-card">
                    <span className="stat-number">{photos.length}</span>
                    <span className="stat-label">Total Foto</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      {new Set(photos.map((p) => p.guest_name?.toLowerCase())).size}
                    </span>
                    <span className="stat-label">Tamu</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">
                      {photos.reduce((acc, p) => acc + (p.likes || 0), 0)}
                    </span>
                    <span className="stat-label">Suka</span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs for Event Management */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '24px' }}>
                {[
                  { key: 'overview', label: 'Galeri Foto' },
                  { key: 'settings', label: 'Pengaturan & Identitas' },
                  { key: 'cloud', label: 'Cloud Supabase' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className={`filter-pill ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: Galeri Foto & Batch Actions */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Foto Tamu yang Terkumpul ({photos.length})
                  </h2>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={handleExportCSV}
                      disabled={photos.length === 0}
                    >
                      <Download size={16} />
                      <span>Ekspor CSV</span>
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={handleDownloadAllZip}
                      disabled={isZipping || photos.length === 0}
                    >
                      <Download size={16} />
                      <span>Download Semua (.ZIP)</span>
                    </button>

                    <button
                      className="btn-danger"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)' }}
                      onClick={handleClearPhotos}
                      disabled={photos.length === 0}
                    >
                      <Trash2 size={16} />
                      <span>Bersihkan Foto</span>
                    </button>
                  </div>
                </div>

                {photos.length === 0 ? (
                  <div className="empty-feed-card glass-panel" style={{ margin: '20px 0', padding: '40px' }}>
                    <ImageIcon size={48} color="#ff7a00" />
                    <h3>Belum Ada Foto</h3>
                    <p>Bagikan QR Code kepada tamu agar mereka dapat mulai mengambil foto.</p>
                    <button className="btn-primary" onClick={() => setIsQROpen(true)}>
                      <QrCode size={18} />
                      <span>Buka QR Code Tamu</span>
                    </button>
                  </div>
                ) : (
                  <div className="photos-masonry-grid">
                    {photos.map((photo) => (
                      <div key={photo.id} className="photo-card glass-panel">
                        <div className="photo-media-box">
                          <img src={photo.photo_url} alt={photo.guest_name} className="photo-card-img" />
                          <span className="photo-preset-chip" style={{ background: '#ff7a00' }}>
                            {photo.preset_id?.toUpperCase()}
                          </span>
                        </div>
                        <div className="photo-meta-info">
                          <div className="guest-info-row">
                            <div className="guest-avatar">
                              {photo.guest_name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className="guest-text-col">
                              <div className="guest-name">{photo.guest_name}</div>
                              <div className="photo-time">{new Date(photo.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <button
                              className="btn-danger-icon"
                              style={{ width: '32px', height: '32px' }}
                              onClick={() => {
                                if (window.confirm('Hapus foto ini?')) {
                                  deletePhoto(photo.id);
                                  setPhotos((p) => p.filter((x) => x.id !== photo.id));
                                  showToast('Foto dihapus', 'info');
                                }
                              }}
                              title="Hapus Foto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {photo.guest_note && (
                            <p className="photo-caption-note">"{photo.guest_note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Pengaturan & Identitas Acara */}
            {activeTab === 'settings' && (
              <div className="glass-panel" style={{ padding: '28px', maxWidth: '700px' }}>
                <h2 className="section-title">
                  <Settings size={20} color="#ff7a00" />
                  <span>Pengaturan Identitas Acara</span>
                </h2>

                <form onSubmit={handleUpdateEvent} className="settings-form" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Nama Acara</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tanggal Acara</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Penyelenggara / Host</label>
                      <input
                        type="text"
                        value={editForm.host_name}
                        onChange={(e) => setEditForm({ ...editForm, host_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Lokasi / Venue</label>
                    <input
                      type="text"
                      value={editForm.venue}
                      onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Pesan Sambutan Tamu</label>
                    <textarea
                      rows={3}
                      value={editForm.welcome_msg}
                      onChange={(e) => setEditForm({ ...editForm, welcome_msg: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <button type="submit" className="btn-primary">
                      <Save size={18} />
                      <span>Simpan Perubahan</span>
                    </button>

                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
                      onClick={() => handleDeleteEvent(selectedEvent.id, selectedEvent.title)}
                    >
                      <Trash2 size={16} />
                      <span>Hapus Acara Ini</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: Cloud Supabase Sync */}
            {activeTab === 'cloud' && (
              <div className="glass-panel" style={{ padding: '28px', maxWidth: '700px' }}>
                <div className="section-header-flex">
                  <h2 className="section-title">
                    <Cloud size={20} color="#06b6d4" />
                    <span>Supabase Cloud Sync</span>
                  </h2>
                  <span className={`status-pill ${isSupabaseActive ? 'online' : 'local'}`}>
                    {isSupabaseActive ? '🟢 Cloud Aktif' : '🟡 Browser Lokal'}
                  </span>
                </div>

                <p className="section-desc">
                  Koneksikan Supabase agar semua tamu di lokasi acara dari koneksi internet seluler mana pun dapat mengunggah secara real-time.
                </p>

                <div className="supabase-config-box">
                  <div className="form-group">
                    <label>Supabase Project URL</label>
                    <input
                      type="text"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Supabase Anon Key</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                    />
                  </div>

                  <div className="supabase-actions-row">
                    <button className="btn-primary" onClick={handleSaveSupabase}>
                      <Save size={18} />
                      <span>Simpan Kunci Cloud</span>
                    </button>

                    <button className="btn-secondary" onClick={handleCopySql}>
                      {copiedSql ? <Check size={18} /> : <Copy size={18} />}
                      <span>{copiedSql ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             ALL EVENTS LIST VIEW (Daftar Semua Album Acara)
             ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Daftar Album Acara</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                  Pilih acara untuk mengelola album, mengubah setting, membagikan link QR, atau membuat acara baru.
                </p>
              </div>

              <button
                id="create-event-main-btn"
                className="btn-primary hero-btn-lg"
                onClick={() => setIsCreatingEvent(true)}
              >
                <Plus size={20} />
                <span>Buat Acara Baru</span>
              </button>
            </div>

            {/* Events Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {eventsList.map((ev) => (
                <div
                  key={ev.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/host?event=${ev.id}`)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="live-event-badge" style={{ fontSize: '0.72rem' }}>
                        ID: {ev.id}
                      </span>
                      {ev.date && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {new Date(ev.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
                      {ev.title}
                    </h3>

                    {ev.venue && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#ff7a00" />
                        <span>{ev.venue}</span>
                      </p>
                    )}

                    {ev.welcome_msg && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '10px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{ev.welcome_msg}"
                      </p>
                    )}
                  </div>

                  {/* Card Action Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Kelola Album <ArrowRight size={14} />
                    </span>

                    <button
                      className="btn-danger-icon"
                      style={{ width: '32px', height: '32px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(ev.id, ev.title);
                      }}
                      title="Hapus Acara"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CREATE NEW EVENT MODAL */}
      {isCreatingEvent && (
        <div className="modal-backdrop" onClick={() => setIsCreatingEvent(false)}>
          <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Buat Acara Baru</h2>
              <button className="modal-close-btn" onClick={() => setIsCreatingEvent(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="settings-form" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Nama Acara *</label>
                <input
                  type="text"
                  placeholder="Contoh: Sarah & Rian Wedding / Kevin 25th Bash"
                  value={newEventForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoId = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    setNewEventForm({ ...newEventForm, title, id: autoId });
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>ID Acara / Kode Link (URL) *</label>
                <input
                  type="text"
                  placeholder="contoh: sarah-rian"
                  value={newEventForm.id}
                  onChange={(e) => setNewEventForm({ ...newEventForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Akan menjadi link: /event/{newEventForm.id || 'kode-acara'}
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal Acara</label>
                  <input
                    type="date"
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nama Host</label>
                  <input
                    type="text"
                    placeholder="Nama Penyelenggara"
                    value={newEventForm.host_name}
                    onChange={(e) => setNewEventForm({ ...newEventForm, host_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Lokasi / Venue</label>
                <input
                  type="text"
                  placeholder="Contoh: Ballroom Hotel Grand"
                  value={newEventForm.venue}
                  onChange={(e) => setNewEventForm({ ...newEventForm, venue: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary w-full" style={{ marginTop: '12px' }}>
                <Plus size={18} />
                <span>Simpan & Buat Album</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL (Scoped to selected event) */}
      {isQROpen && selectedEvent && (
        <QRShareModal
          event={selectedEvent}
          onClose={() => setIsQROpen(false)}
          showToast={showToast}
        />
      )}

      {/* PROJECTOR MODAL (Scoped to selected event) */}
      {isProjectorOpen && selectedEvent && (
        <ProjectorMode
          event={selectedEvent}
          photos={photos}
          onClose={() => setIsProjectorOpen(false)}
        />
      )}
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#090a0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat Panel Host...</div>}>
      <HostMultiEventHub />
    </Suspense>
  );
}
