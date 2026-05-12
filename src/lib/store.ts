import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fetchAccessMatrixFromServer, saveAccessMatrixToServer } from "@/lib/access-api";
import { DEFAULT_ACCESS_MATRIX, mergeAccessMatrix, type AccessLevel, type AccessMatrix, type AccessRole } from "@/lib/access-control";

// ==================
// TYPES
// ==================

export type Role = "ADMIN" | "ADMIN_IT" | "ADMIN_TU" | "GURU" | "ORTU";
export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPHA" | "TERLAMBAT" | "KEPERLUAN_SEKOLAH";
export type LeaveType = "IZIN" | "SAKIT";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone: string;
    nik?: string;          // NIK untuk Orang Tua
    teacherCode?: string;    // Kode guru sesuai jadwal yang diberikan
    homebaseRoomId?: string; // Ruangan tetap untuk mengajar
    isBK?: boolean;          // Tanda khusus jika guru BK / Piket
    waliKelasRombelName?: string; // Menjadi wali kelas di Rombel apa
}

export interface Student {
    id: string;
    nis: string;
    name: string;
    gender: "L" | "P";
    className: string;
    rombelId: string;
    photoUrl?: string; // New
}

export interface Room {
    id: string;
    code: string;
    name: string;
    location: string;
    pic?: string;
}

export interface Rombel {
    id: string;
    name: string;
    grade: number;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    grade?: number;           // Tingkat kelas (misal 7, 8, atau 9)
    targetHoursPerWeek?: number; // Beban Jam / Target Jam per Minggu
}

export interface Schedule {
    id: string;
    rombelId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
    roomId?: string; // Menyambungkan ke ID Ruangan
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    scheduleId: string;
    subjectName: string;
    className: string;
    date: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface ClassSession {
    id: string;
    scheduleId: string;
    date: string;
    topic: string;
    notes: string;
}

export interface LeaveRequest {
    id: string;
    studentId: string;
    studentName: string;
    studentNis: string;
    parentId: string;
    parentName: string;
    parentPhone: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason: string;
    selfieUrl: string;
    attachmentUrl?: string | null;
    status: LeaveStatus;
    reviewedBy?: string;
    reviewNotes?: string;
    createdAt: string;
}

// ==================
// MOCK DATA
// ==================

const USERS: User[] = [
    { id: "u33", teacherCode: "1", name: "Veronika Suhartati, S.Psi.,M.M", email: "guru1@sekolah.id", role: "ADMIN", phone: "-" },
    { id: "u60", teacherCode: "13", name: "Waskitha Wijaya, M.Kom", email: "guru13@sekolah.id", role: "ADMIN_IT", phone: "-" },
    { id: "u61", teacherCode: "TU-01", name: "Admin Tata Usaha", email: "admin.tu@sekolah.id", role: "ADMIN_TU", phone: "-" },
    { id: "u32", name: "Hasan Fauzi", nik: "1234567890", email: "hasan@gmail.com", role: "ORTU", phone: "081300000001" },
];

const ROOMS: Room[] = [];
const ROMBELS: Rombel[] = [];
const SUBJECTS: Subject[] = [];
const STUDENTS: Student[] = [];
const SCHEDULES: Schedule[] = [];

const PARENT_CHILDREN: Record<string, string[]> = {
    u32: ["st1"],
    u33: ["st2"],
};

// ==================
// STORE
// ==================

interface AppState {
    // Auth
    currentUser: User | null;
    login: (email: string, password: string) => boolean;
    logout: () => void;

    // Data
    users: User[];
    rooms: Room[];
    rombels: Rombel[];
    subjects: Subject[];
    students: Student[];
    schedules: Schedule[];

    // Attendance
    attendanceRecords: AttendanceRecord[];
    saveAttendance: (records: Omit<AttendanceRecord, "id">[]) => void;

    // Leave Requests
    leaveRequests: LeaveRequest[];
    submitLeaveRequest: (req: Omit<LeaveRequest, "id" | "status" | "createdAt" | "reviewedBy" | "reviewNotes">) => void;
    reviewLeaveRequest: (id: string, status: "APPROVED" | "REJECTED", reviewNotes: string) => void;

    // Class Sessions (Journal)
    classSessions: ClassSession[];
    saveClassSession: (session: Omit<ClassSession, "id">) => void;
    getClassSession: (scheduleId: string, date: string) => ClassSession | undefined;

    // Tahun Ajaran
    selectedTahunAjaran: string | null;
    setSelectedTahunAjaran: (tahun: string) => void;

    // Access Control
    accessMatrix: AccessMatrix;
    accessMatrixLoaded: boolean;
    accessMatrixError: string | null;
    fetchAccessMatrix: () => Promise<void>;
    setPageAccess: (role: AccessRole, path: string, level: AccessLevel) => Promise<void>;
    resetAccessMatrix: () => Promise<void>;

    // Ortu Selection
    selectedChildId: string | null;
    setSelectedChildId: (id: string | null) => void;

    // Helpers
    getStudentsByRombel: (rombelId: string) => Student[];
    getSchedulesByTeacher: (teacherId: string) => Schedule[];
    getRombelsByTeacher: (teacherId: string) => Rombel[];
    getChildrenByParent: (parentId: string) => Student[];
    getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
    getLeaveRequestsByParent: (parentId: string) => LeaveRequest[];
    getPendingLeaveRequests: () => LeaveRequest[];

    // Jadwal / Scheduling Engine
    checkScheduleConflict: (newSchedule: Partial<Schedule>) => { conflict: boolean; reason?: string };
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Auth
            currentUser: null,
            selectedTahunAjaran: null,
            setSelectedTahunAjaran: (tahun) => set({ selectedTahunAjaran: tahun }),
            accessMatrix: DEFAULT_ACCESS_MATRIX,
            accessMatrixLoaded: false,
            accessMatrixError: null,
            fetchAccessMatrix: async () => {
                try {
                    const accessMatrix = await fetchAccessMatrixFromServer();
                    set({ accessMatrix, accessMatrixLoaded: true, accessMatrixError: null });
                } catch (error) {
                    console.error("Access matrix load error", error);
                    set({
                        accessMatrix: mergeAccessMatrix(get().accessMatrix),
                        accessMatrixLoaded: true,
                        accessMatrixError: error instanceof Error ? error.message : "Gagal memuat matriks akses",
                    });
                }
            },
            setPageAccess: async (role, path, level) => {
                const previousMatrix = get().accessMatrix;
                const nextMatrix = mergeAccessMatrix({
                    ...previousMatrix,
                    [role]: {
                        ...previousMatrix[role],
                        [path]: level,
                    },
                });

                set({ accessMatrix: nextMatrix });

                try {
                    const savedMatrix = await saveAccessMatrixToServer(nextMatrix);
                    set({ accessMatrix: savedMatrix, accessMatrixLoaded: true, accessMatrixError: null });
                } catch (error) {
                    set({
                        accessMatrix: previousMatrix,
                        accessMatrixError: error instanceof Error ? error.message : "Gagal menyimpan matriks akses",
                    });
                    throw error;
                }
            },
            resetAccessMatrix: async () => {
                const previousMatrix = get().accessMatrix;
                const nextMatrix = mergeAccessMatrix(DEFAULT_ACCESS_MATRIX);
                set({ accessMatrix: nextMatrix });

                try {
                    const savedMatrix = await saveAccessMatrixToServer(nextMatrix);
                    set({ accessMatrix: savedMatrix, accessMatrixLoaded: true, accessMatrixError: null });
                } catch (error) {
                    set({
                        accessMatrix: previousMatrix,
                        accessMatrixError: error instanceof Error ? error.message : "Gagal menyimpan matriks akses",
                    });
                    throw error;
                }
            },
            selectedChildId: null,
            setSelectedChildId: (id) => set({ selectedChildId: id }),
            login: (email: string, password: string) => {
                if (password !== "password123") return false;
                const user = USERS.find((u) => u.email === email);
                if (!user) return false;
                set({ currentUser: user });
                return true;
            },
            logout: () => set({ currentUser: null, selectedTahunAjaran: null, selectedChildId: null }),

            // Data
            users: USERS,
            rooms: ROOMS,
            rombels: ROMBELS,
            subjects: SUBJECTS,
            students: STUDENTS,
            schedules: SCHEDULES,

            // Attendance
            attendanceRecords: [],
            saveAttendance: (records) => {
                const newRecords = records.map((r, i) => ({
                    ...r,
                    id: `att-${Date.now()}-${i}`,
                }));
                set((state) => {
                    const keys = new Set(newRecords.map((r) => `${r.studentId}-${r.scheduleId}-${r.date}`));
                    const filtered = state.attendanceRecords.filter(
                        (a) => !keys.has(`${a.studentId}-${a.scheduleId}-${a.date}`)
                    );
                    return { attendanceRecords: [...filtered, ...newRecords] };
                });
            },

            // Class Sessions (Journal)
            classSessions: [],
            saveClassSession: (session) => {
                set((state) => {
                    const filtered = state.classSessions.filter(
                        (s) => !(s.scheduleId === session.scheduleId && s.date === session.date)
                    );
                    return {
                        classSessions: [...filtered, { ...session, id: `cs-${Date.now()}` }],
                    };
                });
            },
            getClassSession: (scheduleId, date) => {
                return get().classSessions.find((s) => s.scheduleId === scheduleId && s.date === date);
            },

            // Leave Requests
            leaveRequests: [],
            submitLeaveRequest: (req) => {
                const newReq: LeaveRequest = {
                    ...req,
                    id: `lr-${Date.now()}`,
                    status: "PENDING",
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ leaveRequests: [newReq, ...state.leaveRequests] }));
            },
            reviewLeaveRequest: (id, status, reviewNotes) => {
                const state = get();
                const currentUser = state.currentUser;
                set((state) => ({
                    leaveRequests: state.leaveRequests.map((lr) =>
                        lr.id === id ? { ...lr, status, reviewNotes, reviewedBy: currentUser?.name || "Guru" } : lr
                    ),
                }));
            },

            // Helpers
            getStudentsByRombel: (rombelId) => get().students.filter((s) => s.rombelId === rombelId),
            getSchedulesByTeacher: (teacherId) => get().schedules.filter((s) => s.teacherId === teacherId),
            getRombelsByTeacher: (teacherId) => {
                const classIds = new Set(get().schedules.filter((s) => s.teacherId === teacherId).map((s) => s.rombelId));
                return get().rombels.filter((c) => classIds.has(c.id));
            },
            getChildrenByParent: (parentId) => {
                const childIds = PARENT_CHILDREN[parentId] || [];
                return get().students.filter((s) => childIds.includes(s.id));
            },
            getAttendanceByStudent: (studentId) =>
                get().attendanceRecords.filter((a) => a.studentId === studentId),
            getLeaveRequestsByParent: (parentId) => {
                const studentIds = get().getChildrenByParent(parentId).map((s) => s.id);
                return get().leaveRequests.filter((lr) => studentIds.includes(lr.studentId));
            },
            getPendingLeaveRequests: () => get().leaveRequests.filter((lr) => lr.status === "PENDING"),

            checkScheduleConflict: (newSchedule) => {
                const { teacherId, rombelId, roomId, dayOfWeek, startTime, endTime } = newSchedule;
                if (!dayOfWeek || !startTime || !endTime) return { conflict: false };
                const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => (start1 < end2 && end1 > start2);
                const existingSchedules = get().schedules.filter(s => s.dayOfWeek === dayOfWeek && s.id !== newSchedule.id);
                for (const s of existingSchedules) {
                    if (isTimeOverlap(startTime, endTime, s.startTime, s.endTime)) {
                        if (teacherId && s.teacherId === teacherId) return { conflict: true, reason: `Konflik Guru` };
                        if (rombelId && s.rombelId === rombelId) return { conflict: true, reason: `Konflik Rombel` };
                        if (roomId && s.roomId && s.roomId === roomId) return { conflict: true, reason: `Konflik Ruangan` };
                    }
                }
                return { conflict: false };
            }
        }),
        {
            name: "presensipander-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                currentUser: state.currentUser, 
                selectedTahunAjaran: state.selectedTahunAjaran,
                selectedChildId: state.selectedChildId,
                accessMatrix: state.accessMatrix
            }),
        }
    )
);
