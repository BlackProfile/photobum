'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Navbar from '../../../components/Navbar';
import AlbumFeed from '../../../components/AlbumFeed';
import CameraView from '../../../components/CameraView';
import ProjectorMode from '../../../components/ProjectorMode';
import QRShareModal from '../../../components/QRShareModal';
import HostSettingsModal from '../../../components/HostSettingsModal';
import Toast from '../../../components/Toast';
import {
  getEventDetails,
  saveEventDetails,
  getPhotos,
  savePhoto,
  deletePhoto,
  subscribeToPhotos,
  DEFAULT_EVENT,
} from '../../../services/storage';

function EventPageContent({ params }) {
  // Safe param unwrapping for Next.js and iOS Safari
  let eventId = 'celebration-2026';
  try {
    if (params) {
      if (typeof params.then === 'function') {
        const p = use(params);
        if (p?.eventId) eventId = p.eventId;
      } else if (params.eventId) {
        eventId = params.eventId;
      }
    }
  } catch (e) {
    if (params?.eventId) eventId = params.eventId;
  }

  // State
  const [event, setEvent] = useState({ ...DEFAULT_EVENT, id: eventId });
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('album'); // 'album' | 'camera'

  // Modals
  const [isQROpen, setIsQROpen] = useState(false);
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

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

  // Guest Name Prompt State
  const [guestName, setGuestName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempNameInput, setTempNameInput] = useState('');

  // Check guest name on initial visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dazzevent_guest_name');
      if (stored && stored.trim()) {
        setGuestName(stored.trim());
      } else {
        setShowNameModal(true);
      }
    }
  }, []);

  const handleSaveGuestName = (e) => {
    e.preventDefault();
    const clean = tempNameInput.trim();
    if (clean) {
      localStorage.setItem('dazzevent_guest_name', clean);
      setGuestName(clean);
      setShowNameModal(false);
      showToast(`Selamat datang, ${clean}! 🎉`, 'success');
    }
  };

  // Load Event Details
  useEffect(() => {
    getEventDetails(eventId).then((data) => {
      if (data) setEvent(data);
    });
  }, [eventId]);

  // Load Photos & Subscribe to Realtime Updates
  const refreshPhotos = useCallback(async () => {
    const data = await getPhotos(eventId);
    setPhotos(data);
  }, [eventId]);

  useEffect(() => {
    refreshPhotos();

    // Realtime subscription (Supabase + BroadcastChannel)
    const unsubscribe = subscribeToPhotos(eventId, (eventUpdate) => {
      console.log('Realtime update received:', eventUpdate);
      refreshPhotos();
    });

    return () => {
      unsubscribe?.();
    };
  }, [eventId, refreshPhotos]);

  // Save new photo
  const handlePhotoSaved = async (photoPayload) => {
    const saved = await savePhoto({
      ...photoPayload,
      event_id: eventId,
    });
    setPhotos((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
    setActiveTab('album');
    return saved;
  };

  // Delete photo
  const handlePhotoDelete = async (photoId) => {
    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    showToast('Foto berhasil dihapus', 'info');
  };

  // Update Event
  const handleUpdateEvent = async (updatedFields) => {
    const updated = await saveEventDetails({
      ...event,
      ...updatedFields,
      id: eventId,
    });
    setEvent(updated);
  };

  // Clear Photos (Host Reset)
  const handleClearPhotos = async () => {
    for (const p of photos) {
      await deletePhoto(p.id);
    }
    setPhotos([]);
  };

  return (
    <div className="app-root">
      {/* Toast Alert Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar (Public Guest Mode) */}
      <Navbar
        event={event}
        photoCount={photos.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQR={() => setIsQROpen(true)}
        isHost={false}
      />

      {/* Main Content Area (Public Guest Mode) */}
      <main className="main-content">
        <AlbumFeed
          event={event}
          photos={photos}
          onOpenCamera={() => setActiveTab('camera')}
          onOpenQR={() => setIsQROpen(true)}
          showToast={showToast}
          isHost={false}
        />
      </main>

      {/* Full-Screen Camera View (Dazz Cam Presets) */}
      {activeTab === 'camera' && (
        <CameraView
          event={event}
          onPhotoSaved={handlePhotoSaved}
          onClose={() => setActiveTab('album')}
          showToast={showToast}
        />
      )}

      {/* QR Code Modal for Guest Sharing */}
      {isQROpen && (
        <QRShareModal
          event={event}
          onClose={() => setIsQROpen(false)}
          showToast={showToast}
        />
      )}

      {/* Guest Name Modal (Muncul saat pertama kali masuk link) */}
      {showNameModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog glass-panel" style={{ maxWidth: '440px', padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 122, 0, 0.15)', color: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Camera size={28} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>
              Selamat Datang! ✨
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Masukkan nama Anda untuk mulai mengabadikan momen di <strong>{event.title}</strong>
            </p>

            <form onSubmit={handleSaveGuestName} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                id="first-time-guest-name-input"
                type="text"
                placeholder="Nama Anda (contoh: Dimas / Maya & Rian)"
                value={tempNameInput}
                onChange={(e) => setTempNameInput(e.target.value)}
                autoFocus
                required
                style={{
                  padding: '14px 18px',
                  fontSize: '1rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 122, 0, 0.4)',
                }}
              />

              <button
                id="submit-guest-name-btn"
                type="submit"
                className="btn-primary w-full"
                style={{ padding: '14px', fontSize: '1rem' }}
                disabled={!tempNameInput.trim()}
              >
                <span>Masuk & Buka Album</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventPage(props) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#090a0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat Album Acara...</div>}>
      <EventPageContent {...props} />
    </Suspense>
  );
}
