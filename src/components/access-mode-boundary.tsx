"use client";

import type { AccessLevel } from "@/lib/access-control";
import { toast } from "sonner";
import { type FormEvent, type MouseEvent, type ReactNode } from "react";

const MUTATION_WORDS = [
    "tambah",
    "simpan",
    "update",
    "perbarui",
    "hapus",
    "delete",
    "edit",
    "import",
    "upload",
    "reset",
    "approve",
    "reject",
    "setujui",
    "tolak",
    "verifikasi",
    "ajukan",
    "kirim",
    "backup",
    "restore",
];

const SAFE_WORDS = [
    "lihat",
    "detail",
    "filter",
    "cari",
    "kembali",
    "batal",
    "tutup",
    "print",
    "cetak",
    "export",
    "download",
    "template",
    "refresh",
    "reset ke sekarang",
];

const isMutationControl = (element: Element) => {
    const label = (element.textContent || element.getAttribute("aria-label") || element.getAttribute("title") || "")
        .toLowerCase()
        .trim();

    if (SAFE_WORDS.some((word) => label.includes(word))) return false;
    if (MUTATION_WORDS.some((word) => label.includes(word))) return true;

    const className = typeof element.getAttribute("class") === "string" ? element.getAttribute("class") || "" : "";
    return /\btext-red-|\bbg-red-|\btext-amber-|\bbg-amber-/.test(className);
};

export function AccessModeBoundary({ accessLevel, children }: { accessLevel: AccessLevel; children: ReactNode }) {
    const isViewOnly = accessLevel === "view";

    const blockViewOnlyAction = () => {
        toast.error("Akses halaman ini hanya view only. Operasi CRUD membutuhkan akses full.");
    };

    const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
        if (!isViewOnly) return;
        const target = event.target instanceof Element
            ? event.target.closest("button,[role='button'],a")
            : null;

        if (!target || !isMutationControl(target)) return;

        event.preventDefault();
        event.stopPropagation();
        blockViewOnlyAction();
    };

    const handleSubmitCapture = (event: FormEvent<HTMLDivElement>) => {
        if (!isViewOnly) return;
        event.preventDefault();
        event.stopPropagation();
        blockViewOnlyAction();
    };

    return (
        <div onClickCapture={handleClickCapture} onSubmitCapture={handleSubmitCapture}>
            {isViewOnly && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    Mode view only. Data dapat dilihat, tetapi aksi tambah, edit, hapus, import, reset, dan submit diblokir.
                </div>
            )}
            {children}
        </div>
    );
}
