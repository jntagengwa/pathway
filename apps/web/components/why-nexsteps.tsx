"use client";

import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const features = [
  {
    title: "Built for busy schools",
    description:
      "Fast flows for attendance, rotas, safeguarding, and announcements. Minimise clicks, maximise efficiency.",
  },
  {
    title: "Multi-tenant and secure",
    description:
      "Tenant isolation with Row-Level Security and GDPR-first data handling. Your data stays private.",
  },
  {
    title: "Offline-first mobile app",
    description:
      "Staff can capture attendance and notes offline, then sync when connected. Perfect for busy classrooms.",
  },
  {
    title: "Parent communication",
    description:
      "Send announcements, share attendance history, and keep families informed-all from one platform.",
  },
];

export default function WhyNexsteps() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <motion.div
        className="rounded-xl border border-border-subtle bg-surface p-8 shadow-soft md:p-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className="mb-8 text-center text-3xl font-bold text-text-primary md:text-4xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Why Nexsteps?
        </motion.h2>
        <motion.div
          className="grid gap-8 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <h3 className="mb-2 text-xl font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}