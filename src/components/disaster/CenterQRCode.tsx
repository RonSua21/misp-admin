"use client";
import { useState } from "react";
import { QrCode, X, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function CenterQRCode({ centerId, centerName }: { centerId: string; centerName: string }) {
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/check-in/${centerId}`
    : `/check-in/${centerId}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-makati-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
      >
        <QrCode className="w-3.5 h-3.5" /> QR Code
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Check-in QR Code</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{centerName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100">
              <QRCodeSVG value={url} size={200} includeMargin />
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-slate-400">
              Evacuees scan this to check in
            </p>

            <a
              href={`/check-in/${centerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-makati-blue hover:underline font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open check-in page
            </a>
          </div>
        </div>
      )}
    </>
  );
}
