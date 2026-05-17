"use client";

import { ProfilePage } from "@/components/profile-page";
import { AccessGuard } from "@/components/access-guard";

export default function OrtuProfilePage() {
    return (
        <AccessGuard>
            <ProfilePage />
        </AccessGuard>
    );
}