// Simple staggered fade-in animation for the pole cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.pole-card');
  cards.forEach((c,i) => {
    c.style.opacity = 0;
    c.style.transform = 'translateY(16px)';
    setTimeout(() => {
      c.style.transition = 'all 450ms cubic-bezier(.2,.9,.2,1)';
      c.style.opacity = 1;
      c.style.transform = 'translateY(0)';
    }, i * 90);
  });
});
