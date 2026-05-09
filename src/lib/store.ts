import { create } from "zustand";

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
    waliKelasRombelId?: string; // Menjadi wali kelas di Rombel apa
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
    { id: "u34", teacherCode: "2", name: "Antonetta Maria Kuntodiati, S.Pd.", email: "guru2@sekolah.id", role: "GURU", phone: "-" },
    { id: "u35", teacherCode: "3", name: "Dra. Maria Marsiti", email: "guru3@sekolah.id", role: "GURU", phone: "089768282828" },
    { id: "u36", teacherCode: "4", name: "Trianto Thomas, S.Pd.", email: "guru4@sekolah.id", role: "GURU", phone: "-" },
    { id: "u37", teacherCode: "5", name: "Agustina Peni Sarasati, S.Pd.", email: "guru5@sekolah.id", role: "GURU", phone: "-" },
    { id: "u38", teacherCode: "6", name: "Y. Pamungkas, S.Pd.", email: "guru6@sekolah.id", role: "GURU", phone: "-" },
    { id: "u39", teacherCode: "7", name: "Joseph Andiek Kristian, S.Pd.,S.Kom.", email: "guru7@sekolah.id", role: "GURU", phone: "-" },
    { id: "u40", teacherCode: "8", name: "Albertha Yulanti Susetyo, M.Pd.", email: "guru8@sekolah.id", role: "GURU", phone: "-" },
    { id: "u41", teacherCode: "9", name: "Galang Bagus Afridianto, M.Pd.", email: "guru9@sekolah.id", role: "GURU", phone: "-" },
    { id: "u42", teacherCode: "10", name: "Hendrik Kiswanto, S.Pd.", email: "guru10@sekolah.id", role: "GURU", phone: "-" },
    { id: "u43", teacherCode: "11", name: "Margareta Esti Wulan, S.Pd.", email: "guru11@sekolah.id", role: "GURU", phone: "-" },
    { id: "u44", teacherCode: "12", name: "Theresia Sri Wahyuni, S.Pd., M.M.", email: "guru12@sekolah.id", role: "GURU", phone: "-" },
    { id: "u45", teacherCode: "14", name: "Yosua Beni Setiawan, S.Pd.", email: "guru14@sekolah.id", role: "GURU", phone: "-" },
    { id: "u46", teacherCode: "15", name: "God Life Endob Mesak, S.Pd.", email: "guru15@sekolah.id", role: "GURU", phone: "-" },
    { id: "u47", teacherCode: "16", name: "Agnes Herawaty, S.E.MM", email: "guru16@sekolah.id", role: "GURU", phone: "-" },
    { id: "u48", teacherCode: "17", name: "Deka Nanda Kurniawati, S.Pd.", email: "guru17@sekolah.id", role: "GURU", phone: "-" },
    { id: "u49", teacherCode: "18", name: "Agatha Novenia Bintang Prieska, S.Pd.", email: "guru18@sekolah.id", role: "GURU", phone: "-" },
    { id: "u50", teacherCode: "19", name: "Bernadetha Devia Tindy Noveyra, S.Pd.", email: "guru19@sekolah.id", role: "GURU", phone: "-" },
    { id: "u51", teacherCode: "20", name: "Drs. Albertus Magnus Meo Depa", email: "guru20@sekolah.id", role: "GURU", phone: "-" },
    { id: "u52", teacherCode: "21", name: "Giovani Bimby Dwiantonio, S.Pd.", email: "guru21@sekolah.id", role: "GURU", phone: "-" },
    { id: "u53", teacherCode: "22", name: "Arnoldus Kobe Tegar Felix Sai, S.Pd.", email: "guru22@sekolah.id", role: "GURU", phone: "-" },
    { id: "u54", teacherCode: "23", name: "Haniar Mey Sila Kinanti, S.Pd.", email: "guru23@sekolah.id", role: "GURU", phone: "-" },
    { id: "u55", teacherCode: "24", name: "Anjelina Wulandari Sitina De Sareng, S.Pd.", email: "guru24@sekolah.id", role: "GURU", phone: "-" },
    { id: "u56", teacherCode: "25", name: "Lydia Uli Permatasari, S.Pd.", email: "guru25@sekolah.id", role: "GURU", phone: "-" },
    { id: "u57", teacherCode: "26", name: "Albertus Bayu Seta, S.Pd.", email: "guru26@sekolah.id", role: "GURU", phone: "-" },
    { id: "u58", teacherCode: "27", name: "Brigita Natalia Setyaningrum, S.Pd.", email: "guru27@sekolah.id", role: "GURU", phone: "-" },
    { id: "u59", teacherCode: "28", name: "Amelia Rangel Da Silva", email: "guru28@sekolah.id", role: "GURU", phone: "-" },
    { id: "u61", teacherCode: "TU-01", name: "Admin Tata Usaha", email: "admin.tu@sekolah.id", role: "ADMIN_TU", phone: "-" },
    { id: "u32", name: "Hasan Fauzi", nik: "1234567890", email: "hasan@gmail.com", role: "ORTU", phone: "081300000001" },
];

const ROOMS: Room[] = [];

const ROMBELS: Rombel[] = [];

const SUBJECTS: Subject[] = [];

const STUDENTS: Student[] = [];

const SCHEDULES: Schedule[] = [];

// Parent-Student mapping: u32 -> st1, u33 -> st2
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

export const useAppStore = create<AppState>((set, get) => ({
    // Auth
    currentUser: null,
    selectedTahunAjaran: typeof window !== "undefined" ? localStorage.getItem("selectedTahunAjaran") : null,
    setSelectedTahunAjaran: (tahun) => {
        set({ selectedTahunAjaran: tahun });
        if (typeof window !== "undefined") {
            localStorage.setItem("selectedTahunAjaran", tahun);
        }
    },
    selectedChildId: typeof window !== "undefined" ? localStorage.getItem("selectedChildId") : null,
    setSelectedChildId: (id) => {
        set({ selectedChildId: id });
        if (typeof window !== "undefined") {
            if (id) localStorage.setItem("selectedChildId", id);
            else localStorage.removeItem("selectedChildId");
        }
    },
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
            // Remove old records for same student+schedule+date, then add new
            const keys = new Set(
                newRecords.map((r) => `${r.studentId}-${r.scheduleId}-${r.date}`)
            );
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




        const lr = state.leaveRequests.find((l) => l.id === id);
        if (lr) {
            // Auto insert attendance records if APPROVED
            if (status === "APPROVED") {
                const studentSchedules = state.schedules.filter(s =>
                    state.students.find(st => st.id === lr.studentId)?.rombelId === s.rombelId
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



    // Helpers
    getStudentsByRombel: (rombelId) => STUDENTS.filter((s) => s.rombelId === rombelId),
    getSchedulesByTeacher: (teacherId) => SCHEDULES.filter((s) => s.teacherId === teacherId),
    getRombelsByTeacher: (teacherId) => {
        const classIds = new Set(
            SCHEDULES.filter((s) => s.teacherId === teacherId).map((s) => s.rombelId)
        );
        return ROMBELS.filter((c) => classIds.has(c.id));
    },
    getChildrenByParent: (parentId) => {
        const childIds = PARENT_CHILDREN[parentId] || [];
        return STUDENTS.filter((s) => childIds.includes(s.id));
    },
    getAttendanceByStudent: (studentId) =>
        get().attendanceRecords.filter((a) => a.studentId === studentId),
    getLeaveRequestsByParent: (parentId) => {
        const studentIds = get().getChildrenByParent(parentId).map((s) => s.id);
        return get().leaveRequests.filter((lr) => studentIds.includes(lr.studentId));
    },
    getPendingLeaveRequests: () =>
        get().leaveRequests.filter((lr) => lr.status === "PENDING"),

    checkScheduleConflict: (newSchedule) => {
        const { teacherId, rombelId, roomId, dayOfWeek, startTime, endTime } = newSchedule;
        if (!dayOfWeek || !startTime || !endTime) return { conflict: false };

        const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
            // Sederhananya dengan membandingkan jam/menit (format HH:mm)
            return (start1 < end2 && end1 > start2);
        };

        const existingSchedules = get().schedules.filter(s => s.dayOfWeek === dayOfWeek && s.id !== newSchedule.id);

        for (const s of existingSchedules) {
            if (isTimeOverlap(startTime, endTime, s.startTime, s.endTime)) {

                // 1. Cek Konflik Guru (Guru yang sama tidak boleh mengajar dua rombel bersamaan)
                if (teacherId && s.teacherId === teacherId) {
                    const guru = get().users.find(u => u.id === teacherId);
                    return { conflict: true, reason: `Tabrakan Jadwal Guru: ${guru?.name} sudah memiliki jadwal mengajar di Rombel ${s.className} pada jam tersebut.` };
                }

                // 2. Cek Konflik Rombel (Satu rombel tidak boleh memiliki 2 mapel bersamaan)
                if (rombelId && s.rombelId === rombelId) {
                    return { conflict: true, reason: `Tabrakan Jadwal Kelas: Rombel ${s.className} sedah memiliki pelajaraan ${s.subjectName} pada jam tersebut.` };
                }

                // 3. Cek Konflik Ruangan (Moving class)
                if (roomId && s.roomId && s.roomId === roomId) {
                    const ruang = get().rooms.find(r => r.id === roomId);
                    return { conflict: true, reason: `Tabrakan Ruangan: Ruangan ${ruang?.name} sedang digunakan oleh Rombel ${s.className} untuk mapel ${s.subjectName}.` };
                }
            }
        }
        return { conflict: false };
    }
}));

