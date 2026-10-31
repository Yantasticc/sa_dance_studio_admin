"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Eye, Send, ExternalLink } from "lucide-react";

interface Course {
  id: string;
  name: string;
}

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  age?: number;
  courseId: string;
  course: Course;
  preferredTiming?: string;
  message?: string;
  source: string;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
  createdAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination / Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  // Detail view drawer
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // WhatsApp composer drawer
  const [whatsappEnquiry, setWhatsappEnquiry] = useState<Enquiry | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>("/enquiries", {
        params: {
          page,
          limit: 15,
          status: statusFilter || undefined,
        },
      });

      if (res.success && res.data) {
        setEnquiries(res.data.enquiries || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        toast.error(res.message || "Failed to load enquiries list.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to enquiry API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [page, statusFilter]);

  const handleOpenWhatsAppDrawer = (enquiry: Enquiry) => {
    const courseTitle = enquiry.course?.name || "our classes";
    const template = `Hello ${enquiry.name},

Thank you for your enquiry regarding ${courseTitle} at S&A Dance Studio.

We have received your enquiry and would be happy to share the available batches and admission details.

Regards,
Sandip Wasnik
S&A Dance Studio`;

    setWhatsappEnquiry(enquiry);
    setWhatsappMessage(template);
  };

  const handleSendWhatsApp = () => {
    if (!whatsappEnquiry) return;
    const rawNumber = whatsappEnquiry.phone;
    if (!rawNumber) {
      toast.error("Enquirer phone number is not available.");
      return;
    }

    let cleanNumber = rawNumber.replace(/\D/g, "");
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setWhatsappEnquiry(null);
  };

  const handleStatusChange = async (enquiryId: string, nextStatus: string) => {
    try {
      const res = await apiRequest(`/enquiries/${enquiryId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.success) {
        toast.success(`Enquiry status changed to ${nextStatus}.`);
        fetchEnquiries();
      } else {
        toast.error(res.message || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to status updates.");
    }
  };

  if (loading && enquiries.length === 0) {
    return <div className="animate-pulse space-y-6"><div className="h-8 bg-black/10 rounded w-48" /><div className="h-64 bg-black/10 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Website Enquiries</h2>
          <p className="font-body text-sm text-[#111111]/60 m-0">Review and follow up with leads from the public website</p>
        </div>

        <select
          className="px-3 py-2 bg-white border border-brand-neutral-200 rounded-lg font-body text-xs font-semibold outline-none cursor-pointer"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Enquiries</option>
          <option value="NEW">NEW</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="CONVERTED">CONVERTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Enquiries list */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        {enquiries.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-brand-neutral-200/50 font-body text-sm text-left">
              <thead className="bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-brand-neutral-600">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Course Details</th>
                  <th className="px-6 py-4">Preferred Timing</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-200/40 text-[#111111]">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-brand-neutral-100/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold m-0">{enquiry.name}</p>
                      <span className="text-[10px] text-brand-neutral-400 font-semibold">{enquiry.email} | {enquiry.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold m-0">{enquiry.course?.name}</p>
                      {enquiry.age && <span className="text-[10px] text-brand-neutral-400 font-semibold">Age: {enquiry.age}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{enquiry.preferredTiming || "Not specified"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {new Date(enquiry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className={`px-2.5 py-1 rounded font-body text-xs font-bold border-0 cursor-pointer outline-none ${
                          enquiry.status === "NEW"
                            ? "bg-blue-500/10 text-blue-500"
                            : enquiry.status === "CONTACTED"
                            ? "bg-[#D4A017]/10 text-[#D4A017]"
                            : enquiry.status === "CONVERTED"
                            ? "bg-[#4ECDC4]/10 text-[#4ECDC4]"
                            : "bg-brand-neutral-400/10 text-brand-neutral-500"
                        }`}
                        value={enquiry.status}
                        onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="p-2 text-brand-neutral-600 hover:bg-[#F7F5F0] rounded cursor-pointer border-0 bg-transparent"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenWhatsAppDrawer(enquiry)}
                        className="p-2 text-[#4ECDC4] hover:bg-[#4ECDC4]/10 rounded cursor-pointer border-0 bg-transparent"
                        title="WhatsApp follow up"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-[#F7F5F0] border-t border-brand-neutral-200/50 flex items-center justify-between text-xs font-bold">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-brand-neutral-200 rounded hover:bg-[#111111] hover:text-white bg-white text-[#111111] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-brand-neutral-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-brand-neutral-200 rounded hover:bg-[#111111] hover:text-white bg-white text-[#111111] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="h-48 flex items-center justify-center font-body text-sm text-brand-neutral-400">No leads found.</div>
        )}
      </div>

      {/* Enquiry Detail Drawer */}
      <AnimatePresence>
        {selectedEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEnquiry(null)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative bg-white h-full w-full max-w-md shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center border-b border-brand-neutral-200 pb-4 mb-6">
                  <h3 className="font-display text-sm font-black uppercase tracking-wider text-[#111111] m-0">Enquiry Details</h3>
                  <button onClick={() => setSelectedEnquiry(null)} className="text-brand-neutral-400 hover:text-brand-black border-0 bg-transparent cursor-pointer font-bold">✕</button>
                </div>

                <div className="space-y-4 font-body text-sm text-brand-neutral-600">
                  <div>
                    <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">Enquirer Name</span>
                    <p className="text-brand-black font-bold m-0 mt-0.5">{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">Phone Number</span>
                    <p className="text-brand-black font-semibold m-0 mt-0.5">{selectedEnquiry.phone}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">Email Address</span>
                    <p className="text-brand-black font-semibold m-0 mt-0.5">{selectedEnquiry.email}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">Selected Course</span>
                    <p className="text-brand-black font-semibold m-0 mt-0.5">{selectedEnquiry.course?.name}</p>
                  </div>
                  {selectedEnquiry.age && (
                    <div>
                      <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">Age</span>
                      <p className="text-brand-black font-semibold m-0 mt-0.5">{selectedEnquiry.age} years old</p>
                    </div>
                  )}
                  {selectedEnquiry.preferredTiming && (
                    <div>
                      <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">Preferred Timing</span>
                      <p className="text-brand-black font-semibold m-0 mt-0.5">{selectedEnquiry.preferredTiming}</p>
                    </div>
                  )}
                  {selectedEnquiry.message && (
                    <div>
                      <span className="block text-[10px] font-bold text-brand-neutral-400 uppercase tracking-widest">User Message</span>
                      <p className="bg-[#F7F5F0] p-3 rounded border border-brand-neutral-200 text-brand-black mt-1 m-0 italic">"{selectedEnquiry.message}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-brand-neutral-200">
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="w-full py-3 bg-[#111111] hover:bg-black text-white rounded font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp follow-up Composer Drawer */}
      <AnimatePresence>
        {whatsappEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setWhatsappEnquiry(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-neutral-200 z-10 p-6"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-brand-neutral-200">
                <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#111111] m-0">WhatsApp Enquiry Follow-up</h3>
                <button onClick={() => setWhatsappEnquiry(null)} className="text-brand-neutral-400 hover:text-brand-black border-0 bg-transparent cursor-pointer font-bold">✕</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-body text-[#111111]/70 bg-[#F7F5F0] p-4 rounded-lg border border-brand-neutral-200">
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">Enquirer</span>
                    {whatsappEnquiry.name}
                  </div>
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-brand-neutral-400">Phone</span>
                    {whatsappEnquiry.phone}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Predefined Follow-up Message</label>
                  <textarea
                    rows={8}
                    className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded p-4 outline-none focus:border-[#E91E8C] w-full resize-none"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-neutral-200">
                  <button type="button" onClick={() => setWhatsappEnquiry(null)} className="px-4 py-2 border border-brand-neutral-200 rounded hover:bg-[#F7F5F0] text-brand-neutral-600 font-display text-xs font-bold uppercase cursor-pointer bg-white">Cancel</button>
                  <button
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" /> Send on WhatsApp <ExternalLink className="w-3 h-3 text-white/55" />
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
