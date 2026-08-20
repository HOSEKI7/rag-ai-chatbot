"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth, HealthCheckResult } from "@/lib/api/health";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ArchitecturePipeline } from "@/components/landing/ArchitecturePipeline";
import { SpecimenCatalog } from "@/components/landing/SpecimenCatalog";
import { LiveQuerySandbox } from "@/components/landing/LiveQuerySandbox";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);

  const backendBaseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const probeBackend = async () => {
    const result = await checkBackendHealth(backendBaseUrl);
    setHealth(result);
  };

  useEffect(() => {
    probeBackend();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--surface-linen)] flex flex-col justify-between text-[var(--color-forest-ink)]">
      {/* Top Fixed Header */}
      <Header isHealthy={health?.isHealthy} />

      {/* Main Content Container (Max width 1200px) */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6">
        {/* Hero Section */}
        <Hero />

        {/* 5-Stage Interactive RAG Pipeline Architecture */}
        <ArchitecturePipeline />

        {/* Curated Equipment Specimen Sheets */}
        <SpecimenCatalog />

        {/* Live Query Sandbox & Guardrail Probe */}
        <LiveQuerySandbox />
      </main>

      {/* Inverted Slate Hollow Footer */}
      <Footer />
    </div>
  );
}
