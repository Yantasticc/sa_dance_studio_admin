"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Inbox,
  Sparkles,
  Mail,
  History,
  Cake,
  LogOut,
  Menu,
  X,
  Images,
  Award,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout, admin } = useAuth();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/students", icon: Users },
    { label: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { label: "Batches", href: "/dashboard/batches", icon: Calendar },
    { label: "Enquiries", href: "/dashboard/enquiries", icon: Inbox },
    { label: "Events", href: "/dashboard/events", icon: Sparkles },
    { label: "Media / Gallery", href: "/dashboard/media", icon: Images },
    { label: "Certifications", href: "/dashboard/certifications", icon: Award },
    { label: "Email Messages", href: "/dashboard/email-messages", icon: Mail },
    { label: "Email History", href: "/dashboard/email-history", icon: History },
    { label: "Birthday Emails", href: "/dashboard/birthday-emails", icon: Cake },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111111] text-white border-r border-white/5">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#D4A017] flex items-center justify-center font-bold text-sm tracking-tight text-white shadow-lg">
            S&A
          </div>
          <div>
            <h1 className="font-display text-sm font-extrabold tracking-wider uppercase text-white m-0">
              S&A STUDIO
            </h1>
            <p className="font-body text-[10px] text-white/40 uppercase tracking-widest m-0">
              Management Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#E91E8C]/15 to-[#D4A017]/5 text-[#E91E8C] border-l-2 border-[#E91E8C]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#E91E8C]" : "text-white/60"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-white/5 bg-white/2">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="min-w-0">
            <p className="font-body text-xs font-bold text-white truncate m-0">
              {admin?.name || "Sandip Wasnik"}
            </p>
            <p className="font-body text-[10px] text-white/40 truncate m-0">
              Studio Owner
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-[#E91E8C]/20 border-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#111111] text-white sticky top-0 z-40 border-b border-white/5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#D4A017] flex items-center justify-center font-bold text-xs tracking-tight text-white">
              S&A
            </div>
            <div>
              <h1 className="font-display text-xs font-extrabold tracking-widest uppercase text-white m-0">
                S&A STUDIO
              </h1>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-white/80 hover:text-white bg-transparent border-0 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40 bg-black lg:hidden"
              />
              {/* Drawer */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
