# Handoff

## Project

- Path: `C:\Users\David Augusto\Documents\Porto\sistem_presensi`
- Stack: Next.js frontend, PHP API, MySQL database, Docker support.
- Latest verification: `npm.cmd run build` passed.

If running through Docker, rebuild after frontend/API changes:

```powershell
docker compose up -d --build web api
```

## Completed Work

### Docker/API Config

- Docker support has been added.
- PHP database config reads environment variables.
- Frontend uses `src/lib/api-config.ts` for API/upload URLs instead of hardcoded local API URLs in the touched areas.

### Parent/Guardian Data

Files:

- `src/components/ortu-management.tsx`
- `src/app/admin/ortu/page.tsx`
- `src/app/it/ortu/page.tsx`
- `api/ortu/index.php`
- `database.sql`

Current concept:

- Admin TU manages full parent data at `/admin/ortu`.
- Admin IT only provisions parent portal accounts at `/it/ortu`.
- Parent data now includes:
  - `nik`
  - `name`
  - `email`
  - `phone`
  - `namaAyah`
  - `pekerjaanAyah`
  - `namaIbu`
  - `pekerjaanIbu`
  - `status`

API notes:

- `api/ortu/index.php` auto-adds missing parent profile columns for older DBs.
- `email` and `phone` are modified to nullable where DB permissions allow it.
- `PUT` supports password update if a non-empty password is sent.
- Bulk upsert endpoint exists:

```http
POST /api/ortu/index.php?action=bulk-upsert
```

Body is an array of parent records. It upserts by unique `nik`.

### Combined Student + Parent Import

File:

- `src/app/admin/siswa/page.tsx`

Current behavior:

- Admin TU student page can import combined student + parent data.
- Template generated: `template_import_siswa_ortu.xlsx`.
- Columns:

```text
noInduk, nisn, name, gender, cls, tglLahir, kota, alamat,
namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu,
parent, nik_ortu, email_ortu, wa
```

Import flow:

1. Read CSV/XLS/XLSX.
2. Validate required student fields: `nisn`, `name`, `cls`.
3. Validate `nik_ortu`:
   - Required.
   - Must be numeric.
   - Scientific notation like `3.57101E+15` is rejected.
4. Bulk upsert parent records by `nik_ortu`.
5. Insert new students.
6. If student already exists by NISN, update the existing student so the parent link/data can be repaired.

Important rule:

- One parent can have many students.
- Same `nik_ortu` may appear on multiple student rows.
- Same `nik_ortu` is only rejected when it has conflicting `email_ortu` or `wa`, because that likely means the NIK is wrong.

### Parent Link In Student Form

File:

- `src/app/admin/siswa/page.tsx`

Current behavior:

- Add/edit student form has `Link Akun Orang Tua`.
- Selecting a parent auto-fills:
  - guardian display name
  - WA
  - father name/job
  - mother name/job
- Edit form also tries to resolve the linked parent from `siswa.nik_ortu` and uses parent master data when available.

### Batch Delete

Files:

- `src/app/admin/siswa/page.tsx`
- `src/components/ortu-management.tsx`

Current behavior:

- Admin TU student table has:
  - checkbox per row
  - select-all checkbox for currently filtered rows
  - `Hapus X Terpilih`
- Admin TU parent table has:
  - checkbox per row
  - select-all checkbox for currently filtered rows
  - `Hapus X Terpilih`
- Parent batch delete is not shown in Admin IT mode.
- Deletes use existing DELETE endpoints with `Promise.allSettled`, then refresh data.

## Known Data Issue

User CSV:

```text
C:\Users\David Augusto\Downloads\template_import_siswa_ortu (1).csv
```

Problem found:

- `nik_ortu` values were exported as scientific notation:

```text
3.57101E+15
```

- 15 rows had the same corrupted NIK value.
- 1 row had empty `nik_ortu`.

Fix for user:

1. Open Excel template.
2. Format the `nik_ortu` column as Text before entering/pasting NIK.
3. Fill full NIK values as plain digits.
4. Export CSV again.
5. Check with Notepad/VSCode that `nik_ortu` is full digits, not scientific notation.
6. Import again.

If students already exist, import ulang is okay because existing students are updated by NISN.

## Verification Commands

```powershell
npm.cmd run build
php -l .\api\ortu\index.php
```

Both passed during the session.

## Suggested Next Checks

- If UI changes do not appear, rebuild Docker:

```powershell
docker compose up -d --build web api
```

- If parent records still do not appear after import, inspect the network response from:

```http
POST /api/ortu/index.php?action=bulk-upsert
```

- If import rejects a file, first check `nik_ortu` formatting in the CSV.
