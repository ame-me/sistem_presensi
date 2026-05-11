import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api-config";

export interface MapelAPI {
    id: number;
    code: string;
    name: string;
    grade: string;
    hours: number;
    cat: string;
    teachers?: string[];
}

const API_BASE_URL = getApiBaseUrl();

export function useMapelData() {
    const [mapel, setMapel] = useState<MapelAPI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMapel = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_BASE_URL}/mapel/index.php`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                const json = await response.json();
                if (json.status === "success") {
                    setMapel(json.data);
                } else {
                    throw new Error("API mengembalikan status gagal");
                }
            } catch (err: any) {
                setError(err.message || "Gagal mengambil data mapel dari server");
            } finally {
                setLoading(false);
            }
        };

        fetchMapel();
    }, []);

    const refetch = () => {
        setLoading(true);
        setError(null);
        fetch(`${API_BASE_URL}/mapel/index.php`)
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") setMapel(json.data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    return { mapel, loading, error, refetch };
}
