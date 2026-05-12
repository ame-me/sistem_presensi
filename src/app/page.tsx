"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    switch (currentUser.role) {
      case "ADMIN":
      case "ADMIN_TU":
        router.replace("/admin/dashboard");
        break;
      case "ADMIN_IT":
        router.replace("/it/dashboard");
        break;
      case "GURU":
        router.replace("/guru/dashboard");
        break;
      case "ORTU":
        router.replace("/ortu/dashboard");
        break;
    }
  }, [currentUser, router]);

  return null;
}
