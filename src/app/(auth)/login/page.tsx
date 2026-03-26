import LoginForm from "@/components/auth/LoginForm";
import { ShieldX } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized:
    "Access denied. Only MSWD Staff and Coordinators can access this portal.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-makati-blue mb-4">
            <span className="text-white font-black text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            MISP Admin Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            MSWD Makati — Administrative Back-Office
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-6">
            Sign in to your account
          </h2>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              <ShieldX className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMessage}
            </div>
          )}

          <LoginForm />
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          For resident access, visit the{" "}
          <a
            href="http://localhost:3000"
            className="text-makati-blue hover:underline"
          >
            Resident Portal
          </a>
        </p>
      </div>
    </div>
  );
}
