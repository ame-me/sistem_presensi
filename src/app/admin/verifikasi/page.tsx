"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminVerifikasiPage() {
    const leaveRequests = useAppStore((state) => state.leaveRequests);
    const reviewLeaveRequest = useAppStore((state) => state.reviewLeaveRequest);

    // Only pending requests
    const pendingRequests = leaveRequests.filter((r) => r.status === "PENDING");

    const handleReview = (id: string, status: "APPROVED" | "REJECTED") => {
        reviewLeaveRequest(id, status, `Ditinjau oleh admin pada ${new Date().toLocaleString()}`);
        toast.success(`Berhasil ${status === "APPROVED" ? "menyetujui" : "menolak"} pengajuan izin.`);
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Verifikasi Pengajuan Izin</h1>
                <p className="text-slate-500 font-medium mt-1">Daftar permohonan izin/sakit siswa yang menunggu persetujuan.</p>
            </div>

            <Card className="border-slate-200 bg-white shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-[#000080] text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Daftar Antrean Verifikasi
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {pendingRequests.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 font-medium">Tidak ada pengajuan izin yang menunggu.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Siswa</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-mono text-xs text-slate-600">
                                            {req.startDate}{req.startDate !== req.endDate && <><br />s/d<br />{req.endDate}</>}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold text-slate-800">{req.studentName}</p>
                                            <p className="text-[10px] text-slate-500">Oleh: {req.parentName}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={req.type === "SAKIT" ? "text-blue-600 border-blue-200" : "text-amber-600 border-amber-200"}>{req.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{req.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleReview(req.id, "APPROVED")}>
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Terima
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReview(req.id, "REJECTED")}>
                                                    <XCircle className="w-4 h-4 mr-1" /> Tolak
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
