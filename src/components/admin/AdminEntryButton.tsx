import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { checkAdmin } from "@/hooks/useAdmin";

export default function AdminEntryButton() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdmin().then(setIsAdmin);
    }, []);

    if (!isAdmin) return null;

    return (
        <Link
            to="/admin"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition"
        >
            <ShieldCheck size={20} />
            Admin Panel
        </Link>
    );
}