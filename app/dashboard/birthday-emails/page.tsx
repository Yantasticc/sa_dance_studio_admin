"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Cake, RefreshCw, Send, CheckCircle, XCircle } from "lucide-react";

interface BirthdayLog {
  id: string;
  studentId: string;
  birthdayDate: string;
  email: string;
  status: "SENT" | "FAILED" | "PENDING";
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  student: {
    fullName: string;
    course: { name: string };
    batch: { name: string };
  };
}

export default function BirthdayEmailsPage() {
  const [logs, setLogs] = useState<BirthdayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await apiRequest<BirthdayLog[]>("/birthday-emails/history");
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load birthday email history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunBirthdayJobManual = async () => {
    setRunningJob(true);
    try {
      const res = await apiRequest<any>("/birthday-emails/run", { method: "POST" });
      if (res.success && res.data) {
        const { totalBirthdays, sent, failed, alreadySent } = res.data;
        toast.success(
          `Birthday Job Completed: ${sent} Sent, ${failed} Failed, ${alreadySent} Already Sent (Total: ${totalBirthdays})`
        );
        fetchLogs();
      } else {
        toast.error(res.message || "Failed to trigger birthday email job.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error executing birthday email job.");
    } finally {
      setRunningJob(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">
            Automatic Birthday Emails
          </h2>
          <p className="font-body text-sm text-[#111111]/60 m-0">
            Daily 12:00 AM IST (Asia/Kolkata) automatic birthday email log history
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-brand-neutral-200 hover:bg-[#F7F5F0] text-brand-neutral-600 rounded-lg font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleRunBirthdayJobManual}
            disabled={runningJob}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded-lg font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg shadow-[#E91E8C]/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {runningJob ? "Running Job..." : "Run Job Now"}
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        <div className="p-4 bg-[#111111] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4 text-[#D4A017]" />
            <span className="font-display text-xs font-black uppercase tracking-wider text-white">
              Birthday Email Delivery History
            </span>
          </div>
          <span className="text-[10px] text-white/50 font-bold uppercase">
            Total Records: {logs.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-brand-neutral-400 font-body text-xs">
            Loading birthday log history...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-body text-xs">
              <thead>
                <tr className="bg-[#F7F5F0] border-b border-brand-neutral-200 text-brand-neutral-600 font-display uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-4">Birthday Date (IST)</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Course / Batch</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Sent At / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-200/50">
                {logs.map((log) => {
                  const isSent = log.status === "SENT";
                  return (
                    <tr key={log.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                      <td className="p-4 font-bold text-brand-black">{log.birthdayDate}</td>
                      <td className="p-4 font-bold text-brand-black">
                        🎂 {log.student?.fullName || log.studentId}
                      </td>
                      <td className="p-4 text-brand-neutral-600">
                        {log.student?.course?.name || "N/A"}
                      </td>
                      <td className="p-4 text-brand-neutral-600 font-mono text-[11px]">
                        {log.email}
                      </td>
                      <td className="p-4">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px] border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            SENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold text-[10px] border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-brand-neutral-500 text-[11px]">
                        {isSent && log.sentAt ? (
                          new Date(log.sentAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          }) + " IST"
                        ) : (
                          <span className="text-red-500 font-semibold">
                            {log.errorMessage || "Unknown failure"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-brand-neutral-400 font-body text-xs">
            <span>No birthday email logs recorded yet.</span>
          </div>
        )}
      </div>
    </div>
  );
}
