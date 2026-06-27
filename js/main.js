const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const copyButton = document.getElementById("copyPixButton");
const pixKey = document.getElementById("pixKey");
const revealElements = [...document.querySelectorAll(".reveal")];
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const marqueeTrack = document.querySelector(".marquee-track");

// ===== Header scroll =====
function syncHeader() {
  if (!header) return;
  if (window.scrollY > 24) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }
}

if (header) {
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

// ===== Mobile nav toggle =====
if (toggle && mobileNav) {
  toggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ===== Copy Pix key =====
if (copyButton && pixKey) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pixKey.textContent.trim());
      const original = copyButton.textContent;
      copyButton.textContent = "Pix copiado";
      setTimeout(() => {
        copyButton.textContent = original;
      }, 1800);
    } catch {
      copyButton.textContent = "Copie manualmente";
    }
  });
}

// ===== Reveal on scroll =====
function revealImmediately() {
  revealElements.forEach((el) => el.classList.add("visible"));
}

if (revealElements.length) {
  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealImmediately();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    revealElements.forEach((el) => observer.observe(el));
  }
}

if (prefersReducedMotion.addEventListener) {
  prefersReducedMotion.addEventListener("change", (e) => {
    if (e.matches) revealImmediately();
    if (marqueeTrack) {
      marqueeTrack.style.animationPlayState = e.matches ? "paused" : "running";
    }
  });
}

// ===== Marquee: pause on reduced motion =====
if (marqueeTrack && prefersReducedMotion.matches) {
  marqueeTrack.style.animationPlayState = "paused";
}
