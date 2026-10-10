const progressBar = document.querySelector("#progress-bar");
const revealItems = document.querySelectorAll(".reveal");
const toast = document.querySelector("#toast");
const archiveItems = document.querySelectorAll(".archive-item");
const logGroups = document.querySelectorAll(".log-group");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxClose = document.querySelector("#lightbox-close");
const header = document.querySelector(".site-header");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
let activeScrollAnimation = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2500);
}

function updateProgressBar() {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

function getHeaderOffset() {
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return headerHeight + 24;
}

function easeInOutQuart(progress) {
  if (progress < 0.5) {
    return 8 * progress * progress * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 4) / 2;
}

function cancelSmoothScroll() {
  if (activeScrollAnimation !== null) {
    window.cancelAnimationFrame(activeScrollAnimation);
    activeScrollAnimation = null;
  }
}

function openLightbox(src, altText) {
  lightboxImage.src = src;
  lightboxImage.alt = altText;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  document.body.style.overflow = "";
}

function updateLogStack(group, activeIndex) {
  const stackItems = Array.from(group.querySelectorAll(".stack-item"));
  if (!stackItems.length) {
    return;
  }

  const count = stackItems.length;
  const nextActive = ((activeIndex % count) + count) % count;
  group.dataset.activeIndex = String(nextActive);

  stackItems.forEach((item, index) => {
    const offset = (index - nextActive + count) % count;
    const isVisible = offset === 0;
    const isTop = offset === 0;

    item.hidden = !isVisible;
    item.style.setProperty("--stack-pos", String(offset));
    item.style.opacity = isVisible ? "1" : "0";
    item.style.pointerEvents = isTop ? "auto" : "none";
    item.style.zIndex = String(10 - offset);
  });
}

function setupLogGroups() {
  logGroups.forEach((group) => {
    const stackItems = Array.from(group.querySelectorAll(".stack-item"));
    if (!stackItems.length) {
      return;
    }

    const head = group.querySelector(".log-head");
    const controls = document.createElement("div");
    controls.className = "log-controls";

    const prevButton = document.createElement("button");
    prevButton.className = "log-control";
    prevButton.type = "button";
    prevButton.textContent = "Prev";

    const nextButton = document.createElement("button");
    nextButton.className = "log-control";
    nextButton.type = "button";
    nextButton.textContent = "Next";

    controls.append(prevButton, nextButton);
    head.append(controls);

    let activeIndex = 0;
    updateLogStack(group, activeIndex);

    if (stackItems.length === 1) {
      prevButton.disabled = true;
      nextButton.disabled = true;
    }

    prevButton.addEventListener("click", () => {
      activeIndex -= 1;
      updateLogStack(group, activeIndex);
    });

    nextButton.addEventListener("click", () => {
      activeIndex += 1;
      updateLogStack(group, activeIndex);
    });
  });
}

function smoothScrollTo(targetY) {
  cancelSmoothScroll();

  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const clampedTargetY = Math.max(0, Math.min(targetY, maxY));
  const distance = clampedTargetY - startY;
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Math.max(300, Math.min(650, Math.abs(distance) * 0.25));
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
    const eased = easeInOutQuart(progress);
    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      activeScrollAnimation = window.requestAnimationFrame(step);
      return;
    }

    activeScrollAnimation = null;
  }

  activeScrollAnimation = window.requestAnimationFrame(step);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
  }
);

revealItems.forEach((item) => {
  revealObserver.observe(item);
});

anchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");

    if (!hash || hash === "#") {
      return;
    }

    const target = document.querySelector(hash);
    if (!target) {
      return;
    }

    event.preventDefault();
    const targetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    smoothScrollTo(targetTop);
    window.history.replaceState(null, "", hash);
  });
});

window.addEventListener("wheel", cancelSmoothScroll, { passive: true });
window.addEventListener("touchstart", cancelSmoothScroll, { passive: true });

archiveItems.forEach((item) => {
  item.addEventListener("click", () => {
    // Log photos that link to a project page navigate instead of opening the lightbox.
    if (!item.classList.contains("stack-item") || !item.dataset.lightboxSrc) {
      return;
    }

    const img = item.querySelector("img");
    openLightbox(item.dataset.lightboxSrc, img ? img.alt : "Archive image");
  });
});

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});

window.addEventListener("scroll", updateProgressBar, { passive: true });
window.addEventListener("load", updateProgressBar);

setupLogGroups();
