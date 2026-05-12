<?php
require_once 'database.php';

$method = $_SERVER['REQUEST_METHOD'];

function parseAcademicYear($academicYear) {
    if (!preg_match('/^(\d{4})\/(\d{4})$/', $academicYear, $matches)) {
        return null;
    }
    $start = (int) $matches[1];
    $end = (int) $matches[2];
    if ($end !== $start + 1) return null;
    return [$start, $end];
}

function previousAcademicYear($academicYear) {
    $parts = parseAcademicYear($academicYear);
    if (!$parts) return null;
    return ($parts[0] - 1) . '/' . $parts[0];
}

function latestPeriodForYear($conn, $academicYear, $excludeName = null) {
    $query = "SELECT name FROM tahun_ajaran WHERE name LIKE :prefix";
    $params = [':prefix' => $academicYear . ' %'];
    if ($excludeName) {
        $query .= " AND name != :exclude_name";
        $params[':exclude_name'] = $excludeName;
    }
    $query .= " ORDER BY CASE WHEN name LIKE '% Genap' THEN 2 WHEN name LIKE '% Ganjil' THEN 1 ELSE 0 END DESC, id DESC LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['name'] : null;
}

function latestPeriodBeforeYearWithSmpData($conn, $academicYear) {
    $parts = parseAcademicYear($academicYear);
    if (!$parts) return null;

    $stmt = $conn->prepare("SELECT ta.name
        FROM tahun_ajaran ta
        WHERE CAST(SUBSTRING(ta.name, 1, 4) AS UNSIGNED) < :target_start
          AND EXISTS (
              SELECT 1 FROM siswa s
              WHERE s.tahun_ajaran = ta.name
                AND COALESCE(s.academic_status, 'AKTIF') IN ('AKTIF', 'PERLU_PENEMPATAN')
                AND s.cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)'
          )
        ORDER BY CAST(SUBSTRING(ta.name, 1, 4) AS UNSIGNED) DESC,
                 CASE WHEN ta.name LIKE '% Genap' THEN 2 WHEN ta.name LIKE '% Ganjil' THEN 1 ELSE 0 END DESC,
                 ta.id DESC
        LIMIT 1");
    $stmt->execute([':target_start' => $parts[0]]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['name'] : null;
}

function scalarCount($conn, $query, $params = []) {
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    return (int) $stmt->fetchColumn();
}

switch ($method) {
    case 'GET':
        try {
            if (isset($_GET['manage'])) {
                $query = "SELECT ta.*,
                    (SELECT COUNT(*) FROM siswa s WHERE s.tahun_ajaran = ta.name AND COALESCE(s.academic_status, 'AKTIF') = 'AKTIF' AND s.cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)') AS active_students,
                    (SELECT COUNT(*) FROM siswa s WHERE s.tahun_ajaran = ta.name AND s.academic_status = 'PERLU_PENEMPATAN' AND s.cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)') AS placement_students,
                    (SELECT COUNT(*) FROM siswa s WHERE s.tahun_ajaran = ta.name AND s.academic_status = 'LULUS' AND s.cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)') AS graduated_students,
                    (SELECT COUNT(*) FROM kelas k WHERE k.tahun_ajaran = ta.name AND k.grade IN ('VII', 'VIII', 'IX')) AS class_count,
                    (SELECT COUNT(*) FROM mapel m WHERE m.tahun_ajaran = ta.name) AS subject_count,
                    (SELECT COUNT(*) FROM jadwal j WHERE j.tahun_ajaran = ta.name) AS schedule_count
                    FROM tahun_ajaran ta
                    ORDER BY ta.name DESC";
                $stmt = $conn->prepare($query);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['status' => 'success', 'data' => $results]);
                break;
            }

            $query = "SELECT * FROM tahun_ajaran WHERE status = 'active' ORDER BY name DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $results]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $academicYear = trim($data['academic_year'] ?? '');
        $semester = trim($data['semester'] ?? '');

        if (!parseAcademicYear($academicYear) || !in_array($semester, ['Ganjil', 'Genap'], true)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Tahun ajaran atau semester tidak valid']);
            break;
        }

        $targetName = $academicYear . ' ' . $semester;

        try {
            $exists = scalarCount($conn, "SELECT COUNT(*) FROM tahun_ajaran WHERE name = :name", [':name' => $targetName]);
            if ($exists > 0) {
                http_response_code(409);
                echo json_encode(['status' => 'error', 'message' => 'Tahun ajaran dan semester ini sudah ada']);
                break;
            }

            $sameYearSource = latestPeriodForYear($conn, $academicYear, $targetName);
            $sourceName = $sameYearSource;
            $mode = 'same_year';
            if (!$sourceName) {
                $sourceName = latestPeriodBeforeYearWithSmpData($conn, $academicYear);
                $mode = 'new_year';
            }

            if (!$sourceName) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Tidak ada periode sumber dengan data SMP kelas VII/VIII/IX. Buat atau pilih periode sebelumnya yang valid terlebih dahulu.']);
                break;
            }

            $sourceSmpStudents = scalarCount($conn, "SELECT COUNT(*) FROM siswa WHERE tahun_ajaran = :source AND COALESCE(academic_status, 'AKTIF') IN ('AKTIF', 'PERLU_PENEMPATAN') AND cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)'", [':source' => $sourceName]);
            if ($sourceSmpStudents === 0) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Periode sumber tidak memiliki siswa SMP kelas VII/VIII/IX. Data non-SMP tidak dipakai untuk kenaikan kelas.']);
                break;
            }

            if ($mode === 'new_year') {
                $sourceActiveSmpStudents = scalarCount($conn, "SELECT COUNT(*) FROM siswa WHERE tahun_ajaran = :source AND COALESCE(academic_status, 'AKTIF') = 'AKTIF' AND cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)'", [':source' => $sourceName]);
                if ($sourceActiveSmpStudents === 0) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => 'Periode sumber masih berisi siswa yang perlu penempatan atau tidak memiliki siswa aktif SMP. Selesaikan penempatan kelas sebelum membuat tahun ajaran baru berikutnya.']);
                    break;
                }
            }

            $conn->beginTransaction();

            $insertPeriod = $conn->prepare("INSERT INTO tahun_ajaran (name, status) VALUES (:name, 'active')");
            $insertPeriod->execute([':name' => $targetName]);

            $summary = [
                'mode' => $mode,
                'source' => $sourceName,
                'classes' => 0,
                'students' => 0,
                'graduated' => 0,
            ];

            if ($sourceName && $mode === 'same_year') {
                $classes = $conn->prepare("INSERT INTO kelas (grade, name, teacher, teacher_code, count, status, tahun_ajaran)
                    SELECT grade, name, teacher, teacher_code, count, status, :target
                    FROM kelas
                    WHERE tahun_ajaran = :source AND grade IN ('VII', 'VIII', 'IX')
                    ON DUPLICATE KEY UPDATE
                        grade = VALUES(grade),
                        teacher = VALUES(teacher),
                        teacher_code = VALUES(teacher_code),
                        count = VALUES(count),
                        status = VALUES(status)");
                $classes->execute([':target' => $targetName, ':source' => $sourceName]);

                $students = $conn->prepare("INSERT INTO siswa (noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, academic_status, previous_cls, min_grade_level, tahun_ajaran)
                    SELECT noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, COALESCE(academic_status, 'AKTIF'), previous_cls, min_grade_level, :target
                    FROM siswa
                    WHERE tahun_ajaran = :source
                      AND COALESCE(academic_status, 'AKTIF') IN ('AKTIF', 'PERLU_PENEMPATAN')
                      AND cls REGEXP '^(VII|VIII|IX)([[:space:]]|$)'
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
                        status = VALUES(status),
                        academic_status = VALUES(academic_status),
                        previous_cls = VALUES(previous_cls),
                        min_grade_level = VALUES(min_grade_level)");
                $students->execute([':target' => $targetName, ':source' => $sourceName]);
            } elseif ($sourceName && $mode === 'new_year') {
                $graduate = $conn->prepare("UPDATE siswa
                    SET academic_status = 'LULUS'
                    WHERE tahun_ajaran = :source
                      AND COALESCE(academic_status, 'AKTIF') = 'AKTIF'
                      AND cls REGEXP '^IX([[:space:]]|$)'");
                $graduate->execute([':source' => $sourceName]);
                $summary['graduated'] = $graduate->rowCount();

                $classes = $conn->prepare("INSERT INTO kelas (grade, name, teacher, teacher_code, count, status, tahun_ajaran)
                    SELECT
                        CASE
                            WHEN grade = 'VII' THEN 'VIII'
                            WHEN grade = 'VIII' THEN 'IX'
                            ELSE grade
                        END AS promoted_grade,
                        CONCAT(
                            CASE
                                WHEN grade = 'VII' THEN 'VIII'
                                WHEN grade = 'VIII' THEN 'IX'
                                ELSE grade
                            END,
                            CASE WHEN LOCATE(' ', name) > 0 THEN SUBSTRING(name, LOCATE(' ', name)) ELSE '' END
                        ) AS promoted_name,
                        '-',
                        NULL,
                        0,
                        'Perlu Penempatan',
                        :target
                    FROM kelas
                    WHERE tahun_ajaran = :source AND grade IN ('VII', 'VIII')
                    ON DUPLICATE KEY UPDATE
                        grade = VALUES(grade),
                        teacher = VALUES(teacher),
                        teacher_code = VALUES(teacher_code),
                        count = VALUES(count),
                        status = VALUES(status)");
                $classes->execute([':target' => $targetName, ':source' => $sourceName]);

                $students = $conn->prepare("INSERT INTO siswa (noInduk, nisn, name, gender, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, parent_id, nik_ortu, wa, status, academic_status, previous_cls, min_grade_level, tahun_ajaran)
                    SELECT
                        noInduk,
                        nisn,
                        name,
                        gender,
                        tglLahir,
                        kota,
                        alamat,
                        namaAyah,
                        pekerjaanAyah,
                        namaIbu,
                        pekerjaanIbu,
                        CONCAT(
                            CASE
                                WHEN cls REGEXP '^VIII([[:space:]]|$)' THEN 'IX'
                                WHEN cls REGEXP '^VII([[:space:]]|$)' THEN 'VIII'
                                ELSE cls
                            END,
                            CASE WHEN LOCATE(' ', cls) > 0 THEN SUBSTRING(cls, LOCATE(' ', cls)) ELSE '' END
                        ),
                        parent,
                        parent_id,
                        nik_ortu,
                        wa,
                        status,
                        'PERLU_PENEMPATAN',
                        cls,
                        CASE
                            WHEN cls REGEXP '^VIII([[:space:]]|$)' THEN 9
                            WHEN cls REGEXP '^VII([[:space:]]|$)' THEN 8
                            ELSE NULL
                        END,
                        :target
                    FROM siswa
                    WHERE tahun_ajaran = :source
                      AND COALESCE(academic_status, 'AKTIF') = 'AKTIF'
                      AND (cls REGEXP '^VII([[:space:]]|$)' OR cls REGEXP '^VIII([[:space:]]|$)')
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
                        status = VALUES(status),
                        academic_status = VALUES(academic_status),
                        previous_cls = VALUES(previous_cls),
                        min_grade_level = VALUES(min_grade_level)");
                $students->execute([':target' => $targetName, ':source' => $sourceName]);
            }

            $summary['classes'] = scalarCount($conn, "SELECT COUNT(*) FROM kelas WHERE tahun_ajaran = :target", [':target' => $targetName]);
            $summary['students'] = scalarCount($conn, "SELECT COUNT(*) FROM siswa WHERE tahun_ajaran = :target", [':target' => $targetName]);

            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Tahun ajaran berhasil dibuat',
                'data' => [
                    'name' => $targetName,
                    'summary' => $summary
                ]
            ]);
        } catch(PDOException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $periodName = trim($data['name'] ?? ($_GET['name'] ?? ''));
        $confirm = $data['dev_confirm'] ?? '';

        if (!$periodName || $confirm !== 'DELETE_TAHUN_AJARAN_DEV') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Konfirmasi delete dev tidak valid']);
            break;
        }

        try {
            $exists = scalarCount($conn, "SELECT COUNT(*) FROM tahun_ajaran WHERE name = :name", [':name' => $periodName]);
            if ($exists === 0) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Tahun ajaran tidak ditemukan']);
                break;
            }

            $conn->beginTransaction();

            $scheduleIds = [];
            $scheduleStmt = $conn->prepare("SELECT id FROM jadwal WHERE tahun_ajaran = :tahun_ajaran");
            $scheduleStmt->execute([':tahun_ajaran' => $periodName]);
            while ($row = $scheduleStmt->fetch(PDO::FETCH_ASSOC)) {
                $scheduleIds[] = (int) $row['id'];
            }

            $studentIds = [];
            $studentStmt = $conn->prepare("SELECT id FROM siswa WHERE tahun_ajaran = :tahun_ajaran");
            $studentStmt->execute([':tahun_ajaran' => $periodName]);
            while ($row = $studentStmt->fetch(PDO::FETCH_ASSOC)) {
                $studentIds[] = (int) $row['id'];
            }

            if (count($scheduleIds) > 0) {
                $schedulePlaceholders = implode(',', array_fill(0, count($scheduleIds), '?'));

                $stmt = $conn->prepare("DELETE FROM jurnal WHERE schedule_id IN ($schedulePlaceholders)");
                $stmt->execute($scheduleIds);

                $stmt = $conn->prepare("DELETE FROM notifikasi WHERE schedule_id IN ($schedulePlaceholders)");
                $stmt->execute($scheduleIds);
            }

            if (count($studentIds) > 0) {
                $studentPlaceholders = implode(',', array_fill(0, count($studentIds), '?'));

                $stmt = $conn->prepare("DELETE FROM izin WHERE student_id IN ($studentPlaceholders)");
                $stmt->execute($studentIds);
            }

            $deleted = [];
            foreach ([
                'presensi' => "DELETE FROM presensi WHERE tahun_ajaran = :tahun_ajaran",
                'jadwal' => "DELETE FROM jadwal WHERE tahun_ajaran = :tahun_ajaran",
                'mapel' => "DELETE FROM mapel WHERE tahun_ajaran = :tahun_ajaran",
                'kelas' => "DELETE FROM kelas WHERE tahun_ajaran = :tahun_ajaran",
                'siswa' => "DELETE FROM siswa WHERE tahun_ajaran = :tahun_ajaran",
                'tahun_ajaran' => "DELETE FROM tahun_ajaran WHERE name = :tahun_ajaran",
            ] as $table => $query) {
                $stmt = $conn->prepare($query);
                $stmt->execute([':tahun_ajaran' => $periodName]);
                $deleted[$table] = $stmt->rowCount();
            }

            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Tahun ajaran berhasil dihapus untuk kebutuhan dev',
                'data' => [
                    'name' => $periodName,
                    'deleted' => $deleted
                ]
            ]);
        } catch(PDOException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method Tidak Diizinkan']);
        break;
}
?>
