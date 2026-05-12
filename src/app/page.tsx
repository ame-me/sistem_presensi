"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDefaultAccessiblePath, requiresTahunAjaran } from "@/lib/access-control";

export default function HomePage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const selectedTahunAjaran = useAppStore((s) => s.selectedTahunAjaran);
  const accessMatrix = useAppStore((s) => s.accessMatrix);
  const accessMatrixLoaded = useAppStore((s) => s.accessMatrixLoaded);
  const router = useRouter();

  useEffect(() => {
    if (!accessMatrixLoaded) return;

    if (!currentUser) {
      router.replace("/login");
      return;
    }
    const targetPath = getDefaultAccessiblePath(currentUser, accessMatrix);
    router.replace(requiresTahunAjaran(currentUser, targetPath) && !selectedTahunAjaran ? "/select-year" : targetPath);
  }, [currentUser, selectedTahunAjaran, accessMatrix, accessMatrixLoaded, router]);

  return null;
}
