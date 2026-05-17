"use client";

import { useState } from "react";
import { useAppStore, type User } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Mail, Phone, Key, Shield, Edit2, Save, X, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api-config";

interface PasswordChangeForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface ProfileEditForm {
    name: string;
    phone: string;
    namaAyah?: string;
    pekerjaanAyah?: string;
    namaIbu?: string;
    pekerjaanIbu?: string;
}

interface ExtendedUser extends User {
    namaAyah?: string;
    pekerjaanAyah?: string;
    namaIbu?: string;
    pekerjaanIbu?: string;
}

export function ProfilePage() {
    const currentUser = useAppStore((s) => s.currentUser);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [resetRequest, setResetRequest] = useState({ reason: "" });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isRequestingReset, setIsRequestingReset] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState<ProfileEditForm>({
        name: "",
        phone: ""
    });

    if (!currentUser) {
        return null;
    }

    const handleEditClick = () => {
        const extUser = currentUser as ExtendedUser;
        setEditForm({
            name: currentUser.name,
            phone: currentUser.phone || "",
            namaAyah: extUser.namaAyah || "",
            pekerjaanAyah: extUser.pekerjaanAyah || "",
            namaIbu: extUser.namaIbu || "",
            pekerjaanIbu: extUser.pekerjaanIbu || ""
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({ name: "", phone: "" });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editForm.name.trim()) {
            toast.error("Nama tidak boleh kosong");
            return;
        }

        setIsSaving(true);

        try {
            let apiEndpoint = "";
            let requestBody: Record<string, string> = {};

            if (currentUser.role === "ORTU") {
                apiEndpoint = `${getApiBaseUrl()}/ortu/update_profile.php`;
                requestBody = {
                    nik: currentUser.nik || currentUser.email,
                    name: editForm.name,
                    phone: editForm.phone || "",
                    namaAyah: editForm.namaAyah || "",
                    pekerjaanAyah: editForm.pekerjaanAyah || "",
                    namaIbu: editForm.namaIbu || "",
                    pekerjaanIbu: editForm.pekerjaanIbu || ""
                };
            } else {
                apiEndpoint = `${getApiBaseUrl()}/guru/update_profile.php`;
                requestBody = {
                    email: currentUser.email,
                    name: editForm.name,
                    phone: editForm.phone || ""
                };
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.status === "success") {
                toast.success("Profil berhasil diperbarui!");
                const updatedUser: ExtendedUser = {
                    ...currentUser,
                    name: editForm.name,
                    phone: editForm.phone
                };
                if (currentUser.role === "ORTU") {
                    updatedUser.namaAyah = editForm.namaAyah;
                    updatedUser.pekerjaanAyah = editForm.pekerjaanAyah;
                    updatedUser.namaIbu = editForm.namaIbu;
                    updatedUser.pekerjaanIbu = editForm.pekerjaanIbu;
                }
                useAppStore.setState({ currentUser: updatedUser });
                setIsEditing(false);
            } else {
                toast.error(data.message || "Gagal memperbarui profil");
            }
        } catch {
            console.error("Error saving profile");
            toast.error("Terjadi kesalahan saat menyimpan profil");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Password baru tidak sama dengan konfirmasi password");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error("Password baru minimal 6 karakter");
            return;
        }

        setIsChangingPassword(true);

        try {
            let apiEndpoint = "";
            let requestBody: Record<string, string> = {};

            if (currentUser.role === "ORTU") {
                apiEndpoint = `${getApiBaseUrl()}/ortu/index.php?action=change_password`;
                requestBody = {
                    nik: currentUser.nik || currentUser.email,
                    current_password: passwordForm.currentPassword,
                    new_password: passwordForm.newPassword
                };
            } else {
                apiEndpoint = `${getApiBaseUrl()}/guru/change_password.php`;
                requestBody = {
                    email: currentUser.email,
                    current_password: passwordForm.currentPassword,
                    new_password: passwordForm.newPassword
                };
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.status === "success") {
                toast.success("Password berhasil diubah!");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.message || "Gagal mengubah password. Periksa password lama Anda.");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Terjadi kesalahan saat mengubah password");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetRequest.reason.trim()) {
            toast.error("Harap isi alasan permintaan reset password");
            return;
        }

        setIsRequestingReset(true);

        try {
            const response = await fetch(`${getApiBaseUrl()}/system/password_reset_request.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    user_name: currentUser.name,
                    user_email: currentUser.email,
                    user_role: currentUser.role,
                    reason: resetRequest.reason,
                    requested_at: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.status === "success") {
                toast.success("Permintaan reset password telah dikirim ke Admin IT.");
                setResetRequest({ reason: "" });
            } else {
                toast.error(data.message || "Gagal mengirim permintaan reset password");
            }
        } catch (error) {
            console.error("Error requesting password reset:", error);
            toast.error("Terjadi kesalahan saat mengirim permintaan");
        } finally {
            setIsRequestingReset(false);
        }
    };

    const getRoleDisplay = () => {
        switch (currentUser.role) {
            case "ADMIN": return "Kepala Sekolah";
            case "ADMIN_IT": return "Admin IT";
            case "ADMIN_TU": return "Admin Tata Usaha";
            case "GURU": return "Guru";
            case "ORTU": return "Orang Tua";
            default: return currentUser.role;
        }
    };

    const renderEditForm = () => (
        <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="editName">Nama Lengkap</Label>
                    <Input
                        id="editName"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Masukkan nama lengkap"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="editPhone">Nomor Telepon</Label>
                    <Input
                        id="editPhone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08xxxxxxxxxx"
                    />
                </div>

                {currentUser.role === "ORTU" && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="editNamaAyah">Nama Ayah</Label>
                            <Input
                                id="editNamaAyah"
                                value={editForm.namaAyah || ""}
                                onChange={(e) => setEditForm(prev => ({ ...prev, namaAyah: e.target.value }))}
                                placeholder="Nama ayah"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editPekerjaanAyah">Pekerjaan Ayah</Label>
                            <Input
                                id="editPekerjaanAyah"
                                value={editForm.pekerjaanAyah || ""}
                                onChange={(e) => setEditForm(prev => ({ ...prev, pekerjaanAyah: e.target.value }))}
                                placeholder="Pekerjaan ayah"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editNamaIbu">Nama Ibu</Label>
                            <Input
                                id="editNamaIbu"
                                value={editForm.namaIbu || ""}
                                onChange={(e) => setEditForm(prev => ({ ...prev, namaIbu: e.target.value }))}
                                placeholder="Nama ibu"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editPekerjaanIbu">Pekerjaan Ibu</Label>
                            <Input
                                id="editPekerjaanIbu"
                                value={editForm.pekerjaanIbu || ""}
                                onChange={(e) => setEditForm(prev => ({ ...prev, pekerjaanIbu: e.target.value }))}
                                placeholder="Pekerjaan ibu"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#000080] hover:bg-[#000060]"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                </Button>
            </div>
        </form>
    );

    const renderProfileView = () => {
        const extUser = currentUser as ExtendedUser;
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-slate-700">Nama Lengkap</Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-medium">{currentUser.name}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-medium">{currentUser.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Role / Jabatan
                        </Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-medium">{getRoleDisplay()}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-700 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Nomor Telepon
                        </Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-medium">{currentUser.phone || "-"}</p>
                        </div>
                    </div>

                    {currentUser.nik && (
                        <div className="space-y-2">
                            <Label className="text-slate-700">NIK</Label>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-medium">{currentUser.nik}</p>
                            </div>
                        </div>
                    )}

                    {currentUser.teacherCode && (
                        <div className="space-y-2">
                            <Label className="text-slate-700">Kode Guru</Label>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-medium">{currentUser.teacherCode}</p>
                            </div>
                        </div>
                    )}

                    {currentUser.waliKelasRombelName && (
                        <div className="space-y-2">
                            <Label className="text-slate-700">Wali Kelas</Label>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-medium">{currentUser.waliKelasRombelName}</p>
                            </div>
                        </div>
                    )}

                    {currentUser.role === "ORTU" && (
                        <>
                            {extUser.namaAyah && (
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Nama Ayah</Label>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="font-medium">{extUser.namaAyah || "-"}</p>
                                    </div>
                                </div>
                            )}

                            {extUser.pekerjaanAyah && (
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Pekerjaan Ayah</Label>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="font-medium">{extUser.pekerjaanAyah || "-"}</p>
                                    </div>
                                </div>
                            )}

                            {extUser.namaIbu && (
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Nama Ibu</Label>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="font-medium">{extUser.namaIbu || "-"}</p>
                                    </div>
                                </div>
                            )}

                            {extUser.pekerjaanIbu && (
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Pekerjaan Ibu</Label>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="font-medium">{extUser.pekerjaanIbu || "-"}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Profil Pengguna</h1>
                    <p className="text-slate-600">Kelola informasi akun dan keamanan password Anda</p>
                </div>
                {!isEditing && (
                    <Button onClick={handleEditClick} variant="outline" className="border-[#000080] text-[#000080] hover:bg-slate-50">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profil
                    </Button>
                )}
            </div>

            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => { setActiveTab("profile"); setIsEditing(false); }}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "profile" ? "text-[#000080] border-b-2 border-[#000080]" : "text-slate-600 hover:text-slate-800"}`}
                >
                    <UserIcon className="w-4 h-4 inline-block mr-2" />
                    Informasi Profil
                </button>
                <button
                    onClick={() => { setActiveTab("password"); setIsEditing(false); }}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "password" ? "text-[#000080] border-b-2 border-[#000080]" : "text-slate-600 hover:text-slate-800"}`}
                >
                    <Key className="w-4 h-4 inline-block mr-2" />
                    Keamanan Password
                </button>
            </div>

            {activeTab === "profile" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            {isEditing ? "Edit Informasi Profil" : "Informasi Profil"}
                        </CardTitle>
                        <CardDescription>
                            {isEditing ? "Perbarui informasi Anda di bawah ini" : "Informasi pribadi dan kontak Anda"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? renderEditForm() : renderProfileView()}
                    </CardContent>
                </Card>
            )}

            {activeTab === "password" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                Ubah Password
                            </CardTitle>
                            <CardDescription>
                                Ubah password Anda yang sekarang
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            placeholder="Masukkan password saat ini"
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Password Baru</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="Minimal 6 karakter"
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            placeholder="Ketik ulang password baru"
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full bg-[#000080] hover:bg-[#000060]"
                                >
                                    {isChangingPassword ? "Mengubah Password..." : "Ubah Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Lupa Password?
                            </CardTitle>
                            <CardDescription>
                                Minta reset password ke Admin IT
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4 bg-amber-50 border-amber-200">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">Perhatian</AlertTitle>
                                <AlertDescription className="text-amber-700 text-sm">
                                    Password akan direset ke default oleh Admin IT. Setelah reset, Anda akan menerima notifikasi dan harus login dengan password default, kemudian ganti password Anda sendiri.
                                </AlertDescription>
                            </Alert>

                            <form onSubmit={handleResetRequest} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="resetReason">Alasan Permintaan Reset Password</Label>
                                    <textarea
                                        id="resetReason"
                                        value={resetRequest.reason}
                                        onChange={(e) => setResetRequest(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="Jelaskan alasan Anda meminta reset password..."
                                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#000080] focus:border-[#000080] min-h-[100px] resize-none"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={isRequestingReset}
                                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                >
                                    {isRequestingReset ? "Mengirim Permintaan..." : "Minta Reset Password ke Admin IT"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}