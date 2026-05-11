import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/api-config";

export interface KelasAPI {
    id: number;
    grade: string;
    name: string;
    teacher: string;
    count: number;
    status: string;
}

const API_BASE_URL = getApiBaseUrl();

export function useKelasData() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const [kelas, setKelas] = useState<KelasAPI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchKelas = async () => {
            try {
                setLoading(true);
                setError(null);
                const url = new URL(`${API_BASE_URL}/kelas/index.php`);
                if (selectedTahunAjaran) url.searchParams.append("tahun_ajaran", selectedTahunAjaran);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                const json = await response.json();
                if (json.status === "success") {
                    setKelas(json.data);
                } else {
                    throw new Error("API mengembalikan status gagal");
                }
            } catch (err: any) {
                setError(err.message || "Gagal mengambil data kelas dari server");
            } finally {
                setLoading(false);
            }
        };

        fetchKelas();
    }, [selectedTahunAjaran]);

    const refetch = () => {
        setLoading(true);
        setError(null);
        const url = new URL(`${API_BASE_URL}/kelas/index.php`);
        if (selectedTahunAjaran) url.searchParams.append("tahun_ajaran", selectedTahunAjaran);
        fetch(url)
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") setKelas(json.data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    return { kelas, loading, error, refetch };
}
