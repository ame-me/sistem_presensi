"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle, Loader2, Camera, FileImage, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useIzinData, reviewIzinAPI } from "@/hooks/useIzinData";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";

export default function AdminVerifikasiPage() {
    const currentUser = useAppStore((state) => state.currentUser);
    const { izin: allIzin, loading, refetch } = useIzinData();

    // Only pending requests
    const pendingRequests = allIzin.filter((r: any) => r.status === "PENDING");

    const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
        const res = await reviewIzinAPI(
            Number(id), 
            status, 
            `Ditinjau oleh Admin (${currentUser?.name || 'Admin'}) pada ${new Date().toLocaleString()}`,
            currentUser?.name || 'Admin'
        );
        
        if (res.status === 'success') {
            toast.success(`Berhasil ${status === "APPROVED" ? "menyetujui" : "menolak"} pengajuan izin.`);
            refetch();
        } else {
            toast.error("Gagal melakukan verifikasi");
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Verifikasi Pengajuan Izin</h1>
                <p className="text-slate-500 font-medium mt-1">Daftar permohonan izin/sakit siswa yang menunggu persetujuan (Real Database).</p>
            </div>

            <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6">
                    <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Daftar Antrean Verifikasi
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="font-bold text-xs uppercase tracking-widest leading-none mt-2">Memuat Antrean...</p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 font-bold bg-slate-50/30">
                           <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                           Semua pengajuan telah diproses secara tuntas.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-100 border-b-2 border-slate-200 shadow-sm pointer-events-none">
                                    <TableHead className="px-8 font-black uppercase text-[10px] text-slate-500 tracking-[0.1em] h-14">Waktu Izin</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] text-slate-500 tracking-[0.1em] h-14">Siswa</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] text-slate-500 tracking-[0.1em] h-14">Kategori</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] text-slate-500 tracking-[0.1em] h-14">Keterangan</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] text-slate-500 tracking-[0.1em] h-14">Lampiran Bukti</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] text-slate-500 tracking-[0.1em] h-14">Panel Kontrol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white">
                                {pendingRequests.map((req: any) => (
                                    <TableRow key={req.id} className="hover:bg-blue-50/30 transition-all border-b border-slate-100">
                                        <TableCell className="px-8 font-extrabold text-xs text-slate-500 shrink-0 whitespace-nowrap">
                                            {new Date(req.start_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                                            {req.start_date !== req.end_date && <> <span className="opacity-30 mx-1">s/d</span> {new Date(req.end_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</>}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-black text-[#000080] text-sm tracking-tight mb-1">{req.student_name}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight px-1.5 py-0 border-slate-200 text-slate-400 bg-slate-50">NIS {req.noInduk || "1001"}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={req.type === "SAKIT" ? "bg-blue-50 text-blue-700 border-blue-200 font-extrabold text-[10px] px-2.5 py-1" : "bg-amber-50 text-amber-700 border-amber-200 font-extrabold text-[10px] px-2.5 py-1"}>
                                                {req.type === "SAKIT" ? "🏥 SAKIT" : "📋 IZIN"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs text-slate-600 font-bold leading-relaxed line-clamp-2 max-w-[280px]">{req.reason}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-9 px-4 text-[#000080] border-slate-200 hover:border-[#000080] hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm transition-all">
                                                        <ImageIcon className="w-3.5 h-3.5 mr-2" />
                                                        Cek Berkas
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl bg-white border-none rounded-3xl shadow-2xl p-0 overflow-hidden">
                                                    <DialogHeader className="p-0">
                                                        <div className="bg-[#000080] p-8 text-white relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                                <FileText className="w-32 h-32" />
                                                            </div>
                                                            <DialogTitle className="text-2xl font-black tracking-tight mb-2 text-white">
                                                                Lampiran Bukti Digital
                                                            </DialogTitle>
                                                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                                                                Siswa: {req.student_name} • Pengajuan: {req.type}
                                                            </p>
                                                        </div>
                                                    </DialogHeader>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-slate-50 text-center">
                                                        {/* Selfie Column */}
                                                        <div className="space-y-4">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
                                                                <Camera className="w-4 h-4" /> 
                                                                Selfie Verifikasi Ortu
                                                            </p>
                                                            <div className="aspect-[4/3] rounded-3xl bg-white border-4 border-white shadow-2xl shadow-blue-900/10 overflow-hidden flex items-center justify-center group relative">
                                                                {req.selfie_url ? (
                                                                    <img src={req.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                                        <Camera className="w-10 h-10" />
                                                                        <p className="text-[10px] font-bold italic">Tidak melampirkan selfie</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Attachment Column */}
                                                        <div className="space-y-4">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
                                                                <FileImage className="w-4 h-4" /> 
                                                                {req.type === 'SAKIT' ? 'Surat Ket. Dokter' : 'Dokumen Pendukung'}
                                                            </p>
                                                            <div className="aspect-[4/3] rounded-3xl bg-white border-4 border-white shadow-2xl shadow-blue-900/10 overflow-hidden flex items-center justify-center group relative">
                                                                {req.attachment_url ? (
                                                                    <img src={req.attachment_url} alt="Berkas" className="w-full h-full object-contain p-2" />
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                                        <FileImage className="w-10 h-10" />
                                                                        <p className="text-[10px] font-bold italic">Tanpa lampiran fisik</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 bg-white border-t border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[300px]">
                                                                Pastikan identitas pada selfie sesuai dengan wali murid yang terdaftar.
                                                            </p>
                                                        </div>
                                                        <DialogTrigger asChild>
                                                            <Button className="h-12 px-8 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.15em] rounded-xl shadow-lg">
                                                                Tutup Berkas
                                                            </Button>
                                                        </DialogTrigger>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-3">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 px-6 rounded-xl shadow-lg shadow-emerald-600/20 text-[11px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95" 
                                                    onClick={() => handleReview(req.id, "APPROVED")}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Setuju
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black h-11 px-6 rounded-xl text-[11px] uppercase tracking-wider transition-all" 
                                                    onClick={() => handleReview(req.id, "REJECTED")}
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" /> Tolak
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
