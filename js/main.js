const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const copyButton = document.getElementById("copyPixButton");
const pixKey = document.getElementById("pixKey");
const revealElements = [...document.querySelectorAll(".reveal")];
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

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

if (copyButton && pixKey) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pixKey.textContent.trim());
      const original = copyButton.textContent;
      copyButton.textContent = "Pix copiado";
      setTimeout(() => {
        copyButton.textContent = original;
      }, 1800);
    } catch (error) {
      copyButton.textContent = "Copie manualmente";
    }
  });
}

function revealImmediately() {
  revealElements.forEach((element) => element.classList.add("visible"));
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
      { threshold: 0.12 },
    );

    revealElements.forEach((element) => observer.observe(element));
  }
}

if (prefersReducedMotion.addEventListener) {
  prefersReducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      revealImmediately();
    }
  });
}
