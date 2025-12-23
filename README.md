# 💵 MoneyVoice - Aplikasi Pemindai Uang untuk Tunanetra

Aplikasi berbasis web untuk membantu penyandang tunanetra dalam mengidentifikasi nominal uang kertas Rupiah Indonesia menggunakan teknologi AI.

## ✨ Fitur Utama

- **🔍 Scan Tunggal** - Pindai satu lembar uang dan dengarkan nominalnya
- **🧮 Mode Hitung** - Scan beberapa lembar uang dan hitung total nilai
- **📊 Riwayat** - Lihat riwayat scan dan perhitungan
- **🔊 Text-to-Speech** - Output suara untuk setiap hasil scan
- **🤖 AI-Powered** - Menggunakan Google Gemini AI untuk deteksi mata uang yang akurat

## 🛠 Teknologi yang Digunakan

### Backend
- **Node.js** + **Express.js** - REST API server
- **PostgreSQL** - Database utama untuk users dan calculation sessions
- **Redis Cloud** - Cache untuk riwayat scan tunggal (TTL 30 hari)
- **Google Gemini AI** - Deteksi mata uang dari gambar
- **Sequelize** - ORM untuk PostgreSQL
- **JWT** - Authentication

### Frontend
- **React.js 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Web Speech API** - Text-to-speech

## 📦 Struktur Data

### Scan Tunggal (Redis Cloud)
```json
{
  "id": "uuid",
  "userId": "uuid",
  "value": 50000,
  "valueFormatted": "Rp 50.000",
  "currency": "IDR",
  "text": "lima puluh ribu rupiah",
  "confidence": 95.5,
  "timestamp": "2025-01-15T10:30:00Z",
  "type": "single_scan"
}
```

### Calculation Session (PostgreSQL)
```json
{
  "id": "uuid",
  "userId": "uuid",
  "totalMoney": 6000,
  "totalBanknotes": 2,
  "currency": "IDR",
  "denominationBreakdown": {
    "totalMoney": 6000,
    "denominations": [
      { "value": 5000, "count": 1, "text": "lima ribu rupiah" },
      { "value": 1000, "count": 1, "text": "seribu rupiah" }
    ]
  },
  "isCompleted": true,
  "note": "Catatan opsional",
  "createdAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:35:00Z"
}
```

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis Cloud account (atau gunakan URL Redis Cloud yang sudah disediakan)
- Google Cloud account dengan Gemini API key

### 1. Setup Environment

**Backend** (buat file `.env` di folder `backend/`):
```env
# Server Configuration
PORT=5010
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scan_tunai_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Upload Configuration
MAX_FILE_SIZE=10485760

# Redis Cloud Configuration
REDIS_URL=redis://default:YOUR_PASSWORD@redis-xxxxx.cloud.redislabs.com:19190

# Scan History TTL (30 days in seconds)
SCAN_HISTORY_TTL=2592000

# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key
```

**Frontend** (buat file `.env` di folder `frontend/`):
```env
VITE_API_URL=http://localhost:5010/api
```

### 2. Buat Database PostgreSQL
```sql
CREATE DATABASE scan_tunai_db;
```

### 3. Install Dependencies & Run

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Akses Aplikasi
- Frontend: http://localhost:5173
- Backend API: http://localhost:5010/api

## �� Penggunaan Aplikasi

### Scan Tunggal
1. Login ke aplikasi
2. Pilih menu "Scan Uang"
3. Ambil foto uang kertas
4. Dengarkan hasil scan (nominal akan dibacakan)

### Mode Hitung
1. Pilih menu "Hitung Uang"
2. Klik "Mulai Sesi"
3. Scan uang satu per satu
4. Total akan dihitung otomatis
5. Klik "Selesai" untuk mengakhiri sesi

### Riwayat
- Tab "Scan Tunggal" - Lihat riwayat scan individual (dari Redis)
- Tab "Perhitungan" - Lihat riwayat sesi perhitungan (dari PostgreSQL)

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Scan
- `POST /api/scan/single` - Scan single currency
- `GET /api/scan/history` - Get scan history (Redis)

### Calculation
- `POST /api/scan/calculate/start` - Start calculation session
- `POST /api/scan/calculate/:sessionId/add` - Add scan to session
- `POST /api/scan/calculate/:sessionId/finish` - Finish session
- `GET /api/scan/calculate/:sessionId` - Get session info
- `GET /api/scan/history/calculations` - Get calculation history (PostgreSQL)

## 🔒 Keamanan

- Gambar uang **dihapus otomatis** setelah diproses oleh AI
- Tidak ada penyimpanan gambar di database
- Data yang disimpan hanya: nominal, mata uang, dan timestamp
- Semua request memerlukan JWT token (kecuali register/login)

## 📝 Catatan Penting

1. **Redis Cloud** - Aplikasi menggunakan Redis Cloud untuk menyimpan riwayat scan tunggal dengan TTL 30 hari. Pastikan URL Redis Cloud sudah dikonfigurasi dengan benar.

2. **Gemini AI** - Pastikan API key Gemini valid dan memiliki akses ke Gemini 1.5 Flash model.

3. **Image Processing** - Gambar akan dikonversi ke base64 dan dikirim ke Gemini AI untuk dianalisis. Setelah itu, file gambar akan otomatis dihapus.

4. **Supported Denominations** - Aplikasi mendukung uang kertas Rupiah: Rp 1.000, Rp 2.000, Rp 5.000, Rp 10.000, Rp 20.000, Rp 50.000, Rp 100.000

## 🤝 Kontribusi

Silakan buat pull request atau issue jika menemukan bug atau ingin menambahkan fitur baru.

## � Deployment

Lihat [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) untuk panduan lengkap deployment ke AWS.

### Quick Deployment Checklist:
1. Setup Supabase PostgreSQL database
2. Jalankan migrations: `npm run db:migrate:prod`
3. Deploy ke EC2 atau ECS
4. Konfigurasi environment variables
5. Setup SSL dan domain

## 🧪 Testing

```bash
# Jalankan semua test
npm test

# Jalankan test dengan watch mode
npm run test:watch

# Jalankan hanya unit test
npm run test:unit

# Jalankan hanya integration test
npm run test:integration
```

## �📄 Lisensi

MIT License
