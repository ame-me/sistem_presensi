"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Filter, FileSpreadsheet } from "lucide-react";

const allData = [
    { id: 1, name: "Chandra Wijaya", cls: "7B", subject: "Matematika", teacher: "Drs. Budi Santoso", date: "2023-10-12", status: "ALPHA", color: "text-red-600 bg-red-100" },
    { id: 2, name: "Bunga Citra", cls: "7A", subject: "B. Indonesia", teacher: "Siti Aminah, S.Pd", date: "2023-10-12", status: "SAKIT", color: "text-blue-600 bg-blue-100" },
    { id: 3, name: "Andi Saputra", cls: "8A", subject: "IPA", teacher: "Ahmad F., S.Pd", date: "2023-10-13", status: "IZIN", color: "text-amber-600 bg-amber-100" },
    { id: 4, name: "Dewi Lestari", cls: "7A", subject: "B. Inggris", teacher: "Rahmawati, M.Pd", date: "2023-10-14", status: "ALPHA", color: "text-red-600 bg-red-100" },
];

export default function AnalitikPelajaranPage() {
    const [kelas, setKelas] = useState("all");
    const [status, setStatus] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredData, setFilteredData] = useState(allData);

    const handleFilter = () => {
        let result = allData;
        if (kelas !== "all") {
            result = result.filter(d => d.cls === kelas);
        }
        if (status !== "all") {
            result = result.filter(d => d.status.toLowerCase() === status.toLowerCase());
        }
        if (startDate) {
            result = result.filter(d => new Date(d.date) >= new Date(startDate));
        }
        if (endDate) {
            result = result.filter(d => new Date(d.date) <= new Date(endDate));
        }
        setFilteredData(result);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/mapel">
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full bg-white shadow-sm hover:bg-slate-50 border-slate-200">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080]">Analisa Lengkap Presensi</h1>
                    <p className="text-slate-500 font-medium mt-1">Laporan rekapitulasi data berdasarkan filter tanggal dan status.</p>
                </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-[#000080] text-lg">Filter Laporan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Pilih Kelas</Label>
                            <Select value={kelas} onValueChange={setKelas}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    <SelectItem value="7A">7A</SelectItem>
                                    <SelectItem value="7B">7B</SelectItem>
                                    <SelectItem value="8A">8A</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status Kehadiran</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Target Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="alpha">Alpha (Tanpa Keterangan)</SelectItem>
                                    <SelectItem value="izin">Izin</SelectItem>
                                    <SelectItem value="sakit">Sakit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Dari Tanggal</Label>
                            <Input type="date" className="bg-white" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sampai Tanggal</Label>
                            <Input type="date" className="bg-white" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Button onClick={handleFilter} variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 font-bold"><Filter className="w-4 h-4 mr-2" /> Terapkan Filter</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"><FileSpreadsheet className="w-4 h-4 mr-2" /> Export Hasil Excel</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-[#000080]">Nama Siswa</TableHead>
                            <TableHead className="font-bold text-[#000080]">Kelas</TableHead>
                            <TableHead className="font-bold text-[#000080]">Mata Pelajaran</TableHead>
                            <TableHead className="font-bold text-[#000080]">Guru Pengampu</TableHead>
                            <TableHead className="font-bold text-[#000080]">Tanggal</TableHead>
                            <TableHead className="font-bold text-[#000080]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row) => (
                                <TableRow key={row.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-bold text-slate-800">{row.name}</TableCell>
                                    <TableCell><span className="font-medium text-slate-700 border border-slate-200 px-2 py-1 bg-white rounded-md text-xs">{row.cls}</span></TableCell>
                                    <TableCell className="font-medium text-slate-700">{row.subject}</TableCell>
                                    <TableCell className="text-sm">{row.teacher}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">{row.date}</TableCell>
                                    <TableCell>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${row.color}`}>{row.status}</span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                                    Tidak ada data presensi yang sesuai dengan filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
