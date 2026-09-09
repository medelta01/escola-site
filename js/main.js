// ===== TRANSIÇÃO ENTRE PÁGINAS =====
let isTransitioning = false;

function fadeInPage() {
  gsap.fromTo(document.body,
    { opacity: 0, y: 15 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out'
    }
  );
}

window.addEventListener('DOMContentLoaded', fadeInPage);

// Corrige o caso de voltar via botão do navegador (bfcache)
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    isTransitioning = false;
    fadeInPage();
  }
});

document.querySelectorAll('a[href$=".html"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const destino = link.getAttribute('href');

    // Ignora se for a própria página atual
    if (destino === window.location.pathname.split('/').pop()) return;

    // Ignora cliques repetidos enquanto uma transição já está em andamento
    if (isTransitioning) {
      e.preventDefault();
      return;
    }

    isTransitioning = true;
    e.preventDefault();

    gsap.to(document.body, {
      opacity: 0,
      duration: 0.35,
      ease: 'power1.in',
      onComplete: () => {
        window.location.href = destino;
      }
    });
  });
});

gsap.registerPlugin(ScrollTrigger);
// ===== SCROLL REVEAL =====
const revealElements = document.querySelectorAll('[data-reveal]');

revealElements.forEach((el) => {
  gsap.fromTo(el,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      }
    }
  );
});

// ===== PARALLAX NO HERO (apenas Home) =====
const heroInner = document.querySelector('.hero__inner');

if (heroInner) {
  gsap.to(heroInner, {
    y: 200,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '60% top',
      scrub: true,
    }
  });
}

// ===== MENU MOBILE =====
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('.nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('nav--open');
  navToggle.classList.toggle('is-active');
});

// ===== ANO ATUAL NO RODAPÉ =====
document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});