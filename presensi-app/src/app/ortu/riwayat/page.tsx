"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrtuRiwayatPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const getChildrenByParent = useAppStore((s) => s.getChildrenByParent);
    const getAttendanceByStudent = useAppStore((s) => s.getAttendanceByStudent);

    if (!currentUser) return null;

    const children = getChildrenByParent(currentUser.id);

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            HADIR: { label: "Hadir", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
            IZIN: { label: "Izin", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
            SAKIT: { label: "Sakit", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
            ALPHA: { label: "Alpha", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
            TERLAMBAT: { label: "Terlambat", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
        };
        const s = map[status] || { label: status, cls: "bg-slate-500/20 text-slate-400" };
        return <Badge className={s.cls}>{s.label}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href="/ortu/dashboard"
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Riwayat Presensi</h1>
                    <p className="text-slate-400 mt-0.5">Histori kehadiran anak Anda</p>
                </div>
            </div>

            {children.map((child) => {
                const records = getAttendanceByStudent(child.id);
                return (
                    <Card key={child.id} className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white text-base">
                                {child.name} (NIS: {child.nis})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {records.length > 0 ? (
                                <div className="space-y-2">
                                    {records.map((att) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-white">{att.subjectName}</p>
                                                <p className="text-xs text-slate-500">
                                                    {att.className} •{" "}
                                                    {new Date(att.date).toLocaleDateString("id-ID", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            {statusBadge(att.status)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    Belum ada data presensi. Guru belum menginput presensi.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
