import { useState, useEffect, useCallback } from "react";

export interface GuruAPI {
    id: number;
    teacherCode: string;
    name: string;
    email: string;
    phone: string;
    mapel: string;
    homebase: string;
    wali_kelas: string;
    role: string;
    isBK: boolean;
    status: string;
}

const API_BASE_URL = "http://127.0.0.1/presensipander/api";

export function useGuruData() {
    const [guru, setGuru] = useState<GuruAPI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGuru = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/guru/index.php`);
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}. Pastikan XAMPP Apache menyala.`);
            }
            const json = await response.json();
            if (json.status === "success") {
                setGuru(json.data);
            } else {
                throw new Error(json.message || "API mengembalikan status gagal");
            }
        } catch (err: any) {
            setError(err.message || "Gagal mengambil data guru. Pastikan server Apache (XAMPP) menyala.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGuru();
    }, [fetchGuru]);

    return { guru, loading, error, refetch: fetchGuru };
}
