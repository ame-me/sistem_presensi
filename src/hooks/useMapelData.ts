import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/api-config";

export interface MapelAPI {
    id: number;
    code: string;
    name: string;
    grade: string;
    hours: number;
    cat: string;
    tahun_ajaran?: string;
    teachers?: string[];
}

const API_BASE_URL = getApiBaseUrl();

export function useMapelData() {
    const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
    const [mapel, setMapel] = useState<MapelAPI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMapel = async () => {
            try {
                setLoading(true);
                setError(null);
                const url = new URL(`${API_BASE_URL}/mapel/index.php`);
                if (selectedTahunAjaran) url.searchParams.append("tahun_ajaran", selectedTahunAjaran);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                const json = await response.json();
                if (json.status === "success") {
                    setMapel(json.data);
                } else {
                    throw new Error("API mengembalikan status gagal");
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Gagal mengambil data mapel dari server");
            } finally {
                setLoading(false);
            }
        };

        fetchMapel();
    }, [selectedTahunAjaran]);

    const refetch = () => {
        setLoading(true);
        setError(null);
        const url = new URL(`${API_BASE_URL}/mapel/index.php`);
        if (selectedTahunAjaran) url.searchParams.append("tahun_ajaran", selectedTahunAjaran);
        fetch(url)
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") setMapel(json.data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    return { mapel, loading, error, refetch };
}
