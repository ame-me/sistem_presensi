/**
 * Hook untuk mengambil data Ruangan dari API Backend PHP
 */
import { useState, useEffect } from "react";

export interface RuanganAPI {
    id: number;
    code: string;
    name: string;
    location: string;
    pic: string;
}

const API_BASE_URL = "http://127.0.0.1/presensipander/api";

export function useRuanganData() {
    const [ruangan, setRuangan] = useState<RuanganAPI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRuangan = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_BASE_URL}/ruangan/index.php`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                const json = await response.json();
                if (json.status === "success") {
                    setRuangan(json.data);
                } else {
                    throw new Error("API mengembalikan status gagal");
                }
            } catch (err: any) {
                setError(err.message || "Gagal mengambil data ruangan dari server");
            } finally {
                setLoading(false);
            }
        };

        fetchRuangan();
    }, []);

    const refetch = () => {
        setLoading(true);
        setError(null);
        fetch(`${API_BASE_URL}/ruangan/index.php`)
            .then(res => res.json())
            .then(json => {
                if (json.status === "success") setRuangan(json.data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    return { ruangan, loading, error, refetch };
}
