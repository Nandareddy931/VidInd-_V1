import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
    LayoutDashboard,
    Users,
    Video,
    MessageSquare,
    Flag,
    BarChart3,
    Shield,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { name: "Users", to: "/admin/users", icon: Users },
    { name: "Videos", to: "/admin/videos", icon: Video },
    { name: "Comments", to: "/admin/comments", icon: MessageSquare },
    { name: "Reports", to: "/admin/reports", icon: Flag },
    { name: "Analytics", to: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    function NavLinks() {
        return (
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active =
                        item.to === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/10 transition",
                                active && "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                            )}
                        >
                            <Icon size={20} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        );
    }

    return (
        <div className="min-h-screen bg-[#07111f] text-white flex">
            <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-[#0b1628]">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                            <Shield />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">VidInd</h1>
                            <p className="text-sm text-purple-300">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <NavLinks />

                <div className="p-4 border-t border-white/10">
                    <button className="flex items-center gap-3 text-slate-300 hover:text-white">
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setOpen(false)}
                    />

                    <aside className="relative h-full w-72 bg-[#0b1628] border-r border-white/10 flex flex-col">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                                    <Shield />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">VidInd</h1>
                                    <p className="text-sm text-purple-300">Admin Panel</p>
                                </div>
                            </div>

                            <button onClick={() => setOpen(false)}>
                                <X />
                            </button>
                        </div>

                        <NavLinks />
                    </aside>
                </div>
            )}

            <main className="flex-1 min-w-0">
                <header className="h-20 border-b border-white/10 bg-[#0b1628]/80 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden rounded-xl border border-white/10 p-2"
                            onClick={() => setOpen(true)}
                        >
                            <Menu />
                        </button>

                        <div>
                            <h2 className="text-lg md:text-xl font-bold">VidInd Admin</h2>
                            <p className="text-xs md:text-sm text-slate-400">
                                Manage complete platform
                            </p>
                        </div>
                    </div>

                    <button className="hidden sm:block rounded-xl border border-white/10 px-4 py-2 text-sm">
                        <Settings size={16} className="inline mr-2" />
                        Settings
                    </button>
                </header>

                <section className="p-4 md:p-6 overflow-x-hidden">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}