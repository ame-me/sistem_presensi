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
}

export function useSiswaData(className?: string, parentId?: string, parentNik?: string) {
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
            if (selectedTahunAjaran) params.append('tahun_ajaran', selectedTahunAjaran);
            
            const url = `${getApiBaseUrl()}/siswa/index.php?${params.toString()}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.status === 'success') {
                setSiswa(data.data);
            } else {
                throw new Error(data.message || 'Gagal mengambil data siswa');
            }
        } catch (err: any) {
            console.error('Failed to fetch siswa', err);
            setError(err.message || 'Gagal mengambil data siswa. Pastikan server Apache (XAMPP) menyala.');
        } finally {
            setLoading(false);
        }
    }, [className, parentId, parentNik, selectedTahunAjaran]);

    useEffect(() => {
        fetchSiswa();
    }, [fetchSiswa]);

    return { siswa, loading, error, refetch: fetchSiswa };
}
