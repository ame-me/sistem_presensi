import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
 
export function useAttendanceData(date?: string, teacherCode?: string, className?: string, startDate?: string, endDate?: string, studentId?: string, scheduleId?: string) {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
 
    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (date) params.append('date', date);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (teacherCode) params.append('teacher', teacherCode);
            if (className) params.append('class', className);
            if (studentId) params.append('student_id', studentId);
            if (scheduleId) params.append('schedule_id', scheduleId);
            if (selectedTahunAjaran) params.append('tahun_ajaran', selectedTahunAjaran);
            
            const url = `http://127.0.0.1/presensipander/api/presensi/index.php?${params.toString()}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.status === 'success') {
                setAttendance(data.data);
            } else {
                throw new Error(data.message || 'Gagal mengambil data presensi');
            }
        } catch (err: any) {
            console.error('Failed to fetch attendance', err);
            setError(err.message || 'Gagal mengambil data presensi. Pastikan server Apache (XAMPP) menyala.');
        } finally {
            setLoading(false);
        }
    }, [date, teacherCode, className, startDate, endDate, studentId, scheduleId, selectedTahunAjaran]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    return { attendance, loading, error, refetch: fetchAttendance };
}
 
export async function saveAttendanceAPI(records: any[]) {
    try {
        const res = await fetch('http://127.0.0.1/presensipander/api/presensi/index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records)
        });
        return await res.json();
    } catch (err) {
        console.error('Failed to save attendance', err);
        return { status: 'error', message: 'Gagal menghubungi server. Pastikan Apache menyala.' };
    }
}
