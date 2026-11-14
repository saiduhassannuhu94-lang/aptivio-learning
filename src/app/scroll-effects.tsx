"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = [
  "main > .app-hero",
  "main > .app-stats",
  "main > .app-section",
  "main > .teaching-section",
  "main > .challenge-band",
  ".catalogue-content > .eyebrow",
  ".catalogue-content > h1",
  ".catalogue-content > p",
  ".library-preview-notice",
  ".catalogue-card",
  ".workspace-card",
  ".workspace-bottom > *",
  ".lesson-outline",
  ".lesson-reader-upgraded",
  ".lesson-concept-diagram",
  ".lesson-worked-example",
  ".lesson-practice-studio",
  ".challenge-section",
  ".challenge-card",
  ".challenge-intro-card",
  ".runner-question-card",
].join(",");

export function ScrollEffects() {
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        if (progressRef.current) {
          progressRef.current.style.transform = "scaleX(" + progress + ")";
        }
      });
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let revealObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    if (!reduceMotion && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
      );

      const observeOne = (element: Element) => {
        if (!(element instanceof HTMLElement) || element.classList.contains("scroll-reveal")) return;
        element.classList.add("scroll-reveal");
        revealObserver?.observe(element);
      };

      const observeTree = (root: ParentNode) => {
        if (root instanceof Element && root.matches(REVEAL_SELECTOR)) observeOne(root);
        root.querySelectorAll(REVEAL_SELECTOR).forEach(observeOne);
      };

      observeTree(document);
      mutationObserver = new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) observeTree(node);
          });
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      revealObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  return (
    <div className="scroll-progress-track" aria-hidden="true">
      <span ref={progressRef} />
    </div>
  );
}
