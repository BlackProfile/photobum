# 📸 DazzEvent • Kamera Album & Photo Booth Acara Real-Time

Aplikasi web modern untuk album foto interaktif acara (pernikahan, ulang tahun, gathering, konser, reuni). Tamu cukup scan kode QR atau buka link tanpa perlu download aplikasi apapun, lalu langsung menjepret foto dengan kamera filter retro analog ala **Dazz Cam** dan membagikannya ke album acara secara real-time!

---

## ✨ Fitur Utama

### 1. 📷 Kamera In-App & Preset Dazz Cam
- **Live Viewfinder**: Tampilan kamera langsung di browser dengan filter real-time.
- **Preset Filter Retro Analog**:
  - **CPM35**: Tone hangat golden amber khas rol film 35mm (Kodak Portra 400 vibe) + stempel tanggal oranye retro.
  - **GR D**: Hitam-putih kontras tinggi khas Ricoh GR dengan grain analog pekat.
  - **DISPO 90s**: Kontras blitz tajam kamera sekali pakai tahun 90-an dengan warna punchy.
  - **INSTAX**: Format foto polaroid klasik dengan bingkai putih dan warna pastel lembut.
  - **PRISM 80s**: Efek kebocoran cahaya vintage (*light leak*) keemasan pada sudut foto.
  - **CT28 VHS**: Efek kaset video camcorder 90s dengan garis scanlines dan jam digital VCR.
  - **ASTIA**: Highlight lembut dreamy bloom dan tone pastel cerah.
  - **RAW HD**: Mode bersih tanpa filter.
- **Stempel Tanggal Retro 35mm**: Tanggal digital LCD oranye (`'26 10 06`) otomatis di sudut kanan bawah.
- **Suara Shutter Mekanikal**: Efek suara analog shutter click synthesized via Web Audio API.
- **Fitur Kamera Lengkap**: Balik kamera depan/belakang, timer 3s/5s, flash layar, garis bantu *rule-of-thirds*, dan opsi upload dari galeri HP.

### 2. 📲 Akses Tamu & Kartu Undangan QR Code
- **Scan QR Langsung Masuk**: Tamu cukup mengarahkan kamera HP ke QR Code acara untuk langsung masuk ke album.
- **Kartu Undangan Siap Cetak (PNG)**: Host dapat mengunduh kartu undangan beresolusi tinggi dengan QR Code untuk diletakkan di meja tamu atau dibagikan via WhatsApp & Instagram Stories.
- **Salin Tautan**: Bagikan link dengan satu klik.

### 3. 🖼️ Album Foto & Interaksi Tamu Real-Time
- **Galeri Masonry Dinamis**: Foto tersusun rapi dengan badge preset, nama pengunggah, dan waktu unggah.
- **Pesan & Doa Ucapan (Guestbook)**: Tamu bisa menyertakan nama dan ucapan selamat pada setiap foto.
- **Sistem Suka (Likes)**: Tamu lain dapat menyukai foto dengan animasi floating heart.
- **Filter & Pencarian**: Filter berdasarkan foto terpopuler, preset tertentu, atau cari nama tamu.
- **Lightbox Fullscreen**: Lihat foto dalam resolusi penuh dan unduh langsung ke galeri perangkat.

### 4. 🖥️ Mode Proyektor Layar Acara (Live Venue Slideshow)
- Dirancang untuk layar panggung / TV / proyektor di lokasi acara.
- Slideshow transisi otomatis dengan efek *Ken Burns pan & zoom*.
- **QR Code Tersemat di Sudut Layar**: Tamu yang sedang menonton layar bisa langsung scan QR kapan saja.
- **Alert Real-Time**: Muncul notifikasi animasi ketika ada tamu yang baru saja mengambil foto baru.

### 5. ☁️ Penyimpanan Cloud Supabase & Fallback Lokal
- **Bekerja Langsung Tanpa Setup**: Menggunakan IndexedDB browser (mampu menyimpan ratusan MB foto) + BroadcastChannel untuk preview cepat.
- **Supabase Cloud Sync (Opsional)**: Masukkan Supabase Project URL & Anon Key di menu pengaturan untuk sinkronisasi internet global antar tamu.
- **1-Click SQL Setup**: Skrip pembuatan tabel database dan storage bucket Supabase sudah tersedia di menu pengaturan.
- **Download Semua Foto (.ZIP)**: Host dapat mengunduh seluruh foto tamu dalam satu file ZIP dengan resolusi penuh.

---

## 🚀 Cara Menjalankan Aplikasi (Next.js)

1. Buka terminal di folder project:
   ```bash
   cd "d:\ANTI GRAVITY\photobum"
   ```
2. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```
3. Akses melalui browser:
   - **Halaman Utama (Landing Page)**: [http://localhost:3000/](http://localhost:3000/)
   - **Dashboard Host & Admin**: [http://localhost:3000/host](http://localhost:3000/host) (atau `/admin`)
   - **Halaman Album Tamu (Demo Acara)**: [http://localhost:3000/event/celebration-2026](http://localhost:3000/event/celebration-2026)
   - **Di Smartphone Tamu (Satu Jaringan Wi-Fi)**: `http://192.168.1.7:3000/` (atau scan QR Code dari menu 'QR Undangan').
4. Build Production:
   ```bash
   npm run build
   npm run start
   ```
