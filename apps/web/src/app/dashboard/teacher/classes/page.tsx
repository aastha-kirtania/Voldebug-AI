"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTeacherClasses, useCreateClass } from "@web/hooks/use-teacher";
import { GradientMesh } from "@web/components/ui/background";
import { Users, BookOpen, ChevronRight, PlusCircle, Calendar, X, Loader2, AlertCircle } from "lucide-react";

export default function TeacherClassesPage() {
  const router = useRouter();
  const { data: classes, isLoading } = useTeacherClasses();
  const createClassMutation = useCreateClass();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [submitError, setSubmitError] = useState<string>();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setSubmitError(undefined);
    try {
      await createClassMutation.mutateAsync({ name: newClassName.trim() });
      setIsCreateOpen(false);
      setNewClassName("");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create class. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative">
      <GradientMesh />
      <div className="max-w-6xl mx-auto space-y-6 pb-24 lg:pb-8 px-4 md:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Your Classes</h1>
            <p className="text-foreground-muted text-sm mt-1.5">Manage your class sections and students</p>
          </div>
          
          <button 
            onClick={() => {
              setIsCreateOpen(true);
              setSubmitError(undefined);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-light transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            New Class
          </button>
        </motion.div>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !classes || classes.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-accent-light" />
            </div>
            <h2 className="font-display text-xl font-semibold">No classes found</h2>
            <p className="text-foreground-muted text-sm max-w-md mt-2">
              You haven't set up any classes yet. Create your first class to invite students and start assigning work. 
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="card overflow-hidden hover:border-accent/40 transition-all group flex flex-col"
              >
                <div className="h-24 bg-gradient-to-br from-accent/20 to-surface border-b border-card-border p-5 relative">
                  <h3 className="font-display text-xl font-bold truncate pr-8">{cls.name}</h3>
                  <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1.5 opacity-80">
                    <Calendar className="w-3.5 h-3.5" /> Created {new Date(cls.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-surface/50 p-3 rounded-lg border border-card-border">
                      <p className="text-xs text-foreground-subtle font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Students
                      </p>
                      <p className="text-xl font-bold text-foreground">{cls._count?.members || 0}</p>
                    </div>
                    <div className="flex-1 bg-surface/50 p-3 rounded-lg border border-card-border">
                      <p className="text-xs text-foreground-subtle font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Assign.
                      </p>
                      <p className="text-xl font-bold text-foreground">{cls._count?.assignments || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs px-1 text-foreground-subtle">
                      <span>Join Code:</span>
                      <span className="font-mono font-bold text-accent-light tracking-wide bg-accent/10 px-2 py-0.5 rounded border border-accent/20">{cls.joinCode || "—"}</span>
                    </div>
                    <button 
                      onClick={() => router.push(`/dashboard/teacher/classes/${cls.id}`)}
                      className="w-full mt-1 py-2.5 border border-card-border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all"
                    >
                      View Class <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md p-6 md:p-8 rounded-3xl border border-white/10 bg-surface-hover backdrop-blur-2xl shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setSubmitError(undefined);
                  setNewClassName("");
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 mb-6">
                <h3 className="font-display text-xl font-bold text-foreground">Create a New Class</h3>
                <p className="text-sm text-foreground-subtle">
                  Set up a new learning environment for your students.
                </p>
              </div>

              {submitError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-error/15 border border-error/25 text-error text-xs">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="className" className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                    Class Name
                  </label>
                  <input
                    id="className"
                    type="text"
                    placeholder="e.g. Physics 12 — Period 4"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                    disabled={createClassMutation.isPending}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all text-foreground placeholder:text-white/20 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setNewClassName("");
                    }}
                    className="flex-1 py-3 border border-card-border hover:bg-white/5 text-foreground font-semibold rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createClassMutation.isPending || !newClassName.trim()}
                    className="flex-1 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                  >
                    {createClassMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="w-4 h-4 mr-2" />
                    )}
                    Create Class
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
