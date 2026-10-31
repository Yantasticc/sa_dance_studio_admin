"use client";

import { useState } from "react";
import { apiClient } from "../../lib/api/client";
import { toast } from "../../lib/toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/forgot-password", { email });
      if (res.success) {
        toast.success("OTP sent! Check your email inbox.");
        setStep("otp");
      } else {
        toast.error(res.message || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the OTP.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      if (res.success) {
        toast.success("Password reset successfully! You can now log in.");
        setStep("done");
      } else {
        toast.error(res.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-brand-neutral-200/50">
        <div className="p-8 bg-[#111111] text-white text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#D4A017] flex items-center justify-center font-bold text-xl tracking-tight text-white mx-auto mb-4 shadow-lg">
            S&A
          </div>
          <h1 className="font-display text-lg font-black tracking-widest uppercase m-0">
            S&A DANCE STUDIO
          </h1>
          <p className="font-body text-xs text-white/40 uppercase tracking-widest mt-1 mb-0">
            Password Recovery
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="p-8 flex flex-col gap-5">
            <p className="text-sm text-brand-neutral-600 font-body">
              Enter your admin email address. We'll send you a 6-digit OTP to
              reset your password.
            </p>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="forgot-email"
                className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600"
              >
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 w-full"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-6 py-3.5 rounded-lg bg-[#111111] hover:bg-black text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 border-0 shadow-lg"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <Link
              href="/login"
              className="text-center text-xs text-[#E91E8C] hover:underline font-display uppercase tracking-wide"
            >
              ← Back to Sign In
            </Link>
          </form>
        )}

        {step === "otp" && (
          <form
            onSubmit={handleResetPassword}
            className="p-8 flex flex-col gap-5"
          >
            <p className="text-sm text-brand-neutral-600 font-body">
              Enter the 6-digit OTP sent to <strong>{email}</strong> and choose
              a new password.
            </p>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="otp-input"
                className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600"
              >
                OTP Code
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="font-body text-2xl text-center text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 w-full tracking-[0.5em] font-bold"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-password"
                className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 w-full"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm-password"
                className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 w-full"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-6 py-3.5 rounded-lg bg-[#111111] hover:bg-black text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 border-0 shadow-lg"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-center text-xs text-[#E91E8C] hover:underline font-display uppercase tracking-wide bg-transparent border-0 cursor-pointer"
            >
              ← Request New OTP
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="p-8 flex flex-col gap-5 text-center">
            <div className="text-4xl">✅</div>
            <p className="text-sm text-brand-neutral-600 font-body">
              Your password has been reset successfully. You can now sign in with
              your new password.
            </p>
            <Link
              href="/login"
              className="w-full mt-2 px-6 py-3.5 rounded-lg bg-[#111111] hover:bg-black text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer no-underline text-center block shadow-lg"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
