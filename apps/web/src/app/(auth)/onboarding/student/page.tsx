"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import {
  Bot, Trophy, Zap, CheckCircle2, ChevronRight,
  ChevronLeft, User, GraduationCap, AlertCircle, Eye, EyeOff,
  Building2, BookOpen
} from "lucide-react";
import { sound } from "@web/lib/audio";

// Password strength helper
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

// ─── Steps config ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "welcome", title: "Welcome!" },
  { id: "how-it-works", title: "How It Works" },
  { id: "avatar", title: "Choose Avatar" },
  { id: "setup", title: "Set Up Profile" },
];

const AVATARS = [
  { id: "robot", name: "Volt Robot", emoji: "🤖" },
  { id: "lion", name: "Leo Lion", emoji: "🦁" },
  { id: "panda", name: "Pip Panda", emoji: "🐼" },
  { id: "fox", name: "Foxy Fox", emoji: "🦊" },
  { id: "unicorn", name: "Spark Unicorn", emoji: "🦄" },
  { id: "owl", name: "Ollie Owl", emoji: "🦉" },
];

function AvatarStep({
  selectedAvatar,
  setSelectedAvatar,
}: {
  selectedAvatar: string;
  setSelectedAvatar: (v: string) => void;
}) {
  return (
    <motion.div
      key="avatar"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="font-display text-2xl font-bold">Choose Your Avatar</h2>
        <p className="text-foreground-muted text-sm mt-1.5">Pick a helper buddy to guide your AI learning journey!</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {AVATARS.map((av) => {
          const isSelected = selectedAvatar === av.id;
          return (
            <motion.button
              key={av.id}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedAvatar(av.id);
                sound.playClick();
              }}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all duration-200 ${
                isSelected
                  ? "bg-accent/15 border-accent shadow-lg shadow-accent/10"
                  : "bg-white/4 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="text-4xl">{av.emoji}</div>
              <span className={`text-xs font-semibold ${isSelected ? "text-accent-light" : "text-foreground-subtle"}`}>
                {av.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

const HOW_IT_WORKS_ITEMS = [
  {
    icon: Bot,
    color: "#6366f1",
    title: "Explore AI Tools",
    description: "Browse 350+ curated AI tools categorized by subject and use case.",
  },
  {
    icon: GraduationCap,
    color: "#06b6d4",
    title: "Complete Assignments",
    description: "Your teachers post missions. Use the suggested AI tools to complete them.",
  },
  {
    icon: Trophy,
    color: "#f59e0b",
    title: "Earn XP & Badges",
    description: "Every submission earns XP. Level up, unlock badges, and top the leaderboard.",
  },
];

// ─── Step components ──────────────────────────────────────────────────────

function WelcomeStep({ name }: { name: string }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="flex flex-col items-center text-center gap-6 py-4"
    >
      <div className="text-6xl animate-float">🤖</div>
      <div className="space-y-3">
        <h2 className="font-display text-2xl md:text-3xl font-bold">
          Welcome to Voldebug{name ? `, ${name.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-foreground-muted text-base max-w-sm mx-auto leading-relaxed">
          You're about to join thousands of students learning AI skills through real assignments and friendly competition.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mt-2">
        {[
          { value: "350+", label: "AI Tools" },
          { value: "12K+", label: "Students" },
          { value: "∞", label: "XP to earn" },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <p className="stat-number text-xl text-accent-light">{s.value}</p>
            <p className="text-xs text-foreground-subtle mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function HowItWorksStep() {
  return (
    <motion.div
      key="how"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold">How It Works</h2>
        <p className="text-foreground-muted text-sm mt-1.5">Three simple steps to master AI tools</p>
      </div>

      <div className="space-y-3">
        {HOW_IT_WORKS_ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-4 flex items-start gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${item.color}18`, border: `1px solid ${item.color}30` }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">{item.description}</p>
            </div>
            <div className="ml-auto text-foreground-subtle/30 text-2xl font-bold font-display flex-shrink-0">
              {i + 1}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SetupStep({
  schoolName,
  classId,
  classes,
  loadingClasses,
  setSchoolName,
  setClassId,
  gradeLevel,
  studentId,
  setGradeLevel,
  setStudentId,
  error,
  hasPassword,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  passwordTouched,
  setPasswordTouched,
  registeredSchools,
  loadingSchools,
}: {
  schoolName: string;
  classId: string;
  classes: { id: string; name: string; teacher: { name: string | null } }[];
  loadingClasses: boolean;
  setSchoolName: (v: string) => void;
  setClassId: (v: string) => void;
  gradeLevel: string;
  studentId: string;
  setGradeLevel: (v: string) => void;
  setStudentId: (v: string) => void;
  error?: string;
  hasPassword: boolean;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  passwordTouched: boolean;
  setPasswordTouched: (v: boolean) => void;
  registeredSchools: { id: string; name: string }[];
  loadingSchools: boolean;
}) {
  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="font-display text-2xl font-bold">Set Up Your Profile</h2>
        <p className="text-foreground-muted text-sm mt-1.5">Just a few details and you're in</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-error/8 border border-error/20 text-error text-sm">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="schoolName" className="text-sm font-medium flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-foreground-subtle" />
            School Name
            <span className="text-error">*</span>
          </label>
          {loadingSchools ? (
            <div className="flex items-center gap-2 text-xs text-foreground-subtle py-2">
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              Loading schools...
            </div>
          ) : registeredSchools.length > 0 ? (
            <select
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="input-base"
              required
            >
              <option value="">Select your school...</option>
              {registeredSchools.map((sch) => (
                <option key={sch.id} value={sch.name}>
                  {sch.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3.5 rounded-xl bg-warning/8 border border-warning/25 text-warning text-xs leading-relaxed font-medium">
              ⚠️ No schools have been registered by a Principal yet. Please ask your school administration to register first.
            </div>
          )}
        </div>

        {schoolName.trim().length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="classId" className="text-sm font-medium flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-foreground-subtle" />
              Class / Classroom
              <span className="text-foreground-subtle text-xs font-normal ml-1">(optional)</span>
            </label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 text-xs text-foreground-subtle py-2">
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                Finding classes...
              </div>
            ) : classes.length > 0 ? (
              <select
                id="classId"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="input-base"
              >
                <option value="">Select class to join...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Teacher: {cls.teacher?.name || "Unknown"})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-warning py-1 font-medium">
                No classes found in this school yet. Ask your teacher to create the class first.
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="gradeLevel" className="text-sm font-medium flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-foreground-subtle" />
            Grade Level
            <span className="text-error">*</span>
          </label>
          <select
            id="gradeLevel"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="input-base"
            required
          >
            <option value="">Select your grade…</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Grade {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="studentId" className="text-sm font-medium flex items-center gap-1.5">
            <User className="w-4 h-4 text-foreground-subtle" />
            Student ID
            <span className="text-foreground-subtle text-xs font-normal ml-1">(optional)</span>
          </label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="input-base"
            placeholder="STU-0001"
          />
          <p className="text-xs text-foreground-subtle">
            Provided by your school. Leave blank if you don't have one.
          </p>
        </div>

        {!hasPassword && (
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-foreground-subtle" />
              Set Password
              <span className="text-error">*</span>
              <span className="text-foreground-subtle text-xs font-normal ml-1">(required to log in via email later)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                className="input-base pr-10"
                placeholder="Min. 8 characters + uppercase, number or symbol"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordTouched && password.length > 0 && password.length < 8 && (
              <p className="text-xs text-error mt-1">Password must be at least 8 characters.</p>
            )}

            {/* Password strength meter */}
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mt-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => {
                    const strength = getPasswordStrength(password);
                    return (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          strength.score >= i ? strength.color : "bg-surface border border-card-border"
                        }`}
                      />
                    );
                  })}
                </div>
                {(() => {
                  const strength = getPasswordStrength(password);
                  return strength.label ? (
                    <p className={`text-xs font-semibold ${
                      strength.label === "Weak" ? "text-error" :
                      strength.label === "Fair" ? "text-warning" :
                      strength.label === "Good" ? "text-info" : "text-success"
                    }`}>
                      {strength.label} password
                    </p>
                  ) : null;
                })()}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function StudentOnboarding() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [gradeLevel, setGradeLevel] = useState("");
  const [studentId, setStudentId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [classId, setClassId] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("robot");
  const [showConfetti, setShowConfetti] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string; teacher: { name: string | null } }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [registeredSchools, setRegisteredSchools] = useState<{ id: string; name: string }[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function fetchSchools() {
      setLoadingSchools(true);
      try {
        const token = (session?.user as any)?.token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/users/schools`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (res.ok) {
          const json = await res.json();
          setRegisteredSchools(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch registered schools:", err);
      } finally {
        setLoadingSchools(false);
      }
    }
    if (session) {
      fetchSchools();
    }
  }, [session]);

  useEffect(() => {
    if (!schoolName.trim()) {
      setClasses([]);
      setClassId("");
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingClasses(true);
      try {
        const token = (session?.user as any)?.token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/users/school-classes?schoolName=${encodeURIComponent(schoolName.trim())}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (res.ok) {
          const json = await res.json();
          setClasses(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [schoolName, session]);

  const userName = session?.user?.name ?? "";
  const hasPassword = session?.user?.hasPassword ?? false;

  const handleSubmit = useCallback(async () => {
    if (!schoolName.trim()) {
      setError("Please enter your school name.");
      return;
    }
    if (!gradeLevel) {
      setError("Please select your grade level.");
      return;
    }
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(undefined);

    try {
      const token = (session?.user as any)?.token;
      console.log("[STUDENT ONBOARDING] token present:", !!token, "| password provided:", !!password);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/users/onboarding/student`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            gradeLevel: Number(gradeLevel),
            studentId: studentId || undefined,
            schoolName: schoolName.trim() || undefined,
            classId: classId || undefined,
            password: password || undefined,
            avatar: selectedAvatar,
          }),
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? "Setup failed. Please try again.");
      }

      // Refresh session with new onboarding status and updated password state
      await update({
        onboardingStatus: "COMPLETED",
        hasPassword: hasPassword || !!password,
      });

      setShowConfetti(true);
      sound.playSuccess();
      setTimeout(() => {
        router.replace("/dashboard/student");
      }, 3500);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [gradeLevel, studentId, schoolName, classId, password, selectedAvatar, session, update, router, hasPassword]);

  const isLastStep = step === STEPS.length - 1;
  const canNext = step < STEPS.length - 1;

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {showConfetti && (
        <ReactConfetti
          width={typeof window !== "undefined" ? window.innerWidth : 500}
          height={typeof window !== "undefined" ? window.innerHeight : 600}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                  i < step
                    ? "w-6 h-6 bg-success text-white"
                    : i === step
                    ? "w-6 h-6 bg-accent"
                    : "w-2 h-2 bg-card-border"
                }`}
              >
                {i < step && <CheckCircle2 className="w-3.5 h-3.5" />}
                {i === step && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 rounded-full transition-all duration-500 ${
                    i < step ? "bg-success" : "bg-card-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step label */}
        <p className="text-center text-xs text-foreground-subtle">
          Step {step + 1} of {STEPS.length} — {STEPS[step].title}
        </p>

        {/* Card */}
        <div className="card p-6 md:p-8 min-h-[320px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 0 && <WelcomeStep name={userName} />}
              {step === 1 && <HowItWorksStep />}
              {step === 2 && (
                <AvatarStep
                  selectedAvatar={selectedAvatar}
                  setSelectedAvatar={setSelectedAvatar}
                />
              )}
              {step === 3 && (
                <SetupStep
                  schoolName={schoolName}
                  classId={classId}
                  classes={classes}
                  loadingClasses={loadingClasses}
                  setSchoolName={setSchoolName}
                  setClassId={setClassId}
                  gradeLevel={gradeLevel}
                  studentId={studentId}
                  setGradeLevel={setGradeLevel}
                  setStudentId={setStudentId}
                  error={error}
                  hasPassword={hasPassword}
                  password={password}
                  setPassword={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  passwordTouched={passwordTouched}
                  setPasswordTouched={setPasswordTouched}
                  registeredSchools={registeredSchools}
                  loadingSchools={loadingSchools}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Nav buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => {
                  setStep((s) => s - 1);
                  setError(undefined);
                  sound.playClick();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-card-border hover:bg-surface/60 text-sm font-medium transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {canNext && (
              <button
                onClick={() => {
                  setStep((s) => s + 1);
                  sound.playClick();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm shadow-md shadow-accent/20 hover:bg-accent-light transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {isLastStep && (
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !gradeLevel ||
                  // Google users (no existing password) must set a password with score >= 2 (Fair or better)
                  (!hasPassword && getPasswordStrength(password).score < 2) ||
                  // If they typed something, it must be valid length
                  (password.length > 0 && password.length < 8)
                }
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm shadow-md shadow-accent/20 hover:bg-accent-light transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Setting up…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Start Learning!
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}