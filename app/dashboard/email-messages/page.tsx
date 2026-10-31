"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../../lib/api/client";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Mail, CheckSquare, Square, Eye, Send, AlertTriangle } from "lucide-react";

interface Course {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  courseId: string;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  courseId: string;
  batchId: string;
  course: { name: string };
  batch: { name: string; startTime: string; endTime: string };
}

interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  skippedInvalid: number;
  results?: Array<{
    studentId: string;
    email: string;
    status: "SENT" | "FAILED";
    reason: string | null;
  }>;
}

export default function EmailMessagesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filter States
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Selection States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [invalidEmailsCount, setInvalidEmailsCount] = useState(0);

  // Composer States
  const [subject, setSubject] = useState("S&A Dance Studio - Class Update");
  const [message, setMessage] = useState(`Hello {{name}},

We hope you are doing well.

This is a reminder that tomorrow's dance class will start at 7 PM.

Please arrive 10 minutes early.

Regards,
Sandip Wasnik
S&A Dance Studio`);

  // Preview States
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewStudentName, setPreviewStudentName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Result States
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [sending, setSending] = useState(false);

  const fetchFilters = async () => {
    try {
      const [coursesRes, batchesRes] = await Promise.all([
        apiRequest<Course[]>("/courses"),
        apiRequest<Batch[]>("/batches"),
      ]);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (batchesRes.success) setBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load options.");
    }
  };

  const fetchStudents = async () => {
    if (!selectedCourseId) {
      setStudents([]);
      setSelectedStudentIds([]);
      setInvalidEmailsCount(0);
      return;
    }

    try {
      const res = await apiRequest<any>("/students", {
        params: {
          limit: 1000, // Fetch all for bulk selection
          courseId: selectedCourseId,
          batchId: selectedBatchId || undefined,
          status: "ACTIVE",
        },
      });

      if (res.success && res.data) {
        const studentList: Student[] = res.data.students || [];
        setStudents(studentList);

        // Pre-validate emails and select all valid ones
        const validIds = studentList
          .filter((s) => s.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))
          .map((s) => s.id);
        setSelectedStudentIds(validIds);

        const invalid = studentList.length - validIds.length;
        setInvalidEmailsCount(invalid);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedCourseId, selectedBatchId]);

  const handleToggleSelectAll = () => {
    const validStudents = students.filter(
      (s) => s.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)
    );

    if (selectedStudentIds.length === validStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(validStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds((prev) => prev.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds((prev) => [...prev, id]);
    }
  };

  const fetchPreview = async () => {
    if (selectedStudentIds.length === 0 || !subject.trim() || !message.trim()) {
      setPreviewMessage("");
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await apiRequest("/messages/email/preview", {
        method: "POST",
        body: JSON.stringify({
          studentIds: [selectedStudentIds[0]], // only need one for sample
          subject,
          message,
        }),
      });

      if (res.success && res.data) {
        setPreviewSubject(res.data.previewSubject);
        setPreviewMessage(res.data.previewMessage);
        setPreviewStudentName(res.data.sampleRecipient?.fullName || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 600);
    return () => clearTimeout(timer);
  }, [subject, message, selectedStudentIds]);

  const handleSendMail = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter an email subject.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setSending(true);
    setCampaignResult(null);

    try {
      const res = await apiClient.post("/messages/email/bulk", {
        studentIds: selectedStudentIds,
        subject,
        message,
      });

      if (res.success && res.data) {
        toast.success(`Email campaign sent successfully to ${res.data.sent} students.`);
        setCampaignResult(res.data);
      } else {
        toast.error(res.message || "Unable to send email. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "SMTP server connection failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Bulk Email Dispatcher</h2>
        <p className="font-body text-sm text-[#111111]/60 m-0">Compose and send class schedule updates to targeted student lists</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composer Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Targets */}
          <div className="bg-white p-6 rounded-xl border border-brand-neutral-200/50 shadow-md space-y-4">
            <h3 className="font-display text-xs font-black uppercase tracking-wider text-[#111111] m-0">1. Target Audience</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold uppercase text-brand-neutral-600">Select Course</label>
                <select
                  className="px-3 py-2.5 bg-[#F7F5F0] border border-brand-neutral-200 rounded-lg font-body text-xs font-semibold outline-none cursor-pointer"
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedBatchId("");
                  }}
                >
                  <option value="">— Select Course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold uppercase text-brand-neutral-600">Select Batch (Optional)</label>
                <select
                  className="px-3 py-2.5 bg-[#F7F5F0] border border-brand-neutral-200 rounded-lg font-body text-xs font-semibold outline-none cursor-pointer"
                  value={selectedBatchId}
                  disabled={!selectedCourseId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="">All Batches</option>
                  {batches
                    .filter((b) => b.courseId === selectedCourseId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Message content */}
          <div className="bg-white p-6 rounded-xl border border-brand-neutral-200/50 shadow-md space-y-4">
            <h3 className="font-display text-xs font-black uppercase tracking-wider text-[#111111] m-0">2. Compose Mail</h3>

            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs font-bold uppercase text-brand-neutral-600">Subject</label>
              <input
                type="text"
                className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-display text-xs font-bold uppercase text-brand-neutral-600">Message Body</label>
                <span className="text-[10px] font-bold text-brand-neutral-400">Characters: {message.length}</span>
              </div>
              <textarea
                rows={10}
                className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded p-4 outline-none focus:border-[#E91E8C] w-full resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <span className="text-[10px] text-brand-neutral-400 mt-1">
                Supported Placeholders: <code className="bg-[#F7F5F0] px-1 py-0.5 rounded font-mono font-bold text-[#E91E8C]">{`{{name}}`}</code>, <code className="bg-[#F7F5F0] px-1 py-0.5 rounded font-mono font-bold text-[#E91E8C]">{`{{course}}`}</code>, <code className="bg-[#F7F5F0] px-1 py-0.5 rounded font-mono font-bold text-[#E91E8C]">{`{{batch}}`}</code>, <code className="bg-[#F7F5F0] px-1 py-0.5 rounded font-mono font-bold text-[#E91E8C]">{`{{date}}`}</code>, <code className="bg-[#F7F5F0] px-1 py-0.5 rounded font-mono font-bold text-[#E91E8C]">{`{{time}}`}</code>
              </span>
            </div>

            {/* Live Preview Section */}
            <div className="flex flex-col gap-1.5 mt-6 border-t border-brand-neutral-200/50 pt-6">
              <div className="flex justify-between items-center">
                <label className="font-display text-xs font-bold uppercase text-brand-neutral-600">Email Preview</label>
                {previewLoading && <span className="text-[10px] text-[#E91E8C] font-bold animate-pulse">Generating...</span>}
              </div>
              
              {previewMessage ? (
                <div className="relative rounded-lg overflow-hidden border border-brand-neutral-200 shadow-sm">
                  <iframe
                    className="w-full h-[350px] bg-white border-0 block"
                    srcDoc={previewMessage}
                    title="Email Preview"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold">
                    Sample for: {previewStudentName || "Student"}
                  </div>
                </div>
              ) : (
                <div className="w-full h-[150px] bg-[#F7F5F0] rounded-lg border border-brand-neutral-200 flex items-center justify-center text-brand-neutral-400 font-body text-xs">
                  {selectedStudentIds.length === 0 ? "Select at least one student to view preview." : "Enter subject and message to see preview."}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-brand-neutral-200/50">
              <div className="text-xs font-bold text-brand-neutral-600">
                {selectedStudentIds.length > 0 ? (
                  <span className="text-[#E91E8C]">{selectedStudentIds.length} students selected</span>
                ) : (
                  <span>No students selected</span>
                )}
              </div>
              <button
                onClick={handleSendMail}
                disabled={sending || selectedStudentIds.length === 0}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#E91E8C] hover:bg-[#D81B80] text-white rounded-lg font-display text-sm font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg shadow-[#E91E8C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" /> 
                {sending ? "Sending..." : "Send Mail"}
              </button>
            </div>
          </div>
        </div>

        {/* Recipients checklist */}
        <div className="bg-white p-6 rounded-xl border border-brand-neutral-200/50 shadow-md flex flex-col h-[500px]">
          <div className="flex justify-between items-center border-b border-brand-neutral-200 pb-3 mb-4">
            <div>
              <h3 className="font-display text-xs font-black uppercase tracking-wider text-[#111111] m-0">3. Recipients</h3>
              <span className="text-[10px] font-bold text-brand-neutral-400">Selected: {selectedStudentIds.length} students</span>
            </div>
            {students.length > 0 && (
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1 bg-transparent border-0 font-display text-[10px] font-bold uppercase tracking-wider text-[#E91E8C] hover:text-[#E91E8C]/80 cursor-pointer"
              >
                {selectedStudentIds.length === students.filter(s => s.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)).length ? (
                  <>Deselect All</>
                ) : (
                  <>Select All</>
                )}
              </button>
            )}
          </div>

          {invalidEmailsCount > 0 && (
            <div className="p-3 mb-3 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded text-[10px] text-brand-neutral-700 flex items-start gap-2 font-body font-semibold">
              <AlertTriangle className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
              <div>
                <span>{invalidEmailsCount} students hidden due to missing or invalid email structures.</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {students.length > 0 ? (
              students
                .filter((s) => s.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))
                .map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleSelectStudent(student.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-gradient-to-r from-[#E91E8C]/10 to-transparent border-[#E91E8C]/20"
                          : "bg-[#F7F5F0]/40 border-brand-neutral-200/40 hover:bg-[#F7F5F0]"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#E91E8C] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-brand-neutral-400 shrink-0" />
                      )}
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-[#111111] m-0 truncate">{student.fullName}</p>
                        <p className="text-brand-neutral-400 m-0 truncate">{student.email}</p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="h-48 flex items-center justify-center text-brand-neutral-400 font-body text-xs text-center px-4">
                <span>Select a target course to view and filter recipients.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Result Report Box */}
      {campaignResult && (
        <div className="bg-[#111111] text-white p-6 rounded-xl border border-white/5 shadow-lg max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#4ECDC4]" />
            <h3 className="font-display text-sm font-black uppercase tracking-wider text-white m-0">Campaign Summary Result</h3>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center font-body text-xs">
            <div className="p-3 bg-white/5 rounded">
              <span className="block text-[10px] text-white/50 uppercase">Total Recipient</span>
              <span className="block font-display text-xl font-black text-white mt-1">{campaignResult.total}</span>
            </div>
            <div className="p-3 bg-[#4ECDC4]/10 rounded border border-[#4ECDC4]/20">
              <span className="block text-[10px] text-[#4ECDC4]/70 uppercase">Sent Success</span>
              <span className="block font-display text-xl font-black text-[#4ECDC4] mt-1">{campaignResult.sent}</span>
            </div>
            <div className="p-3 bg-red-500/15 rounded border border-red-500/25">
              <span className="block text-[10px] text-red-400 uppercase">Failed</span>
              <span className="block font-display text-xl font-black text-red-500 mt-1">{campaignResult.failed}</span>
            </div>
            <div className="p-3 bg-white/5 rounded">
              <span className="block text-[10px] text-white/50 uppercase">Skipped Blank</span>
              <span className="block font-display text-xl font-black text-white mt-1">{campaignResult.skippedInvalid}</span>
            </div>
          </div>

          {campaignResult.failed > 0 && campaignResult.results && (
            <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
              <span className="block text-[10px] font-bold tracking-widest text-red-400 uppercase">Failed Recipients Details</span>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {campaignResult.results
                  .filter((r) => r.status === "FAILED")
                  .map((r, idx) => {
                    const studentObj = students.find((s) => s.id === r.studentId);
                    return (
                      <div key={idx} className="flex justify-between items-start text-xs p-2 rounded bg-red-500/10 border border-red-500/20 font-body">
                        <div>
                          <div className="font-bold text-white">{studentObj?.fullName || "Student ID: " + r.studentId}</div>
                          <div className="text-[10px] text-white/60">{r.email}</div>
                        </div>
                        <div className="text-[10px] text-red-400 font-semibold">{r.reason || "SMTP delivery failure"}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
