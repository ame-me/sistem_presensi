import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-config';

export function useNotificationData(teacherCode?: string) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!teacherCode) return;
        setLoading(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/notifikasi/index.php?teacher=${teacherCode}`);
            const data = await res.json();
            if (data.status === 'success') {
                setNotifications(data.data);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const timer = setInterval(fetchNotifications, 30000); // 30s poll
        return () => clearInterval(timer);
    }, [teacherCode]);

    return { notifications, loading, refetch: fetchNotifications };
}
