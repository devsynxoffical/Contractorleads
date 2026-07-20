"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Soft floating clouds — left / right framing like Gamma */
export function CloudDecor({
  side = "both",
  className,
}: {
  side?: "left" | "right" | "both";
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {(side === "left" || side === "both") && (
        <motion.div
          className="absolute -left-[12%] top-[2%] w-[min(58vw,460px)] sm:-left-[6%] lg:w-[500px]"
          animate={{ y: [0, -12, 0], x: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/marketing/cloud-left.png"
            alt=""
            width={640}
            height={400}
            className="h-auto w-full drop-shadow-[0_20px_50px_rgba(120,80,180,0.2)]"
          />
        </motion.div>
      )}
      {(side === "right" || side === "both") && (
        <motion.div
          className="absolute -right-[14%] top-[6%] w-[min(60vw,480px)] sm:-right-[7%] lg:w-[520px]"
          animate={{ y: [0, 14, 0], x: [0, -6, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/marketing/cloud-right.png"
            alt=""
            width={640}
            height={400}
            className="h-auto w-full drop-shadow-[0_20px_50px_rgba(120,80,180,0.2)]"
          />
        </motion.div>
      )}
    </div>
  );
}

export function SparklesDecor({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-16 z-[1] flex justify-center gap-14 text-violet-400/70 sm:gap-24",
        className,
      )}
      aria-hidden
    >
      {["✦", "✧", "✦"].map((s, i) => (
        <motion.span
          key={i}
          className={i === 1 ? "mt-8 text-sm" : i === 0 ? "text-xl" : "text-lg"}
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2.6 + i * 0.3, repeat: Infinity, delay: i * 0.35 }}
        >
          {s}
        </motion.span>
      ))}
    </div>
  );
}

export function SoftBlob({
  className,
  color = "pink",
}: {
  className?: string;
  color?: "pink" | "violet";
}) {
  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        color === "pink" ? "bg-pink-300/45" : "bg-violet-300/45",
        className,
      )}
      aria-hidden
      animate={{
        scale: [1, 1.08, 1],
        opacity: [0.85, 1, 0.85],
      }}
      transition={{ duration: 8 + (color === "violet" ? 1.5 : 0), repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Content photo with soft pink-purple frame */
export function ContentPhoto({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(100,60,160,0.15)] ring-1 ring-white/60",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(135deg, rgba(236,72,153,0.25), transparent 45%, rgba(168,85,247,0.2))",
        }}
      />
    </div>
  );
}

export const MARKETING_PHOTOS = {
  contractor: "/marketing/problem-contractors.png",
  team:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  analytics:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  meeting:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  home:
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
  laptop:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
} as const;
