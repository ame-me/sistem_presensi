"use client";

import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Printer, Calendar, Clock, BookOpen, User } from "lucide-react";
import Link from "next/link";
import { useSiswaData } from "@/hooks/useSiswaData";
import { useJadwalData } from "@/hooks/useJadwalData";
import { useGuruData } from "@/hooks/useGuruData";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function OrtuJadwalPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const { siswa: children, loading: loadingSiswa } = useSiswaData(undefined, undefined, currentUser?.nik);
    
    const globalSelectedId = useAppStore((s) => s.selectedChildId);
    const setGlobalSelectedId = useAppStore((s) => s.setSelectedChildId);
    
    const activeChild = children.find(c => c.id.toString() === globalSelectedId) || children[0];
    const { jadwal, loading: loadingJadwal } = useJadwalData(undefined, activeChild?.cls);
    const { guru: guruList } = useGuruData();

    if (!currentUser) return null;

    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    const handlePrint = () => {
        window.print();
    };

    const isLoading = loadingSiswa || loadingJadwal;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        margin: 1.5cm !important;
                    }
                    .print-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        border: 1.5px solid black !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid black !important;
                        color: black !important;
                        padding: 8px 12px !important;
                        background: transparent !important;
                    }
                    .print-table th {
                        background-color: #f1f5f9 !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                        font-size: 10px !important;
                    }
                    .print-table td {
                        font-size: 11px !important;
                    }
                }
            ` }} />

            <div className="space-y-6 pb-12 font-sans print:p-0">
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/ortu/dashboard"
                            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#000080] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold text-[#000080]">Jadwal Pelajaran</h1>
                            <p className="text-slate-500 font-medium mt-0.5">Jadwal mingguan kelas anak Anda</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handlePrint}
                        className="bg-[#000080] hover:bg-[#000060] text-white font-bold flex items-center gap-2 rounded-xl px-6 py-6 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        <Printer className="w-5 h-5" />
                        Cetak Jadwal
                    </Button>
                </div>

                {/* Print Header (Kop Surat) */}
                <div className="hidden print:block mb-8 text-black">
                    <div className="flex items-center gap-6 border-b-4 border-double border-black pb-6 mb-8">
                        <div className="w-28 h-28 bg-white flex items-center justify-center shrink-0">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-center">
                            <h2 className="text-base font-bold uppercase tracking-widest text-slate-800">PERKUMPULAN DHARMAPUTRI</h2>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-[#000080]">SMP KATOLIK SANTA MARIA 2</h1>
                            <p className="text-sm font-bold mt-1">TERAKREDITASI "A"</p>
                            <p className="text-[11px] font-medium mt-1">NPSN: 20533743, NSS: 2030560101019</p>
                            <p className="text-[11px] font-medium mt-0.5">Jl. Panderman No.7A, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115</p>
                            <p className="text-[11px] font-medium italic mt-0.5 whitespace-nowrap">Telepon: (0341) 551871 | Email: smpksantamaria2mlg@gmail.com</p>
                        </div>
                    </div>
                    
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-black uppercase tracking-widest border-b border-slate-800 w-fit mx-auto pb-1 mb-4">JADWAL PELAJARAN SISWA</h3>
                        <div className="flex justify-between items-start text-left px-2">
                            <div className="space-y-1">
                                <div className="flex gap-2">
                                    <span className="w-24 text-sm font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</span>
                                    <span className="text-sm font-bold text-slate-900">: {activeChild?.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="w-24 text-sm font-bold text-slate-500 uppercase tracking-wider">Kelas</span>
                                    <span className="text-sm font-bold text-slate-900">: {activeChild?.cls}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun Ajaran</p>
                                <p className="text-sm font-black text-[#000080]">{useAppStore.getState().selectedTahunAjaran}</p>
                                <p className="text-[9px] text-slate-400 mt-1 italic">Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="font-medium">Memuat Jadwal...</p>
                    </div>
                )}

                {!isLoading && children.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        Tidak ada data anak yang terhubung dengan akun Anda.
                    </div>
                )}

                {/* Child Selector (Only if > 1 child) */}
                {!isLoading && children.length > 1 && (
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit print:hidden">
                            {children.map((child) => (
                                <button
                                    key={child.id}
                                    onClick={() => setGlobalSelectedId(child.id.toString())}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                        activeChild?.id === child.id
                                            ? "bg-[#000080] text-white shadow-lg"
                                            : "text-slate-500 hover:bg-white/50"
                                    )}
                                >
                                    {child.name}
                                </button>
                            ))}
                    </div>
                )}

                {!isLoading && activeChild && (
                    <div className="space-y-12 max-w-6xl mx-auto pb-20">
                        {days.map((day) => {
                            // Helper for Roman sorting
                            const romanMap: Record<string, number> = { 
                                "0": 0, "I": 1, "II": 2, "III": 3, "IV": 4, 
                                "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9 
                            };

                            const daySchedule = jadwal
                                .filter(j => 
                                    j.day?.toUpperCase() === day.toUpperCase() && 
                                    j.class_name === activeChild.cls
                                )
                                .sort((a, b) => (romanMap[a.slot] || 0) - (romanMap[b.slot] || 0));
                            
                            if (daySchedule.length === 0 && day === "Sabtu") return null;

                            return (
                                <div key={day} className="space-y-6 print:break-inside-avoid">
                                    <div className="border-b-2 border-slate-900 pb-2 flex items-baseline justify-between px-2">
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{day.toUpperCase()}</h2>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{daySchedule.length} SESI</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse print-table">
                                            <thead>
                                                <tr className="text-left bg-slate-50 print:bg-slate-100">
                                                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 print:text-slate-900 uppercase tracking-[0.2em] w-12 text-center border-b border-slate-200">#</th>
                                                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 print:text-slate-900 uppercase tracking-[0.2em] w-40 border-b border-slate-200">Waktu</th>
                                                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 print:text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200">Mata Pelajaran</th>
                                                    <th className="py-4 px-4 text-[10px] font-black text-slate-400 print:text-slate-900 uppercase tracking-[0.2em] w-72 border-b border-slate-200">Guru Pengajar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {daySchedule.length > 0 ? (
                                                    daySchedule.map((item, idx) => (
                                                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors print:border-slate-300">
                                                            <td className="py-4 px-4 text-center border-r border-slate-100 print:border-slate-300">
                                                                <span className="text-xs font-bold text-slate-400 print:text-slate-900 italic">{item.slot}</span>
                                                            </td>
                                                            <td className="py-4 px-4 border-r border-slate-100 print:border-slate-300">
                                                                <span className="text-sm font-black text-slate-800 print:text-slate-900 font-mono tracking-tight">
                                                                    {item.time_range}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 border-r border-slate-100 print:border-slate-300">
                                                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                                                    {(() => {
                                                                        if (item.subject_hint) return item.subject_hint;
                                                                        if (item.teacher_mapel) return item.teacher_mapel;
                                                                        
                                                                        // Mapping spesial berdasarkan teacher_code
                                                                        const code = item.teacher_code;
                                                                        if (code === "3D") return "Bahasa Daerah";
                                                                        if (code === "S") return "IPS";
                                                                        if (code === "UPACARA") return "Upacara Bendera";
                                                                        if (code === "DOA dan SABDA") return "Doa & Sabda";
                                                                        
                                                                        // Resolusi dinamis untuk team teaching (X/Y)
                                                                        if (code && code.includes('/')) {
                                                                            const firstCode = code.split('/')[0].trim();
                                                                            const firstGuru = guruList.find(g => g.teacherCode === firstCode);
                                                                            if (firstGuru && firstGuru.mapel) {
                                                                                return firstGuru.mapel.split('(')[0].trim();
                                                                            }
                                                                        }
                                                                        
                                                                        return code || "Mata Pelajaran";
                                                                    })()}
                                                                </h3>
                                                            </td>
                                                            <td className="py-4 px-4 border-slate-100 print:border-slate-300">
                                                                {(() => {
                                                                    const isSpecial = ["UPACARA", "DOA dan SABDA", "DOA & SABDA", "SENAM"].includes(item.teacher_code);
                                                                    if (isSpecial) return null;

                                                                    // Ambil nama dari API join (untuk single teacher)
                                                                    // Atau resolusi manual untuk team teaching (X/Y)
                                                                    let displayNames = item.teacher_name;
                                                                    
                                                                    if (!displayNames && item.teacher_code) {
                                                                        // Mapping spesial untuk kode shorthand
                                                                        let lookupCode = item.teacher_code;
                                                                        if (lookupCode === "3D") lookupCode = "3";
                                                                        if (lookupCode === "S") lookupCode = "6";
                                                                        
                                                                        const codes = lookupCode.split('/');
                                                                        const resolved = codes.map(c => {
                                                                            const found = guruList.find(g => g.teacherCode === c.trim());
                                                                            return found ? found.name.split(',')[0] : null;
                                                                        }).filter(Boolean);
                                                                        
                                                                        if (resolved.length > 0) {
                                                                            displayNames = resolved.join(' / ');
                                                                        }
                                                                    }

                                                                    if (!displayNames || displayNames === "-") return <span className="text-[10px] font-bold text-slate-200">-</span>;

                                                                    return (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                                                                                {displayNames.charAt(0)}
                                                                            </div>
                                                                            <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]" title={displayNames}>
                                                                                {displayNames}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-12 px-4 text-center text-slate-300 italic text-sm">
                                                            Tidak ada jadwal pelajaran untuk hari {day}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
