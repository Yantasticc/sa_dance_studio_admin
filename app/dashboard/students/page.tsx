"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiRequest } from "../../../lib/api";
import { toast } from "../../../lib/toast";
import { Plus, Edit2, Search, Filter } from "lucide-react";

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
  phone: string;
  whatsappNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContact?: string;
  courseId: string;
  course: Course;
  batchId: string;
  batch: { id: string; name: string };
  enrollmentDate: string;
  status: "ACTIVE" | "INACTIVE";
  notes?: string;
}

function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [filteredFormBatches, setFilteredFormBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Student Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("Female");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [notes, setNotes] = useState("");

  const handlePhoneChange = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length <= 10) {
      setter(digits);
    }
  };

  const fetchFilters = async () => {
    try {
      const [coursesRes, batchesRes] = await Promise.all([
        apiRequest<Course[]>("/courses"),
        apiRequest<Batch[]>("/batches"),
      ]);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (batchesRes.success) setAllBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>("/students", {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          courseId: courseFilter || undefined,
          batchId: batchFilter || undefined,
          status: statusFilter || undefined,
        },
      });

      if (res.success && res.data) {
        setStudents(res.data.students || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        toast.error(res.message || "Failed to load students list.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to student API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, courseFilter, batchFilter, statusFilter]);

  // Check URL triggers
  useEffect(() => {
    if (actionParam === "add" && courses.length > 0) {
      handleOpenForm();
      // Remove trigger param without full refresh
      router.replace("/dashboard/students");
    }
  }, [actionParam, courses]);

  // Form batch cascading
  useEffect(() => {
    if (courseId) {
      const filtered = allBatches.filter((b) => b.courseId === courseId);
      setFilteredFormBatches(filtered);
      // Auto select first batch if current batch isn't in filtered list
      if (!filtered.some((b) => b.id === batchId)) {
        setBatchId(filtered[0]?.id || "");
      }
    } else {
      setFilteredFormBatches([]);
      setBatchId("");
    }
  }, [courseId, allBatches]);

  const handleOpenForm = (student?: Student) => {
    if (student) {
      setEditingId(student.id);
      setFullName(student.fullName);
      setPhone(student.phone);
      setWhatsappNumber(student.whatsappNumber);
      setEmail(student.email);
      setDateOfBirth(student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "");
      setGender(student.gender);
      setAddress(student.address);
      setGuardianName(student.guardianName || "");
      setGuardianPhone(student.guardianPhone || "");
      setEmergencyContact(student.emergencyContact || "");
      setCourseId(student.courseId);
      setBatchId(student.batchId);
      setEnrollmentDate(student.enrollmentDate ? student.enrollmentDate.split("T")[0] : "");
      setStatus(student.status);
      setNotes(student.notes || "");
    } else {
      setEditingId(null);
      setFullName("");
      setPhone("");
      setWhatsappNumber("");
      setEmail("");
      setDateOfBirth("2000-01-01");
      setGender("Female");
      setAddress("");
      setGuardianName("");
      setGuardianPhone("");
      setEmergencyContact("");
      setCourseId(courses[0]?.id || "");
      setBatchId("");
      setEnrollmentDate(new Date().toISOString().split("T")[0]);
      setStatus("ACTIVE");
      setNotes("");
    }
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !whatsappNumber.trim() || !email.trim() || !dateOfBirth || !courseId || !batchId) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Mobile Phone must be a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    if (!phoneRegex.test(whatsappNumber)) {
      toast.error("WhatsApp Number must be a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    if (guardianPhone && !phoneRegex.test(guardianPhone)) {
      toast.error("Guardian Phone must be a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    if (emergencyContact && !phoneRegex.test(emergencyContact)) {
      toast.error("Emergency Contact Phone must be a valid 10-digit Indian mobile number starting with 6-9.");
      return;
    }

    try {
      const payload = {
        fullName,
        phone,
        whatsappNumber,
        email,
        dateOfBirth,
        gender,
        address,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        emergencyContact: emergencyContact || null,
        courseId,
        batchId,
        enrollmentDate,
        status,
        notes: notes || null,
      };

      let res;
      if (editingId) {
        res = await apiRequest(`/students/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest("/students", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        toast.success(editingId ? "Student records updated." : "Student enrolled successfully!");
        setIsOpen(false);
        fetchStudents();
      } else {
        toast.error(res.message || "Failed to save student.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error saving student record.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight m-0">Students</h2>
          <p className="font-body text-sm text-[#111111]/60 m-0">Enrolled student rosters and contact sheets</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-lg font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Enroll Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-brand-neutral-200/50 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 font-body text-sm text-brand-black bg-[#F7F5F0] border border-brand-neutral-200 rounded-lg outline-none focus:border-[#E91E8C] transition-colors"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 text-brand-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <Filter className="w-4 h-4 text-brand-neutral-400 hidden sm:block" />
          <select
            className="px-3 py-2 bg-[#F7F5F0] border border-brand-neutral-200 rounded-lg font-body text-xs font-semibold outline-none cursor-pointer"
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setBatchFilter(""); // clear batch
              setPage(1);
            }}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 bg-[#F7F5F0] border border-brand-neutral-200 rounded-lg font-body text-xs font-semibold outline-none cursor-pointer"
            value={batchFilter}
            disabled={!courseFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Batches</option>
            {allBatches
              .filter((b) => b.courseId === courseFilter)
              .map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
          </select>

          <select
            className="px-3 py-2 bg-[#F7F5F0] border border-brand-neutral-200 rounded-lg font-body text-xs font-semibold outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Roster list */}
      <div className="bg-white rounded-xl border border-brand-neutral-200/50 shadow-md overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center font-body text-sm text-brand-neutral-400">Loading roster...</div>
        ) : students.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-brand-neutral-200/50 font-body text-sm text-left">
              <thead className="bg-[#F7F5F0] text-xs font-bold uppercase tracking-wider text-brand-neutral-600">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contacts</th>
                  <th className="px-6 py-4">Course/Batch</th>
                  <th className="px-6 py-4">DOB</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-200/40 text-[#111111]">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-brand-neutral-100/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold m-0">{student.fullName}</p>
                      <span className="text-[10px] text-brand-neutral-400 font-semibold uppercase">{student.gender}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <p className="m-0"><span className="text-brand-neutral-400">Ph:</span> {student.phone}</p>
                      <p className="m-0"><span className="text-brand-neutral-400">WA:</span> {student.whatsappNumber}</p>
                      <p className="m-0 text-brand-neutral-400 truncate max-w-[150px]" title={student.email}>{student.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <p className="font-bold m-0">{student.course?.name}</p>
                      <p className="text-brand-neutral-400 m-0">{student.batch?.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {new Date(student.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        student.status === "ACTIVE" ? "bg-[#4ECDC4]/10 text-[#4ECDC4]" : "bg-red-500/10 text-red-500"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenForm(student)}
                        className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-[#F7F5F0] hover:bg-brand-neutral-200 text-brand-neutral-700 rounded text-xs font-bold transition-all border-0 cursor-pointer shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
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
          <div className="h-48 flex items-center justify-center font-body text-sm text-brand-neutral-400">No students enrolled matching search filters.</div>
        )}
      </div>

      {/* Student Record Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-brand-neutral-200 z-10 flex flex-col my-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-brand-neutral-200 bg-[#111111] text-white">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[#D4A017] m-0">
                {editingId ? "Edit Student Record" : "Enroll New Student"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white bg-transparent border-0 cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="font-display text-xs font-black uppercase tracking-wider text-[#E91E8C] mb-4 pb-1 border-b border-brand-neutral-200/50">Personal Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Full Name *</label>
                    <input type="text" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Email Address *</label>
                    <input type="email" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Mobile Phone *</label>
                    <input type="tel" maxLength={10} className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" placeholder="10-digit mobile number" value={phone} onChange={(e) => handlePhoneChange(e.target.value, setPhone)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">WhatsApp Number *</label>
                    <input type="tel" maxLength={10} className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" placeholder="10-digit whatsapp number" value={whatsappNumber} onChange={(e) => handlePhoneChange(e.target.value, setWhatsappNumber)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Date of Birth *</label>
                    <input type="date" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Gender</label>
                    <select className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Home Address</label>
                  <input type="text" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>

              {/* Class & Batch Assignment */}
              <div>
                <h4 className="font-display text-xs font-black uppercase tracking-wider text-[#4ECDC4] mb-4 pb-1 border-b border-brand-neutral-200/50">Studio Assignment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Enroll Course *</label>
                    <select className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                      <option value="">— Select a course —</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Class Batch *</label>
                    <select className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={batchId} disabled={!courseId} onChange={(e) => setBatchId(e.target.value)}>
                      <option value="">— Choose schedule batch —</option>
                      {filteredFormBatches.map((b) => (
                        <option key={b.id} value={b.id}>{allBatches.find((ab) => ab.id === b.id)?.name || b.id}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Enrollment Date</label>
                    <input type="date" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Status</label>
                    <select className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Guardian Emergency details */}
              <div>
                <h4 className="font-display text-xs font-black uppercase tracking-wider text-[#D4A017] mb-4 pb-1 border-b border-brand-neutral-200/50">Emergency Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Guardian Name</label>
                    <input type="text" className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Guardian Phone</label>
                    <input type="tel" maxLength={10} className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" placeholder="10-digit guardian number" value={guardianPhone} onChange={(e) => handlePhoneChange(e.target.value, setGuardianPhone)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Emergency Contact Phone</label>
                    <input type="tel" maxLength={10} className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] w-full" placeholder="10-digit emergency number" value={emergencyContact} onChange={(e) => handlePhoneChange(e.target.value, setEmergencyContact)} />
                  </div>
                </div>
              </div>

              {/* Additional notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600">Additional Notes</label>
                <textarea rows={3} className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded p-4 outline-none focus:border-[#E91E8C] w-full resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-brand-neutral-200">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border border-brand-neutral-200 rounded hover:bg-[#F7F5F0] text-brand-neutral-600 font-display text-xs font-bold uppercase cursor-pointer bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#E91E8C] hover:bg-[#E91E8C]/90 text-white rounded font-display text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-black/10 rounded w-48" />
        <div className="h-64 bg-black/10 rounded-xl" />
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}
