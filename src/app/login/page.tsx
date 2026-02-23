"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
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

        // Slight delay for UX
        await new Promise((r) => setTimeout(r, 500));

        const success = login(email, password);

        if (!success) {
            setError("Email atau password salah");
            setLoading(false);
            return;
        }

        // Get user to redirect
        const user = useAppStore.getState().currentUser;
        if (user) {
            switch (user.role) {
                case "ADMIN":
                    router.push("/admin/dashboard");
                    break;
                case "GURU":
                    router.push("/guru/dashboard");
                    break;
                case "ORTU":
                    router.push("/ortu/dashboard");
                    break;
            }
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl" />

            <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl shadow-blue-900/5 relative z-10 transition-all duration-300">
                <CardHeader className="text-center space-y-4 pb-4">
                    <div className="mx-auto w-16 h-16 bg-[#000080] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <GraduationCap className="w-8 h-8 text-white" />
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
                                Email Sekolah
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@sekolah.id"
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
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Admin", email: "admin@sekolah.id" },
                                { label: "Guru", email: "budi@sekolah.id" },
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
