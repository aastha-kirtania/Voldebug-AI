"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Award
} from "lucide-react";
import Confetti from "react-confetti";
import { useQuiz, useQuizAttempts, useSubmitQuizAttempt } from "@web/hooks/use-quizzes";

interface ToolQuizCardProps {
  toolId: string;
  brandColor: string;
}

export function ToolQuizCard({ toolId, brandColor }: ToolQuizCardProps) {
  const { data: quiz, isLoading: isQuizLoading } = useQuiz(toolId);
  const { data: attempts, isLoading: isAttemptsLoading } = useQuizAttempts();
  const submitAttempt = useSubmitQuizAttempt();

  const [activeStep, setActiveStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [localResult, setLocalResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
  } | null>(null);

  const [windowDimensions, setWindowDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  if (isQuizLoading || isAttemptsLoading) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-foreground-subtle animate-spin mb-2" />
        <p className="text-sm text-foreground-muted">Loading quiz details...</p>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  // Find if student has already passed this quiz
  const hasPassed = attempts?.some((a) => a.quizId === quiz.id && a.passed) ?? false;
  const bestAttempt = attempts
    ?.filter((a) => a.quizId === quiz.id)
    .sort((a, b) => b.score - a.score)[0];

  const handleStartQuiz = () => {
    setActiveStep("quiz");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setLocalResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await submitAttempt.mutateAsync({
        quizId: quiz.id,
        answers,
      });

      setLocalResult({
        score: res.score,
        passed: res.passed,
        correctCount: res.correctCount,
        totalQuestions: res.totalQuestions,
        xpEarned: res.xpEarned,
      });

      if (res.passed) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      setActiveStep("result");
    } catch (err) {
      console.error(err);
      alert("Failed to submit quiz attempt. Please try again.");
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isOptionSelected = answers[currentQuestion?.id] !== undefined;

  return (
    <div className="relative">
      {showConfetti && typeof window !== "undefined" && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          style={{ zIndex: 100, position: "fixed", top: 0, left: 0 }}
        />
      )}

      <div
        className="card p-6 border border-white/5 bg-white/[0.02]"
        style={{
          boxShadow: hasPassed ? `inset 0 0 20px ${brandColor}05` : undefined,
          borderColor: hasPassed ? `${brandColor}20` : undefined,
        }}
      >
        {/* Step 1: INTRO */}
        {activeStep === "intro" && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5" style={{ color: brandColor }} />
                <h3 className="text-base font-semibold text-foreground">{quiz.title}</h3>
                {hasPassed && (
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                    PASSED
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-muted mb-4 max-w-xl">
                {quiz.description || `Test your knowledge and verify concepts for utilizing this tool.`}
              </p>

              {bestAttempt && (
                <p className="text-[11px] text-foreground-subtle">
                  Best Score: <span className="font-semibold text-foreground">{bestAttempt.score}%</span>
                  {bestAttempt.passed ? " ✅ Passed!" : " 🌟 Keep going — you're improving!"}
                </p>
              )}
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
              <button
                onClick={handleStartQuiz}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
                style={{ backgroundColor: brandColor }}
              >
                {hasPassed ? "Retake Quiz" : "Take Quiz (+50 XP)"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: QUIZ COMPILING */}
        {activeStep === "quiz" && currentQuestion && (
          <div>
            {/* Header / Progress */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 text-[11px] text-foreground-muted">
              <span>{quiz.title}</span>
              <span>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
            </div>

            {/* Question Text */}
            <h4 className="text-sm font-semibold text-foreground mb-4">
              {currentQuestion.questionText}
            </h4>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(currentQuestion.id, idx)}
                    className={`text-left p-4 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/[0.01] border-white/5 text-foreground-subtle hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                          isSelected
                            ? "bg-white text-black border-white"
                            : "border-white/10 text-foreground-muted"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-end items-center">
              <button
                onClick={handleNext}
                disabled={!isOptionSelected || submitAttempt.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {submitAttempt.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : currentQuestionIndex < quiz.questions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Submit Answers
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: RESULT SCREEN */}
        {activeStep === "result" && localResult && (
          <div className="text-center py-4 flex flex-col items-center">
            {localResult.passed ? (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="text-5xl animate-bounce select-none">🏆</div>
                <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="text-5xl select-none">🤖</div>
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            )}

            <h4 className="text-base font-bold mb-1">
              {localResult.passed ? "🎉 Amazing — you nailed it!" : "🌟 Nice try — you're getting better!"}
            </h4>
            <p className="text-xs text-foreground-subtle mb-2">
              You scored <span className="font-semibold text-foreground">{localResult.score}%</span> ({localResult.correctCount} / {localResult.totalQuestions} correct)
            </p>

            {localResult.passed && localResult.xpEarned > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px] font-semibold mb-6">
                <Award className="w-4 h-4" />
                <span>+{localResult.xpEarned} XP Awarded! Keep it up! 🚀</span>
              </div>
            )}

            {!localResult.passed && (
              <div className="mb-6 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/20 max-w-sm text-center">
                <p className="text-[11px] text-amber-300 font-medium mb-0.5">🤖 Volt Robot says:</p>
                <p className="text-xs text-foreground-subtle leading-relaxed">
                  "Almost there! You need {quiz.passingScore}% to pass. Let's try together — you're improving every time!"
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center w-full max-w-xs">
              <button
                onClick={handleStartQuiz}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold transition-all text-foreground hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{localResult.passed ? "Play Again" : "Try Again! 💪"}</span>
              </button>
              <button
                onClick={() => setActiveStep("intro")}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: brandColor }}
              >
                <span>Back to World</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
