import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-10 h-10 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
                    <p className="text-slate-400 mt-2">
                        Anda tidak memiliki izin untuk mengakses halaman ini.
                    </p>
                </div>
                <Link href="/">
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
