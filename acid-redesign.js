'use strict';

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const root = document.documentElement;
  const body = document.body;

  const progress = document.createElement('div');
  progress.className = 'ambient-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.prepend(progress);

  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-field';
  canvas.setAttribute('aria-hidden', 'true');
  const heroSection = document.querySelector('.hero');
  (heroSection || body).prepend(canvas);

  const pointerOrb = document.createElement('div');
  pointerOrb.className = 'pointer-orb';
  pointerOrb.setAttribute('aria-hidden', 'true');
  body.append(pointerOrb);

  const ctx = canvas.getContext('2d');
  const pointer = { x: window.innerWidth * .72, y: window.innerHeight * .32, tx: window.innerWidth * .72, ty: window.innerHeight * .32 };
  let viewport = { width: window.innerWidth, height: window.innerHeight, ratio: 1 };
  let particles = [];
  let animationFrame = 0;

  function randomParticle(index) {
    const symbols = ['H⁺', 'O₂', 'e⁻', 'Fe²⁺'];
    return {
      x: Math.random() * viewport.width,
      y: Math.random() * viewport.height,
      radius: 1 + Math.random() * 2.4,
      vx: (Math.random() - .5) * .13,
      vy: -.05 - Math.random() * .15,
      alpha: .12 + Math.random() * .3,
      phase: Math.random() * Math.PI * 2,
      label: index % 11 === 0 ? symbols[index % symbols.length] : ''
    };
  }

  function resize() {
    viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: Math.min(window.devicePixelRatio || 1, 1.5)
    };
    canvas.width = Math.round(viewport.width * viewport.ratio);
    canvas.height = Math.round(viewport.height * viewport.ratio);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    if (ctx) ctx.setTransform(viewport.ratio, 0, 0, viewport.ratio, 0, 0);
    const count = Math.max(18, Math.min(52, Math.round(viewport.width / 30)));
    particles = Array.from({ length: count }, (_, index) => randomParticle(index));
  }

  function draw(time) {
    if (!ctx || reducedMotion.matches) return;
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    pointer.x += (pointer.tx - pointer.x) * .045;
    pointer.y += (pointer.ty - pointer.y) * .045;

    const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.min(viewport.width, 520));
    glow.addColorStop(0, 'rgba(216,255,82,.045)');
    glow.addColorStop(1, 'rgba(216,255,82,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    particles.forEach((particle) => {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.max(70, Math.hypot(dx, dy));
      if (distance < 230) {
        particle.x += (dx / distance) * .22;
        particle.y += (dy / distance) * .22;
      }
      particle.x += particle.vx + Math.sin(time * .00035 + particle.phase) * .05;
      particle.y += particle.vy;
      if (particle.y < -30) particle.y = viewport.height + 25;
      if (particle.x < -30) particle.x = viewport.width + 25;
      if (particle.x > viewport.width + 30) particle.x = -25;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(216,255,82,${particle.alpha})`;
      ctx.fill();
      if (particle.label) {
        ctx.fillStyle = `rgba(216,255,82,${particle.alpha * .7})`;
        ctx.font = '600 9px ui-monospace, monospace';
        ctx.fillText(particle.label, particle.x + 7, particle.y - 6);
      }
    });
    animationFrame = requestAnimationFrame(draw);
  }

  function updateScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    root.style.setProperty('--page-progress', Math.min(1, window.scrollY / max).toFixed(4));
  }

  function onPointerMove(event) {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    root.style.setProperty('--pointer-x', `${event.clientX}px`);
    root.style.setProperty('--pointer-y', `${event.clientY}px`);
    pointerOrb.classList.add('is-visible');
    const hero = document.querySelector('.hero');
    if (hero) {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const nx = (event.clientX / Math.max(1, window.innerWidth) - .5);
        const ny = (event.clientY / Math.max(1, window.innerHeight) - .5);
        hero.style.setProperty('--hero-mx', `${nx * 70}px`);
        hero.style.setProperty('--hero-my', `${ny * 45}px`);
        hero.style.setProperty('--metal-rx', `${nx * 8}deg`);
        hero.style.setProperty('--metal-ry', `${ny * -7}deg`);
      }
    }
  }

  const revealTargets = [
    document.querySelector('.hypothesis'),
    document.querySelector('.workbench'),
    document.querySelector('.results-title'),
    document.querySelector('.chart-grid'),
    document.querySelector('.result-brief'),
    document.querySelector('.compare-head'),
    document.querySelector('.compare-board')
  ].filter(Boolean);
  revealTargets.forEach((element) => element.setAttribute('data-reveal', ''));
  const compareActions = document.querySelector('.compare-actions');
  if (compareActions) compareActions.setAttribute('data-reveal-stagger', '');

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((element) => element.classList.add('is-revealed'));
  }

  document.querySelectorAll('button, input[type="range"], summary').forEach((element) => {
    element.addEventListener('pointerenter', () => pointerOrb.classList.add('is-active'));
    element.addEventListener('pointerleave', () => pointerOrb.classList.remove('is-active'));
  });

  document.querySelectorAll('.primary-button, .run-button, .preset-button').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .11;
      const y = (event.clientY - rect.top - rect.height / 2) * .14;
      button.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.02)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });

  function startAmbient() {
    cancelAnimationFrame(animationFrame);
    if (!reducedMotion.matches && ctx) animationFrame = requestAnimationFrame(draw);
  }

  resize();
  updateScroll();
  startAmbient();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });
  if (finePointer.matches) window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', () => pointerOrb.classList.remove('is-visible'));
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', startAmbient);
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(startAmbient);
  }
})();
