"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import { toast } from "../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  Inbox,
  Cake,
  PlusCircle,
  PlusSquare,
  MessageSquare,
  Send,
  ExternalLink,
} from "lucide-react";

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  upcomingEvents: number;
  newEnquiries: number;
  todayBirthdaysCount: number;
}

interface BirthdayStudent {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  dateOfBirth: string;
  courseName: string;
  age: number;
  birthdayEmailStatus?: "SENT" | "FAILED" | "NOT_SENT";
  birthdayEmailSentAt?: string | null;
  birthdayEmailError?: string | null;
}

interface UpcomingBirthday {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  dateOfBirth: string;
  courseName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayStudent[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);

  // WhatsApp Birthday Modal State
  const [selectedStudent, setSelectedStudent] = useState<BirthdayStudent | null>(null);
  const [editedMessage, setEditedMessage] = useState("");

  const fetchDashboardData = async () => {
    try {
      const [statsRes, todayBirthRes, upcomingBirthRes] = await Promise.all([
        apiRequest<Stats>("/dashboard/stats"),
        apiRequest<BirthdayStudent[]>("/students/birthdays/today"),
        apiRequest<UpcomingBirthday[]>("/students/birthdays/upcoming"),
      ]);

      if (statsRes.success) setStats(statsRes.data || null);
      if (todayBirthRes.success) setTodayBirthdays(todayBirthRes.data || []);
      if (upcomingBirthRes.success) setUpcomingBirthdays(upcomingBirthRes.data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenBirthdayModal = (student: BirthdayStudent) => {
    const template = `🎉 Happy Birthday, ${student.fullName}!

Wishing you a wonderful birthday filled with happiness, joy and lots of amazing moments.

Have a fantastic year ahead!

Regards,
Sandip Wasnik
S&A Dance Studio`;

    setSelectedStudent(student);
    setEditedMessage(template);
  };

  const handleSendBirthdayWhatsApp = () => {
    if (!selectedStudent) return;


    const rawNumber = selectedStudent.whatsappNumber || selectedStudent.phone;
    if (!rawNumber) {
      toast.error("No valid phone number found for this student.");
      return;
    }

    let cleanNumber = rawNumber.replace(/\D/g, "");
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(editedMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-8 bg-black/10 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-black/10 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-black/10 rounded-xl" />
          <div className="h-96 bg-black/10 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">
          Studio Overview
        </h2>
        <p className="font-body text-sm text-[#111111]/60 m-0">
          Quick metrics and dashboard actions
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111111] text-white p-6 rounded-xl border border-white/5 shadow-lg">
        <h3 className="font-display text-xs font-black uppercase tracking-widest text-[#D4A017] mb-4 m-0">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/dashboard/students?action=add")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-body text-xs font-bold transition-all border-0 cursor-pointer text-left"
          >
            <PlusCircle className="w-4 h-4 text-[#4ECDC4]" />
            Add Student
          </button>
          <button
            onClick={() => router.push("/dashboard/courses")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-body text-xs font-bold transition-all border-0 cursor-pointer text-left"
          >
            <PlusSquare className="w-4 h-4 text-[#E91E8C]" />
            Add Course
          </button>
          <button
            onClick={() => router.push("/dashboard/batches")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-body text-xs font-bold transition-all border-0 cursor-pointer text-left"
          >
            <PlusCircle className="w-4 h-4 text-[#D4A017]" />
            Add Batch
          </button>
          <button
            onClick={() => router.push("/dashboard/events")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-body text-xs font-bold transition-all border-0 cursor-pointer text-left"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Add Event
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Total Students", value: stats?.totalStudents || 0, icon: Users, color: "text-[#E91E8C] bg-[#E91E8C]/10" },
          { label: "Active Students", value: stats?.activeStudents || 0, icon: Users, color: "text-[#4ECDC4] bg-[#4ECDC4]/10" },
          { label: "Active Courses", value: stats?.totalCourses || 0, icon: BookOpen, color: "text-[#D4A017] bg-[#D4A017]/10" },
          { label: "Upcoming Events", value: stats?.upcomingEvents || 0, icon: Calendar, color: "text-purple-500 bg-purple-500/10" },
          { label: "New Enquiries", value: stats?.newEnquiries || 0, icon: Inbox, color: "text-blue-500 bg-blue-500/10" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white p-5 rounded-xl border border-brand-neutral-200/50 shadow-md flex items-center justify-between"
            >
              <div>
                <span className="block font-body text-xs font-bold text-brand-neutral-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="block font-display text-2xl font-black text-[#111111] mt-1">
                  {stat.value}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Birthday Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Birthdays */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-brand-neutral-200/50 shadow-md flex flex-col">
          <div className="flex items-center justify-between border-b border-brand-neutral-200/50 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <Cake className="w-5 h-5 text-[#E91E8C]" />
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-[#111111] m-0">
                  Today's Birthdays
                </h3>
                <p className="font-body text-xs text-brand-neutral-400 m-0">
                  Daily 12:00 AM IST automatic birthday emails & manual WhatsApp wishing
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await apiRequest<any>("/birthday-emails/run", { method: "POST" });
                  if (res.success && res.data) {
                    toast.success(`Birthday Job: ${res.data.sent} Sent, ${res.data.alreadySent} Already Sent`);
                    fetchDashboardData();
                  }
                } catch (e: any) {
                  toast.error("Failed to run birthday job.");
                }
              }}
              className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white rounded font-display text-[10px] font-bold uppercase tracking-wider border-0 cursor-pointer"
            >
              Run Birthday Job
            </button>
          </div>

          <div className="flex-1">
            {todayBirthdays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {todayBirthdays.map((student) => (
                  <motion.div
                    key={student.id}
                    className="p-4 rounded-lg bg-[#F7F5F0] border border-brand-neutral-200 flex flex-col justify-between"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-display text-sm font-extrabold text-[#111111] m-0 truncate">
                          🎂 {student.fullName}
                        </h4>
                        <span className="font-body text-xs bg-[#E91E8C]/10 text-[#E91E8C] px-2 py-0.5 rounded-full font-bold">
                          Age {student.age}
                        </span>
                      </div>
                      <p className="font-body text-xs text-brand-neutral-400 mt-1 mb-2">
                        Course: {student.courseName}
                      </p>

                      {/* Automatic Birthday Email Status Badge */}
                      <div className="mb-3 text-[11px] font-body">
                        {student.birthdayEmailStatus === "SENT" ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-block">
                            ✓ Email Sent Automatically
                          </span>
                        ) : student.birthdayEmailStatus === "FAILED" ? (
                          <span
                            className="text-red-700 font-bold bg-red-50 px-2 py-1 rounded border border-red-200 inline-block"
                            title={student.birthdayEmailError || ""}
                          >
                            ✕ Email Failed ({student.birthdayEmailError || "Delivery Error"})
                          </span>
                        ) : (
                          <span className="text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded border border-gray-200 inline-block">
                            ○ Email Not Sent
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenBirthdayModal(student)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded font-display text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-0 shadow"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Wish on WhatsApp
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-brand-neutral-400 font-body text-xs">
                <span>No student birthdays today.</span>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white p-6 rounded-xl border border-brand-neutral-200/50 shadow-md flex flex-col">
          <div className="flex items-center gap-3 border-b border-brand-neutral-200/50 pb-4 mb-5">
            <Calendar className="w-5 h-5 text-[#D4A017]" />
            <div>
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-[#111111] m-0">
                Next 7 Days Birthdays
              </h3>
              <p className="font-body text-xs text-brand-neutral-400 m-0">
                Upcoming celebrations
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1">
            {upcomingBirthdays.length > 0 ? (
              upcomingBirthdays.map((student) => {
                const dob = new Date(student.dateOfBirth);
                const day = dob.getDate();
                const month = dob.toLocaleString("en-IN", { month: "short" });
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#F7F5F0] border border-brand-neutral-200/40 text-xs"
                  >
                    <div>
                      <p className="font-display font-extrabold text-[#111111] m-0">
                        {student.fullName}
                      </p>
                      <p className="font-body text-[10px] text-brand-neutral-400 m-0">
                        {student.courseName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-black text-[#D4A017] uppercase tracking-wide">
                        {day} {month}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-32 flex items-center justify-center text-brand-neutral-400 font-body text-xs">
                <span>No upcoming birthdays.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action WhatsApp Message Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-black"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-neutral-200 z-10"
            >
              <div className="p-6 bg-[#111111] text-white flex justify-between items-center">
                <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#D4A017] m-0">
                  Compose WhatsApp Wish
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-white/60 hover:text-white bg-transparent border-0 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-body text-[#111111]/70 bg-[#F7F5F0] p-4 rounded-lg border border-brand-neutral-200">
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">Student</span>
                    {selectedStudent.fullName}
                  </div>
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">WhatsApp</span>
                    {selectedStudent.whatsappNumber || selectedStudent.phone}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">
                    Message Template
                  </label>
                  <textarea
                    rows={8}
                    className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded p-4 outline-none focus:border-[#E91E8C] w-full resize-none"
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 border border-brand-neutral-200 hover:bg-[#F7F5F0] rounded text-brand-neutral-600 font-display text-xs font-bold uppercase cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendBirthdayWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg shadow-[#E91E8C]/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Open WhatsApp
                    <ExternalLink className="w-3 h-3 text-white/50" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
