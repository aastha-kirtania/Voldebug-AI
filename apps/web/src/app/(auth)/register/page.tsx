"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Input } from "@web/components/ui/input";
import { Button } from "@web/components/ui/button";
import {
  Zap, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2,
  Mail, ShieldCheck, ArrowLeft, RefreshCw,
} from "lucide-react";

const API = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

// ─── Password strength ────────────────────────────────────────────────────

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

// ─── Google button ────────────────────────────────────────────────────────

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-card-border bg-surface shadow-sm hover:bg-surface/80 hover:border-card-border-hover text-sm font-semibold text-foreground transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-foreground-subtle/40 border-t-foreground rounded-full animate-spin" />
      ) : (
        <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      )}
      <span className={loading ? "opacity-60" : ""}>Sign up with Google</span>
    </motion.button>
  );
}

function Divider() {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-1 border-t border-card-border" />
      <span className="px-4 text-xs font-medium text-foreground-subtle/80 uppercase tracking-wider">
        Or register with email
      </span>
      <div className="flex-1 border-t border-card-border" />
    </div>
  );
}

// ─── 6-box OTP input ──────────────────────────────────────────────────────

function OtpInput({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        const arr = value.split("");
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
        const arr = value.split("");
        arr[i - 1] = "";
        onChange(arr.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          onClick={() => inputs.current[i]?.select()}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-card-border bg-surface text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Register form ────────────────────────────────────────────────────────

// phase: "email" → "otp" → "details"
type Phase = "email" | "otp" | "details";

function RegisterForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("email");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email phase
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  // OTP phase
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Details phase
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const strength = getPasswordStrength(password);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailErrorMsg = emailTouched && email.length > 0 && !isEmailValid ? "Please enter a valid email address." : "";
  const passwordErrorMsg = passwordTouched && password.length > 0 && password.length < 8 ? "Password must be at least 8 characters." : "";

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // bfcache fix
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) { setGoogleLoading(false); setLoading(false); }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    setError(undefined);
    await signIn("google", { callbackUrl: "/login" });
  }, []);

  // Phase 1: Send OTP
  const handleSendOtp = useCallback(async () => {
    if (!isEmailValid) return;
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`${API()}/v1/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to send verification code.");
      setOtp("");
      setPhase("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message ?? "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, isEmailValid]);

  // Phase 2: Verify OTP
  const handleVerifyOtp = useCallback(async () => {
    if (otp.replace(/\D/g, "").length < 6) return;
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`${API()}/v1/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp.replace(/\D/g, "") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Verification failed.");
      setVerificationToken(json.data.verificationToken);
      setPhase("details");
    } catch (err: any) {
      setError(err.message ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, otp]);

  // Phase 3: Register
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (strength.score < 2) { setError("Please choose a stronger password (at least Fair strength)."); return; }
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch(`${API()}/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, verificationToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Registration failed.");

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { router.push("/login?registered=1"); return; }

      setSuccess(true);
      setTimeout(() => router.push("/role-select"), 800);
    } catch (err: any) {
      setError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, email, password, verificationToken, strength, router]);

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-12 text-center bg-card border border-card-border rounded-3xl shadow-sm max-w-md mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <div>
          <p className="font-display text-xl font-bold text-foreground">Account created!</p>
          <p className="text-sm text-foreground-muted mt-2">Setting up your profile…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card border border-card-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-7"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 relative"
            style={{ boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}
          >
            {phase === "otp" ? (
              <ShieldCheck className="w-7 h-7 text-accent-light" />
            ) : (
              <UserPlus className="w-7 h-7 text-accent-light" />
            )}
          </motion.div>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {phase === "email" && "Create your account"}
              {phase === "otp" && "Verify your email"}
              {phase === "details" && "Almost there!"}
            </h1>
            <p className="text-foreground-muted text-sm mt-2">
              {phase === "email" && "Join 12,000+ students on Voldebug"}
              {phase === "otp" && `We sent a 6-digit code to ${email}`}
              {phase === "details" && "Set your name and password"}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {(["email", "otp", "details"] as Phase[]).map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <div className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                (phase === "otp" && i < 1) || (phase === "details" && i < 2)
                  ? "w-5 h-5 bg-success text-white"
                  : phase === p
                  ? "w-5 h-5 bg-accent"
                  : "w-2 h-2 bg-card-border"
              }`}>
                {((phase === "otp" && i < 1) || (phase === "details" && i < 2)) && (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                {phase === p && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {i < 2 && (
                <div className={`h-0.5 w-6 rounded-full transition-all duration-500 ${
                  (phase === "otp" && i < 1) || (phase === "details" && i < 2) ? "bg-success" : "bg-card-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── Phase 1: Email ── */}
          {phase === "email" && (
            <motion.div
              key="email-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <GoogleButton loading={googleLoading} onClick={handleGoogle} />
              <Divider />

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    onKeyDown={(e) => { if (e.key === "Enter" && isEmailValid) handleSendOtp(); }}
                    disabled={loading}
                    className={`w-full pl-10 transition-shadow focus:ring-2 ${emailErrorMsg ? "border-error focus:ring-error/20" : "focus:ring-accent/20"}`}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted w-4 h-4" />
                </div>
                {emailErrorMsg && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-error">
                    {emailErrorMsg}
                  </motion.p>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full font-semibold"
                disabled={loading || !isEmailValid}
                onClick={handleSendOtp}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Sending code…</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" />Send Verification Code</>
                )}
              </Button>
            </motion.div>
          )}

          {/* ── Phase 2: OTP ── */}
          {phase === "otp" && (
            <motion.div
              key="otp-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="text-sm text-center text-foreground-muted">
                  Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full font-semibold"
                disabled={loading || otp.replace(/\s/g, "").length < 6}
                onClick={handleVerifyOtp}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Verifying…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4 mr-2" />Verify Email</>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setPhase("email"); setError(undefined); setOtp(""); }}
                  className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="flex items-center gap-1.5 text-accent hover:text-accent-light disabled:text-foreground-subtle disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Phase 3: Name + Password ── */}
          {phase === "details" && (
            <motion.div
              key="details-phase"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Verified email badge */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-success/8 border border-success/20">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm text-success font-medium">{email} verified</span>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label>
                  <Input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full transition-shadow focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      disabled={loading}
                      className={`w-full pr-10 transition-shadow focus:ring-2 ${passwordErrorMsg ? "border-error focus:ring-error/20" : "focus:ring-accent/20"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrorMsg && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-error mt-1">
                      {passwordErrorMsg}
                    </motion.p>
                  )}
                  {password.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mt-2">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= i ? strength.color : "bg-surface border border-card-border"}`}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p className={`text-xs font-semibold ${
                          strength.label === "Weak" ? "text-error" :
                          strength.label === "Fair" ? "text-warning" :
                          strength.label === "Good" ? "text-info" : "text-success"
                        }`}>
                          {strength.label} password
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-semibold mt-2"
                  disabled={loading || !name || password.length < 8 || strength.score < 2}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Creating account…</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />Create Account</>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Terms */}
        {phase !== "otp" && (
          <p className="text-xs text-foreground-muted text-center leading-relaxed px-4">
            By registering, you agree to our{" "}
            <Link href="/terms" className="text-accent font-medium hover:text-accent-light transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-accent font-medium hover:text-accent-light transition-colors">Privacy Policy</Link>.
          </p>
        )}

        {/* Switch to login */}
        <p className="text-center text-sm text-foreground-muted border-t border-card-border pt-6 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:text-accent-light transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}