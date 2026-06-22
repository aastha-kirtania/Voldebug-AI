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
  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="text-center p-4">
        {/* Warning Icon Banner */}
        <div className="mx-auto w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6 border border-error/20 animate-pulse">
          <ShieldAlert className="w-8 h-8 text-error" />
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          Academic Integrity Warning
        </h3>
        
        {/* Subtitle / Severity */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 border border-error/20 text-xs font-semibold text-error mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Blocked Category: {category} ({severity} Severity)</span>
        </div>

        {/* Detailed Message */}
        <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
          The system flagged your query as a potential cheating or restriction bypass attempt. This action violates school academic honesty policies.
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

        <p className="text-xs text-error font-medium mb-6">
          ⚠️ This event has been logged and sent to your teacher's dashboard.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-error hover:bg-error/90 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-error/20"
        >
          I understand and will follow policy
        </button>
      </div>
    </Modal>
  );
}
