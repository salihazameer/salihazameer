(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- hero word-reveal trigger ---------- */
  requestAnimationFrame(() => document.getElementById('hero').classList.add('is-loaded'));

  /* ---------- nav hide-on-scroll + progress bar ---------- */
  const nav = document.getElementById('siteNav');
  const progressBar = document.getElementById('progressBar');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 140) nav.classList.add('nav-hidden');
    else nav.classList.remove('nav-hidden');
    lastY = y;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = max > 0 ? (y / max * 100) + '%' : '0%';
  }, { passive: true });

  /* ---------- active nav link on scroll ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active'));
        const match = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObserver.observe(s));

  /* ---------- reveal on scroll (single + staggered) ---------- */
  const revealEls = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.hasAttribute('data-reveal-stagger')) {
          Array.from(entry.target.children).forEach((child, i) => {
            child.style.transitionDelay = reduceMotion ? '0s' : (i * 80) + 'ms';
          });
        }
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- animated stat counters ---------- */
  const counters = document.querySelectorAll('.stat-num[data-count]');
  const targets = { 0: 187, 1: 24, 2: 850 }; // demo numbers — swap for real ones
  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, idx) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const i = Array.from(counters).indexOf(el);
      const target = targets[i] ?? 100;
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; obs.unobserve(el); return; }
      const dur = 1400;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  /* ---------- hero video card subtle parallax tilt ---------- */
  const heroCard = document.getElementById('heroVideoCard');
  if (heroCard && !reduceMotion && window.matchMedia('(hover:hover)').matches) {
    heroCard.addEventListener('mousemove', (e) => {
      const r = heroCard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      heroCard.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateZ(0)`;
    });
    heroCard.addEventListener('mouseleave', () => {
      heroCard.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
    });
  }

  /* ---------- horizontal drag carousel for portfolio ---------- */
  const rail = document.getElementById('workRail');
  const railFill = document.getElementById('railFill');
  const prevBtn = document.getElementById('railPrev');
  const nextBtn = document.getElementById('railNext');

  // duplicate the card set once so the loop can wrap seamlessly
  const originalCards = Array.from(rail.children);
  originalCards.forEach(card => rail.appendChild(card.cloneNode(true)));
  const loopWidth = () => originalCards.reduce((sum, c) => sum + c.getBoundingClientRect().width + 22, 0);

  let isDown = false, startX = 0, startScroll = 0, moved = false;
  let autoplay = !reduceMotion;
  let speed = 0.5; // px per frame, to the right

  function updateFill() {
    const lw = loopWidth();
    const ratio = lw > 0 ? (rail.scrollLeft % lw) / lw : 0;
    const fillWidth = Math.max(12, (rail.clientWidth / lw) * 100);
    railFill.style.width = fillWidth + '%';
    railFill.style.transform = `translateX(${ratio * (100 / fillWidth - 1) * 100}%)`;
  }

  function loopCheck() {
    const lw = loopWidth();
    if (rail.scrollLeft >= lw) rail.scrollLeft -= lw;
    if (rail.scrollLeft < 0) rail.scrollLeft += lw;
  }

  function tick() {
    if (autoplay && !isDown) {
      rail.scrollLeft += speed;
      loopCheck();
      updateFill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  rail.addEventListener('mouseenter', () => autoplay = false);
  rail.addEventListener('mouseleave', () => { if (!isDown) autoplay = !reduceMotion; });

  rail.addEventListener('pointerdown', (e) => {
    isDown = true; moved = false; autoplay = false;
    startX = e.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add('dragging');
    rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    rail.scrollLeft = startScroll - dx;
    loopCheck();
  });
  function endDrag() {
    isDown = false;
    rail.classList.remove('dragging');
    setTimeout(() => { autoplay = !reduceMotion; }, 1200);
  }
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointerleave', endDrag);
  rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } });

  function cardStep() {
    const card = rail.querySelector('.work-card');
    return card ? card.getBoundingClientRect().width + 22 : 320;
  }
  prevBtn.addEventListener('click', () => { autoplay = false; rail.scrollBy({ left: -cardStep(), behavior: 'smooth' }); setTimeout(() => autoplay = !reduceMotion, 1200); });
  nextBtn.addEventListener('click', () => { autoplay = false; rail.scrollBy({ left: cardStep(), behavior: 'smooth' }); setTimeout(() => autoplay = !reduceMotion, 1200); });

  rail.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      autoplay = false;
      rail.scrollLeft += e.deltaY;
      loopCheck();
      clearTimeout(rail._wheelTimer);
      rail._wheelTimer = setTimeout(() => autoplay = !reduceMotion, 1200);
      e.preventDefault();
    }
  }, { passive: false });

  updateFill();

  document.getElementById('year').textContent = new Date().getFullYear();
})();
