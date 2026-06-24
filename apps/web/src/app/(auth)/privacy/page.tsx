"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center justify-center space-y-6"
    >
      <div className="card p-8 md:p-10 shadow-2xl relative overflow-hidden w-full max-w-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-success" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-center">Privacy Policy</h1>
          <p className="text-foreground-subtle text-sm mt-2 text-center">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6 text-sm text-foreground-muted leading-relaxed">
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, such as your name, email address, and role (Student or Teacher). We also automatically collect certain information about your device and how you interact with our Services, including your IP address, browser type, and usage data.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our educational platform. This includes operating the gamification system, tracking progress on assignments, and personalizing the learning experience. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">3. Student Privacy (FERPA & COPPA)</h2>
            <p>
              We are committed to protecting student privacy and complying with all applicable educational privacy laws, including FERPA and COPPA. Data associated with student accounts is used solely for educational purposes and is only shared with authorized educators associated with the student's class.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">5. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal information. Teachers and parents can request access to or deletion of their students' or children's data by contacting our support team.
            </p>
          </section>
        </div>

        <div className="border-t border-card-border mt-8 pt-6 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center text-sm font-medium text-foreground-subtle hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
