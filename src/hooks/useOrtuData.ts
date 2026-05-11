import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api-config';

export interface OrtuAPI {
    id: number;
    nik: string;
    name: string;
    email: string;
    phone: string;
    namaAyah?: string;
    pekerjaanAyah?: string;
    namaIbu?: string;
    pekerjaanIbu?: string;
    status: string;
}

export function useOrtuData() {
    const [ortu, setOrtu] = useState<OrtuAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrtu = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const url = `${getApiBaseUrl()}/ortu/index.php`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.status === 'success') {
                setOrtu(data.data);
            } else {
                throw new Error(data.message || 'Gagal mengambil data orang tua');
            }
        } catch (err: any) {
            console.error('Failed to fetch ortu', err);
            setError(err.message || 'Gagal mengambil data orang tua.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrtu();
    }, [fetchOrtu]);

    return { ortu, loading, error, refetch: fetchOrtu };
}
