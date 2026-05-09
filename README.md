# 🍎 Blox Fruits Stock Bot (WhatsApp)

Bot WhatsApp untuk cek stock Blox Fruits otomatis dari fruityblox.com.

## Fitur
- 📦 Kirim stock otomatis setiap 4 jam
- 💬 Reply `!stock` untuk cek stock kapan saja
- 💬 Reply `!help` untuk bantuan
- 🔵 Support Normal Stock & Mirage Stock

---

## Cara Pakai (Lokal)

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env, isi TARGET_NUMBERS dengan nomor WA tujuan
```

### 3. Jalankan bot
```bash
npm start
```

### 4. Scan QR Code
Scan QR yang muncul di terminal menggunakan WhatsApp di HP.

---

## Deploy ke Render

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/blox-bot.git
git push -u origin main
```

### 2. Buat service di Render
- Buka https://render.com
- New → **Background Worker**
- Connect repo GitHub kamu
- Runtime: **Docker**
- Tambahkan Environment Variable:
  - `TARGET_NUMBERS` = `6281234567890@s.whatsapp.net`

### 3. Disk untuk session
Di Render dashboard → **Disks** → tambah disk:
- Mount Path: `/app/session`
- Size: 1 GB

### 4. Scan QR pertama kali
- Buka **Logs** di Render
- Scan QR yang muncul dengan WhatsApp
- Setelah connect, session tersimpan otomatis di disk

---

## Format Nomor WA
```
# Satu nomor
TARGET_NUMBERS=6281234567890@s.whatsapp.net

# Beberapa nomor (pisah koma)
TARGET_NUMBERS=6281234567890@s.whatsapp.net,6289876543210@s.whatsapp.net

# Grup WA (ambil dari log saat ada pesan masuk)
TARGET_NUMBERS=120363xxxxxxxx@g.us
```

---

## Struktur Project
```
blox-bot/
├── src/
│   ├── index.js      # Main bot + Baileys
│   ├── scraper.js    # Puppeteer scraper
│   └── formatter.js  # Format pesan WA
├── session/          # Session WA (auto-generated)
├── Dockerfile
├── render.yaml
├── package.json
└── .env.example
```
