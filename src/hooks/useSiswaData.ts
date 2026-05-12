import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { getApiBaseUrl } from '@/lib/api-config';
 
export interface SiswaAPI {
    id: number;
    nisn: string;
    noInduk: string;
    name: string;
    gender: string;
    cls: string;
    status: string;
    parent: string;
    wa: string;
    tglLahir?: string;
    kota?: string;
    alamat?: string;
    namaAyah?: string;
    pekerjaanAyah?: string;
    namaIbu?: string;
    pekerjaanIbu?: string;
    academic_status?: "AKTIF" | "PERLU_PENEMPATAN" | "LULUS" | "NONAKTIF";
    previous_cls?: string | null;
    min_grade_level?: number | null;
    tahun_ajaran?: string;
}

export function useSiswaData(className?: string, parentId?: string, parentNik?: string, includeInactive = false, tahunAjaranOverride?: string, activeOnly = false) {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const [siswa, setSiswa] = useState<SiswaAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSiswa = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (className) params.append('class', className);
            if (parentId) params.append('parent_id', parentId);
            if (parentNik) params.append('parent_nik', parentNik);
            const targetTahun = tahunAjaranOverride || selectedTahunAjaran;
            if (targetTahun) params.append('tahun_ajaran', targetTahun);
            if (includeInactive) params.append('include_inactive', '1');
            if (activeOnly) params.append('active_only', '1');
            
            const url = `${getApiBaseUrl()}/siswa/index.php?${params.toString()}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.status === 'success') {
                setSiswa(data.data);
            } else {
                throw new Error(data.message || 'Gagal mengambil data siswa');
            }
        } catch (err: unknown) {
            console.error('Failed to fetch siswa', err);
            setError(err instanceof Error ? err.message : 'Gagal mengambil data siswa. Pastikan server Apache (XAMPP) menyala.');
        } finally {
            setLoading(false);
        }
    }, [className, parentId, parentNik, selectedTahunAjaran, includeInactive, tahunAjaranOverride, activeOnly]);

    useEffect(() => {
        fetchSiswa();
    }, [fetchSiswa]);

    return { siswa, loading, error, refetch: fetchSiswa };
}
