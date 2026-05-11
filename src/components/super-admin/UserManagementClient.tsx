"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ShieldCheck,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  barangay?: string | null;
  createdAt: string;
  residencyVerified: boolean;
};

export default function UserManagementClient({
  users,
  barangays,
}: {
  users: AdminUser[];
  barangays: string[];
}) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    barangay: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  async function handleAddCoordinator(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "ADMIN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create user.");
        return;
      }
      setSuccess(`Coordinator account created for ${formData.firstName} ${formData.lastName}.`);
      setFormData({ email: "", password: "", firstName: "", lastName: "", barangay: "" });
      setShowAddForm(false);
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Deactivate ${name}'s account? Their role will be changed to REGISTERED_USER.`)) return;
    setDeactivating(userId);
    try {
      const res = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "REGISTERED_USER" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to deactivate user.");
        return;
      }
      setSuccess(`${name}'s account has been deactivated.`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setDeactivating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Staff Accounts ({users.length})
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            All ADMIN and SUPER_ADMIN accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Coordinator
        </button>
      </div>

      {/* Add Coordinator Form */}
      {showAddForm && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Create New Coordinator Account
          </h3>
          <form onSubmit={handleAddCoordinator} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="coordinator@mswd.makati.gov.ph"
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Temporary Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Min. 8 characters"
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Assigned Barangay
              </label>
              <select
                required
                value={formData.barangay}
                onChange={(e) =>
                  setFormData({ ...formData, barangay: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
              >
                <option value="">Select barangay...</option>
                {barangays.sort().map((b) => (
                  <option key={b} value={b}>
                    Brgy. {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Creating..." : "Create Account"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
                {["Name", "Email", "Role", "Barangay", "Date Added", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400 dark:text-slate-500"
                  >
                    No staff accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {u.firstName} {u.lastName}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                      {u.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.role === "SUPER_ADMIN"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {u.role === "SUPER_ADMIN" ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        {u.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                      {u.barangay ? `Brgy. ${u.barangay}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.role !== "SUPER_ADMIN" && (
                        <button
                          onClick={() =>
                            handleDeactivate(
                              u.id,
                              `${u.firstName} ${u.lastName}`
                            )
                          }
                          disabled={deactivating === u.id}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deactivating === u.id ? "Removing..." : "Deactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
