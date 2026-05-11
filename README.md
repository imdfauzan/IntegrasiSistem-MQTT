# 🚘 Smart Garage & Fleet Management (MQTT v5 System)

## 👥 Anggota Kelompok
- **Imam Mahmud Dalil Fauzan** - 5027241100
- **Raya Ahmad Syarif** - 5027241041
---
## 📌 Tema & Deskripsi
Proyek ini bertemakan **"Integrated Smart Garage & Fleet Management"**. Sistem ini mensimulasikan dan memonitor kondisi garasi modern kelas *Enterprise* yang terhubung melalui protokol IoT MQTT versi 5. 

Sistem ini memonitor 4 sensor secara paralel:
1. **Sensor Lingkungan (`sg_pub_env.js`):** Suhu & Kelembapan.
2. **Gerbang Garasi (`sg_pub_gate.js`):** Kondisi pintu (Buka/Tutup).
3. **Kendaraan (`sg_pub_vehicle.js`):** Voltase aki dan persentase bahan bakar (BBM) dari Mobil SUV & Motor Sport.
4. **Panel Listrik (`sg_pub_electric.js`):** Penggunaan daya listrik garasi dalam Watt.

Sistem ini didesain mendekati realistis. Data akan berfluktuasi secara terus-menerus dan bisa memunculkan status anomali seperti `fire alert`, `low battery`, listrik `overload`, dan lain-lain.

---

## 🚀 Struktur File
Proyek ini terdiri dari **Publishers** (Pengirim Data) dan **Subscribers** (Penerima Data/Aplikasi).

*   **Publishers:** 
    *   `sg_pub_env.js`: Suhu & Kelembapan Garasi
    *   `sg_pub_gate.js`: Kondisi Gerbang Garasi
    *   `sg_pub_vehicle.js`: Voltase aki dan persentase bahan bakar (BBM)
    *   `sg_pub_electric.js`: Penggunaan daya listrik garasi dalam Watt
*   **Subscribers:** 
    *   `sg_sub_monitor.js` *(CLI Live Table Dashboard)*
    *   `dashboard/index.html` *(Web Dashboard)*
    *   `sg_sub_alert.js` *(Notifikasi jika ada anomali)*
    *   `sg_sub_logger.js` *(Menyimpan histori data ke file `garage_history.log` tiap 5 detik)*
*   **Launcher:** `start_publishers.js` *(Shortcut langsung run semua Publisher)*

---

## 🌐 Web Dashboard Monitor (Modern UI)
Proyek ini dilengkapi dengan **Web Dashboard interaktif** yang mengambil data MQTT menggunakan protokol **WebSockets**.

**Cara Membuka Web Dashboard:**
1. Masuk ke dalam folder `dashboard`.
2. Buka file `index.html`.
3. Dashboard akan langsung terkoneksi ke broker MQTT (via WebSockets) dan menampilkan visualisasi grafik.

---

## 📦 Instalasi & Persiapan
Pastikan sudah terinstall **Node.js**. Selanjutnya, run command ini:

```bash
# Install Dependencies
npm install mqtt cli-table3
```
   *Penjelasan Dependency:*
   - **`mqtt`**: *Library* inti untuk menghubungkan Node.js dengan MQTT Broker.
   - **`cli-table3`**: *Library* grafis terminal untuk merender "Live Table Monitor" secara rapi dan cantik.

---

## 🛠️ Cara Menjalankan Keseluruhan Sistem
Buka 4 terminal berbeda:

1. **Terminal 1:** `node start_publishers.js` 
   Menjalankan seluruh perangkat IoT garasi.
2. **Terminal 2:** `node sg_sub_monitor.js` 
   Menampilkan Dashboard Tabel *Real-time* & *System Health*.
3. **Terminal 3 (Fitur 8):** `node sg_pub_diag_requester.js`
   Mencoba fitur *Request-Response* (meminta data internal sensor).
4. **Terminal 4 (Fitur 9):** Buka 2 terminal, jalankan `node sg_sub_processor.js` di keduanya.
   Lihat bagaimana data dari sensor dibagi rata (Load Balance).
5. **Terminal 5 (Fitur 6):** `node sg_pub_command.js`
   Mengirim perintah yang bisa kedaluwarsa.


---

## 📝 Penjelasan tiap Fitur MQTT v5 yang Digunakan
1. **Fitur 1 (Pub/Sub & QoS):** QoS 0 untuk Suhu Lingkungan (hemat *bandwidth*), QoS 1 untuk Kendaraan, dan QoS 2 (tertinggi) untuk Gerbang agar data kritis tidak *double*/hilang.
2. **Fitur 2 (Topic Wildcards):** Digunakan pada *subscriber* (mendengarkan `smartgarage/#`). Arsitektur ini *scalable*; jika ada 100 mobil baru ditambahkan, aplikasi *monitor* tidak perlu di-*update*.
3. **Fitur 3 (Topic Alias):** Diterapkan di `sg_pub_env.js`. Sensor ini secara otomatis mengubah topik string yang panjang menjadi angka integer ID (misal `1`), lalu mengosongkan string topik (`""`) di pengiriman berikutnya. Sangat hemat *bandwidth*.
4. **Fitur 4 (User Properties):** Diterapkan di `sg_pub_vehicle.js`. Sensor menyisipkan metadata (seperti `Vehicle-Type` dan status *Maintenance*) di **Header/Properties**, sehingga *subscriber alert* tidak perlu mengekstrak (*parsing*) JSON payload yang berat.
5. **Fitur 5 (Retain Message):** Diterapkan di `sg_pub_gate.js` dengan menyalakan `retain: true`. Ketika *Dashboard Monitor* baru dihidupkan, Broker langsung mengirimkan status gerbang terakhir.
6. **Fitur 6 (Message Expiry Interval):** Diterapkan di `sg_pub_command.js`. Perintah darurat seperti `OPEN_GATE_EMERGENCY` diberi masa berlaku 10 detik. Jika sistem sedang *down* dan baru *online* setelah 10 detik, perintah basi tersebut otomatis dihapus oleh Broker agar tidak terjadi eksekusi yang tidak diinginkan.
7. **Fitur 7 (Last Will and Testament):** Seluruh *publisher* dilengkapi dengan pesan "Will". Jika sensor atau perangkat terputus tiba-tiba (misal: kabel putus/crash), Broker akan mempublikasikan status `offline` ke topik `smartgarage/status`. Ini dipantau secara *real-time* di Dashboard Monitor (Tabel *System Health*).
8. **Fitur 8 (Request-Response Pattern):** Implementasi pola HTTP di atas MQTT. `sg_pub_diag_requester.js` mengirim permintaan diagnostik dengan menyertakan `responseTopic` dan `correlationData`. Sensor lingkungan (`sg_pub_env.js`) menangkap permintaan tersebut dan mengirim balik data internal (memori/uptime) ke topik spesifik tersebut.
9. **Fitur 9 (Shared Subscriptions):** Digunakan untuk *Load Balancing* pemrosesan data berat. Dengan format `$share/heavy-duty/smartgarage/env`, pesan dari sensor lingkungan akan dibagi rata ke beberapa instance `sg_sub_processor.js` (Round Robin).
10. **Fitur 10 (Flow Control):** Diterapkan pada `sg_sub_monitor.js` menggunakan properti `receiveMaximum: 10`. Ini membatasi jumlah pesan yang sedang dalam perjalanan (*in-flight*) dari Broker ke Klien, memastikan aplikasi monitor tidak *hang* atau *crash* saat terjadi lonjakan data masif.