"use client";

import { motion } from "framer-motion";

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
}

const features: FeatureCard[] = [
  {
    title: "Attendance",
    description: "Track attendance quickly with offline-first mobile capture",
    icon: "✓",
  },
  {
    title: "Safeguarding",
    description: "Log concerns and positive notes with strict access controls",
    icon: "🛡️",
  },
  {
    title: "Communication",
    description: "Send announcements and keep parents informed",
    icon: "💬",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function FeatureCards() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mb-4 text-3xl font-bold text-text-primary md:text-4xl">
          Everything you need
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-text-muted">
          Powerful features designed for busy schools and organisations
        </p>
      </motion.div>

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            className="rounded-xl border border-border-subtle bg-surface p-6 text-center shadow-soft transition hover:border-accent-primary/60 hover:shadow-card md:text-left"
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="mb-4 text-4xl">{feature.icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-text-primary">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-muted">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}