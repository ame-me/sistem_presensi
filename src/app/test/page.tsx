import { AccessGuard } from "@/components/access-guard";

export default function TestPage() {
    return (
        <AccessGuard>
            <div>Test Page Works!</div>
        </AccessGuard>
    );
}
