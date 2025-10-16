// Smooth navigation to another page
function goTo(url) {
  window.location.href = url;
}

// Go back one page
function goBack() {
  window.history.back();
}

// Fade-in animation for cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  cards.forEach((c, i) => {
    c.style.opacity = 0;
    c.style.transform = 'translateY(16px)';
    setTimeout(() => {
      c.style.transition = 'all 450ms cubic-bezier(.2,.9,.2,1)';
      c.style.opacity = 1;
      c.style.transform = 'translateY(0)';
    }, i * 90);
  });
});

// Toggle years under specialties
function toggleYears(id) {
  const allYears = document.querySelectorAll('.years');
  allYears.forEach(section => {
    if (section.id !== id) section.style.display = 'none';
  });

  const selected = document.getElementById(id);
  if (selected.style.display === 'flex') {
    selected.style.display = 'none';
  } else {
    selected.style.display = 'flex';
  }
}
