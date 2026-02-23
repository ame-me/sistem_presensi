"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useAppStore } from "@/lib/store";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Camera,
    RotateCcw,
    Send,
    Loader2,
    CheckCircle,
    ArrowLeft,
    ImagePlus,
    FileImage
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function OrtuIzinPage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const getChildrenByParent = useAppStore((s) => s.getChildrenByParent);
    const submitLeaveRequest = useAppStore((s) => s.submitLeaveRequest);

    const children = currentUser ? getChildrenByParent(currentUser.id) : [];

    const [selectedChild, setSelectedChild] = useState(
        children.length === 1 ? children[0].id : ""
    );
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [leaveType, setLeaveType] = useState<"IZIN" | "SAKIT">("IZIN");
    const [reason, setReason] = useState("");
    const [selfieData, setSelfieData] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [attachmentData, setAttachmentData] = useState<string | null>(null);
    const [showAttachmentCamera, setShowAttachmentCamera] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const webcamRef = useRef<Webcam>(null);
    const attachmentWebcamRef = useRef<Webcam>(null);

    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setSelfieData(imageSrc);
                setShowCamera(false);
            }
        }
    }, []);

    const captureAttachment = useCallback(() => {
        if (attachmentWebcamRef.current) {
            const imageSrc = attachmentWebcamRef.current.getScreenshot();
            if (imageSrc) {
                setAttachmentData(imageSrc);
                setShowAttachmentCamera(false);
            }
        }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedChild || !startDate || !endDate || !reason || !selfieData) {
            toast.error("Semua field wajib diisi termasuk foto selfie");
            return;
        }

        if (leaveType === "SAKIT" && !attachmentData) {
            toast.error("Mohon lampirkan foto Surat Keterangan Dokter untuk izin Sakit");
            return;
        }

        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 500));

        const child = children.find((c) => c.id === selectedChild)!;

        submitLeaveRequest({
            studentId: child.id,
            studentName: child.name,
            studentNis: child.nis,
            parentId: currentUser!.id,
            parentName: currentUser!.name,
            parentPhone: currentUser!.phone,
            startDate,
            endDate,
            type: leaveType,
            reason,
            selfieUrl: selfieData,
            attachmentUrl: attachmentData,
        });

        setSubmitting(false);
        setSubmitted(true);
        toast.success("Pengajuan izin berhasil dikirim!");
    }

    if (!currentUser) return null;

    if (submitted) {
        return (
            <div className="max-w-lg mx-auto font-sans pb-12">
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="py-16 text-center space-y-4">
                        <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#000080]">Pengajuan Berhasil!</h2>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">
                            Pengajuan izin telah dikirim dan menunggu persetujuan wali kelas.
                            Notifikasi WhatsApp sedang diproses.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSubmitted(false);
                                    setReason("");
                                    setSelfieData(null);
                                    setAttachmentData(null);
                                }}
                                className="border-slate-200 text-slate-600 hover:text-[#000080] font-bold h-11"
                            >
                                Ajukan Lagi
                            </Button>
                            <Link href="/ortu/dashboard">
                                <Button className="bg-[#000080] hover:bg-blue-900 text-white font-bold h-11 w-full sm:w-auto">
                                    Kembali ke Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6 font-sans pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/ortu/dashboard"
                    className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#000080] hover:bg-slate-50 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080]">Ajukan Izin</h1>
                    <p className="text-slate-500 font-medium mt-0.5">Lengkapi form berikut untuk mengajukan izin absen</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="pt-6 space-y-6 p-6">
                        {/* Pilih Anak */}
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide">Pilih Anak</Label>
                            <Select value={selectedChild} onValueChange={setSelectedChild}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800 h-11 font-medium focus:ring-[#000080]/20">
                                    <SelectValue placeholder="Pilih anak" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                    {children.map((child) => (
                                        <SelectItem key={child.id} value={child.id} className="font-medium">
                                            {child.name} (Kelas {child.className})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tanggal & Jenis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide">Tgl Mulai</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-50 border-slate-200 text-slate-800 h-11 font-medium focus:border-[#000080]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide">Tgl Selesai</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="bg-slate-50 border-slate-200 text-slate-800 h-11 font-medium focus:border-[#000080]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide">Kategori</Label>
                                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as "IZIN" | "SAKIT")}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-800 h-11 font-medium focus:ring-[#000080]/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                        <SelectItem value="IZIN" className="font-medium">📋 Izin</SelectItem>
                                        <SelectItem value="SAKIT" className="font-medium text-blue-600">🤒 Sakit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Alasan */}
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide">Pesan / Alasan Singkat</Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Jelaskan alasan izin / sakit secara singkat..."
                                className="bg-slate-50 border-slate-200 text-slate-800 min-h-[100px] resize-none focus:border-[#000080]"
                                required
                            />
                        </div>

                        {/* Selfie Section */}
                        <div className="space-y-3 pt-2">
                            <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Validasi Selfie Identitas
                            </Label>
                            <p className="text-xs text-slate-500">
                                Mohon ambil foto selfie sebagai bukti autentik bahwa pengajuan ini dilakukan langsung oleh orang tua / wali murid.
                            </p>

                            {showCamera ? (
                                <div className="space-y-3">
                                    <div className="rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-sm">
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={{
                                                width: 480,
                                                height: 360,
                                                facingMode: "user",
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={captureSelfie}
                                            className="flex-1 bg-[#000080] hover:bg-blue-900 text-white font-bold h-11"
                                        >
                                            <Camera className="w-4 h-4 mr-2" />
                                            Jepret Foto
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCamera(false)}
                                            className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-11"
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            ) : selfieData ? (
                                <div className="flex items-end gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="rounded-xl overflow-hidden bg-slate-200 w-28 h-28 border-2 border-white shadow-sm shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setSelfieData(null); setShowCamera(true); }}
                                        className="border-slate-300 text-slate-600 hover:bg-slate-100 bg-white font-bold mb-1"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                        Ulangi
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCamera(true)}
                                    className="w-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:text-[#000080] hover:border-[#000080]/50 hover:bg-blue-50/50 h-32 flex flex-col items-center justify-center gap-3 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <span className="font-bold text-sm">Buka Kamera & Ambil Selfie</span>
                                </Button>
                            )}
                        </div>

                        {/* Surat Dokter Section */}
                        {leaveType === "SAKIT" && (
                            <div className="space-y-3 pt-2">
                                <Label className="text-slate-600 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                                    <FileImage className="w-4 h-4" />
                                    Surat Keterangan Dokter
                                </Label>
                                <p className="text-xs text-slate-500">
                                    Unggah atau foto surat keterangan dari dokter medis sebagai bukti sah pengajuan izin sakit.
                                </p>

                                {showAttachmentCamera ? (
                                    <div className="space-y-3">
                                        <div className="rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-sm">
                                            <Webcam
                                                ref={attachmentWebcamRef}
                                                audio={false}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={{
                                                    width: 480,
                                                    height: 360,
                                                    facingMode: "environment", // use rear camera if available
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={captureAttachment}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                                            >
                                                <Camera className="w-4 h-4 mr-2" />
                                                Jepret Surat
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowAttachmentCamera(false)}
                                                className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-11"
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                ) : attachmentData ? (
                                    <div className="flex items-end gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="rounded-xl overflow-hidden bg-slate-200 w-28 h-auto border-2 border-white shadow-sm shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={attachmentData} alt="Surat Dokter" className="w-full h-auto object-cover" />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setAttachmentData(null); setShowAttachmentCamera(true); }}
                                            className="border-slate-300 text-slate-600 hover:bg-slate-100 bg-white font-bold mb-1"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                            Ulangi
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAttachmentCamera(true)}
                                        className="w-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:text-blue-600 hover:border-blue-600/50 hover:bg-blue-50/50 h-32 flex flex-col items-center justify-center gap-3 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                                            <ImagePlus className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <span className="font-bold text-sm">Buka Kamera & Foto Surat Dokter</span>
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-4 border-t border-slate-100">
                            <Button
                                type="submit"
                                disabled={submitting || !selfieData || (leaveType === "SAKIT" && !attachmentData)}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md rounded-xl text-lg relative overflow-hidden group transition-all disabled:opacity-70 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative flex items-center justify-center">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-6 h-6 mr-2" />
                                            Kirim Pengajuan Sekarang
                                        </>
                                    )}
                                </span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
