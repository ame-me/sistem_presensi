import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { getApiBaseUrl } from '@/lib/api-config';

export interface JadwalItem {
    id: number;
    day: string;
    slot: string;
    time_range: string;
    class_name: string;
    teacher_code: string;
    teacher_name: string | null;
    teacher_mapel: string | null;
    subject_hint: string | null;
    subject_code: string | null;
    room_code: string | null;
}

export function useJadwalData(dayName?: string, className?: string, teacherCode?: string) {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJadwal = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (dayName) params.append('day', dayName);
            if (className) params.append('class', className);
            if (teacherCode) params.append('teacher', teacherCode);
            if (selectedTahunAjaran) params.append('tahun_ajaran', selectedTahunAjaran);
            
            const url = `${getApiBaseUrl()}/jadwal/index.php?${params.toString()}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.status === 'success') {
                setJadwal(data.data);
            } else {
                throw new Error(data.message || 'Gagal mengambil data jadwal');
            }
        } catch (err: any) {
            console.error('Failed to fetch jadwal', err);
            setError(err.message || 'Gagal mengambil data jadwal. Pastikan server Apache (XAMPP) menyala.');
        } finally {
            setLoading(false);
        }
    }, [dayName, className, teacherCode, selectedTahunAjaran]);

    useEffect(() => {
        fetchJadwal();
    }, [fetchJadwal]);

    return { jadwal, loading, error, refetch: fetchJadwal };
}
