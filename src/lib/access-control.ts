import type { User } from "@/lib/store";

export type AccessRole = "ADMIN_IT" | "ADMIN_TU" | "ADMIN" | "GURU" | "ORTU";
export type AccessLevel = "none" | "view" | "full";
export type AccessMatrix = Record<AccessRole, Record<string, AccessLevel>>;

export interface AppPageAccess {
    path: string;
    label: string;
    section: "Admin IT" | "Admin TU" | "Guru" | "Orang Tua";
}

export const ACCESS_ROLES: Array<{ key: AccessRole; label: string }> = [
    { key: "ADMIN_IT", label: "Admin IT" },
    { key: "ADMIN_TU", label: "Admin TU" },
    { key: "ADMIN", label: "Kepala Sekolah" },
    { key: "GURU", label: "Guru" },
    { key: "ORTU", label: "Orang Tua" },
];

export const APP_PAGES: AppPageAccess[] = [
    { section: "Admin IT", label: "Dashboard IT", path: "/it/dashboard" },
    { section: "Admin IT", label: "Manajemen Akses & User", path: "/it/users" },
    { section: "Admin IT", label: "Akun Orang Tua", path: "/it/ortu" },
    { section: "Admin IT", label: "Backup Data", path: "/it/backup" },

    { section: "Admin TU", label: "Dashboard Admin", path: "/admin/dashboard" },
    { section: "Admin TU", label: "Daftar Kelas", path: "/admin/kelas" },
    { section: "Admin TU", label: "Manajemen Ruangan", path: "/admin/ruangan" },
    { section: "Admin TU", label: "Mata Pelajaran", path: "/admin/mapel" },
    { section: "Admin TU", label: "Analitik Mapel", path: "/admin/mapel/analitik" },
    { section: "Admin TU", label: "Guru", path: "/admin/guru" },
    { section: "Admin TU", label: "Siswa", path: "/admin/siswa" },
    { section: "Admin TU", label: "Orang Tua", path: "/admin/ortu" },
    { section: "Admin TU", label: "Tahun Ajaran", path: "/admin/tahun-ajaran" },
    { section: "Admin TU", label: "Pengajuan Izin", path: "/admin/izin" },
    { section: "Admin TU", label: "Rekap Presensi", path: "/admin/rekap" },
    { section: "Admin TU", label: "Verifikasi", path: "/admin/verifikasi" },

    { section: "Guru", label: "Dashboard Guru", path: "/guru/dashboard" },
    { section: "Guru", label: "Presensi", path: "/guru/presensi" },
    { section: "Guru", label: "Pengajuan Izin", path: "/guru/izin" },
    { section: "Guru", label: "Panel Wali Kelas", path: "/guru/wali-kelas" },

    { section: "Orang Tua", label: "Dashboard Orang Tua", path: "/ortu/dashboard" },
    { section: "Orang Tua", label: "Jadwal Pelajaran", path: "/ortu/jadwal" },
    { section: "Orang Tua", label: "Ajukan Izin", path: "/ortu/izin" },
    { section: "Orang Tua", label: "Riwayat & Izin", path: "/ortu/riwayat" },
];

export const LOCKED_ACCESS_ROUTES = new Set(["/it/dashboard", "/it/users"]);

const pageSet = new Set(APP_PAGES.map((page) => page.path));
const protectedPrefixes = ["/admin", "/it", "/guru", "/ortu"];

export const resolveProtectedPagePath = (pathname: string) => {
    if (pageSet.has(pathname)) return pathname;

    const parentPage = [...APP_PAGES]
        .sort((a, b) => b.path.length - a.path.length)
        .find((page) => pathname.startsWith(`${page.path}/`));

    return parentPage?.path ?? null;
};

const makeRoleAccess = (fullPaths: string[], viewPaths: string[] = []) =>
    APP_PAGES.reduce<Record<string, AccessLevel>>((acc, page) => {
        acc[page.path] = fullPaths.includes(page.path)
            ? "full"
            : viewPaths.includes(page.path)
                ? "view"
                : "none";
        return acc;
    }, {});

const allAdminPages = APP_PAGES.filter((page) => page.path.startsWith("/admin/")).map((page) => page.path);
const allGuruPages = APP_PAGES.filter((page) => page.path.startsWith("/guru/")).map((page) => page.path);
const allOrtuPages = APP_PAGES.filter((page) => page.path.startsWith("/ortu/")).map((page) => page.path);
const allItPages = APP_PAGES.filter((page) => page.path.startsWith("/it/")).map((page) => page.path);

export const DEFAULT_ACCESS_MATRIX: AccessMatrix = {
    ADMIN_IT: makeRoleAccess(allItPages),
    ADMIN_TU: makeRoleAccess(allAdminPages),
    ADMIN: makeRoleAccess(["/admin/dashboard"], ["/admin/guru", "/admin/ruangan", "/admin/mapel/analitik"]),
    GURU: makeRoleAccess(allGuruPages),
    ORTU: makeRoleAccess(allOrtuPages),
};

export const normalizeRoleName = (role?: string | null) =>
    (role || "").toUpperCase().trim().replace(/\s+/g, "_");

export const resolveAccessRole = (role?: string | null): AccessRole | null => {
    const normalizedRole = normalizeRoleName(role);

    if (normalizedRole.includes("ADMIN_TU")) return "ADMIN_TU";
    if (normalizedRole.includes("ADMIN_IT") || (normalizedRole.includes("ADMIN") && normalizedRole.includes("IT"))) return "ADMIN_IT";
    if (normalizedRole === "ADMIN" || normalizedRole.includes("KEPALA")) return "ADMIN";
    if (normalizedRole.includes("ORTU")) return "ORTU";
    if (normalizedRole.includes("GURU") || normalizedRole.includes("WALI") || normalizedRole.includes("KELAS")) return "GURU";
    return null;
};

export const mergeAccessMatrix = (matrix?: Partial<AccessMatrix> | null): AccessMatrix => {
    const merged = ACCESS_ROLES.reduce<AccessMatrix>((acc, role) => {
        const persistedRoleMatrix = matrix?.[role.key] || {};
        const normalizedRoleMatrix = Object.entries(persistedRoleMatrix).reduce<Record<string, AccessLevel>>((roleAcc, [path, level]) => {
            roleAcc[path] = normalizeAccessLevel(level);
            return roleAcc;
        }, {});

        acc[role.key] = { ...DEFAULT_ACCESS_MATRIX[role.key], ...normalizedRoleMatrix };
        return acc;
    }, {} as AccessMatrix);

    LOCKED_ACCESS_ROUTES.forEach((path) => {
        merged.ADMIN_IT[path] = "full";
    });

    return merged;
};

export const normalizeAccessLevel = (value: unknown): AccessLevel => {
    if (value === true) return "full";
    if (value === false) return "none";
    if (value === "view" || value === "full" || value === "none") return value;
    return "none";
};

export const getPageAccessLevel = (
    user: Pick<User, "role" | "teacherCode"> | null | undefined,
    pathname: string,
    matrix?: Partial<AccessMatrix> | null
): AccessLevel => {
    if (!user) return "none";
    const role = resolveAccessRole(user.role);
    if (!role) return "none";

    const protectedPagePath = resolveProtectedPagePath(pathname);
    if (!protectedPagePath && protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) return "none";

    const effectiveMatrix = mergeAccessMatrix(matrix);
    return normalizeAccessLevel(effectiveMatrix[role]?.[protectedPagePath || pathname]);
};

export const isKnownProtectedPage = (pathname: string) => resolveProtectedPagePath(pathname) !== null;

export const canAccessPage = (
    user: Pick<User, "role" | "teacherCode"> | null | undefined,
    pathname: string,
    matrix?: Partial<AccessMatrix> | null
) => {
    if (!user) return false;
    const role = resolveAccessRole(user.role);
    if (!role) return false;

    if (!isKnownProtectedPage(pathname)) {
        return !protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
    }

    return getPageAccessLevel(user, pathname, matrix) !== "none";
};

export const getDefaultAccessiblePath = (
    user: Pick<User, "role" | "teacherCode"> | null | undefined,
    matrix?: Partial<AccessMatrix> | null
) => {
    if (!user) return "/login";
    const role = resolveAccessRole(user.role);
    if (!role) return "/login";

    const effectiveMatrix = mergeAccessMatrix(matrix);
    const firstAccessiblePage = APP_PAGES.find((page) => normalizeAccessLevel(effectiveMatrix[role]?.[page.path]) !== "none");

    return firstAccessiblePage?.path || "/login";
};

export const requiresTahunAjaran = (user: Pick<User, "role"> | null | undefined, pathname: string) => {
    const role = resolveAccessRole(user?.role);
    if (role === "ADMIN_IT" || role === "ORTU") return false;
    return pathname.startsWith("/admin") || pathname.startsWith("/guru");
};
