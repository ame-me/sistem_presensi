import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/api-config';
 
export function useJurnalData(date?: string, teacherCode?: string, scheduleId?: string) {
    const [jurnal, setJurnal] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        const fetchJurnal = async () => {
            setLoading(true);
            let url = `${getApiBaseUrl()}/jurnal/index.php?`;
            if (date) url += `date=${date}&`;
            if (teacherCode) url += `teacher=${teacherCode}&`;
            if (scheduleId) url += `schedule_id=${scheduleId}&`;
            
            try {
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === 'success') {
                    setJurnal(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch jurnal', err);
            } finally {
                setLoading(false);
            }
        };
 
        fetchJurnal();
    }, [date, teacherCode, scheduleId]);
 
    return { jurnal, loading };
}
 
export async function saveJurnalAPI(data: any) {
    try {
        const res = await fetch(`${getApiBaseUrl()}/jurnal/index.php`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (err) {
        console.error('Failed to save jurnal', err);
        return { status: 'error' };
    }
}
