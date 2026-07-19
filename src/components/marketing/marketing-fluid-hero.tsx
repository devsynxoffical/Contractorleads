"use client";

import { useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { fluidSimulation } from "./fluid-simulation";

const HEADING = "Generate leads that actually convert";
const SUBLINE =
  "Cut through the noise, reclaim your pipeline, and book work that truly matters.";

function splitWords(text: string) {
  return text.split(" ").filter(Boolean);
}

export function MarketingFluidHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const id = "onest-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Onest:wght@400;500&display=swap";
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
    reveal(section.querySelector("[data-reveal='badge']"), 320, "1.25rem");
    reveal(section.querySelector("[data-reveal='form']"), 1450, "1.25rem");
    reveal(section.querySelector("[data-reveal='footer']"), 1650, "1.25rem");

    const animateWords = (
      container: Element | null,
      baseDelay: number,
      stagger: number,
      duration: number,
      fromY: number,
    ) => {
      if (!container) return;
      const words = container.querySelectorAll<HTMLElement>("[data-word]");
      words.forEach((word, i) => {
        word.style.display = "inline-block";
        word.style.opacity = "0";
        word.style.transform = `translateY(${fromY}px)`;
        word.style.transition = `opacity ${duration}ms cubic-bezier(0.33, 1, 0.68, 1) ${
          baseDelay + i * stagger
        }ms, transform ${duration}ms cubic-bezier(0.33, 1, 0.68, 1) ${
          baseDelay + i * stagger
        }ms`;
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          words.forEach((word) => {
            word.style.opacity = "1";
            word.style.transform = "translateY(0)";
          });
        });
      });
    };

    animateWords(section.querySelector("[data-reveal='heading']"), 480, 85, 720, 26);
    animateWords(section.querySelector("[data-reveal='sub']"), 1150, 22, 600, 14);
  }, []);

  function onWaitlist(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    window.location.href = `/register${q}`;
  }

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
          Get Started
        </Link>
      </header>

      <div className="mkt-flow-center">
        <p className="mkt-flow-badge" data-reveal="badge">
          10K+ leads already scored
        </p>

        <h1 className="mkt-flow-heading" data-reveal="heading">
          {splitWords(HEADING).map((w, i, arr) => (
            <span key={`${w}-${i}`} data-word>
              {w}
              {i < arr.length - 1 ? "\u00A0" : ""}
            </span>
          ))}
        </h1>

        <p className="mkt-flow-sub" data-reveal="sub">
          {splitWords(SUBLINE).map((w, i, arr) => (
            <span key={`${w}-${i}`} data-word>
              {w}
              {i < arr.length - 1 ? "\u00A0" : ""}
            </span>
          ))}
        </p>

        <div className="mkt-flow-form-wrap" data-reveal="form">
          <form className="mkt-flow-form" onSubmit={onWaitlist}>
            <div className="mkt-flow-bar">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                autoComplete="email"
              />
              <button type="submit" className="mkt-flow-pill mkt-flow-pill--submit">
                Join Waitlist
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="mkt-flow-footer" data-reveal="footer">
        © 2026 Contractor Leads — engineered for agencies.
      </footer>
    </section>
  );
}
