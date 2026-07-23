"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { fluidSimulation } from "./fluid-simulation";
import { handleMarketingHashClick } from "./marketing-scroll";
import { usePrefersReducedMotion } from "./marketing-motion";

/** Rotating conversion lines — sell the outcome, not the feature. */
const ROTATING_LINES = [
  "close paying retainers this month",
  "book discovery calls that convert",
  "fill your pipeline with ready buyers",
  "turn dials into signed clients",
  "land your next six-figure client",
];

const SUBLINE =
  "Verified contractor leads, scored and dial-ready — so your team sells instead of researching. Start free, prove ROI, upgrade when you’re closing.";

export function MarketingFluidHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = "onest-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let destroy: (() => void) | undefined;
    try {
      destroy = fluidSimulation(canvas);
    } catch {
      // WebGL unavailable — solid base still shows
    }
    return () => destroy?.();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % ROTATING_LINES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reveal = (el: Element | null, delay: number, fromY: string) => {
      if (!el || !(el instanceof HTMLElement)) return;
      el.style.opacity = "0";
      el.style.transform = `translateY(${fromY})`;
      el.style.transition = `opacity 700ms cubic-bezier(0.2, 0, 0, 1) ${delay}ms, transform 700ms cubic-bezier(0.2, 0, 0, 1) ${delay}ms`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        });
      });
    };

    reveal(section.querySelector("[data-reveal='nav']"), 150, "-0.75rem");
    reveal(section.querySelector("[data-reveal='brand']"), 280, "1rem");
    reveal(section.querySelector("[data-reveal='hook']"), 480, "1.1rem");
    reveal(section.querySelector("[data-reveal='sub']"), 900, "1rem");
    reveal(section.querySelector("[data-reveal='cta']"), 1100, "1.25rem");
  }, []);

  const activeLine = ROTATING_LINES[lineIndex];

  return (
    <section ref={sectionRef} className="mkt-flow-hero" aria-label="Hero">
      <canvas ref={canvasRef} className="mkt-flow-canvas" aria-hidden="true" />
      <div className="mkt-flow-scrim" aria-hidden="true" />

      <header className="mkt-flow-nav" data-reveal="nav">
        <Link href="/" className="mkt-flow-brand">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="mkt-flow-brand-logo"
            priority
          />
          Contractor Leads
        </Link>

        <nav className="mkt-flow-links" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#technology">Technology</a>
          <a href="#faq">FAQ</a>
        </nav>

        <Link href="/register" className="mkt-flow-pill">
          Start free trial
        </Link>
      </header>

      <div className="mkt-flow-center">
        <p className="mkt-flow-brand-mark" data-reveal="brand">
          Contractor Leads
        </p>

        <h1 className="mkt-flow-heading mkt-flow-heading--rotator" data-reveal="hook">
          <span className="mkt-flow-heading-static">The fastest way to </span>
          <span className="mkt-flow-rotator" aria-live="polite">
            {reduced || !entered ? (
              <span className="mkt-flow-rotator-line">{ROTATING_LINES[0]}</span>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={activeLine}
                  className="mkt-flow-rotator-line"
                  initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeLine}
                </motion.span>
              </AnimatePresence>
            )}
          </span>
        </h1>

        <p className="mkt-flow-sub mkt-flow-sub--deck" data-reveal="sub">
          {SUBLINE}
        </p>

        <div className="mkt-flow-cta-row" data-reveal="cta">
          <Link href="/register" className="mkt-flow-pill mkt-flow-pill--primary">
            Start closing leads free
            <HiOutlineArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a
            href="#pricing"
            className="mkt-flow-pill mkt-flow-pill--ghost"
            onClick={(e) => handleMarketingHashClick(e, "#pricing")}
          >
            See plans
          </a>
        </div>
        <p className="mkt-flow-trust" data-reveal="cta">
          20 free credits · No card required · Upgrade when you close
        </p>
      </div>
    </section>
  );
}
