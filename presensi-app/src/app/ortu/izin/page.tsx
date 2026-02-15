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
    const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split("T")[0]);
    const [leaveType, setLeaveType] = useState<"IZIN" | "SAKIT">("IZIN");
    const [reason, setReason] = useState("");
    const [selfieData, setSelfieData] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setSelfieData(imageSrc);
                setShowCamera(false);
            }
        }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedChild || !leaveDate || !reason || !selfieData) {
            toast.error("Semua field wajib diisi termasuk foto selfie");
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
            leaveDate,
            type: leaveType,
            reason,
            selfieUrl: selfieData,
        });

        setSubmitting(false);
        setSubmitted(true);
        toast.success("Pengajuan izin berhasil dikirim!");
    }

    if (!currentUser) return null;

    if (submitted) {
        return (
            <div className="max-w-lg mx-auto">
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="py-16 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Pengajuan Berhasil!</h2>
                        <p className="text-slate-400">
                            Pengajuan izin telah dikirim dan menunggu persetujuan guru.
                            <br />
                            Notifikasi WhatsApp telah terkirim.
                        </p>
                        <div className="flex gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSubmitted(false);
                                    setReason("");
                                    setSelfieData(null);
                                }}
                                className="border-slate-700 text-slate-300"
                            >
                                Ajukan Lagi
                            </Button>
                            <Link href="/ortu/dashboard">
                                <Button className="bg-gradient-to-r from-emerald-600 to-teal-500">
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
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/ortu/dashboard"
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Ajukan Izin</h1>
                    <p className="text-slate-400 mt-0.5">Lengkapi form berikut untuk mengajukan izin</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="pt-6 space-y-5">
                        {/* Pilih Anak */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Pilih Anak</Label>
                            <Select value={selectedChild} onValueChange={setSelectedChild}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Pilih anak" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {children.map((child) => (
                                        <SelectItem key={child.id} value={child.id}>
                                            {child.name} ({child.className})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tanggal & Jenis */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Tanggal Izin</Label>
                                <Input
                                    type="date"
                                    value={leaveDate}
                                    onChange={(e) => setLeaveDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Jenis</Label>
                                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as "IZIN" | "SAKIT")}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="IZIN">📋 Izin</SelectItem>
                                        <SelectItem value="SAKIT">🤒 Sakit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Alasan */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Alasan / Keterangan</Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Jelaskan alasan izin / sakit..."
                                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                                required
                            />
                        </div>

                        {/* Selfie Section */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Foto Selfie (Bukti Identitas)
                            </Label>
                            <p className="text-xs text-slate-500">
                                Ambil foto selfie sebagai verifikasi bahwa Anda adalah orang tua/wali siswa
                            </p>

                            {showCamera ? (
                                <div className="space-y-3">
                                    <div className="rounded-xl overflow-hidden bg-black">
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
                                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500"
                                        >
                                            <Camera className="w-4 h-4 mr-2" />
                                            Ambil Foto
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCamera(false)}
                                            className="border-slate-700 text-slate-300"
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            ) : selfieData ? (
                                <div className="space-y-2">
                                    <div className="rounded-xl overflow-hidden bg-slate-800 w-48 h-48">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setSelfieData(null); setShowCamera(true); }}
                                        className="border-slate-700 text-slate-300"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                        Ulangi Foto
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCamera(true)}
                                    className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 h-24 flex flex-col items-center gap-2"
                                >
                                    <Camera className="w-6 h-6" />
                                    <span>Buka Kamera & Ambil Selfie</span>
                                </Button>
                            )}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={submitting || !selfieData}
                            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold shadow-lg"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Kirim Pengajuan Izin
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
