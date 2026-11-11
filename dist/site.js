const menuButton = document.querySelector('.menu-button');
const mainNav = document.querySelector('.main-nav');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close −' : 'Menu +';
  mainNav.classList.toggle('is-open', open);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    menuButton.click();
    menuButton.focus();
  }
});

const heroImage = document.querySelector('.hero-image');
const heroCaption = document.querySelector('#hero-caption-text');
const heroVideo = document.querySelector('.hero-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.scene-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.scene-button').forEach((scene) => {
      scene.setAttribute('aria-pressed', String(scene === button));
    });
    heroImage.src = button.dataset.image;
    heroImage.alt = button.dataset.alt;
    heroCaption.textContent = button.dataset.caption;
    const isVideo = button.dataset.video === 'true';
    heroImage.closest('.hero').classList.toggle('is-video-scene', isVideo);
    heroVideo.pause();
    heroVideo.hidden = !isVideo || reducedMotion;
    heroImage.hidden = !heroVideo.hidden;
    if (isVideo && !reducedMotion) {
      heroVideo.currentTime = 0;
      heroVideo.play().catch(() => {
        heroVideo.hidden = true;
        heroImage.hidden = false;
      });
    }
  });
});

if (reducedMotion) {
  document.querySelectorAll('.project-image video').forEach((video) => {
    video.autoplay = false;
    video.pause();
  });
}
