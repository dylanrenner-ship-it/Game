// app.js
import { Avatar3D } from './avatar3d.js';

const el = (id) => document.getElementById(id);
const statusEl = el('status');

const avatar = new Avatar3D({
  canvasSmall: el('avatarCanvas'),
  canvasHero: el('avatarCanvasHero'),
  statusEl
});

function currentSelection(){
  return {
    charType: el('charType').value,
    species: el('species').value,
    variant: el('variant').value
  };
}

function syncUI(){
  // species only relevant for animals
  const isAnimal = el('charType').value === 'animal';
  el('species').disabled = !isAnimal;
  el('species').style.opacity = isAnimal ? '1' : '.5';
}

async function refresh(){
  syncUI();
  const sel = currentSelection();
  await avatar.loadAvatar(sel);
}

el('charType').addEventListener('change', refresh);
el('species').addEventListener('change', refresh);
el('variant').addEventListener('change', refresh);

el('btnRandom').addEventListener('click', async () => {
  const animals = ['dog','cat','bear','bunny','bird','fox'];
  const variants = ['v1','v2','v3'];
  const charType = Math.random() < 0.45 ? 'human' : 'animal';
  el('charType').value = charType;
  el('species').value = animals[Math.floor(Math.random()*animals.length)];
  el('variant').value = variants[Math.floor(Math.random()*variants.length)];
  await refresh();
});

el('btnExport').addEventListener('click', () => {
  const png = avatar.exportPNG();

  // Download both
  const dl = (dataUrl, name) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    a.click();
  };
  dl(png.small, 'avatar_ui.png');
  dl(png.hero,  'avatar_hero.png');

  statusEl.textContent = 'Exported PNG files ✅';
});

// Initial render
statusEl.textContent = 'Add models under /public/assets/models then refresh.';
refresh();
