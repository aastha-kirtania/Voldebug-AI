"use client";

import { Modal } from "@web/components/ui/modal";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface WarningModalProps {
  open: boolean;
  onClose: () => void;
  blockedQuery: string;
  category: string;
  severity: string;
}

export function WarningModal({ open, onClose, blockedQuery, category, severity }: WarningModalProps) {
  const isCritical = severity === "CRITICAL";

  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="text-center p-4">
        {/* Warning Icon Banner */}
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 border animate-pulse ${
          isCritical ? "bg-red-500/10 border-red-500/25" : "bg-error/10 border-error/20"
        }`}>
          <ShieldAlert className={`w-8 h-8 ${isCritical ? "text-red-500" : "text-error"}`} />
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {isCritical ? "Critical Safety Alert" : "Academic Integrity Warning"}
        </h3>
        
        {/* Subtitle / Severity */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border ${
          isCritical ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-error/10 border-error/20 text-error"
        }`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Blocked Category: {category} ({severity} Severity)</span>
        </div>

        {/* Detailed Message */}
        <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
          {isCritical
            ? "The system flagged your query as a potential critical safety or school regulations violation. This action violates school safety policies and has been escalated to school administration."
            : "The system flagged your query as a potential cheating or restriction bypass attempt. This action violates school academic honesty policies."
          }
        </p>

        {/* Log details */}
        <div className="bg-surface/60 rounded-xl p-3.5 text-left border border-white/5 mb-6">
          <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider mb-1">
            Blocked Input Query
          </p>
          <p className="text-xs font-mono text-foreground break-words bg-black/20 p-2.5 rounded-lg">
            "{blockedQuery}"
          </p>
        </div>

        <p className={`text-xs font-medium mb-6 ${isCritical ? "text-red-500" : "text-error"}`}>
          ⚠️ This event has been logged and sent to your teacher and school administration.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            isCritical
              ? "bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/20"
              : "bg-error hover:bg-error/90 text-white hover:shadow-error/20"
          }`}
        >
          I understand and will follow policy
        </button>
      </div>
    </Modal>
  );
}
