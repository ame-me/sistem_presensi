"use client";

import { useAppStore } from "@/lib/store";
import { useIzinData, reviewIzinAPI } from "@/hooks/useIzinData";
import { useJadwalData } from "@/hooks/useJadwalData";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Loader2, 
    Eye, 
    FileText, 
    CheckCircle2, 
    XCircle, 
    MessageSquare,
    Calendar,
    User,
    Search,
    Filter,
    FileImage
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getApiBaseUrl } from "@/lib/api-config";

function AffectedSubjects({ startDate, endDate, className, tahunAjaran }: { startDate: string, endDate: string, className: string, tahunAjaran?: string }) {
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

export default function AdminIzinPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const { izin, loading, refetch } = useIzinData();
    const [selectedIzin, setSelectedIzin] = useState<any | null>(null);
    const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const filteredIzin = izin.filter(i => filterStatus === "all" || i.status === filterStatus);

    const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        setIsReviewing(true);
        try {
            const res = await reviewIzinAPI(id, status, reviewNotes, currentUser?.name || 'Admin');
            if (res.status === 'success') {
                toast.success(`Pengajuan izin ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
                setSelectedIzin(null);
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
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 pb-20 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080]">Daftar Pengajuan Izin</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Validasi dan pantau pengajuan izin/sakit dari orang tua siswa
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === 'all' ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500'}`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => setFilterStatus("PENDING")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilterStatus("APPROVED")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Disetujui
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-bold">Memuat data pengajuan...</p>
                </div>
            ) : filteredIzin.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredIzin.map((item) => (
                        <Card key={item.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Left: Basic Info */}
                                    <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#000080] font-bold">
                                                {item.student_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{item.student_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-600 font-medium">
                                                    {new Date(item.start_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                                    {item.start_date !== item.end_date && ` - ${new Date(item.end_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <Badge variant="outline" className={item.type === 'SAKIT' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}>
                                                    {item.type === 'SAKIT' ? '🤒 Sakit' : '📋 Izin'}
                                                </Badge>
                                                <Badge className={item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Reason & Proofs */}
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Alasan / Pesan:</span>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.reason}</p>
                                        </div>

                                        {/* Affected Subjects Detail */}
                                        {item.cls && (
                                            <AffectedSubjects 
                                                startDate={item.start_date} 
                                                endDate={item.end_date} 
                                                className={item.cls} 
                                                tahunAjaran={item.tahun_ajaran}
                                            />
                                        )}
                                        
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {item.selfie_url && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="rounded-lg h-9 text-xs font-bold border-slate-200 hover:bg-slate-50"
                                                    onClick={() => setSelectedProofUrl(item.selfie_url)}
                                                >
                                                    <User className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                                                    Lihat Selfie
                                                </Button>
                                            )}
                                            {item.attachment_url && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="rounded-lg h-9 text-xs font-bold border-slate-200 hover:bg-slate-50"
                                                    onClick={() => setSelectedProofUrl(item.attachment_url)}
                                                >
                                                    <FileImage className="w-3.5 h-3.5 mr-2 text-blue-500" />
                                                    Lihat Bukti Surat
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="p-6 md:w-64 bg-slate-50/50 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100">
                                        {item.status === 'PENDING' ? (
                                            <>
                                                <Button 
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11"
                                                    onClick={() => {
                                                        setSelectedIzin(item);
                                                        setReviewNotes("");
                                                    }}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Validasi
                                                </Button>
                                                <p className="text-[10px] text-center text-slate-400 font-medium">Klik untuk menyetujui atau menolak</p>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase">
                                                    <User className="w-3 h-3" />
                                                    Validated by {item.reviewed_by}
                                                </div>
                                                {item.review_notes && (
                                                    <p className="text-[10px] italic text-slate-500 line-clamp-2">"{item.review_notes}"</p>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="w-full h-8 text-[10px] font-bold text-[#000080]"
                                                    onClick={() => {
                                                        setSelectedIzin(item);
                                                        setReviewNotes(item.review_notes || "");
                                                    }}
                                                >
                                                    Lihat Detail Review
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 text-slate-400 gap-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                        <FileText className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="font-bold text-lg">Tidak ada data pengajuan izin</p>
                </div>
            )}

            {/* Review Dialog */}
            <Dialog open={!!selectedIzin} onOpenChange={(open) => !open && setSelectedIzin(null)}>
                <DialogContent className="sm:max-w-[500px] p-6 rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-[#000080]">Review Pengajuan Izin</DialogTitle>
                        <DialogDescription className="font-medium">
                            Tentukan apakah pengajuan dari {selectedIzin?.student_name} disetujui atau ditolak.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" /> Catatan Review (Opsional)
                            </label>
                            <Textarea 
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Masukkan alasan penolakan atau catatan tambahan..."
                                className="min-h-[100px] rounded-xl border-slate-200 focus:border-[#000080]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        {selectedIzin?.status === 'PENDING' ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl"
                                    onClick={() => handleReview(selectedIzin.id, 'REJECTED')}
                                    disabled={isReviewing}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Tolak Pengajuan
                                </Button>
                                <Button 
                                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg"
                                    onClick={() => handleReview(selectedIzin.id, 'APPROVED')}
                                    disabled={isReviewing}
                                >
                                    {isReviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Setujui Izin
                                </Button>
                            </>
                        ) : (
                            <Button 
                                variant="outline" 
                                className="w-full h-12 font-bold rounded-xl"
                                onClick={() => setSelectedIzin(null)}
                            >
                                Tutup
                            </Button>
                        )}
                    </DialogFooter>
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

