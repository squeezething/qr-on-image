# QR on Image

Aplikasi web untuk membaca beberapa QR code sekaligus dari satu gambar. Gambar dapat dimasukkan melalui URL atau diunggah langsung dari perangkat.

## Cara menggunakan aplikasi

1. Buka aplikasi di browser.
2. Masukkan URL gambar lalu tekan **Pindai**, atau unggah gambar dari perangkat.
3. Tunggu proses pemindaian selesai.
4. Lihat posisi dan isi setiap QR yang ditemukan.
5. Tekan tombol salin untuk menyalin isi QR.

Pemindaian file unggahan dilakukan di browser. Gambar dari URL diambil melalui endpoint server dengan batas ukuran 12 MB.

## Menjalankan secara lokal

### Persyaratan

- Node.js 22.13 atau lebih baru
- npm

### Instalasi

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan di terminal, biasanya [http://localhost:5173](http://localhost:5173).

### Perintah yang tersedia

```bash
npm run dev    # menjalankan development server
npm run build  # membuat production build
npm run start  # menjalankan hasil build secara lokal
npm run lint   # memeriksa kualitas kode
```

## Teknologi yang digunakan

- **React 19** dan **TypeScript** untuk antarmuka dan logika aplikasi.
- **Next.js API Route** dengan **Vinext** untuk endpoint pengambil gambar.
- **Vite** sebagai development server dan build tool.
- **Tailwind CSS 4** untuk styling.
- **ZXing WebAssembly (`zxing-wasm`)** untuk mendeteksi dan membaca banyak QR code.
- **Lucide React** untuk ikon.
- **Cloudflare Workers dan Wrangler** untuk runtime serta preview production.

## Cara kerja singkat

```text
Gambar lokal ───────────────┐
                            ├─> Canvas browser ─> ZXing WASM ─> Daftar hasil QR
URL gambar ─> /api/image ───┘
```

Endpoint `/api/image` hanya menerima URL HTTP/HTTPS, menolak host lokal atau privat, memastikan respons berupa gambar, dan membatasi ukuran unduhan hingga 12 MB.
