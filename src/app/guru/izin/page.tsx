"use client";

import { useState } from "react";
import { useAppStore, type LeaveRequest } from "@/lib/store";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Check, X, Eye, FileText, CheckCircle2, XCircle, FileImage } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusBadge = (status: string) => {
    switch (status) {
        case "PENDING":
            return <Badge className="bg-amber-100 text-amber-700 border-amber-200">⏳ Pending</Badge>;
        case "APPROVED":
            return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✅ Disetujui</Badge>;
        case "REJECTED":
            return <Badge className="bg-red-100 text-red-700 border-red-200">❌ Ditolak</Badge>;
    }
};

export default function GuruIzinPage() {
    const leaveRequests = useAppStore((s) => s.leaveRequests);
    const reviewLeaveRequest = useAppStore((s) => s.reviewLeaveRequest);

    const [filter, setFilter] = useState<FilterStatus>("ALL");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");

    const filtered = filter === "ALL" ? leaveRequests : leaveRequests.filter((l) => l.status === filter);

    function handleReview(status: "APPROVED" | "REJECTED") {
        if (!selectedRequest) return;

        reviewLeaveRequest(selectedRequest.id, status, reviewNotes);

        if (status === "APPROVED") {
            toast.success(`Berhasil: Presensi siswa diupdate menjadi ${selectedRequest.type}. Pesan WA (Fontee API) terkirim ke ${selectedRequest.parentPhone}.`);
        } else {
            toast.error(`Perhatian: Izin ditolak. Pesan alasan penolakan dikirim via WA (Fontee API) ke ${selectedRequest.parentPhone}.`);
        }

        setSelectedRequest(null);
        setReviewNotes("");
    }

    const FILTERS: { label: string; value: FilterStatus }[] = [
        { label: "Semua", value: "ALL" },
        { label: "Pending", value: "PENDING" },
        { label: "Disetujui", value: "APPROVED" },
        { label: "Ditolak", value: "REJECTED" },
    ];

    return (
        <div className="space-y-8 font-sans pb-20">
            <div>
                <h1 className="text-3xl font-extrabold text-[#000080]">Pusat Verifikasi Izin & Sakit</h1>
                <p className="text-slate-500 font-medium mt-1">Kelola permohonan ketidakhadiran dari wali murid dengan cepat.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-5 py-2 text-sm font-bold rounded-full transition-all shadow-sm ${filter === f.value
                            ? "bg-[#000080] text-white border-2 border-[#000080]"
                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Leave Request List */}
            <Card className="bg-white border-slate-200 shadow-md overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-[#000080]">Identitas Siswa</TableHead>
                                <TableHead className="font-bold text-[#000080]">Jenis Izin</TableHead>
                                <TableHead className="font-bold text-[#000080]">Tanggal</TableHead>
                                <TableHead className="font-bold text-[#000080]">Alasan Singkat</TableHead>
                                <TableHead className="font-bold text-[#000080]">Status</TableHead>
                                <TableHead className="font-bold text-[#000080] text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length > 0 ? filtered.map((lr) => (
                                <TableRow key={lr.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <p className="font-bold text-slate-800 text-sm">{lr.studentName}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">NIS: {lr.studentNis}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={lr.type === "SAKIT" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                                            {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-slate-600">
                                        {new Date(lr.startDate).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                        {lr.startDate !== lr.endDate && ` - ${new Date(lr.endDate).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-slate-600 truncate max-w-[200px]" title={lr.reason}>{lr.reason}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {lr.parentName}</p>
                                    </TableCell>
                                    <TableCell>
                                        {statusBadge(lr.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {lr.status === "PENDING" && (
                                                <Button size="sm" onClick={() => { setSelectedRequest(lr); handleReview("APPROVED"); }} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold hidden sm:flex">
                                                    Setujui Langsung
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedRequest(lr); setReviewNotes(""); }} className="text-slate-600 hover:text-[#000080] hover:bg-blue-50">
                                                <Eye className="w-4 h-4 mr-1.5" /> Detail
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">
                                                {filter === "ALL" ? "Belum ada pengajuan izin/sakit." : `Tidak ada perizinan dengan status ${filter.toLowerCase()}.`}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="bg-white border-slate-200 max-w-2xl rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 relative">
                        <DialogTitle className="text-[#000080] text-xl font-black">Detail Verifikasi Izin / Sakit</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Kiri: Detail Data Pribadi */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                            <span className="text-sm font-bold text-slate-500">Siswa</span>
                                            <span className="text-sm text-slate-800 font-bold text-right">
                                                {selectedRequest.studentName} <br />
                                                <span className="text-xs font-mono text-slate-500">{selectedRequest.studentNis}</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Kategori</span>
                                            <Badge className={selectedRequest.type === "SAKIT" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"} shadow-none>
                                                {selectedRequest.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Tanggal</span>
                                            <span className="text-sm text-slate-800 font-bold ml-4 text-right">
                                                {new Date(selectedRequest.startDate).toLocaleDateString("id-ID", { dateStyle: 'full' })}
                                                {selectedRequest.startDate !== selectedRequest.endDate && (
                                                    <>
                                                        <br /> s.d <br />
                                                        {new Date(selectedRequest.endDate).toLocaleDateString("id-ID", { dateStyle: 'full' })}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Wali Murid</span>
                                            <span className="text-sm text-slate-800 font-bold">{selectedRequest.parentName}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">No. WA (Ortu)</span>
                                            <span className="text-sm text-slate-800 font-bold font-mono">{selectedRequest.parentPhone}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Status Review</span>
                                            {statusBadge(selectedRequest.status)}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-black text-[#000080] mb-2 uppercase tracking-wide">Pesan / Alasan:</p>
                                        <div className="text-sm text-slate-700 bg-blue-50 p-4 rounded-xl border border-blue-100 italic leading-relaxed">
                                            "{selectedRequest.reason}"
                                        </div>
                                    </div>

                                    {/* Already reviewed */}
                                    {selectedRequest.status !== "PENDING" && selectedRequest.reviewNotes && (
                                        <div>
                                            <p className="text-xs font-black text-slate-500 mb-1 uppercase tracking-wide">Catatan Anda Sebelumnya:</p>
                                            <p className="text-xs font-medium text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">{selectedRequest.reviewNotes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Kanan: Bukti Autentik */}
                                <div>
                                    <p className="text-sm font-black text-[#000080] mb-3 uppercase tracking-wide">Dokumen Validasi:</p>
                                    <div className="space-y-4">
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                            <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                                                <FileImage className="w-4 h-4" /> Bukti Selfie Wali Murid
                                            </div>
                                            <div className="w-full aspect-square bg-slate-200 relative">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${selectedRequest.parentId}`}
                                                    alt="Selfie verifikasi"
                                                    className="w-full h-full object-cover opacity-80"
                                                />
                                            </div>
                                        </div>

                                        {selectedRequest.type === "SAKIT" && (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                                <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                                                    <FileText className="w-4 h-4" /> Surat Keterangan Dokter
                                                </div>
                                                <div className="w-full h-auto bg-slate-200 relative flex items-center justify-center p-4">
                                                    {selectedRequest.attachmentUrl ? (
                                                        <img
                                                            src={selectedRequest.attachmentUrl}
                                                            alt="Surat Dokter"
                                                            className="w-full h-auto rounded shadow-sm opacity-90"
                                                        />
                                                    ) : (
                                                        <div className="border-2 border-dashed border-slate-400 w-full h-24 rounded flex items-center justify-center bg-white/50 text-slate-500 text-xs font-bold text-center">
                                                            [Tidak Ada Lampiran]
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Review Action */}
                            {selectedRequest.status === "PENDING" && (
                                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1 block">Catatan Penolakan (Wajib jika menolak):</label>
                                        <Textarea
                                            placeholder="Tuliskan alasan penolakan di sini..."
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            className="bg-white border-slate-200 text-slate-800 resize-none h-20"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => handleReview("REJECTED")}
                                            variant="outline"
                                            className="w-1/3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                                        >
                                            <X className="w-5 h-5 mr-2" /> Tolak
                                        </Button>
                                        <Button
                                            onClick={() => handleReview("APPROVED")}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10"
                                        >
                                            <CheckCircle2 className="w-5 h-5 mr-2" /> Setujui & Update Database
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-center font-bold text-slate-400">
                                        Data presensi akan otomatis diubah ke {selectedRequest.type} & orang tua akan dikirimi notifikasi WA via API Fontee.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
