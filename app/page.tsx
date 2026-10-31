import { redirect } from "next/navigation";

/**
 * Root route — always redirect to /login.
 *
 * WHY SERVER REDIRECT (not client-side):
 * The original "use client" + useEffect approach works locally but fails on
 * production (Hostinger / Next.js `next start`) because:
 *   1. The server renders the loading-spinner HTML and sends it to the browser.
 *   2. The browser must download, parse, and execute the JS bundle.
 *   3. React hydration must complete.
 *   4. Only then does AuthProvider's useEffect run and call router.replace("/login").
 * On a production server with a cold start or slow network this chain can stall,
 * leaving unauthenticated users stuck on the spinner instead of /login.
 *
 * A server-side redirect() emits an HTTP 307 response before any HTML is sent,
 * so the browser is redirected instantly — no JS required, no hydration race.
 *
 * Authenticated users:
 * If a logged-in admin navigates to "/" (e.g. after logout route.push("/")),
 * they will land on /login. AuthProvider's useEffect detects the valid token,
 * verifies it with the API, and calls router.replace("/dashboard") automatically.
 * This is the same behaviour that was already in place; only the first hop
 * (/ → /login) is now done server-side for reliability.
 */
export default function RootIndexPage() {
  redirect("/login");
}
