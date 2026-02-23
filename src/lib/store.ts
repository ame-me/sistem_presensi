import { create } from "zustand";

// ==================
// TYPES
// ==================

export type Role = "ADMIN" | "GURU" | "ORTU";
export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPHA" | "TERLAMBAT" | "KEPERLUAN_SEKOLAH";
export type LeaveType = "IZIN" | "SAKIT";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone: string;
}

export interface Student {
    id: string;
    nis: string;
    name: string;
    gender: "L" | "P";
    className: string;
    classId: string;
    photoUrl?: string; // New
}

export interface ClassInfo {
    id: string;
    name: string;
    grade: number;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
}

export interface Schedule {
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
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

export interface WhatsAppLog {
    id: string;
    phone: string;
    message: string;
    status: "sent" | "failed";
    timestamp: string;
}

// ==================
// MOCK DATA
// ==================

const USERS: User[] = [
    { id: "u1", name: "Admin Sekolah", email: "admin@sekolah.id", role: "ADMIN", phone: "081234567890" },
    { id: "u2", name: "Budi Santoso, S.Pd.", email: "budi@sekolah.id", role: "GURU", phone: "081234567891" },
    { id: "u3", name: "Siti Rahayu, S.Pd.", email: "siti@sekolah.id", role: "GURU", phone: "081234567892" },
    { id: "u4", name: "Hasan Fauzi", email: "hasan@gmail.com", role: "ORTU", phone: "081300000001" },
    { id: "u5", name: "Sri Lestari", email: "sri@gmail.com", role: "ORTU", phone: "081300000002" },
];

const CLASSES: ClassInfo[] = [
    { id: "c1", name: "X-IPA-1", grade: 10 },
    { id: "c2", name: "X-IPA-2", grade: 10 },
    { id: "c3", name: "XI-IPA-1", grade: 11 },
];

const SUBJECTS: Subject[] = [
    { id: "s1", name: "Matematika", code: "MTK" },
    { id: "s2", name: "Bahasa Indonesia", code: "BIN" },
    { id: "s3", name: "Fisika", code: "FIS" },
    { id: "s4", name: "Bahasa Inggris", code: "BIG" },
];

const STUDENTS: Student[] = [
    { id: "st1", nis: "2024001", name: "Ahmad Fauzi", gender: "L", className: "X-IPA-1", classId: "c1", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad" },
    { id: "st2", nis: "2024002", name: "Dewi Lestari", gender: "P", className: "X-IPA-1", classId: "c1", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dewi" },
    { id: "st3", nis: "2024003", name: "Rizky Pratama", gender: "L", className: "X-IPA-1", classId: "c1", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rizky" },
    { id: "st4", nis: "2024004", name: "Putri Maharani", gender: "P", className: "X-IPA-1", classId: "c1", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Putri" },
    { id: "st5", nis: "2024005", name: "Fajar Nugroho", gender: "L", className: "X-IPA-1", classId: "c1", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fajar" },
    { id: "st6", nis: "2024006", name: "Sari Wulandari", gender: "P", className: "X-IPA-2", classId: "c2", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sari" },
    { id: "st7", nis: "2024007", name: "Dimas Ardiansyah", gender: "L", className: "X-IPA-2", classId: "c2", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas" },
    { id: "st8", nis: "2024008", name: "Rina Fitriani", gender: "P", className: "X-IPA-2", classId: "c2", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rina" },
    { id: "st9", nis: "2024009", name: "Andi Setiawan", gender: "L", className: "X-IPA-2", classId: "c2", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi" },
    { id: "st10", nis: "2024010", name: "Maya Sari", gender: "P", className: "XI-IPA-1", classId: "c3", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya" },
];

const SCHEDULES: Schedule[] = [
    { id: "sch1", classId: "c1", className: "X-IPA-1", subjectId: "s1", subjectName: "Matematika", teacherId: "u2", dayOfWeek: 1, startTime: "07:00", endTime: "08:30" },
    { id: "sch2", classId: "c1", className: "X-IPA-1", subjectId: "s2", subjectName: "Bahasa Indonesia", teacherId: "u2", dayOfWeek: 1, startTime: "08:30", endTime: "10:00" },
    { id: "sch3", classId: "c1", className: "X-IPA-1", subjectId: "s3", subjectName: "Fisika", teacherId: "u2", dayOfWeek: 2, startTime: "07:00", endTime: "08:30" },
    { id: "sch4", classId: "c1", className: "X-IPA-1", subjectId: "s4", subjectName: "Bahasa Inggris", teacherId: "u3", dayOfWeek: 2, startTime: "08:30", endTime: "10:00" },
    { id: "sch5", classId: "c2", className: "X-IPA-2", subjectId: "s3", subjectName: "Fisika", teacherId: "u2", dayOfWeek: 1, startTime: "10:15", endTime: "11:45" },
    { id: "sch6", classId: "c2", className: "X-IPA-2", subjectId: "s1", subjectName: "Matematika", teacherId: "u3", dayOfWeek: 3, startTime: "07:00", endTime: "08:30" },
    { id: "sch7", classId: "c3", className: "XI-IPA-1", subjectId: "s1", subjectName: "Matematika", teacherId: "u2", dayOfWeek: 3, startTime: "08:30", endTime: "10:00" },
];

// Parent-Student mapping: u4 -> st1, u5 -> st2
const PARENT_CHILDREN: Record<string, string[]> = {
    u4: ["st1"],
    u5: ["st2"],
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
    classes: ClassInfo[];
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

    // WhatsApp logs
    waLogs: WhatsAppLog[];

    // Class Sessions (Journal)
    classSessions: ClassSession[];
    saveClassSession: (session: Omit<ClassSession, "id">) => void;
    getClassSession: (scheduleId: string, date: string) => ClassSession | undefined;

    // Helpers
    getStudentsByClass: (classId: string) => Student[];
    getSchedulesByTeacher: (teacherId: string) => Schedule[];
    getClassesByTeacher: (teacherId: string) => ClassInfo[];
    getChildrenByParent: (parentId: string) => Student[];
    getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
    getLeaveRequestsByParent: (parentId: string) => LeaveRequest[];
    getPendingLeaveRequests: () => LeaveRequest[];
}

export const useAppStore = create<AppState>((set, get) => ({
    // Auth
    currentUser: null,
    login: (email: string, password: string) => {
        if (password !== "password123") return false;
        const user = USERS.find((u) => u.email === email);
        if (!user) return false;
        set({ currentUser: user });
        return true;
    },
    logout: () => set({ currentUser: null }),

    // Data
    users: USERS,
    classes: CLASSES,
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
            // Remove old records for same student+schedule+date, then add new
            const keys = new Set(
                newRecords.map((r) => `${r.studentId}-${r.scheduleId}-${r.date}`)
            );
            const filtered = state.attendanceRecords.filter(
                (a) => !keys.has(`${a.studentId}-${a.scheduleId}-${a.date}`)
            );
            return { attendanceRecords: [...filtered, ...newRecords] };
        });

        // Simulate WA notification for non-hadir
        const nonHadir = newRecords.filter((r) => r.status !== "HADIR");
        if (nonHadir.length > 0) {
            const logs: WhatsAppLog[] = nonHadir.map((r) => ({
                id: `wa-${Date.now()}-${r.studentId}`,
                phone: "0813xxxxxxxx",
                message: `🏫 *Notifikasi Presensi*\n\nAnak Anda *${r.studentName}* tercatat *${r.status}* pada ${r.subjectName} (${r.className}) tanggal ${r.date}.`,
                status: "sent" as const,
                timestamp: new Date().toISOString(),
            }));
            set((state) => ({ waLogs: [...state.waLogs, ...logs] }));
        }
    },

    // Class Sessions (Journal)
    classSessions: [],
    saveClassSession: (session) => {
        set((state) => {
            // Remove old session for same schedule+date
            const filtered = state.classSessions.filter(
                (s) => !(s.scheduleId === session.scheduleId && s.date === session.date)
            );
            return {
                classSessions: [
                    ...filtered,
                    { ...session, id: `cs-${Date.now()}` },
                ],
            };
        });
    },
    getClassSession: (scheduleId, date) => {
        return get().classSessions.find(
            (s) => s.scheduleId === scheduleId && s.date === date
        );
    },

    // Leave Requests
    leaveRequests: [
        {
            id: "lr-1",
            studentId: "st1",
            studentName: "Ahmad Fauzi",
            studentNis: "2024001",
            parentId: "u4",
            parentName: "Hasan Fauzi",
            parentPhone: "081300000001",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            type: "SAKIT",
            reason: "Sakit demam dan batuk sejak semalam.",
            selfieUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=Ahmad",
            attachmentUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=Dokter",
            status: "PENDING",
            createdAt: new Date().toISOString(),
        },
        {
            id: "lr-2",
            studentId: "st3",
            studentName: "Rizky Pratama",
            studentNis: "2024003",
            parentId: "u10",
            parentName: "Bpk. Pratama",
            parentPhone: "081500000002",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            type: "IZIN",
            reason: "Menghadiri acara keluarga di luar kota.",
            selfieUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=Rizky",
            status: "PENDING",
            createdAt: new Date().toISOString(),
        }
    ],
    submitLeaveRequest: (req) => {
        const newReq: LeaveRequest = {
            ...req,
            id: `lr-${Date.now()}`,
            status: "PENDING",
            createdAt: new Date().toISOString(),
        };
        set((state) => ({ leaveRequests: [newReq, ...state.leaveRequests] }));

        // Simulate WA confirmation
        set((state) => ({
            waLogs: [
                ...state.waLogs,
                {
                    id: `wa-${Date.now()}`,
                    phone: req.parentPhone,
                    message: `✅ Pengajuan izin untuk *${req.studentName}* (${req.type}) pada ${req.startDate} s/d ${req.endDate} telah diterima. Menunggu persetujuan guru.`,
                    status: "sent" as const,
                    timestamp: new Date().toISOString(),
                },
            ],
        }));
    },
    reviewLeaveRequest: (id, status, reviewNotes) => {
        const state = get();
        const currentUser = state.currentUser;
        set((state) => ({
            leaveRequests: state.leaveRequests.map((lr) =>
                lr.id === id
                    ? {
                        ...lr,
                        status,
                        reviewNotes,
                        reviewedBy: currentUser?.name || "Guru",
                    }
                    : lr
            ),
        }));

        // Simulate WA notification and auto-attendance
        const lr = state.leaveRequests.find((l) => l.id === id);
        if (lr) {
            const statusText = status === "APPROVED" ? "Disetujui ✅" : "Ditolak ❌";
            set((state) => ({
                waLogs: [
                    ...state.waLogs,
                    {
                        id: `wa-${Date.now()}`,
                        phone: lr.parentPhone,
                        message: `Pengajuan izin untuk *${lr.studentName}* pada ${lr.startDate} s/d ${lr.endDate} telah *${statusText}*.`,
                        status: "sent" as const,
                        timestamp: new Date().toISOString(),
                    },
                ],
            }));

            // Auto insert attendance records if APPROVED
            if (status === "APPROVED") {
                const studentSchedules = state.schedules.filter(s =>
                    state.students.find(st => st.id === lr.studentId)?.classId === s.classId
                );

                if (studentSchedules.length > 0) {
                    const newRecords: typeof state.attendanceRecords = [];
                    // Simple mock for today only (or single date) for auto attendance loop
                    // In a real app we would iterate from startDate to endDate and check schedules
                    studentSchedules.forEach(sched => {
                        newRecords.push({
                            id: `ar-auto-${Date.now()}-${sched.id}`,
                            studentId: lr.studentId,
                            studentName: lr.studentName,
                            scheduleId: sched.id,
                            subjectName: sched.subjectName,
                            className: sched.className,
                            date: lr.startDate,
                            status: lr.type as any, // "IZIN" or "SAKIT" mapped to AttendanceStatus
                        });
                    });

                    set((state) => ({
                        attendanceRecords: [
                            ...state.attendanceRecords.filter(r => !(r.studentId === lr.studentId && r.date === lr.startDate)),
                            ...newRecords
                        ]
                    }));
                }
            }
        }
    },

    // WhatsApp
    waLogs: [],

    // Helpers
    getStudentsByClass: (classId) => STUDENTS.filter((s) => s.classId === classId),
    getSchedulesByTeacher: (teacherId) => SCHEDULES.filter((s) => s.teacherId === teacherId),
    getClassesByTeacher: (teacherId) => {
        const classIds = new Set(
            SCHEDULES.filter((s) => s.teacherId === teacherId).map((s) => s.classId)
        );
        return CLASSES.filter((c) => classIds.has(c.id));
    },
    getChildrenByParent: (parentId) => {
        const childIds = PARENT_CHILDREN[parentId] || [];
        return STUDENTS.filter((s) => childIds.includes(s.id));
    },
    getAttendanceByStudent: (studentId) =>
        get().attendanceRecords.filter((a) => a.studentId === studentId),
    getLeaveRequestsByParent: (parentId) => {
        const childIds = PARENT_CHILDREN[parentId] || [];
        return get().leaveRequests.filter((lr) => childIds.includes(lr.studentId));
    },
    getPendingLeaveRequests: () =>
        get().leaveRequests.filter((lr) => lr.status === "PENDING"),
}));
