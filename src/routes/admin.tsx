import { createFileRoute, redirect } from "@tanstack/react-router";
import AdminLayout from "@/components/admin/AdminLayout";
import { checkAdmin } from "@/hooks/useAdmin";

export const Route = createFileRoute("/admin")({
    beforeLoad: async () => {
        const isAdmin = await checkAdmin();

        if (!isAdmin) {
            throw redirect({ to: "/" });
        }
    },
    component: AdminLayout,
});