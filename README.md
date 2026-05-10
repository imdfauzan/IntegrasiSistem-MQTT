# 🚘 Smart Garage & Fleet Management (MQTT v5 System)

## 📌 Tema & Deskripsi
Proyek ini bertemakan **"Integrated Smart Garage & Fleet Management"**. Sistem ini mensimulasikan lingkungan garasi modern kelas *Enterprise* yang terhubung melalui protokol IoT MQTT versi 5. 

Kita memonitor 4 sensor secara paralel:
1. **Sensor Lingkungan (`sg_pub_env.js`):** Suhu & Kelembapan.
2. **Gerbang Garasi (`sg_pub_gate.js`):** Kondisi pintu (Buka/Tutup).
3. **Kendaraan (`sg_pub_vehicle.js`):** Voltase aki dan persentase bahan bakar (BBM) dari Mobil SUV & Motor Sport.
4. **Panel Listrik (`sg_pub_electric.js`):** Penggunaan daya listrik garasi dalam Watt.

Sistem ini didesain sangat realistis. Data akan berfluktuasi secara terus-menerus dan bisa memunculkan status anomali seperti `fire alert`, `low battery`, listrik `overload`, dan lain-lain.

---

## 🚀 Struktur File
Proyek ini memisahkan aktor menjadi **Publishers** (Pengirim Data) dan **Subscribers** (Penerima Data/Aplikasi).

*   **Publishers:** 
    *   `sg_pub_env.js`
    *   `sg_pub_gate.js`
    *   `sg_pub_vehicle.js`
    *   `sg_pub_electric.js`
*   **Subscribers:** 
    *   `sg_sub_monitor.js` *(Tampilan Live Table Dashboard)*
    *   `sg_sub_alert.js` *(Notifikasi jika ada anomali)*
    *   `sg_sub_logger.js` *(Menyimpan histori data ke file `garage_history.log` tiap 5 detik)*
*   **Launcher:** `start_publishers.js` *(Shortcut langsung run semua Publisher)*

---

## 🛠️ Cara Menjalankan
Buka 4 terminal/command prompt terpisah di folder ini:

1. **Terminal 1:** `node start_publishers.js` 
   *(Menjalankan seluruh perangkat IoT garasi sekaligus di latar belakang)*
2. **Terminal 2:** `node sg_sub_monitor.js` 
   *(Menampilkan Dashboard Tabel *Real-time*. Ini output utamanya)*
3. **Terminal 3:** `node sg_sub_alert.js` 
   *(Opsional: Menangkap peringatan bahaya/keamanan dengan label warna)*
4. **Terminal 4:** `node sg_sub_logger.js` 
   *(Opsional: Menyimpan data sensor per 5 detik ke dalam file log)*

---

## 📝 Penjelasan tiap Fitur MQTT v5 yang Digunakan
Fitur-fitur ini sudah diterapkan di dalam *code* saat ini:
1. **Fitur 1 (Pub/Sub & QoS):** Diimplementasikan secara dinamis. QoS 0 untuk Suhu Lingkungan (hemat *bandwidth*), QoS 1 untuk Kendaraan, dan QoS 2 (tertinggi) untuk Gerbang agar data kritis tidak *double*/hilang.
2. **Fitur 2 (Topic Wildcards):** Digunakan pada *subscriber* (mendengarkan `smartgarage/#`). Arsitektur ini *scalable*; jika ada 100 mobil baru ditambahkan, aplikasi *monitor* tidak perlu di-*update*.
3. **Fitur 3 (Topic Alias):** Diterapkan di `sg_pub_env.js`. Sensor ini secara otomatis mengubah topik string yang panjang menjadi angka integer ID (misal `1`), lalu mengosongkan string topik (`""`) di pengiriman berikutnya. Sangat hemat *bandwidth*.
4. **Fitur 4 (User Properties):** Diterapkan di `sg_pub_vehicle.js`. Sensor menyisipkan metadata (seperti `Vehicle-Type` dan status *Maintenance*) di **Header/Properties**, sehingga *subscriber alert* tidak perlu mengekstrak (*parsing*) JSON payload yang berat.
5. **Fitur 5 (Retain Message):** Diterapkan di `sg_pub_gate.js` dengan menyalakan `retain: true`. Ketika *Dashboard Monitor* baru dihidupkan, Broker langsung mengirimkan status gerbang terakhir. *Dashboard* tidak perlu menanti jadwal *update* gerbang berikutnya (yang biasanya memakan waktu 10 detik).