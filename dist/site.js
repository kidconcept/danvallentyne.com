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

const heroImage = document.querySelector('img.hero-image');
const heroCaption = document.querySelector('#hero-caption-text');
const heroCaptionContext = document.querySelector('#hero-caption-context');
const heroVideos = [...document.querySelectorAll('.hero-video')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const videoLoads = new Map();
let playerLibrary;
let mediaStarted = false;
let activeHeroVideo;

function loadVideo(video) {
  if (videoLoads.has(video)) return videoLoads.get(video);

  let ready;
  let complete;
  const loading = {
    ready: new Promise(resolve => { ready = resolve; }),
    complete: new Promise(resolve => { complete = resolve; }),
  };
  videoLoads.set(video, loading);
  video.preload = 'auto';
  video.autoplay = video.hasAttribute('data-autoplay') && !reducedMotion;
  video.addEventListener('loadeddata', () => ready(true), { once: true });
  video.addEventListener('error', () => {
    ready(false);
    complete();
  }, { once: true });

  (async () => {
    const Hls = await (playerLibrary ||= import('/assets/hls.light.min.js').then(() => window.Hls));
    if (Hls.isSupported()) {
      // These clips are at most 30 seconds: buffer each one before starting the next.
      const player = new Hls({
        maxBufferLength: 60,
        // Let the first variant set startup bandwidth, including the hero originals.
        abrEwmaDefaultEstimateMax: Infinity,
      });
      player.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
        if (data.frag.sn === player.levels[data.frag.level].details?.endSN) complete();
      });
      player.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          ready(false);
          complete();
          player.destroy();
        }
      });
      player.loadSource(video.dataset.hls);
      player.attachMedia(video);
    } else {
      video.addEventListener('canplaythrough', () => complete(), { once: true });
      video.src = video.canPlayType('application/vnd.apple.mpegurl') ? video.dataset.hls : video.dataset.src;
      video.load();
    }
  })().catch(() => {
    ready(false);
    complete();
  });

  return loading;
}

document.querySelectorAll('.scene-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.scene-button').forEach((scene) => {
      scene.setAttribute('aria-pressed', String(scene === button));
    });
    heroImage.src = button.dataset.image;
    heroImage.alt = button.dataset.alt;
    heroCaption.textContent = `${button.dataset.caption} • ${button.dataset.details}`;
    heroCaptionContext.textContent = button.dataset.context;
    const videoSrc = button.dataset.video;
    const isVideo = Boolean(videoSrc);
    heroImage.closest('.hero').classList.toggle('is-video-scene', isVideo);
    heroVideos.forEach(video => {
      video.pause();
      video.hidden = true;
    });
    activeHeroVideo = heroVideos.find(video => video.dataset.src === videoSrc);
    heroImage.hidden = false;
    if (isVideo && mediaStarted && !reducedMotion) {
      const video = activeHeroVideo;
      loadVideo(video).ready.then(loaded => {
        if (!loaded || activeHeroVideo !== video) return;
        video.currentTime = 0;
        video.hidden = false;
        heroImage.hidden = true;
        video.play().catch(() => {
          video.hidden = true;
          heroImage.hidden = false;
        });
      });
    }
  });
});

document.querySelector('.scene-button[aria-pressed="true"]')?.click();

// Load automatically in stages; scrolling and clicks never gate background downloads.
(async () => {
  const videos = [...document.querySelectorAll('video[data-hls]')];

  if (heroImage) await heroImage.decode().catch(() => {});
  await new Promise(requestAnimationFrame);
  mediaStarted = true;
  document.querySelector('.scene-button[aria-pressed="true"]')?.click();
  const hero = activeHeroVideo ? loadVideo(activeHeroVideo) : null;
  if (hero) await hero.ready;

  await Promise.all([...document.querySelectorAll('img[data-src], img[loading="lazy"], video[data-poster], iframe[data-src]')].map(element => {
    return new Promise(resolve => {
      const isPoster = element.tagName === 'VIDEO';
      const image = isPoster ? new Image() : element;
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
      image.loading = 'eager';
      if (element.dataset.srcset) image.srcset = element.dataset.srcset;
      image.src = isPoster ? element.dataset.poster : element.dataset.src || image.src;
      if (isPoster) element.poster = image.src;
      if (image.complete) resolve();
    });
  }));

  if (hero) await hero.complete;
  const remaining = [
    ...videos.filter(video => !heroVideos.includes(video)),
    ...heroVideos.filter(video => video !== activeHeroVideo),
  ];
  for (const video of remaining) await loadVideo(video).complete;
})();
