# 🔥 Panduan Deploy Backend ke Firebase Functions

Dokumen ini menjelaskan langkah-langkah untuk mendeploy backend Scan Tunai ke Firebase Cloud Functions.

## 📋 Prasyarat

Sebelum memulai, pastikan Anda sudah memiliki:

1. **Node.js** versi 18 atau lebih baru
2. **Akun Google/Firebase** yang aktif
3. **Firebase CLI** terinstall di komputer Anda
4. **Database PostgreSQL** yang bisa diakses dari internet (contoh: Supabase, Railway, Neon, dll)

## 🚀 Langkah-langkah Deployment

### 1. Install Firebase CLI

Jika belum terinstall, jalankan perintah berikut:

```bash
npm install -g firebase-tools
```

### 2. Login ke Firebase

```bash
firebase login
```

Browser akan terbuka untuk proses autentikasi. Login dengan akun Google Anda.

### 3. Buat Project Firebase Baru

Kunjungi [Firebase Console](https://console.firebase.google.com/) dan buat project baru:

1. Klik **"Add project"** atau **"Buat project"**
2. Masukkan nama project (contoh: `scan-tunai-api`)
3. Pilih apakah ingin mengaktifkan Google Analytics (opsional)
4. Klik **"Create project"**

### 4. Upgrade ke Blaze Plan

⚠️ **PENTING:** Firebase Functions memerlukan **Blaze Plan (Pay as you go)**

1. Di Firebase Console, klik ikon gear ⚙️ > **Usage and billing**
2. Klik **"Modify plan"**
3. Pilih **"Blaze"** plan
4. Masukkan informasi billing/pembayaran

> **Catatan:** Blaze Plan memiliki free tier yang cukup besar. Anda hanya dikenakan biaya jika melebihi kuota gratis.

### 5. Konfigurasi Project ID

Edit file `.firebaserc` di folder `backend/`:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

Ganti `YOUR_FIREBASE_PROJECT_ID` dengan Project ID Firebase Anda (bisa dilihat di Firebase Console > Project Settings).

### 6. Setup Environment Variables

#### Opsi A: Menggunakan Firebase Config (Recommended)

```bash
cd backend

# Set environment variables menggunakan Firebase CLI
firebase functions:config:set \
  database.url="postgresql://username:password@host:port/database" \
  jwt.secret="your-super-secret-jwt-key" \
  jwt.expires_in="7d" \
  gemini.api_key="your-gemini-api-key" \
  frontend.url="https://your-frontend-domain.com"
```

Kemudian, modifikasi file `functions/config/database.js` untuk membaca dari Firebase config:

```javascript
const functions = require('firebase-functions');

// Untuk Firebase Functions, gunakan:
const dbUrl = functions.config().database?.url || process.env.DATABASE_URL;
```

#### Opsi B: Menggunakan File .env

1. Copy file `.env.example` menjadi `.env`:

```bash
cd backend/functions
cp .env.example .env
```

2. Edit file `.env` dengan nilai yang sesuai:

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### 7. Install Dependencies

```bash
cd backend/functions
npm install
```

### 8. Test Secara Lokal (Opsional)

Sebelum deploy, Anda bisa test fungsi secara lokal:

```bash
cd backend
firebase emulators:start
```

API akan berjalan di `http://localhost:5001/YOUR_PROJECT_ID/asia-southeast1/api`

### 9. Deploy ke Firebase

```bash
cd backend
firebase deploy --only functions
```

Tunggu proses deployment selesai. Setelah berhasil, Anda akan melihat URL function seperti:

```
✔ Function URL (api(asia-southeast1)): https://asia-southeast1-YOUR_PROJECT_ID.cloudfunctions.net/api
```

### 10. Verifikasi Deployment

Test API dengan mengakses endpoint health check:

```bash
curl https://asia-southeast1-YOUR_PROJECT_ID.cloudfunctions.net/api/api/health
```

Respons yang diharapkan:

```json
{
  "success": true,
  "message": "Scan Tunai API is running!",
  "timestamp": "2024-12-24T10:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## 📁 Struktur Folder Firebase Functions

```
backend/
├── firebase.json          # Konfigurasi Firebase
├── .firebaserc           # Project ID
└── functions/
    ├── index.js          # Entry point Firebase Functions
    ├── app.js            # Express app
    ├── package.json      # Dependencies
    ├── .env              # Environment variables
    ├── config/           # Konfigurasi database, redis, dll
    ├── controllers/      # Controller handlers
    ├── middleware/       # Middleware (auth, upload)
    ├── models/           # Sequelize models
    ├── routes/           # Express routes
    └── services/         # Business logic services
```

## ⚙️ Konfigurasi Tambahan

### Mengatur Region

Secara default, function di-deploy ke region `asia-southeast1` (Singapore). Untuk mengubah region, edit `functions/index.js`:

```javascript
exports.api = functions
  .region('asia-southeast2') // Jakarta
  // atau region lainnya
  .https.onRequest(app);
```

Region yang tersedia di Asia:
- `asia-southeast1` - Singapore
- `asia-southeast2` - Jakarta
- `asia-east1` - Taiwan
- `asia-east2` - Hong Kong
- `asia-northeast1` - Tokyo
- `asia-northeast2` - Osaka
- `asia-south1` - Mumbai

### Mengatur Memory dan Timeout

```javascript
exports.api = functions
  .region('asia-southeast1')
  .runWith({
    timeoutSeconds: 120,  // Max 540 seconds
    memory: '1GB'         // Opsi: 128MB, 256MB, 512MB, 1GB, 2GB, 4GB, 8GB
  })
  .https.onRequest(app);
```

### Cold Start Optimization

Untuk mengurangi cold start, Anda bisa menggunakan `minInstances`:

```javascript
exports.api = functions
  .region('asia-southeast1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
    minInstances: 1  // Selalu ada 1 instance aktif (ada biaya tambahan)
  })
  .https.onRequest(app);
```

## 🔄 Update & Re-deploy

Untuk mengupdate function setelah ada perubahan kode:

```bash
cd backend
firebase deploy --only functions
```

## 📊 Monitoring & Logs

### Melihat Logs

```bash
firebase functions:log
```

Atau melalui Firebase Console > Functions > Logs

### Monitoring

Kunjungi Firebase Console > Functions untuk melihat:
- Jumlah invocations
- Execution time
- Memory usage
- Error rate

## 🔧 Troubleshooting

### Error: "Cloud Functions deployment requires the pay-as-you-go (Blaze) billing plan"

**Solusi:** Upgrade ke Blaze Plan di Firebase Console.

### Error: "Cannot find module 'xxx'"

**Solusi:** Pastikan semua dependencies ada di `functions/package.json` dan jalankan `npm install` di folder functions.

### Error: Connection timeout ke database

**Solusi:** 
1. Pastikan database Anda bisa diakses dari internet
2. Whitelist IP range Google Cloud jika diperlukan
3. Periksa connection string di environment variables

### Error: CORS blocked

**Solusi:** Pastikan FRONTEND_URL sudah dikonfigurasi dengan benar, atau gunakan `origin: true` untuk development.

## 💰 Estimasi Biaya

Firebase Functions memiliki free tier:
- 2 juta invocations per bulan
- 400,000 GB-seconds per bulan
- 200,000 CPU-seconds per bulan

Untuk aplikasi dengan traffic rendah-menengah, kemungkinan besar Anda tidak akan dikenakan biaya.

## 📝 Catatan Penting

1. **File Upload:** Firebase Functions tidak mendukung penyimpanan file secara persisten. Gunakan Firebase Storage atau cloud storage lainnya untuk menyimpan file yang diupload.

2. **Redis:** Firebase Functions tidak mendukung Redis secara langsung. Pertimbangkan untuk menggunakan Upstash Redis atau layanan Redis cloud lainnya.

3. **Cold Start:** Function pertama kali dipanggil mungkin membutuhkan waktu lebih lama (cold start). Ini normal untuk serverless architecture.

4. **Database Connection:** Pastikan untuk handle connection pooling dengan baik agar tidak kehabisan koneksi database.

---

## 🔗 Link Berguna

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Pricing Calculator](https://firebase.google.com/pricing)
- [Cloud Functions Locations](https://firebase.google.com/docs/functions/locations)

---

**Selamat! Backend Scan Tunai Anda sekarang sudah di-deploy di Firebase! 🎉**
