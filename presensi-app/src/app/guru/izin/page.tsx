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
import { Check, X, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusBadge = (status: string) => {
    switch (status) {
        case "PENDING":
            return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">⏳ Pending</Badge>;
        case "APPROVED":
            return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✅ Disetujui</Badge>;
        case "REJECTED":
            return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">❌ Ditolak</Badge>;
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
        toast.success(
            status === "APPROVED"
                ? "Izin disetujui! Notifikasi WA terkirim."
                : "Izin ditolak. Notifikasi WA terkirim."
        );
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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Pengajuan Izin</h1>
                <p className="text-slate-400 mt-1">Review dan kelola pengajuan izin dari orang tua siswa</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === f.value
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Leave Request List */}
            {filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map((lr) => (
                        <Card
                            key={lr.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                            onClick={() => { setSelectedRequest(lr); setReviewNotes(""); }}
                        >
                            <CardContent className="py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-slate-800 rounded-xl">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            {lr.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"} — {lr.studentName}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            Tanggal: {new Date(lr.leaveDate).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Diajukan oleh: {lr.parentName} •{" "}
                                            {new Date(lr.createdAt).toLocaleDateString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                                {statusBadge(lr.status)}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="py-16 text-center">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">
                            {filter === "ALL" ? "Belum ada pengajuan izin" : `Tidak ada pengajuan ${filter.toLowerCase()}`}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Detail Pengajuan Izin</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Siswa</span>
                                    <span className="text-sm text-white font-medium">
                                        {selectedRequest.studentName} ({selectedRequest.studentNis})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Jenis</span>
                                    <Badge className={selectedRequest.type === "SAKIT" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}>
                                        {selectedRequest.type === "SAKIT" ? "🤒 Sakit" : "📋 Izin"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Tanggal</span>
                                    <span className="text-sm text-white">
                                        {new Date(selectedRequest.leaveDate).toLocaleDateString("id-ID")}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Diajukan oleh</span>
                                    <span className="text-sm text-white">{selectedRequest.parentName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">Status</span>
                                    {statusBadge(selectedRequest.status)}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-slate-400 mb-1">Alasan:</p>
                                <p className="text-sm text-white bg-slate-800 p-3 rounded-lg">{selectedRequest.reason}</p>
                            </div>

                            {/* Selfie */}
                            {selectedRequest.selfieUrl && (
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Foto Selfie Verifikasi:</p>
                                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={selectedRequest.selfieUrl}
                                            alt="Selfie verifikasi"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Review Action */}
                            {selectedRequest.status === "PENDING" && (
                                <div className="space-y-3 pt-2 border-t border-slate-700">
                                    <Textarea
                                        placeholder="Catatan review (opsional)..."
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleReview("APPROVED")}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                        >
                                            <Check className="w-4 h-4 mr-1.5" />
                                            Setujui
                                        </Button>
                                        <Button
                                            onClick={() => handleReview("REJECTED")}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <X className="w-4 h-4 mr-1.5" />
                                            Tolak
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Already reviewed */}
                            {selectedRequest.status !== "PENDING" && selectedRequest.reviewNotes && (
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Catatan Review:</p>
                                    <p className="text-sm text-white bg-slate-800 p-3 rounded-lg">{selectedRequest.reviewNotes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
