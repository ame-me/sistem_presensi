"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getApiBaseUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const login = useAppStore((s) => s.login);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Try Guru Login first
        try {
            const res = await fetch(`${getApiBaseUrl()}/guru/login.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            });
            const data = await res.json();
            
            if (data.status === "success" && data.data) {
                const guruUser: any = {
                    id: String(data.data.id),
                    name: data.data.name,
                    email: data.data.email,
                    teacherCode: data.data.teacherCode,
                    role: data.data.role.toUpperCase().replace(' ', '_'),
                    phone: data.data.phone,
                    waliKelasRombelName: data.data.wali_kelas,
                    isBK: Boolean(data.data.isBK)
                };
                useAppStore.setState({ currentUser: guruUser });
                router.push("/select-year");
                setLoading(false);
                return;
            }
        } catch (err) { 
            console.error("Guru login error", err);
        }

        // If not Guru, try Ortu Login
        try {
            const res = await fetch(`${getApiBaseUrl()}/ortu/index.php?action=login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nik: email, password: password })
            });
            const data = await res.json();
            
            if (data.status === "success" && data.data) {
                const ortuUser: any = {
                    id: data.data.id,
                    name: data.data.name,
                    email: data.data.email,
                    nik: data.data.nik,
                    role: "ORTU",
                    phone: data.data.phone
                };
                useAppStore.setState({ currentUser: ortuUser });
                router.push("/select-year");
                setLoading(false);
                return;
            }
        } catch (err) { 
            console.error("Ortu login error", err);
        }

        setError("Email / NIK atau password salah");
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl" />

            <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl shadow-blue-900/5 relative z-10 transition-all duration-300">
                <CardHeader className="text-center space-y-4 pb-4">
                    <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10 border border-slate-50 p-1.5">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-extrabold text-[#000080] tracking-tight">
                            Sistem Presensi
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                            Selamat datang, silakan masuk ke akun Anda
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 text-sm font-semibold ml-1">
                                Email Sekolah / NIK Ortu
                            </Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="name@sekolah.id atau 16 Digit NIK"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#000080] focus:ring-[#000080]/10 h-12 rounded-xl transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 text-sm font-semibold ml-1">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#000080] focus:ring-[#000080]/10 h-12 rounded-xl pr-11 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#000080] hover:bg-[#000060] text-white font-bold rounded-xl shadow-lg shadow-blue-900/10 transition-all duration-300 transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-4 mr-2 animate-spin" />
                                    Sedang Masuk...
                                </>
                            ) : (
                                "Masuk ke Sistem"
                            )}
                        </Button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center font-medium mb-4 uppercase tracking-wider">
                            Akun Demo (Akses Cepat)
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                                { label: "Kepala Sekolah", email: "guru1@sekolah.id" },
                                { label: "Admin TU", email: "admin.tu@sekolah.id" },
                                { label: "Admin IT", email: "guru13@sekolah.id" },
                                { label: "Guru", email: "guru2@sekolah.id" },
                                { label: "Ortu", email: "hasan@gmail.com" },
                            ].map((cred) => (
                                <button
                                    key={cred.email}
                                    type="button"
                                    onClick={() => {
                                        setEmail(cred.email);
                                        setPassword("password123");
                                    }}
                                    className="text-[11px] px-2 py-2.5 rounded-lg bg-slate-50 text-slate-600 font-semibold border border-slate-200 hover:border-[#000080] hover:text-[#000080] hover:bg-white transition-all shadow-sm"
                                >
                                    {cred.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
