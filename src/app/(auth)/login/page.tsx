import LoginForm from "@/components/auth/LoginForm";
import { ShieldX, ShieldCheck, Lock } from "lucide-react";

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top government banner */}
      <div className="bg-makati-blue border-b-4 border-makati-gold w-full">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
            <span className="font-extrabold text-makati-blue text-base">M</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Republic of the Philippines</p>
            <p className="text-blue-200 text-xs">City of Makati — Social Welfare and Development Department</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between bg-makati-blue text-white w-[42%] p-12">
          <div>
            <div className="inline-block bg-makati-gold text-makati-blue text-xs font-bold px-3 py-1 rounded mb-6 tracking-wide uppercase">
              Staff Portal
            </div>
            <h2 className="text-3xl font-extrabold leading-snug mb-3">
              MSWD Administrative<br />
              <span className="text-makati-gold">Back-Office System</span>
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed mb-8 border-l-2 border-makati-gold pl-4">
              Restricted access portal for authorized MSWD Makati staff and coordinators only.
              Unauthorized access is prohibited and monitored.
            </p>
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: "Authorized MSWD Staff Only" },
                { icon: Lock, text: "All sessions are logged and audited" },
                { icon: ShieldX, text: "Unauthorized access is a punishable offense" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-makati-gold" />
                  </div>
                  <span className="text-blue-100 text-sm leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-blue-300 text-xs">© {new Date().getFullYear()} Makati Social Welfare and Development Department</p>
            <p className="text-blue-400 text-xs mt-1">In accordance with R.A. 10173 — Data Privacy Act of 2012</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Republic of the Philippines</p>
              <p className="font-bold text-makati-blue">City of Makati — MSWD</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-makati-blue px-6 py-4 border-b-2 border-makati-gold">
                <h1 className="text-white font-bold text-lg">Staff Sign In</h1>
                <p className="text-blue-200 text-xs mt-0.5">MISP — Administrative Back-Office Portal</p>
              </div>

              <div className="px-6 py-6">
                {errorMessage && (
                  <div className="flex items-start gap-2.5 p-3 mb-5 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <ShieldX className="w-4 h-4 shrink-0 mt-0.5" />
                    {errorMessage}
                  </div>
                )}
                <LoginForm />
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              For resident access, visit the{" "}
              <a href="http://localhost:3000" className="text-makati-blue font-medium hover:underline">
                Resident Portal
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
