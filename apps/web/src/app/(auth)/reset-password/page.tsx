"use client";

import { useState, useCallback, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Input } from "@web/components/ui/input";
import { Button } from "@web/components/ui/button";
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

// Password strength indicator helper
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-error" };
  if (score <= 2) return { score, label: "Fair", color: "bg-warning" };
  if (score <= 3) return { score, label: "Good", color: "bg-info" };
  return { score, label: "Strong", color: "bg-success" };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const strength = getPasswordStrength(password);
  const isMatch = password === confirmPassword;
  const isLengthValid = password.length >= 8;

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing from the link URL.");
      return;
    }

    if (!isLengthValid) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!isMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
      const res = await fetch(`${apiUrl}/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, password, isLengthValid, isMatch]);

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 md:p-10 rounded-3xl border border-card-border bg-card/60 backdrop-blur-xl shadow-xl space-y-6 relative text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Invalid Reset Link</h2>
        <p className="text-sm text-foreground-muted leading-relaxed">
          The password reset link is invalid because the token is missing. Please request a new link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-light transition-colors mt-2"
        >
          Request new reset link
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md p-8 md:p-10 rounded-3xl border border-card-border bg-card/60 backdrop-blur-xl shadow-xl space-y-6 relative overflow-hidden"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-light to-accent" />

      {/* Header & Logo */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 mb-1 relative"
          style={{ boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}
        >
          <Zap className="w-8 h-8 text-accent-light" />
        </motion.div>

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="text-foreground-muted text-sm mt-2">
            Enter your new password below
          </p>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 py-4"
        >
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Password reset complete</h3>
            <p className="text-sm text-foreground-muted px-4 leading-relaxed">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-light transition-colors mt-2"
          >
            Continue to login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                disabled={loading}
                className="w-full pr-10 transition-shadow focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Password Validation Warnings */}
            {passwordTouched && password.length > 0 && !isLengthValid && (
              <span className="text-xs text-error block mt-1">
                Password must be at least 8 characters.
              </span>
            )}

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-foreground-muted font-medium">Password strength:</span>
                  <span className="font-semibold text-foreground">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-card-border rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4].map((barIndex) => (
                    <div
                      key={barIndex}
                      className={`h-full flex-1 transition-colors duration-300 ${
                        strength.score >= barIndex ? strength.color : "bg-foreground-subtle/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full transition-shadow focus:ring-2 focus:ring-accent/20"
            />
            {confirmPassword.length > 0 && !isMatch && (
              <span className="text-xs text-error block mt-1">
                Passwords do not match.
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword || !isMatch || !isLengthValid}
            className="w-full py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent/90 hover:to-accent-light/90 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-accent-light/5 blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 md:p-10 rounded-3xl border border-card-border bg-card/60 backdrop-blur-xl shadow-xl flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
