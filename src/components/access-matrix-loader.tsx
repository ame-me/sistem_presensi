"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function AccessMatrixLoader() {
    const fetchAccessMatrix = useAppStore((s) => s.fetchAccessMatrix);

    useEffect(() => {
        void fetchAccessMatrix();
    }, [fetchAccessMatrix]);

    return null;
}
