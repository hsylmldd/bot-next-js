# 📝 Prompt Chatbot Telegram – HD & Teknisi (Versi Lengkap & Gabungan)

> **Prompt**: Saya ingin Anda membuat chatbot Telegram untuk manajemen order instalasi/aktivasi layanan. Bot ini mendukung dua role utama (**Helpdesk – HD** dan **Teknisi**) dengan flow pembuatan order, update progres, hingga evidence close. Semua data disimpan di **Supabase** (PostgreSQL + Supabase Storage untuk foto).

> Berikut detail kebutuhan:

---

## 🔹 1. Role & Akses

### **Helpdesk (HD)**

* Membuat order baru (input data pelanggan: nama, alamat, kontak).
* Assign teknisi ke order.
* Input waktu **SOD (Start of Delivery)** dan **E2E (End to End)**.
* Update status bila jaringan tidak ready → bot mencatat waktu **LME PT2**.
* Update waktu selesai PT2 → bot otomatis menghitung **SLA (TTI comply 3x24 jam)**.
* Cek progres setiap order.
* Bisa generate laporan harian/mingguan (open, on progress, closed).

### **Teknisi**

* Mendapat notifikasi order baru dari bot.
* Update progres tiap tahapan:

  1. Survey (Jaringan ready / tidak).

     * Jika tidak ready → otomatis **On Hold**, HD mendapat notifikasi untuk update LME PT2.
  2. Penarikan Kabel.
  3. P2P (Point-to-Point selesai).
  4. Instalasi ONT.
* Upload semua evidence sebelum order bisa ditutup.
* Bisa cek status order kapan saja.

---

## 🔹 2. Evidence Close (wajib dari teknisi)

Order hanya bisa ditutup jika semua evidence lengkap:

1. Nama ODP
2. SN ONT
3. Foto SN ONT
4. Foto teknisi + pelanggan
5. Foto rumah pelanggan
6. Foto depan ODP
7. Foto dalam ODP
8. Foto label DC
9. Foto hasil test redaman di ODP

> Bot validasi: jika ada evidence yang belum lengkap → order tidak bisa **Closed**.

---

## 🔹 3. Flow Order

1. **HD** membuat order baru → input data pelanggan + assign teknisi → status = **Pending**.
2. **Bot** notifikasi teknisi → "Order baru ditugaskan".
3. **Teknisi** update progres:

   * Survey (Ready ❇ / Not Ready ❌).
   * Jika Ready → lanjut Penarikan Kabel → P2P → Instalasi ONT.
   * Jika Not Ready → order jadi **On Hold**, HD input waktu LME PT2.
4. **HD** update PT2 selesai → bot hitung SLA (**TTI comply 3x24 jam**).
5. **Teknisi** upload evidence close → bot validasi semua evidence.
6. Jika valid → status order = **Closed**.

---

## 🔹 4. Database Supabase

### **users**

* id (UUID)
* telegram_id (string)
* role (HD / Teknisi)
* name

### **orders**

* id (UUID)
* customer_name (string)
* customer_address (string)
* contact (string)
* assigned_technician (FK → users.id)
* status (Pending, In Progress, On Hold, Completed, Closed)
* sod_time (timestamp)
* e2e_time (timestamp)
* lme_pt2_start (timestamp)
* lme_pt2_end (timestamp)
* sla_deadline (timestamp)
* created_at
* updated_at

### **progress**

* id (UUID)
* order_id (FK → orders.id)
* stage (Survey, Penarikan, P2P, Instalasi, Catatan)
* status (Ready, Not Ready, Selesai)
* note (optional)
* timestamp

### **evidence**

* id (UUID)
* order_id (FK → orders.id)
* odp_name (string)
* ont_sn (string)
* photo_sn_ont (url)
* photo_technician_customer (url)
* photo_customer_house (url)
* photo_odp_front (url)
* photo_odp_inside (url)
* photo_label_dc (url)
* photo_test_result (url)
* uploaded_at

---

## 🔹 5. Command Flow

### Untuk HD

* /order → input pelanggan + assign teknisi.
* /update → update status (misalnya LME PT2 start/finish).
* /status <order_id> → cek detail order.
* /myorders → lihat semua order.
* /report daily atau /report weekly → generate laporan.

### Untuk Teknisi

* /myorders → lihat order yang ditugaskan.
* /progress → update progres per tahap (Survey, Penarikan, P2P, Instalasi).
* /evidence → upload evidence (nama ODP, SN ONT, + foto).
* /status <order_id> → cek status order.

---

## 🔹 6. Reminder & SLA

* Jika teknisi belum update progres dalam **2 jam** setelah terima order → bot kirim reminder ke teknisi.
* Jika order mendekati **SLA 3x24 jam** → bot kirim notifikasi ke HD & teknisi.

---

## 🔹 7. UX Chatbot

* Gunakan **inline keyboard/button Telegram** untuk update status (tidak hanya manual text).
* Upload foto via attach Telegram → bot simpan ke **Supabase Storage**.
* Bot harus menyesuaikan pesan **/help** sesuai role user.

---

## 🔹 8. Welcome & Help

* Saat /start:

  * Jika user **HD** → tampilkan panduan command untuk HD.
  * Jika user **Teknisi** → tampilkan panduan command untuk teknisi.
  * Jika user **tidak terdaftar** → tampilkan pesan: "Anda belum terdaftar, silahkan pilih role."
    * Ada 2 button: "Daftar sebagai HD" dan "Daftar sebagai Teknisi"
    * Setelah data masuk ke DB, tampilkan pesan berhasil registrasi dan welcome message dengan menu yang ada dan cara penggunaan

* Command /help: menampilkan panduan sesuai role.

---

## 🔹 9. Mekanisme SLA & Monitoring

### **SLA Calculation**
* **SLA Deadline**: 3x24 jam dari SOD time
* **SOD (Start of Delivery)**: Waktu mulai delivery/instalasi
* **E2E (End to End)**: Waktu selesai instalasi
* **TTI Compliance**: E2E harus ≤ SLA Deadline

### **LME PT2 Process**
* **LME PT2 Start**: Waktu mulai LME PT2 (jika jaringan tidak ready)
* **LME PT2 End**: Waktu selesai LME PT2
* **SLA Reset**: Setelah LME PT2 selesai, SLA dihitung ulang dari LME PT2 End

### **Automated Monitoring**
* **Progress Reminder**: Setiap 2 jam jika teknisi belum update progress
* **SLA Warning**: 2 jam sebelum SLA deadline
* **SLA Exceeded**: Alert jika melewati SLA deadline
* **LME PT2 Reminder**: Notifikasi ke HD jika perlu input LME PT2

---

## 🔹 10. Technical Requirements

### **Tech Stack**
* **Frontend**: Next.js 14, React, TypeScript
* **Backend**: Next.js API Routes
* **Database**: Supabase (PostgreSQL)
* **File Storage**: Supabase Storage
* **Bot Framework**: node-telegram-bot-api
* **Monitoring**: Cron jobs untuk SLA tracking

### **Security**
* Row Level Security (RLS) di Supabase
* Role-based access control
* Secure file upload ke Supabase Storage
* Webhook signature validation

### **Performance**
* Database indexes untuk performa optimal
* Efficient file storage dengan public URLs
* Real-time notifications
* Automated background jobs

---

## 🔹 11. Output yang Diharapkan

* Source code bot (Next.js)
* Integrasi penuh dengan Supabase (database + storage)
* Command & flow sesuai di atas
* Validasi evidence close
* SLA monitoring + reminder otomatis
* Admin dashboard untuk management
* Comprehensive testing scripts
* Documentation lengkap

---

## 🔹 12. Additional Features

### **Admin Dashboard**
* Web interface untuk manage users dan orders
* Real-time monitoring dashboard
* Report generation
* System health check

### **Testing & Development**
* Comprehensive test scripts
* Development mode dengan polling
* Production deployment guide
* Troubleshooting documentation

### **Scalability**
* Horizontal scaling support
* Database optimization
* File storage optimization
* Performance monitoring

---

**Bot ini siap untuk production use dengan semua fitur yang diminta!** 🚀
