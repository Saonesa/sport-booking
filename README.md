# Sistem Reservasi Lapangan Olahraga

Aplikasi ini adalah sistem reservasi lapangan olahraga yang dibangun dengan **Laravel 12** sebagai backend API RESTful dan **HTML, CSS (Bootstrap), serta Vanilla JavaScript** untuk frontend. Sistem ini dirancang untuk mempermudah proses pencarian, pemesanan, dan pengelolaan lapangan olahraga.

## Fitur Utama

-   **Pencarian & Detail Lapangan:** Pengguna dapat melihat daftar lapangan olahraga, mencari berdasarkan jenis olahraga, dan melihat detail lengkap setiap lapangan (alamat, deskripsi, harga per jam).
-   **Reservasi Online:** Pengguna dapat memilih tanggal dan jam untuk memesan lapangan berdasarkan ketersediaan slot waktu.
-   **Manajemen Reservasi (User):** Pengguna dapat melihat riwayat reservasi mereka sendiri dan membatalkan reservasi yang masih berstatus `pending` atau `confirmed`.
-   **Manajemen Lapangan (Admin):** Admin memiliki kemampuan penuh (CRUD - Create, Read, Update, Delete) untuk mengelola data lapangan olahraga.
-   **Manajemen Reservasi (Admin):** Admin dapat melihat semua reservasi, memperbarui status reservasi (misalnya, dari `pending` ke `confirmed`, `canceled`, atau `completed`), dan menghapus reservasi apa pun.
-   **Manajemen Pengguna (Admin):** Admin dapat melihat dan mengelola data pengguna (opsional, jika diaktifkan).
-   **Sistem Role-Based Access Control (RBAC):** Memisahkan hak akses antara `Admin` dan `User` untuk fitur-fitur tertentu.
-   **API RESTful:** Seluruh interaksi data dilakukan melalui API, memungkinkan frontend yang fleksibel.

## Teknologi yang Digunakan

**Backend:**
-   **Laravel 12:** Framework PHP untuk membangun API RESTful.
-   **Laravel Sanctum:** Untuk otentikasi API berbasis token.
-   **MySQL/MariaDB:** Sistem manajemen database.

**Frontend:**
-   **HTML5:** Struktur dasar halaman web.
-   **CSS3 (Bootstrap 5):** Styling dan komponen UI responsif.
-   **JavaScript (Vanilla JS):** Interaksi dinamis dengan API backend.

## Struktur Proyek (High-Level)

-   **Backend (Laravel):**
    -   `app/Models`: `User`, `Field`, `Reservation` (dengan relasi One-to-Many).
    -   `app/Http/Controllers/Api`: `AuthController`, `FieldController`, `ReservationController`, `UserController`.
    -   `app/Http/Middleware/AdminMiddleware.php`: Middleware kustom untuk otorisasi admin.
    -   `routes/api.php`: Definisi semua endpoint API.
    -   `database/migrations`: Skema database untuk `users`, `fields`, `reservations`.
    -   `database/seeders`: Data dummy untuk pengujian.
    -   `bootstrap/app.php`: Konfigurasi inti Laravel 12 (termasuk routing dan middleware).

-   **Frontend (HTML/CSS/JS):**
    -   `public/assets/index.html`: Halaman utama aplikasi.
    -   `public/assets/style.css`: Styling kustom.
    -   `public/assets/script.js`: Logika aplikasi frontend, interaksi dengan API.

## Cara Menjalankan Proyek

### Prasyarat

-   PHP >= 8.2
-   Composer
-   Node.js & npm (Opsional, jika Anda ingin menggunakan Vite/Mix untuk asset compiling, tetapi tidak wajib untuk setup dasar ini)
-   MySQL/MariaDB

### Langkah-langkah Instalasi

1.  **Clone Repositori:**
    ```bash
    git clone https://github.com/Saonesa/sport-booking.git
    cd sports-field-reservation-laravel
    ```
   

2.  **Instal Dependensi Composer:**
    ```bash
    composer install
    ```

3.  **Konfigurasi Environment:**
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
    Edit file `.env` dan konfigurasikan detail database Anda:
    ```dotenv
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=sports_field_db # Ubah sesuai nama database Anda
    DB_USERNAME=root
    DB_PASSWORD=
    ```
    Buat database dengan nama yang sama di server MySQL/MariaDB Anda.

4.  **Jalankan Migrasi dan Seeder:**
    Ini akan membuat tabel database dan mengisi data awal (user admin, user biasa, dan beberapa lapangan).
    ```bash
    php artisan migrate:fresh --seed
    ```

5.  **Instal Laravel Sanctum:**
    ```bash
    composer require laravel/sanctum
    php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
    php artisan migrate
    ```

6.  **Jalankan Server Laravel:**
    ```bash
    php artisan serve
    ```

7.  **Akses Aplikasi:**
    Buka browser Anda dan navigasikan ke:
    ```
    http://localhost:8000/assets/index.html
    ```
    

### Akun Pengujian (Setelah `php artisan migrate:fresh --seed`)

-   **Admin:**
    -   Email: `admin@example.com`
    -   Password: `password`
-   **User Biasa:**
    -   Email: `user@example.com`
    -   Password: `password`


