"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api-config";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
    Clock,
    CheckCircle,
    XCircle,
    User,
    Mail,
    Shield,
    Key,
    MessageSquare,
    RefreshCw,
    Eye,
    Copy
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PasswordResetRequest {
    id: number;
    user_id: string;
    user_name: string;
    user_email: string;
    user_role: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    requested_at: string;
    processed_at: string | null;
    processed_by: string | null;
    default_password: string | null;
    notes: string | null;
}

export function PasswordResetRequests() {
    const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('PENDING');
    const [processingRequest, setProcessingRequest] = useState<number | null>(null);
    const [actionNotes, setActionNotes] = useState("");
    const API_BASE_URL = getApiBaseUrl();
    const currentUser = useAppStore((s) => s.currentUser);

    useEffect(() => {
        fetchRequests();
    }, [selectedStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/system/password_reset_request.php?status=${selectedStatus}`);
            const data = await response.json();

            if (data.status === 'success') {
                setRequests(data.data || []);
            } else {
                toast.error(data.message || "Gagal mengambil data permintaan");
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: number, action: 'approve' | 'reject' | 'complete') => {
        if (!currentUser) {
            toast.error("Anda harus login sebagai Admin IT");
            return;
        }

        if (action === 'approve' && !actionNotes.trim()) {
            toast.error("Harap isi catatan untuk persetujuan");
            return;
        }

        setProcessingRequest(requestId);

        try {
            const response = await fetch(`${API_BASE_URL}/system/password_reset_request.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    action: action,
                    processed_by: currentUser.name,
                    notes: actionNotes
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success(`Permintaan berhasil di${action}`);

                // Show default password if approved
                if (action === 'approve' && data.default_password) {
                    toast.success(`Password default: ${data.default_password}`, {
                        duration: 10000,
                        icon: <Key className="w-5 h-5" />
                    });
                }

                // Clear notes and refresh
                setActionNotes("");
                fetchRequests();
            } else {
                toast.error(data.message || `Gagal ${action} permintaan`);
            }
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
            toast.error("Terjadi kesalahan koneksi");
        } finally {
            setProcessingRequest(null);
        }
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'APPROVED':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
            case 'COMPLETED':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Selesai</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        const roleColors: Record<string, string> = {
            'ADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
            'ADMIN_IT': 'bg-blue-100 text-blue-800 border-blue-200',
            'ADMIN_TU': 'bg-cyan-100 text-cyan-800 border-cyan-200',
            'GURU': 'bg-green-100 text-green-800 border-green-200',
            'ORTU': 'bg-orange-100 text-orange-800 border-orange-200'
        };

        const roleLabels: Record<string, string> = {
            'ADMIN': 'Kepala Sekolah',
            'ADMIN_IT': 'Admin IT',
            'ADMIN_TU': 'Admin TU',
            'GURU': 'Guru',
            'ORTU': 'Orang Tua'
        };

        return (
            <Badge variant="outline" className={roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200 text-[10px]'}>
                <Shield className="w-3 h-3 mr-1" />
                {roleLabels[role] || role}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Key className="w-6 h-6" />
                        Permintaan Reset Password
                    </h2>
                    <p className="text-slate-600">
                        Kelola permintaan reset password dari user
                    </p>
                </div>
                <Button
                    onClick={fetchRequests}
                    variant="outline"
                    className="font-bold rounded-xl"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                {(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] as const).map((status) => (
                    <Button
                        key={status}
                        variant={selectedStatus === status ? "default" : "outline"}
                        onClick={() => setSelectedStatus(status)}
                        className={`rounded-xl ${selectedStatus === status ? 'bg-[#000080]' : ''}`}
                    >
                        {status === 'PENDING' && <Clock className="w-4 h-4 mr-2" />}
                        {status === 'APPROVED' && <CheckCircle className="w-4 h-4 mr-2" />}
                        {status === 'REJECTED' && <XCircle className="w-4 h-4 mr-2" />}
                        {status === 'COMPLETED' && <CheckCircle className="w-4 h-4 mr-2" />}
                        {status} ({requests.length})
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                    <p className="mt-2 text-slate-500">Memuat permintaan...</p>
                </div>
            ) : requests.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
                    <CardContent className="py-12 text-center">
                        <Key className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600">Tidak ada permintaan</h3>
                        <p className="text-slate-500 mt-1">
                            Tidak ada permintaan reset password dengan status "{selectedStatus}"
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {selectedStatus === 'PENDING' && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertTitle className="text-blue-800 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Perhatian
                            </AlertTitle>
                            <AlertDescription className="text-blue-700 text-sm">
                                Setiap persetujuan akan menghasilkan password default baru. Pastikan untuk mencatat password default dan berikan kepada user.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        {requests.map((request) => (
                            <Card key={request.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="w-5 h-5 text-slate-500" />
                                                {request.user_name}
                                            </CardTitle>
                                            <div className="flex flex-wrap gap-2">
                                                {getStatusBadge(request.status)}
                                                {getRoleBadge(request.user_role)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDateTime(request.requested_at)}
                                            </div>
                                            {request.processed_at && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Diproses: {formatDateTime(request.processed_at)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Kontak
                                            </p>
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="font-medium">{request.user_email}</p>
                                                <p className="text-sm text-slate-500">User ID: {request.user_id}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4" />
                                                Alasan
                                            </p>
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="font-medium">{request.reason}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {request.notes && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-700">Catatan Admin</p>
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                <p className="font-medium">{request.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    {request.default_password && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Key className="w-4 h-4" />
                                                Password Default
                                            </p>
                                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex items-center justify-between">
                                                    <code className="font-mono text-lg font-bold tracking-wider">
                                                        {request.default_password}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(request.default_password!);
                                                            toast.success("Password berhasil disalin");
                                                        }}
                                                    >
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Salin
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2">
                                                    Password ini telah diberikan kepada user. User harus login dengan password ini dan menggantinya.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {request.processed_by && (
                                        <div className="text-sm text-slate-500">
                                            Diproses oleh: <span className="font-semibold">{request.processed_by}</span>
                                        </div>
                                    )}

                                    {selectedStatus === 'PENDING' && (
                                        <div className="pt-4 border-t border-slate-100 space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Catatan Tindakan</label>
                                                <Textarea
                                                    placeholder="Isi catatan untuk user (wajib diisi jika menyetujui)..."
                                                    value={actionNotes}
                                                    onChange={(e) => setActionNotes(e.target.value)}
                                                    className="min-h-[80px]"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    onClick={() => handleAction(request.id, 'approve')}
                                                    disabled={processingRequest === request.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {processingRequest === request.id ? (
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Setujui & Reset Password
                                                </Button>
                                                <Button
                                                    onClick={() => handleAction(request.id, 'reject')}
                                                    disabled={processingRequest === request.id}
                                                    variant="outline"
                                                    className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                                                >
                                                    {processingRequest === request.id ? (
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Tolak Permintaan
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedStatus === 'APPROVED' && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <Button
                                                onClick={() => handleAction(request.id, 'complete')}
                                                disabled={processingRequest === request.id}
                                                variant="outline"
                                                className="border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                                            >
                                                {processingRequest === request.id ? (
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                )}
                                                Tandai sebagai Selesai
                                            </Button>
                                            <p className="text-sm text-slate-500 mt-2">
                                                Tandai sebagai selesai setelah user mengonfirmasi telah login dengan password default.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}