'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  QrCode,
  Tv,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Share2,
  Film,
  Heart,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { DAZZ_PRESETS } from '../filters/presets';

export default function LandingPage() {
  const [demoCode, setDemoCode] = useState('celebration-2026');

  return (
    <div className="app-root landing-page">
      {/* Navbar */}
      <header className="glass-nav sticky-top">
        <div className="nav-container">
          <Link href="/" className="brand-group" style={{ textDecoration: 'none' }}>
            <div className="brand-icon">
              <Camera size={22} color="#ff7a00" />
              <span className="brand-dot" />
            </div>
            <div>
              <div className="brand-title">
                DAZZ<span>EVENT</span>
              </div>
              <div className="brand-sub">Kamera & Album Acara</div>
            </div>
          </Link>

          <div className="nav-actions">
            <Link href="/host" className="nav-btn">
              <span>Panel Host</span>
            </Link>

            <Link href={`/event/${demoCode}`} className="camera-launch-btn">
              <Camera size={18} />
              <span>Coba Demo Album</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="live-event-badge" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
          <Sparkles size={14} /> LIVE PHOTO BOOTH & GUEST ALBUM
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-1.5px',
          background: 'linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px',
        }}>
          Abadikan Setiap Momen Acara<br />
          Dengan Sentuhan Kamera <span style={{ color: '#ff7a00', WebkitTextFillColor: '#ff7a00' }}>Dazz Cam</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Tamu cukup scan kode QR atau buka link tanpa perlu download aplikasi.
          Jepret foto langsung dengan filter retro film 35mm, dan saksikan album terisi secara real-time di layar proyektor acara!
        </p>

        {/* CTA Button Group */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link href={`/event/${demoCode}`} className="btn-primary hero-btn-lg" style={{ fontSize: '1.05rem', padding: '16px 32px' }}>
            <Camera size={22} />
            <span>Masuk ke Album Tamu</span>
            <ArrowRight size={18} />
          </Link>

          <Link href="/host" className="btn-secondary" style={{ fontSize: '1.05rem', padding: '16px 28px' }}>
            <Sliders size={20} />
            <span>Buka Dashboard Host</span>
          </Link>
        </div>

        {/* Room / Code Quick Jump */}
        <div className="glass-panel" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px 8px 18px',
          maxWidth: '460px',
          width: '100%',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>ID Acara:</span>
          <input
            type="text"
            value={demoCode}
            onChange={(e) => setDemoCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="nama-acara-kamu"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#fff',
              outline: 'none',
              boxShadow: 'none',
              width: '100%',
            }}
          />
          <Link href={`/event/${demoCode || 'celebration-2026'}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <span>Masuk</span>
          </Link>
        </div>
      </section>

      {/* Dazz Cam Presets Showcase */}
      <section style={{ maxWidth: '1200px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="live-event-badge" style={{ marginBottom: '10px' }}>
            <Film size={14} /> ANALOG CAMERA PRESETS
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Filter Retro Ikonik Dazz Cam
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
            Diolah langsung di browser menggunakan Web Audio synthesizer, stempel tanggal 35mm, dan tekstur film grain.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {DAZZ_PRESETS.slice(0, 4).map((preset) => (
            <div key={preset.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="preset-chip" style={{ backgroundColor: preset.badgeColor, fontSize: '0.8rem', padding: '4px 10px' }}>
                  {preset.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {preset.brand}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{preset.subtitle}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {preset.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Cara Kerja Sangat Praktis</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Tanpa registrasi ribet, tanpa instal aplikasi di Play Store atau App Store.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 122, 0, 0.15)', color: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <QrCode size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>1. Tamu Scan Kode QR</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Letakkan kartu undangan QR di meja makan atau proyektor. Tamu membuka kamera HP dan otomatis masuk ke album acara.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Camera size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>2. Jepret dengan Dazz Cam</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Pilih preset retro (CPM35, Dispo, GR D, Polaroid), dengarkan suara shutter analog, dan kirim pesan ucapan manis.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Tv size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>3. Live di Layar Proyektor</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Foto yang baru diambil langsung muncul di slideshow panggung venue dengan transisi halus dan notifikasi real-time!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        <p>DazzEvent • Kamera Album & Photo Booth Acara Real-Time</p>
        <p style={{ marginTop: '8px' }}>
          <Link href="/host" style={{ color: 'var(--accent-amber)', textDecoration: 'none' }}>Panel Host & Admin</Link> • <Link href={`/event/${demoCode}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contoh Album Tamu</Link>
        </p>
      </footer>
    </div>
  );
}
