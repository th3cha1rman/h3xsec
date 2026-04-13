/* ============================================================
   h3xsec — script.js
   ============================================================ */

/* ── SCROLL REVEAL ──────────────────────────────────────────
   Watches .reveal elements and adds .visible when they enter
   the viewport, triggering the CSS transition.
──────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ── STAGGER CHILDREN ───────────────────────────────────────
   Adds incremental transition-delay to direct children of
   .features-grid and .stats-bar for a cascade effect.
──────────────────────────────────────────────────────────── */
document.querySelectorAll('.features-grid, .stats-bar').forEach((parent) => {
  Array.from(parent.children).forEach((child, i) => {
    child.style.transitionDelay = `${i * 80}ms`;
  });
});

/* ── ANIMATED COUNTER ───────────────────────────────────────
   Counts a stat number up from 0 to its target value.
   - el      : the DOM element to update
   - target  : numeric end value
   - suffix  : string appended after the number (e.g. '+')
──────────────────────────────────────────────────────────── */
function animateCount(el, target, suffix = '') {
  let current = 0;
  const duration = 1500; // ms
  const increment = Math.ceil(target / 60); // ~60 ticks
  const interval = Math.floor(duration / (target / increment));

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current + suffix;
  }, interval);
}

/* Observe stat numbers and kick off counters when visible */
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const raw = el.textContent;

      if (raw.includes('600')) animateCount(el, 600, '+');
      else if (raw.includes('10')) animateCount(el, 10, '+');

      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

/* ── NOW PLAYING WIDGET ─────────────────────────────────────
   Real audio playback. Drop your .mp3 in the same folder and
   set <source src="yourfile.mp3"> in index.html.
──────────────────────────────────────────────────────────── */
(function () {
  const audio       = document.getElementById('npAudio');
  const playBtn     = document.getElementById('npPlayPause');
  const icon        = document.getElementById('npIcon');
  const fill        = document.getElementById('npFill');
  const currentTime = document.getElementById('npCurrentTime');
  const vinyl       = document.getElementById('npVinyl');
  const bars        = document.getElementById('npBars');
  const progressBar = document.querySelector('.np-progress-bar');

  if (!audio || !playBtn) return;

  let isPlaying = false;

  /* ── helpers ── */
  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    fill.style.width = pct + '%';
    currentTime.textContent = formatTime(audio.currentTime);

    // keep the displayed total time accurate once metadata loads
    const totalEl = document.querySelectorAll('.np-time')[1];
    if (totalEl) totalEl.textContent = formatTime(audio.duration);
  }

  function setVisualState(playing) {
    if (playing) {
      icon.innerHTML = '&#9646;&#9646;';      // pause icon
      vinyl.classList.remove('paused');
      bars.classList.remove('paused');
    } else {
      icon.innerHTML = '&#9654;';             // play icon
      vinyl.classList.add('paused');
      bars.classList.add('paused');
    }
  }

  /* ── play / pause ── */
  function tryPlay() {
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          isPlaying = true;
          setVisualState(true);
        })
        .catch((err) => {
          console.warn('Audio play blocked:', err);
          isPlaying = false;
          setVisualState(false);
        });
    }
  }

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      setVisualState(false);
    } else {
      tryPlay();
    }
  });

  /* ── sync progress bar with audio ── */
  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('loadedmetadata', () => {
    updateProgress();
  });

  audio.addEventListener('ended', () => {
    isPlaying = false;
    setVisualState(false);
    fill.style.width = '0%';
    currentTime.textContent = '0:00';
  });

  /* ── click progress bar to seek ── */
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
  }

  /* ── prev: restart ── */
  const prevBtn = document.getElementById('npPrev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      audio.currentTime = 0;
      if (isPlaying) tryPlay();
    });
  }

  /* ── next: skip to end (loops back to start) ── */
  const nextBtn = document.getElementById('npNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      audio.currentTime = 0;
      updateProgress();
    });
  }

  /* ── start in paused state visually ── */
  setVisualState(false);

})();



/* ── ACTIVE NAV LINK ────────────────────────────────────────
   Highlights the nav link whose section is currently in view.
──────────────────────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id], div[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach((section) => sectionObserver.observe(section));

/* ── MOBILE NAV TOGGLE ──────────────────────────────────────
   If a hamburger button with id="nav-toggle" is added to the
   HTML, this will handle showing/hiding the mobile menu.
──────────────────────────────────────────────────────────── */
const navToggle = document.getElementById('nav-toggle');
const navLinksEl = document.querySelector('.nav-links');

if (navToggle && navLinksEl) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}