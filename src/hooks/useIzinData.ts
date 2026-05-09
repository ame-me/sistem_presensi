import { useState, useEffect, useCallback } from 'react';
 
export function useIzinData(date?: string, status?: string) {
    const [izin, setIzin] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
 
    const fetchIzin = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (date) params.append('date', date);
            if (status) params.append('status', status);
            
            const url = `http://127.0.0.1/presensipander/api/izin/index.php?${params.toString()}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.status === 'success') {
                setIzin(data.data);
            } else {
                throw new Error(data.message || 'Gagal mengambil data izin');
            }
        } catch (err: any) {
            console.error('Failed to fetch izin', err);
            setError(err.message || 'Gagal mengambil data izin. Pastikan server Apache (XAMPP) menyala.');
        } finally {
            setLoading(false);
        }
    }, [date, status]);
 
    useEffect(() => {
        fetchIzin();
    }, [fetchIzin]);
 
    return { izin, loading, error, refetch: fetchIzin };
}
 
export async function submitIzinAPI(data: any) {
    try {
        const res = await fetch('http://127.0.0.1/presensipander/api/izin/index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (err) {
        console.error('Failed to submit izin', err);
        return { status: 'error', message: 'Gagal menghubungi server. Pastikan Apache menyala.' };
    }
}
 
export async function reviewIzinAPI(id: number, status: string, notes: string, reviewedBy: string) {
    try {
        const res = await fetch('http://127.0.0.1/presensipander/api/izin/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, notes, reviewedBy })
        });
        return await res.json();
    } catch (err) {
        console.error('Failed to review izin', err);
        return { status: 'error', message: 'Gagal menghubungi server. Pastikan Apache menyala.' };
    }
}
