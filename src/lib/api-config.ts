/**
 * Utility to get the API Base URL dynamically based on the current hostname.
 * This ensures the app works both on localhost and when accessed via local network IP.
 */
export function getApiBaseUrl(): string {
    // If we are in the browser, use the current hostname but default to Apache port 80
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        // Adjust the folder name 'presensipander' if your project folder in XAMPP htdocs is different
        return `http://${hostname}/presensipander/api`;
    }
    
    // Fallback for SSR
    return "http://127.0.0.1/presensipander/api";
}
