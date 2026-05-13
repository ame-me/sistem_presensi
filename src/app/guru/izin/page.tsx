"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useIzinData, reviewIzinAPI } from "@/hooks/useIzinData";
import { useJadwalData } from "@/hooks/useJadwalData";
import { getApiBaseUrl } from "@/lib/api-config";
import { Calendar } from "lucide-react";
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
import { Check, X, Eye, FileText, CheckCircle2, XCircle, FileImage, AlertCircle } from "lucide-react";
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
};function AffectedSubjects({ startDate, endDate, className, tahunAjaran }: { startDate: string, endDate: string, className: string, tahunAjaran?: string }) {
    const { jadwal, loading } = useJadwalData(undefined, className, undefined, tahunAjaran);
    
    if (loading) return <div className="text-[10px] text-slate-400 animate-pulse">Menghitung mata pelajaran yang terdampak...</div>;
    if (!jadwal || jadwal.length === 0) return <div className="text-[10px] text-slate-400 italic">Tidak ada jadwal ditemukan untuk kelas {className}</div>;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const affectedDays: string[] = [];
    
    // Get all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const rawDay = d.toLocaleDateString('id-ID', { weekday: 'long' });
        // Normalize to UPPERCASE to match database ('SENIN', 'RABU', etc)
        const dayName = rawDay.toUpperCase();
        if (!affectedDays.includes(dayName)) affectedDays.push(dayName);
    }

    const dayMap: { [key: string]: string } = {
        'SENIN': 'SENIN',
        'SELASA': 'SELASA',
        'RABU': 'RABU',
        'KAMIS': 'KAMIS',
        'JUMAT': 'JUMAT',
        'SABTU': 'SABTU',
        'MINGGU': 'MINGGU'
    };

    return (
        <div className="mt-4 space-y-3">
            <h4 className="text-[10px] font-black text-[#000080] uppercase tracking-widest border-b border-slate-100 pb-1">
                📅 Detail Hari & Mata Pelajaran Terdampak:
            </h4>
            <div className="grid grid-cols-1 gap-2">
                {affectedDays.map(dayName => {
                    const mappedDay = dayMap[dayName] || dayName;
                    const dayJadwal = jadwal.filter(j => j.day === mappedDay);
                    
                    if (dayJadwal.length === 0) return null;

                    return (
                        <div key={dayName} className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500" /> {dayName}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {dayJadwal.map((j, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-white border-slate-200 text-slate-600 font-medium">
                                        {j.time_range.split(' ')[0]} - {j.teacher_mapel || j.subject_hint || j.teacher_code || 'Mata Pelajaran'}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


export default function GuruIzinPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const { izin, loading, refetch } = useIzinData();

    const [filter, setFilter] = useState<FilterStatus>("ALL");
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

    const filtered = filter === "ALL" ? izin : izin.filter((l) => l.status === filter);

    async function handleReview(status: "APPROVED" | "REJECTED") {
        if (!selectedRequest) return;
        setIsReviewing(true);

        try {
            const res = await reviewIzinAPI(selectedRequest.id, status, reviewNotes, currentUser?.name || 'Guru');
            if (res.status === 'success') {
                toast.success(`Pengajuan izin ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
                setSelectedRequest(null);
                setReviewNotes("");
                refetch();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsReviewing(false);
        }
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length > 0 ? filtered.map((lr) => (
                                <TableRow 
                                    key={lr.id} 
                                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                    onClick={() => { setSelectedRequest(lr); setReviewNotes(""); }}
                                >
                                    <TableCell>
                                        <p className="font-bold text-slate-800 text-sm">{lr.student_name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">NIS: {lr.nisn || lr.noInduk}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={lr.type === "SAKIT" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                                            {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-slate-600">
                                        {new Date(lr.start_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                        {lr.start_date !== lr.end_date && ` - ${new Date(lr.end_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-slate-600 truncate max-w-[200px]" title={lr.reason}>{lr.reason}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {lr.parent_email}</p>
                                    </TableCell>
                                    <TableCell>
                                        {statusBadge(lr.status)}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center">
                                            {loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-300 mb-3" /> : <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />}
                                            <p className="text-slate-500 font-medium">
                                                {loading ? "Memuat data..." : filter === "ALL" ? "Belum ada pengajuan izin/sakit." : `Tidak ada perizinan dengan status ${filter.toLowerCase()}.`}
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
                                                {selectedRequest.student_name} <br />
                                                <span className="text-xs font-mono text-slate-500">{selectedRequest.nisn || selectedRequest.noInduk}</span>
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
                                                {new Date(selectedRequest.start_date).toLocaleDateString("id-ID", { dateStyle: 'full' })}
                                                {selectedRequest.start_date !== selectedRequest.end_date && (
                                                    <>
                                                        <br /> s.d <br />
                                                        {new Date(selectedRequest.end_date).toLocaleDateString("id-ID", { dateStyle: 'full' })}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Wali Murid</span>
                                            <span className="text-sm text-slate-800 font-bold">{selectedRequest.parent_email}</span>
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

                                    {/* Affected Subjects Detail */}
                                    {selectedRequest.cls && (
                                        <AffectedSubjects 
                                            startDate={selectedRequest.start_date} 
                                            endDate={selectedRequest.end_date} 
                                            className={selectedRequest.cls} 
                                            tahunAjaran={selectedRequest.tahun_ajaran}
                                        />
                                    )}

                                    {/* Already reviewed */}
                                    {selectedRequest.status !== "PENDING" && selectedRequest.review_notes && (
                                        <div>
                                            <p className="text-xs font-black text-slate-500 mb-1 uppercase tracking-wide">Catatan Reviewer ({selectedRequest.reviewed_by}):</p>
                                            <p className="text-xs font-medium text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">{selectedRequest.review_notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Kanan: Bukti Autentik */}
                                <div>
                                    <p className="text-sm font-black text-[#000080] mb-3 uppercase tracking-wide">Dokumen Validasi:</p>
                                    <div className="space-y-4">
                                        {selectedRequest.selfie_url && (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                                <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                                                    <FileImage className="w-4 h-4" /> Bukti Selfie Wali Murid
                                                </div>
                                                <div 
                                                    className="w-full aspect-video bg-slate-200 relative cursor-pointer group"
                                                    onClick={() => setSelectedProofUrl(selectedRequest.selfie_url)}
                                                >
                                                    <img
                                                        src={selectedRequest.selfie_url.startsWith('data:') ? selectedRequest.selfie_url : `${getApiBaseUrl().replace('/api', '')}/uploads/${selectedRequest.selfie_url}`}
                                                        alt="Selfie verifikasi"
                                                        className="w-full h-full object-cover transition-all group-hover:opacity-90"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                        <Eye className="w-8 h-8 text-white drop-shadow-md" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                            <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> Surat Keterangan Dokter / Bukti
                                            </div>
                                            <div 
                                                className="w-full h-auto min-h-[120px] bg-slate-200 relative flex items-center justify-center p-2 cursor-pointer group"
                                                onClick={() => selectedRequest.attachment_url && setSelectedProofUrl(selectedRequest.attachment_url)}
                                            >
                                                {selectedRequest.attachment_url ? (
                                                    <>
                                                        <img
                                                            src={selectedRequest.attachment_url.startsWith('data:') ? selectedRequest.attachment_url : `${getApiBaseUrl().replace('/api', '')}/uploads/${selectedRequest.attachment_url}`}
                                                            alt="Surat Dokter"
                                                            className="w-full h-auto rounded shadow-sm transition-all group-hover:opacity-90"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                            <Eye className="w-8 h-8 text-white drop-shadow-md" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="border-2 border-dashed border-slate-400 w-full h-24 rounded flex items-center justify-center bg-white/50 text-slate-500 text-xs font-bold text-center">
                                                        [Tidak Ada Lampiran]
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Review Action */}
                            {selectedRequest.status === "PENDING" && (
                                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1 block">Catatan Review (Opsional):</label>
                                        <Textarea
                                            placeholder="Tuliskan alasan penolakan atau catatan tambahan..."
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            className="bg-white border-slate-200 text-slate-800 resize-none h-20"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            disabled={isReviewing}
                                            onClick={() => handleReview("REJECTED")}
                                            variant="outline"
                                            className="w-1/3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                                        >
                                            <X className="w-5 h-5 mr-2" /> Tolak
                                        </Button>
                                        <Button
                                            disabled={isReviewing}
                                            onClick={() => handleReview("APPROVED")}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10"
                                        >
                                            {isReviewing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                            Setujui & Update Database
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Proof Preview Modal */}
            <Dialog open={!!selectedProofUrl} onOpenChange={(open) => !open && setSelectedProofUrl(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10">
                        <DialogTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-[#000080]" />
                            Lampiran Bukti Pengajuan
                        </DialogTitle>
                    </DialogHeader>
                    <div className="bg-slate-900 p-6 flex justify-center items-center min-h-[400px]">
                        {selectedProofUrl && (
                            <img 
                                src={selectedProofUrl.startsWith('data:') ? selectedProofUrl : `${getApiBaseUrl().replace('/api', '')}/uploads/${selectedProofUrl}`} 
                                alt="Bukti Lampiran" 
                                className="max-w-full max-h-[75vh] rounded-lg shadow-2xl"
                                onError={(e: any) => {
                                    e.target.src = "https://placehold.co/400x600?text=Bukti+Tidak+Ditemukan";
                                }}
                            />
                        )}
                    </div>
                    <DialogFooter className="p-4 bg-white border-t">
                        <Button variant="ghost" className="font-bold text-slate-500" onClick={() => setSelectedProofUrl(null)}>Tutup</Button>
                        {selectedProofUrl && (
                            <Button 
                                className="bg-[#000080] font-bold"
                                onClick={() => window.open(selectedProofUrl.startsWith('data:') ? selectedProofUrl : `${getApiBaseUrl().replace('/api', '')}/uploads/${selectedProofUrl}`, '_blank')}
                            >
                                Buka Ukuran Penuh
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
