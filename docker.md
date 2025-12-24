🐳 Penjelasan Docker di Project Ini
Docker adalah tool untuk membuat "container" - seperti kotak virtual yang berisi semua yang dibutuhkan aplikasi untuk berjalan (Node.js, dependencies, kode, dll).

Mengapa pakai Docker?
Konsisten - Aplikasi berjalan sama di laptop developer maupun di server AWS
Mudah deploy - Tinggal docker run dan aplikasi jalan
Terisolasi - Tidak bentrok dengan aplikasi lain di server
File Docker di Project Ini:
File	Fungsi
Dockerfile	Resep untuk membangun image aplikasi
.dockerignore	File yang tidak perlu masuk ke image
docker-compose.yml	Menjalankan beberapa container sekaligus

Cara Pakai Docker (Opsional):
# Build image
cd backend
docker build -t moneyvoice-api .

# Jalankan container
docker run -d -p 5000:5000 --env-file .env moneyvoice-api

# Atau pakai docker-compose (jalankan semua services)
docker-compose up -d

PENTING: Docker itu OPSIONAL. Kamu bisa deploy tanpa Docker dengan cara:
npm install
npm start