"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { apiClient } from "../../lib/api/client";
import { toast } from "../../lib/toast";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If the admin is already authenticated, redirect to dashboard instead of showing login
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email address and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email, password });

      if (res.success && res.data?.token) {
        toast.success("Welcome back, Sandip Wasnik!");
        login(res.data.token, res.data.admin);
      } else {
        toast.error(res.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network connection failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-brand-neutral-200/50">
        <div className="p-8 bg-[#111111] text-white text-center">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/images/logo/logo.png"
              alt="S&A Dance Studio Logo"
              width={80}
              height={80}
              className="object-contain drop-shadow-[0_4px_16px_rgba(233,30,140,0.3)]"
              priority
            />
          </div>
          <h1 className="font-brand text-3xl font-medium tracking-wide m-0 italic">
            S&A Dance Studio
          </h1>
          <p className="font-body text-xs text-white/40 uppercase tracking-widest mt-2 mb-0">
            Owner Management Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 w-full"
              placeholder="owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label
              htmlFor="password"
              className="font-display text-xs font-bold tracking-wide uppercase text-brand-neutral-600"
            >
              Password
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="font-body text-sm text-brand-black bg-white border border-brand-neutral-200 rounded px-4 py-3 outline-none focus:border-[#E91E8C] focus:ring-4 focus:ring-[#E91E8C]/10 w-full pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-neutral-400 hover:text-brand-neutral-600 focus:outline-none focus:text-[#E91E8C] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-6 py-3.5 rounded-lg bg-[#111111] hover:bg-black text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 border-0 shadow-lg"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>

          <Link
            href="/forgot-password"
            className="text-center text-xs text-[#E91E8C] hover:underline font-display uppercase tracking-wide"
          >
            Forgot Password?
          </Link>
        </form>
      </div>
    </main>
  );
}
