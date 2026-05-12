import { getApiBaseUrl } from "@/lib/api-config";
import { mergeAccessMatrix, type AccessMatrix } from "@/lib/access-control";

export async function fetchAccessMatrixFromServer(): Promise<AccessMatrix> {
    const response = await fetch(`${getApiBaseUrl()}/access/index.php`, {
        method: "GET",
        cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Gagal memuat matriks akses");
    }

    return mergeAccessMatrix(data.data);
}

export async function saveAccessMatrixToServer(accessMatrix: AccessMatrix): Promise<AccessMatrix> {
    const normalizedMatrix = mergeAccessMatrix(accessMatrix);
    const response = await fetch(`${getApiBaseUrl()}/access/index.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessMatrix: normalizedMatrix }),
    });

    const data = await response.json();
    if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Gagal menyimpan matriks akses");
    }

    return mergeAccessMatrix(data.data);
}
