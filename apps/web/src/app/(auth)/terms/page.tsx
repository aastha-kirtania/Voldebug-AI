"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center justify-center space-y-6"
    >
      <div className="card p-8 md:p-10 shadow-2xl relative overflow-hidden w-full max-w-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-accent-light" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-center">Terms of Service</h1>
          <p className="text-foreground-subtle text-sm mt-2 text-center">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6 text-sm text-foreground-muted leading-relaxed">
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Voldebug AI Education Portal ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">2. User Accounts</h2>
            <p>
              You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. Students under 13 must obtain parental consent before using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">3. Acceptable Use</h2>
            <p>
              You agree to use the Service only for educational purposes. You will not use the Service to generate, distribute, or promote harmful, illegal, or inappropriate content. Teachers are responsible for monitoring their students' use of the provided AI tools.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">4. Intellectual Property</h2>
            <p>
              The Service, including its original content, features, and functionality, is owned by Voldebug and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">5. Limitations of Liability</h2>
            <p>
              Voldebug provides the Service "as is" without any warranties. We shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the Service.
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
