"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SelectYearPage() {
    const [years, setYears] = useState<any[]>([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const currentUser = useAppStore((s) => s.currentUser);
    const setStoreYear = useAppStore((s) => s.setSelectedTahunAjaran);

    useEffect(() => {
        if (!currentUser) {
            router.push("/login");
            return;
        }

        fetch("http://127.0.0.1/presensipander/api/config/tahun_ajaran.php")
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    setYears(data.data);
                    if (data.data.length > 0) {
                        setSelectedYear(data.data[0].name);
                    }
                }
            })
            .catch(err => toast.error("Gagal mengambil data tahun ajaran"))
            .finally(() => setLoading(false));
    }, [currentUser, router]);

    const handleContinue = () => {
        if (!selectedYear) return toast.error("Pilih tahun ajaran terlebih dahulu");
        
        setIsSaving(true);
        setStoreYear(selectedYear);
        
        // Save to localStorage so it persists
        localStorage.setItem("selectedTahunAjaran", selectedYear);

        // Slight delay for premium feel
        setTimeout(() => {
            if (currentUser) {
                switch (currentUser.role) {
                    case "ADMIN":
                    case "ADMIN_TU":
                        router.push("/admin/dashboard");
                        break;
                    case "ADMIN_IT":
                        router.push("/it/dashboard");
                        break;
                    case "GURU":
                        router.push("/guru/dashboard");
                        break;
                    case "ORTU":
                        router.push("/ortu/dashboard");
                        break;
                }
            }
        }, 800);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl" />

            <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl relative z-10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-[#000080] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-extrabold text-[#000080] tracking-tight">
                            Pilih Tahun Ajaran
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                            Halo, {currentUser?.name}. Silakan pilih tahun ajaran aktif untuk memulai.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 focus:ring-[#000080]/10 focus:border-[#000080]">
                                <SelectValue placeholder="Pilih Tahun Ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y.id} value={y.name}>
                                        {y.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleContinue}
                        disabled={isSaving}
                        className="w-full h-12 bg-[#000080] hover:bg-[#000060] text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Lanjutkan ke Dashboard
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
