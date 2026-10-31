"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Eye, Mail, CheckCircle2, XCircle } from "lucide-react";

interface Course {
  name: string;
}

interface Campaign {
  id: string;
  subject: string;
  message: string;
  courseId: string;
  course: Course;
  createdBy: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface RecipientLog {
  id: string;
  email: string;
  status: "SENT" | "FAILED";
  errorMessage?: string;
  sentAt?: string;
  student: { fullName: string };
}

interface DetailedCampaign extends Campaign {
  recipients: RecipientLog[];
}

export default function EmailHistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected details modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailedCampaign, setDetailedCampaign] = useState<DetailedCampaign | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest<Campaign[]>("/messages/email/history");
      if (res.success) {
        setCampaigns(res.data || []);
      } else {
        toast.error(res.message || "Failed to load history.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to history logs API.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await apiRequest<DetailedCampaign>(`/messages/email/history/${id}`);
      if (res.success && res.data) {
        setDetailedCampaign(res.data);
      } else {
        toast.error("Failed to retrieve campaign details.");
        setSelectedId(null);
      }
    } catch (err) {
      console.error(err);
      setSelectedId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchCampaignDetails(selectedId);
    } else {
      setDetailedCampaign(null);
    }
  }, [selectedId]);

  if (loading && campaigns.length === 0) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-black/10 rounded w-48" /><div className="h-64 bg-black/10 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Campaign History</h2>
        <p className="font-body text-sm text-[#111111]/60 m-0">Review dispatched email campaigns, delivery statistics, and recipient logs</p>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        {campaigns.length > 0 ? (
          <table className="min-w-full divide-y divide-brand-neutral-200/50 font-body text-sm text-left">
            <thead className="bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-brand-neutral-600">
              <tr>
                <th className="px-6 py-4">Campaign Subject</th>
                <th className="px-6 py-4">Target Course</th>
                <th className="px-6 py-4">Recipients</th>
                <th className="px-6 py-4">Sent/Failed</th>
                <th className="px-6 py-4">Date Dispatched</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-neutral-200/40 text-[#111111]">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-brand-neutral-100/20">
                  <td className="px-6 py-4 font-bold whitespace-nowrap">{camp.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{camp.course?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{camp.totalRecipients} students</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[#4ECDC4] font-bold">{camp.sentCount} ✓</span>
                    <span className="text-red-500 font-bold ml-2">{camp.failedCount} ✕</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-brand-neutral-400">
                    {new Date(camp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedId(camp.id)}
                      className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-[#F7F5F0] hover:bg-brand-neutral-200 text-brand-neutral-700 rounded text-xs font-bold transition-all border-0 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-48 flex items-center justify-center font-body text-sm text-brand-neutral-400">No campaigns sent yet.</div>
        )}
      </div>

      {/* Campaign Details Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedId(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-brand-neutral-200 z-10 flex flex-col max-h-[85vh]">
            <div className="p-6 bg-[#111111] text-white flex justify-between items-center">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#D4A017] m-0">Campaign Delivery Logs</h3>
              <button onClick={() => setSelectedId(null)} className="text-white/60 hover:text-white bg-transparent border-0 cursor-pointer font-bold">✕</button>
            </div>

            {loadingDetails || !detailedCampaign ? (
              <div className="h-64 flex items-center justify-center text-xs font-bold text-brand-neutral-400">Loading delivery details...</div>
            ) : (
              <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-body text-[#111111]/70 bg-[#F7F5F0] p-4 rounded-lg border border-brand-neutral-200">
                  <div className="col-span-2">
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">Subject</span>
                    {detailedCampaign.subject}
                  </div>
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">Sent By</span>
                    {detailedCampaign.createdBy}
                  </div>
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">Date</span>
                    {new Date(detailedCampaign.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>

                {/* Template body */}
                <div className="space-y-1">
                  <span className="font-bold text-[10px] text-brand-neutral-400 uppercase tracking-widest">Message template</span>
                  <div className="bg-[#F7F5F0] p-3 border border-brand-neutral-200/50 rounded font-mono text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {detailedCampaign.message}
                  </div>
                </div>

                {/* Recipient breakdown logs */}
                <div className="space-y-2">
                  <span className="font-bold text-[10px] text-brand-neutral-400 uppercase tracking-widest">Recipient Delivery logs ({detailedCampaign.recipients.length})</span>
                  <div className="border border-brand-neutral-200/50 rounded overflow-hidden max-h-56 overflow-y-auto">
                    <table className="min-w-full divide-y divide-brand-neutral-200/40 text-left">
                      <thead className="bg-[#F7F5F0] text-[9px] font-bold uppercase tracking-wider text-brand-neutral-400">
                        <tr>
                          <th className="px-4 py-2.5">Student</th>
                          <th className="px-4 py-2.5">Email Address</th>
                          <th className="px-4 py-2.5">Delivery Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-neutral-200/30 text-[#111111] bg-white">
                        {detailedCampaign.recipients.map((rec) => (
                          <tr key={rec.id} className="hover:bg-brand-neutral-100/10">
                            <td className="px-4 py-2.5 font-semibold">{rec.student?.fullName}</td>
                            <td className="px-4 py-2.5">{rec.email}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                rec.status === "SENT" ? "text-[#4ECDC4]" : "text-red-500"
                              }`}>
                                {rec.status === "SENT" ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> SENT
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" /> FAILED
                                    {rec.errorMessage && <span className="text-[10px] font-normal text-red-400">({rec.errorMessage})</span>}
                                  </>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
