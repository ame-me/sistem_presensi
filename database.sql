CREATE DATABASE IF NOT EXISTS presensipander_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE presensipander_db;

CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacherCode VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) DEFAULT '-',
    mapel VARCHAR(120) DEFAULT '-',
    homebase VARCHAR(80) DEFAULT '-',
    role VARCHAR(80) NOT NULL DEFAULT 'Guru Mapel',
    wali_kelas VARCHAR(80) DEFAULT '-',
    isBK TINYINT(1) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'AKTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ortu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nik VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    namaAyah VARCHAR(120) DEFAULT NULL,
    pekerjaanAyah VARCHAR(80) DEFAULT NULL,
    namaIbu VARCHAR(120) DEFAULT NULL,
    pekerjaanIbu VARCHAR(80) DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AKTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    noInduk VARCHAR(30) NOT NULL,
    nisn VARCHAR(30) NOT NULL,
    name VARCHAR(120) NOT NULL,
    gender VARCHAR(2) NOT NULL DEFAULT 'L',
    tglLahir VARCHAR(30) DEFAULT NULL,
    kota VARCHAR(80) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    namaAyah VARCHAR(120) DEFAULT NULL,
    pekerjaanAyah VARCHAR(80) DEFAULT NULL,
    namaIbu VARCHAR(120) DEFAULT NULL,
    pekerjaanIbu VARCHAR(80) DEFAULT NULL,
    cls VARCHAR(50) NOT NULL,
    parent VARCHAR(120) DEFAULT NULL,
    parent_id INT DEFAULT NULL,
    nik_ortu VARCHAR(80) DEFAULT NULL,
    wa VARCHAR(30) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'ok',
    academic_status VARCHAR(30) DEFAULT 'AKTIF',
    previous_cls VARCHAR(50) DEFAULT NULL,
    min_grade_level INT DEFAULT NULL,
    tahun_ajaran VARCHAR(50) DEFAULT '2025/2026 Genap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_siswa_noinduk_ta (noInduk, tahun_ajaran),
    UNIQUE KEY uq_siswa_nisn_ta (nisn, tahun_ajaran),
    INDEX idx_siswa_cls (cls),
    INDEX idx_siswa_academic_status (academic_status),
    INDEX idx_siswa_nik_ortu (nik_ortu),
    INDEX idx_siswa_tahun (tahun_ajaran)
);

CREATE TABLE IF NOT EXISTS kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    teacher VARCHAR(120) DEFAULT '-',
    teacher_code VARCHAR(30) DEFAULT NULL,
    count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Aman',
    tahun_ajaran VARCHAR(50) DEFAULT '2025/2026 Genap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kelas_name_ta (name, tahun_ajaran),
    INDEX idx_kelas_tahun (tahun_ajaran)
);

CREATE TABLE IF NOT EXISTS mapel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(120) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    hours INT DEFAULT 0,
    cat VARCHAR(50) DEFAULT 'Umum',
    tahun_ajaran VARCHAR(50) DEFAULT '2025/2026 Genap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mapel_code_ta (code, tahun_ajaran),
    INDEX idx_mapel_grade (grade)
);

CREATE TABLE IF NOT EXISTS ruangan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL UNIQUE,
    location VARCHAR(120) DEFAULT 'Lantai 1',
    pic VARCHAR(120) DEFAULT '-',
    pic_code VARCHAR(30) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jadwal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    slot VARCHAR(20) NOT NULL,
    time_range VARCHAR(50) DEFAULT '',
    class_name VARCHAR(50) NOT NULL,
    teacher_code VARCHAR(80) DEFAULT '',
    subject_code VARCHAR(30) DEFAULT NULL,
    subject_hint VARCHAR(120) DEFAULT NULL,
    room_code VARCHAR(30) DEFAULT NULL,
    tahun_ajaran VARCHAR(50) DEFAULT '2025/2026 Genap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_jadwal_filter (day, class_name, teacher_code, tahun_ajaran),
    INDEX idx_jadwal_slot (day, slot, tahun_ajaran)
);

CREATE TABLE IF NOT EXISTS presensi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    schedule_id INT NOT NULL,
    teacher_code VARCHAR(80) DEFAULT '',
    class_name VARCHAR(50) NOT NULL,
    subject_name VARCHAR(120) DEFAULT '',
    date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    tahun_ajaran VARCHAR(50) DEFAULT '2025/2026 Genap',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_presensi_student_schedule_date (student_id, schedule_id, date),
    INDEX idx_presensi_filter (date, teacher_code, class_name, tahun_ajaran)
);

CREATE TABLE IF NOT EXISTS jurnal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    teacher_code VARCHAR(80) DEFAULT '',
    date DATE NOT NULL,
    topic VARCHAR(255) DEFAULT '',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_jurnal_schedule_date (schedule_id, date),
    INDEX idx_jurnal_filter (date, teacher_code, schedule_id)
);

CREATE TABLE IF NOT EXISTS izin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    parent_email VARCHAR(120) DEFAULT '',
    type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    selfie_url VARCHAR(255) DEFAULT NULL,
    attachment_url VARCHAR(255) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    review_notes TEXT,
    reviewed_by VARCHAR(120) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_izin_status (status),
    INDEX idx_izin_student (student_id)
);

CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_code VARCHAR(80) NOT NULL,
    schedule_id INT DEFAULT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    message TEXT NOT NULL,
    date DATE DEFAULT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifikasi_teacher (teacher_code, is_read)
);

-- MIGRASI INDEX UNTUK DATABASE LAMA
-- Data siswa/kelas/mapel perlu bisa berulang di semester atau tahun ajaran berbeda.
SET @schema_name = DATABASE();

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND column_name = 'academic_status'
    ),
    'ALTER TABLE siswa ADD COLUMN academic_status VARCHAR(30) DEFAULT ''AKTIF'' AFTER status',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND column_name = 'previous_cls'
    ),
    'ALTER TABLE siswa ADD COLUMN previous_cls VARCHAR(50) DEFAULT NULL AFTER academic_status',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND column_name = 'min_grade_level'
    ),
    'ALTER TABLE siswa ADD COLUMN min_grade_level INT DEFAULT NULL AFTER previous_cls',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND index_name = 'idx_siswa_academic_status'
    ),
    'ALTER TABLE siswa ADD INDEX idx_siswa_academic_status (academic_status)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND index_name = 'noInduk'
    ),
    'ALTER TABLE siswa DROP INDEX noInduk',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND index_name = 'nisn'
    ),
    'ALTER TABLE siswa DROP INDEX nisn',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND index_name = 'uq_siswa_noinduk_ta'
    ),
    'ALTER TABLE siswa ADD UNIQUE KEY uq_siswa_noinduk_ta (noInduk, tahun_ajaran)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'siswa' AND index_name = 'uq_siswa_nisn_ta'
    ),
    'ALTER TABLE siswa ADD UNIQUE KEY uq_siswa_nisn_ta (nisn, tahun_ajaran)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'kelas' AND index_name = 'name'
    ),
    'ALTER TABLE kelas DROP INDEX name',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'kelas' AND index_name = 'uq_kelas_name_ta'
    ),
    'ALTER TABLE kelas ADD UNIQUE KEY uq_kelas_name_ta (name, tahun_ajaran)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'mapel' AND index_name = 'code'
    ),
    'ALTER TABLE mapel DROP INDEX code',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name AND table_name = 'mapel' AND index_name = 'uq_mapel_code_ta'
    ),
    'ALTER TABLE mapel ADD UNIQUE KEY uq_mapel_code_ta (code, tahun_ajaran)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO tahun_ajaran (id, name, status) VALUES
    (1, '2025/2026 Genap', 'active')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO guru (id, teacherCode, name, email, password, phone, mapel, homebase, role, wali_kelas, isBK, status) VALUES
    (1, '1', 'Veronika Suhartati, S.Psi.,M.M', 'guru1@sekolah.id', '$2y$10$IVo7Q4VVQL1J89AwxFgBx.rejWf8eos5iL.9388uJPU/2iU488sd2', '-', 'Manajemen Sekolah', '-', 'ADMIN', '-', 0, 'AKTIF'),
    (2, '2', 'Budi Santoso, S.Pd', 'guru2@sekolah.id', '$2y$10$IVo7Q4VVQL1J89AwxFgBx.rejWf8eos5iL.9388uJPU/2iU488sd2', '081200000002', 'Matematika', 'R-01', 'Guru Mapel, Wali Kelas', 'VII A', 0, 'AKTIF'),
    (3, '13', 'Waskitha Wijaya, M.Kom', 'guru13@sekolah.id', '$2y$10$IVo7Q4VVQL1J89AwxFgBx.rejWf8eos5iL.9388uJPU/2iU488sd2', '-', 'Informatika', '-', 'ADMIN_IT', '-', 0, 'AKTIF'),
    (4, 'TU-01', 'Admin Tata Usaha', 'admin.tu@sekolah.id', '$2y$10$IVo7Q4VVQL1J89AwxFgBx.rejWf8eos5iL.9388uJPU/2iU488sd2', '-', 'Administrasi', '-', 'ADMIN_TU', '-', 0, 'AKTIF')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), role = VALUES(role), wali_kelas = VALUES(wali_kelas);

INSERT INTO ortu (id, nik, name, email, password, phone, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, status) VALUES
    (1, '1234567890123456', 'Hasan Fauzi', 'hasan@gmail.com', 'password123', '081300000001', 'Hasan Fauzi', 'Karyawan', 'Siti Aminah', 'Ibu Rumah Tangga', 'AKTIF')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password = VALUES(password), phone = VALUES(phone), namaAyah = VALUES(namaAyah), pekerjaanAyah = VALUES(pekerjaanAyah), namaIbu = VALUES(namaIbu), pekerjaanIbu = VALUES(pekerjaanIbu), status = VALUES(status);

INSERT INTO kelas (id, grade, name, teacher, teacher_code, count, status, tahun_ajaran) VALUES
    (1, 'VII', 'VII A', 'Budi Santoso, S.Pd', '2', 2, 'Aman', '2025/2026 Genap'),
    (2, 'VIII', 'VIII A', '-', NULL, 1, 'Aman', '2025/2026 Genap'),
    (3, 'IX', 'IX A', '-', NULL, 1, 'Aman', '2025/2026 Genap')
ON DUPLICATE KEY UPDATE teacher = VALUES(teacher), teacher_code = VALUES(teacher_code), count = VALUES(count), tahun_ajaran = VALUES(tahun_ajaran);

INSERT INTO siswa (id, noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, tahun_ajaran) VALUES
    (1, 'SIS-001', '1000000001', 'Andi Fauzi', 'L', '2012-02-10', 'Jakarta', 'Jl. Melati No. 1', 'Hasan Fauzi', 'Karyawan', 'Siti Aminah', 'Ibu Rumah Tangga', 'VII A', 'Hasan Fauzi', 1, '1234567890123456', '081300000001', 'ok', '2025/2026 Genap'),
    (2, 'SIS-002', '1000000002', 'Maria Lestari', 'P', '2012-05-21', 'Jakarta', 'Jl. Mawar No. 2', 'Antonius', 'Wiraswasta', 'Clara', 'Guru', 'VII A', '-', NULL, '-', '-', 'ok', '2025/2026 Genap'),
    (3, 'SIS-003', '1000000003', 'Rafael Wijaya', 'L', '2011-09-12', 'Jakarta', 'Jl. Kenanga No. 3', '-', '-', '-', '-', 'VIII A', '-', NULL, '-', '-', 'ok', '2025/2026 Genap'),
    (4, 'SIS-004', '1000000004', 'Sinta Maharani', 'P', '2010-07-18', 'Jakarta', 'Jl. Dahlia No. 4', '-', '-', '-', '-', 'IX A', '-', NULL, '-', '-', 'ok', '2025/2026 Genap')
ON DUPLICATE KEY UPDATE name = VALUES(name), cls = VALUES(cls), nik_ortu = VALUES(nik_ortu), tahun_ajaran = VALUES(tahun_ajaran);

INSERT INTO mapel (id, code, name, grade, hours, cat, tahun_ajaran) VALUES
    (1, 'MTK7', 'Matematika', 'VII', 4, 'Umum', '2025/2026 Genap'),
    (2, 'IND7', 'Bahasa Indonesia', 'VII', 4, 'Umum', '2025/2026 Genap'),
    (3, 'INF8', 'Informatika', 'VIII', 2, 'Umum', '2025/2026 Genap')
ON DUPLICATE KEY UPDATE name = VALUES(name), grade = VALUES(grade), hours = VALUES(hours), tahun_ajaran = VALUES(tahun_ajaran);

INSERT INTO ruangan (id, code, name, location, pic, pic_code) VALUES
    (1, 'R-01', 'Ruang 01', 'Lantai 1', 'Budi Santoso, S.Pd', '2'),
    (2, 'LAB-01', 'Laboratorium Komputer', 'Lantai 2', '-', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), location = VALUES(location), pic = VALUES(pic), pic_code = VALUES(pic_code);

INSERT INTO jadwal (id, day, slot, time_range, class_name, teacher_code, subject_code, subject_hint, room_code, tahun_ajaran) VALUES
    (1, 'Senin', '1', '07.00 - 07.40', 'VII A', '2', 'MTK7', 'Matematika', 'R-01', '2025/2026 Genap'),
    (2, 'Senin', '2', '07.40 - 08.20', 'VII A', '2', 'MTK7', 'Matematika', 'R-01', '2025/2026 Genap'),
    (3, 'Selasa', '1', '07.00 - 07.40', 'VIII A', '13', 'INF8', 'Informatika', 'LAB-01', '2025/2026 Genap')
ON DUPLICATE KEY UPDATE teacher_code = VALUES(teacher_code), subject_hint = VALUES(subject_hint), room_code = VALUES(room_code), tahun_ajaran = VALUES(tahun_ajaran);

-- SEED DATA TAMBAHAN UNTUK OPSI TAHUN AJARAN DAN SEMESTER LAIN

-- 1. Opsi tahun ajaran aktif untuk halaman pilih tahun ajaran.
INSERT INTO tahun_ajaran (name, status) VALUES
    ('2025/2026 Ganjil', 'active'),
    ('2024/2025 Genap', 'active'),
    ('2024/2025 Ganjil', 'active')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 2. Data kelas.
-- 2025/2026 Ganjil memakai kelas yang sama dengan 2025/2026 Genap.
-- 2024/2025 memakai kelas berbeda karena tahun ajarannya berbeda.
INSERT INTO kelas (grade, name, teacher, teacher_code, count, status, tahun_ajaran) VALUES
    ('VII', 'VII A', 'Budi Santoso, S.Pd', '2', 2, 'Aman', '2025/2026 Ganjil'),
    ('VIII', 'VIII A', '-', NULL, 1, 'Aman', '2025/2026 Ganjil'),
    ('IX', 'IX A', '-', NULL, 1, 'Aman', '2025/2026 Ganjil'),
    ('VII', 'VII B', 'Veronika Suhartati, S.Psi.,M.M', '1', 2, 'Aman', '2024/2025 Genap'),
    ('VIII', 'VIII B', 'Waskitha Wijaya, M.Kom', '13', 1, 'Aman', '2024/2025 Genap'),
    ('IX', 'IX B', '-', NULL, 1, 'Aman', '2024/2025 Genap'),
    ('VII', 'VII B', 'Veronika Suhartati, S.Psi.,M.M', '1', 2, 'Aman', '2024/2025 Ganjil'),
    ('VIII', 'VIII B', 'Waskitha Wijaya, M.Kom', '13', 1, 'Aman', '2024/2025 Ganjil'),
    ('IX', 'IX B', '-', NULL, 1, 'Aman', '2024/2025 Ganjil')
ON DUPLICATE KEY UPDATE
    teacher = VALUES(teacher),
    teacher_code = VALUES(teacher_code),
    count = VALUES(count),
    status = VALUES(status);

INSERT INTO kelas (grade, name, teacher, teacher_code, count, status, tahun_ajaran)
SELECT grade, name, teacher, teacher_code, count, status, '2025/2026 Ganjil'
FROM kelas
WHERE tahun_ajaran = '2025/2026 Genap'
ON DUPLICATE KEY UPDATE
    grade = VALUES(grade),
    teacher = VALUES(teacher),
    teacher_code = VALUES(teacher_code),
    count = VALUES(count),
    status = VALUES(status);

-- 3. Data siswa.
-- Jika hanya semester berubah dalam tahun ajaran yang sama, daftar siswa tetap.
-- Jika tahun ajaran berubah, daftar siswa dibuat berbeda.
INSERT INTO siswa (noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, tahun_ajaran) VALUES
    ('SIS-001', '1000000001', 'Andi Fauzi', 'L', '2012-02-10', 'Jakarta', 'Jl. Melati No. 1', 'Hasan Fauzi', 'Karyawan', 'Siti Aminah', 'Ibu Rumah Tangga', 'VII A', 'Hasan Fauzi', 1, '1234567890123456', '081300000001', 'ok', '2025/2026 Ganjil'),
    ('SIS-002', '1000000002', 'Maria Lestari', 'P', '2012-05-21', 'Jakarta', 'Jl. Mawar No. 2', 'Antonius', 'Wiraswasta', 'Clara', 'Guru', 'VII A', '-', NULL, '-', '-', 'ok', '2025/2026 Ganjil'),
    ('SIS-003', '1000000003', 'Rafael Wijaya', 'L', '2011-09-12', 'Jakarta', 'Jl. Kenanga No. 3', '-', '-', '-', '-', 'VIII A', '-', NULL, '-', '-', 'ok', '2025/2026 Ganjil'),
    ('SIS-004', '1000000004', 'Sinta Maharani', 'P', '2010-07-18', 'Jakarta', 'Jl. Dahlia No. 4', '-', '-', '-', '-', 'IX A', '-', NULL, '-', '-', 'ok', '2025/2026 Ganjil'),
    ('SIS-101', '9000000001', 'Dimas Pratama', 'L', '2011-01-14', 'Bandung', 'Jl. Anggrek No. 11', 'Rudi Hartono', 'Pedagang', 'Maya Sari', 'Karyawan', 'VII B', '-', NULL, '1111222233334444', '081100000001', 'ok', '2024/2025 Genap'),
    ('SIS-102', '9000000002', 'Nabila Putri', 'P', '2011-04-03', 'Bandung', 'Jl. Anggrek No. 12', 'Agus Salim', 'Karyawan', 'Rina Marlina', 'Wiraswasta', 'VII B', '-', NULL, '-', '-', 'ok', '2024/2025 Genap'),
    ('SIS-103', '9000000003', 'Yusuf Ramadhan', 'L', '2010-11-27', 'Bandung', 'Jl. Anggrek No. 13', '-', '-', '-', '-', 'VIII B', '-', NULL, '-', '-', 'ok', '2024/2025 Genap'),
    ('SIS-104', '9000000004', 'Ratih Anggraini', 'P', '2009-10-22', 'Bandung', 'Jl. Anggrek No. 14', '-', '-', '-', '-', 'IX B', '-', NULL, '-', '-', 'ok', '2024/2025 Genap'),
    ('SIS-101', '9000000001', 'Dimas Pratama', 'L', '2011-01-14', 'Bandung', 'Jl. Anggrek No. 11', 'Rudi Hartono', 'Pedagang', 'Maya Sari', 'Karyawan', 'VII B', '-', NULL, '1111222233334444', '081100000001', 'ok', '2024/2025 Ganjil'),
    ('SIS-102', '9000000002', 'Nabila Putri', 'P', '2011-04-03', 'Bandung', 'Jl. Anggrek No. 12', 'Agus Salim', 'Karyawan', 'Rina Marlina', 'Wiraswasta', 'VII B', '-', NULL, '-', '-', 'ok', '2024/2025 Ganjil'),
    ('SIS-103', '9000000003', 'Yusuf Ramadhan', 'L', '2010-11-27', 'Bandung', 'Jl. Anggrek No. 13', '-', '-', '-', '-', 'VIII B', '-', NULL, '-', '-', 'ok', '2024/2025 Ganjil'),
    ('SIS-104', '9000000004', 'Ratih Anggraini', 'P', '2009-10-22', 'Bandung', 'Jl. Anggrek No. 14', '-', '-', '-', '-', 'IX B', '-', NULL, '-', '-', 'ok', '2024/2025 Ganjil')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    gender = VALUES(gender),
    tglLahir = VALUES(tglLahir),
    kota = VALUES(kota),
    alamat = VALUES(alamat),
    namaAyah = VALUES(namaAyah),
    pekerjaanAyah = VALUES(pekerjaanAyah),
    namaIbu = VALUES(namaIbu),
    pekerjaanIbu = VALUES(pekerjaanIbu),
    cls = VALUES(cls),
    parent = VALUES(parent),
    parent_id = VALUES(parent_id),
    nik_ortu = VALUES(nik_ortu),
    wa = VALUES(wa),
    status = VALUES(status);

INSERT INTO siswa (noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, tahun_ajaran)
SELECT noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, '2025/2026 Ganjil'
FROM siswa
WHERE tahun_ajaran = '2025/2026 Genap'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    gender = VALUES(gender),
    tglLahir = VALUES(tglLahir),
    kota = VALUES(kota),
    alamat = VALUES(alamat),
    namaAyah = VALUES(namaAyah),
    pekerjaanAyah = VALUES(pekerjaanAyah),
    namaIbu = VALUES(namaIbu),
    pekerjaanIbu = VALUES(pekerjaanIbu),
    cls = VALUES(cls),
    parent = VALUES(parent),
    parent_id = VALUES(parent_id),
    nik_ortu = VALUES(nik_ortu),
    wa = VALUES(wa),
    status = VALUES(status);

-- 4. Data mapel.
-- Mapel dibuat berbeda antar semester walaupun tahun ajaran sama.
INSERT INTO mapel (code, name, grade, hours, cat, tahun_ajaran) VALUES
    ('MTK7-G1', 'Matematika Ganjil', 'VII', 4, 'Umum', '2025/2026 Ganjil'),
    ('IPA7-G1', 'IPA Ganjil', 'VII', 4, 'Umum', '2025/2026 Ganjil'),
    ('INF8-G1', 'Informatika Ganjil', 'VIII', 2, 'Umum', '2025/2026 Ganjil'),
    ('MTK7-2425-G2', 'Matematika Terapan', 'VII', 4, 'Umum', '2024/2025 Genap'),
    ('BIND7-2425-G2', 'Bahasa Indonesia Literasi', 'VII', 4, 'Umum', '2024/2025 Genap'),
    ('INF8-2425-G2', 'Informatika Praktik', 'VIII', 2, 'Umum', '2024/2025 Genap'),
    ('MTK7-2425-G1', 'Matematika Dasar', 'VII', 3, 'Umum', '2024/2025 Ganjil'),
    ('IPA7-2425-G1', 'IPA Dasar', 'VII', 4, 'Umum', '2024/2025 Ganjil'),
    ('IPS8-2425-G1', 'IPS Terpadu', 'VIII', 3, 'Umum', '2024/2025 Ganjil')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    grade = VALUES(grade),
    hours = VALUES(hours),
    cat = VALUES(cat);

-- 5. Data jadwal.
-- ID eksplisit menjaga seed tetap idempotent saat database.sql dijalankan ulang.
INSERT INTO jadwal (id, day, slot, time_range, class_name, teacher_code, subject_code, subject_hint, room_code, tahun_ajaran) VALUES
    (101, 'Senin', '1', '07.00 - 07.40', 'VII A', '2', 'MTK7-G1', 'Matematika Ganjil', 'R-01', '2025/2026 Ganjil'),
    (102, 'Senin', '2', '07.40 - 08.20', 'VII A', '2', 'IPA7-G1', 'IPA Ganjil', 'R-01', '2025/2026 Ganjil'),
    (103, 'Selasa', '1', '07.00 - 07.40', 'VIII A', '13', 'INF8-G1', 'Informatika Ganjil', 'LAB-01', '2025/2026 Ganjil'),
    (201, 'Senin', '1', '07.00 - 07.40', 'VII B', '1', 'MTK7-2425-G2', 'Matematika Terapan', 'R-01', '2024/2025 Genap'),
    (202, 'Senin', '2', '07.40 - 08.20', 'VII B', '1', 'BIND7-2425-G2', 'Bahasa Indonesia Literasi', 'R-01', '2024/2025 Genap'),
    (203, 'Selasa', '1', '07.00 - 07.40', 'VIII B', '13', 'INF8-2425-G2', 'Informatika Praktik', 'LAB-01', '2024/2025 Genap'),
    (301, 'Senin', '1', '07.00 - 07.40', 'VII B', '1', 'MTK7-2425-G1', 'Matematika Dasar', 'R-01', '2024/2025 Ganjil'),
    (302, 'Senin', '2', '07.40 - 08.20', 'VII B', '1', 'IPA7-2425-G1', 'IPA Dasar', 'R-01', '2024/2025 Ganjil'),
    (303, 'Selasa', '1', '07.00 - 07.40', 'VIII B', '13', 'IPS8-2425-G1', 'IPS Terpadu', 'LAB-01', '2024/2025 Ganjil')
ON DUPLICATE KEY UPDATE
    day = VALUES(day),
    slot = VALUES(slot),
    time_range = VALUES(time_range),
    class_name = VALUES(class_name),
    teacher_code = VALUES(teacher_code),
    subject_code = VALUES(subject_code),
    subject_hint = VALUES(subject_hint),
    room_code = VALUES(room_code),
    tahun_ajaran = VALUES(tahun_ajaran);
