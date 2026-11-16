const canvas = document.getElementById('hearts');
const ctx = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS = ['#ff5e8a', '#ff8fab', '#c77dff', '#ffb86b', '#ff6b9d', '#e0aaff'];

let W = 0, H = 0;
const hearts = [];
const stars = [];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function ambientHeart() {
  return {
    burst: false,
    baseX: rand(0, W),
    x: 0,
    y: H + 40,
    size: rand(7, 20),
    vy: rand(0.25, 0.8),
    sway: rand(15, 55),
    freq: rand(0.0006, 0.0016),
    phase: rand(0, Math.PI * 2),
    rot: rand(-0.35, 0.35),
    color: pick(COLORS),
    alpha: rand(0.25, 0.65)
  };
}

function burst(x, y, n) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(1, 4.5);
    hearts.push({
      burst: true,
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1.2,
      size: rand(6, 15),
      rot: rand(-0.6, 0.6),
      vr: rand(-0.05, 0.05),
      color: pick(COLORS),
      life: 1,
      decay: rand(0.008, 0.018)
    });
  }
}

function heartPath(s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(s * 0.5, -s * 0.15, s * 0.35, -s * 0.55, 0, -s * 0.2);
  ctx.bezierCurveTo(-s * 0.35, -s * 0.55, -s * 0.5, -s * 0.15, 0, s * 0.35);
  ctx.closePath();
}

function drawHeart(p, alpha) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = p.size * 0.9;
  heartPath(p.size);
  ctx.fill();
  ctx.restore();
}

for (let i = 0; i < 26; i++) {
  stars.push({ x: rand(0, W), y: rand(0, H), r: rand(0.6, 1.8), phase: rand(0, Math.PI * 2), speed: rand(0.001, 0.003) });
}

function frame(now) {
  ctx.clearRect(0, 0, W, H);

  for (const s of stars) {
    ctx.globalAlpha = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase));
    ctx.fillStyle = '#ffd9ec';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const target = Math.min(38, Math.round(W * H / 32000));
  let ambient = 0;

  for (let i = hearts.length - 1; i >= 0; i--) {
    const p = hearts[i];
    if (p.burst) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045;
      p.rot += p.vr;
      p.life -= p.decay;
      if (p.life <= 0) { hearts.splice(i, 1); continue; }
      drawHeart(p, p.life * 0.9);
    } else {
      ambient++;
      p.y -= p.vy;
      p.x = p.baseX + Math.sin(now * p.freq + p.phase) * p.sway;
      if (p.y < -50) Object.assign(p, ambientHeart());
      const edge = Math.min(1, (H + 40 - p.y) / 120, (p.y + 50) / 120);
      drawHeart(p, p.alpha * edge);
    }
  }

  while (ambient < target) {
    const p = ambientHeart();
    p.y = rand(0, H);
    hearts.push(p);
    ambient++;
  }

  requestAnimationFrame(frame);
}

if (reduceMotion) {
  for (const s of stars) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffd9ec';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 20; i++) {
    const p = ambientHeart();
    p.y = rand(0, H);
    p.x = p.baseX;
    drawHeart(p, p.alpha);
  }
} else {
  requestAnimationFrame(frame);
  window.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button, [contenteditable]')) return;
    burst(e.clientX, e.clientY, 10);
  });
}

const heroTitle = document.getElementById('heroTitle');
const words = heroTitle.textContent.trim().split(/\s+/);
heroTitle.innerHTML = words
  .map((w, i) => `<span class="word" style="--d:${(0.25 + i * 0.09).toFixed(2)}s">${w}</span>`)
  .join(' ');

function startReveals() {
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    }
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal, .card').forEach(el => io.observe(el));
}

const song = document.getElementById('loveSong');
const musicBtn = document.getElementById('musicBtn');
const musicLabel = musicBtn.querySelector('.music-label');
const songBar = document.getElementById('songBar');
const songHint = document.getElementById('songHint');
let songReady = true;
let wantPlay = true;
let startedByGesture = false;
let hintTimer;

function setMusicUI(playing) {
  musicBtn.classList.toggle('playing', playing);
  musicBtn.setAttribute('aria-pressed', String(playing));
}

function showSongHint() {
  songHint.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => songHint.classList.remove('show'), 5200);
}

function markSongMissing() {
  songReady = false;
  setMusicUI(false);
  musicBtn.classList.add('missing');
  musicLabel.textContent = 'add song.mp3';
  musicBtn.title = 'Put your song next to index.html and name it song.mp3';
}

function playSong() {
  if (!songReady || !song.paused) return;
  song.play().then(() => setMusicUI(true)).catch(() => {
    if (song.error) { markSongMissing(); showSongHint(); }
    setMusicUI(false);
  });
}

song.volume = 0.8;
song.addEventListener('error', () => {
  markSongMissing();
  if (document.body.classList.contains('unlocked')) showSongHint();
});
song.addEventListener('play', () => setMusicUI(true));
song.addEventListener('pause', () => setMusicUI(false));
song.addEventListener('timeupdate', () => {
  if (song.duration) songBar.style.width = (song.currentTime / song.duration * 100) + '%';
});

musicBtn.addEventListener('click', () => {
  if (startedByGesture) { startedByGesture = false; return; }
  if (!songReady) { showSongHint(); return; }
  if (song.paused) { wantPlay = true; playSong(); }
  else { wantPlay = false; song.pause(); }
});

window.addEventListener('pointerdown', e => {
  if (wantPlay && songReady && song.paused && document.body.classList.contains('unlocked')) {
    if (e.target.closest('#musicBtn')) startedByGesture = true;
    playSong();
  }
});

const lockScreen = document.getElementById('lockScreen');
const lockForm = document.getElementById('lockForm');
const lockInput = document.getElementById('lockInput');
const lockError = document.getElementById('lockError');
const PASSWORD = 'love you';
const UNLOCK_KEY = 'love-unlocked';

function unlock() {
  document.body.classList.remove('locked');
  document.body.classList.add('unlocked');
  lockScreen.classList.add('open');
  setTimeout(() => lockScreen.remove(), 900);
  burst(W / 2, H / 2, 30);
  startReveals();
  playSong();
  if (!songReady) showSongHint();
  try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (_) {}
}

let alreadyUnlocked = false;
try { alreadyUnlocked = sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (_) {}

if (alreadyUnlocked) {
  document.body.classList.remove('locked');
  document.body.classList.add('unlocked');
  lockScreen.remove();
  startReveals();
  playSong();
  if (!songReady) showSongHint();
} else {
  lockInput.focus();
  lockForm.addEventListener('submit', e => {
    e.preventDefault();
    const value = lockInput.value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (value === PASSWORD) {
      lockError.textContent = '';
      unlock();
    } else {
      lockError.textContent = "Hmm, that's not it... try again, my love";
      lockForm.classList.remove('shake');
      void lockForm.offsetWidth;
      lockForm.classList.add('shake');
      lockInput.select();
    }
  });
}

document.querySelectorAll('.photo img').forEach(img => {
  img.addEventListener('error', () => img.classList.add('missing'));
  if (img.complete && img.naturalWidth === 0) img.classList.add('missing');
});

if (matchMedia('(pointer: fine)').matches && !reduceMotion) {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform .15s ease-out, box-shadow .45s';
    });
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
      card.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-8px) scale(1.03)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = '';
      card.style.transform = '';
    });
  });
}

const note = document.getElementById('loveNote');
const NOTE_KEY = 'love-note-text';
try {
  const saved = localStorage.getItem(NOTE_KEY);
  if (saved !== null) note.textContent = saved;
} catch (_) {}
let saveTimer;
note.addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(NOTE_KEY, note.textContent); } catch (_) {}
  }, 250);
});

const sweetMsgs = [
  'You are my favorite notification.',
  'Every love story is beautiful, but ours is my favorite.',
  'You + Me = Everything.',
  'I fall for you more every single day.',
  'Home is wherever you are.',
  'You are the best part of every day.',
  'My heart smiles every time it thinks of you.'
];
const loveBtn = document.getElementById('loveBtn');
const sweetMsg = document.getElementById('sweetMsg');
let msgIndex = 0;
loveBtn.addEventListener('click', () => {
  const r = loveBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 28);
  sweetMsg.classList.remove('show');
  setTimeout(() => {
    sweetMsg.textContent = sweetMsgs[msgIndex++ % sweetMsgs.length];
    sweetMsg.classList.add('show');
  }, 180);
});