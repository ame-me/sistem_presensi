/**
 * Utility to get the API Base URL dynamically based on the current hostname.
 * This ensures the app works both on localhost and when accessed via local network IP.
 */
export function getApiBaseUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (configuredUrl) {
        return configuredUrl.replace(/\/$/, "");
    }

    // If we are in the browser, use the current hostname but default to Apache port 80
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        // Adjust the folder name 'presensipander' if your project folder in XAMPP htdocs is different
        return `http://${hostname}/presensipander/api`;
    }
    
    // Fallback for SSR
    return "http://127.0.0.1/presensipander/api";
}

export function getUploadBaseUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL;
    if (configuredUrl) {
        return configuredUrl.replace(/\/$/, "");
    }

    const apiBaseUrl = getApiBaseUrl();
    return apiBaseUrl.endsWith("/api")
        ? apiBaseUrl.slice(0, -4) + "/uploads"
        : `${apiBaseUrl}/../uploads`;
}

export function getUploadUrl(path?: string | null): string {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${getUploadBaseUrl()}/${path.replace(/^\/+/, "")}`;
}
