"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : authError.message === "Email not confirmed"
            ? "Email not confirmed. Please verify your email address."
            : authError.message
        );
        return;
      }
      // Get role and redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("supabaseId", user?.id ?? "")
        .single();

      const role = profile?.role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        await supabase.auth.signOut();
        setError(
          "Access denied. Only MSWD Staff and Coordinators can access this portal."
        );
        return;
      }
      router.push(role === "SUPER_ADMIN" ? "/super-admin" : "/admin");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-2.5 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@mswd.makati.gov.ph"
          required
          className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue focus:border-makati-blue"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue focus:border-makati-blue pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-makati-blue text-white font-semibold py-2.5 rounded hover:bg-blue-800 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
      >
        <LogIn className="w-4 h-4" />
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
