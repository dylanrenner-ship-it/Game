// avatar3d.js
// Renders low‑poly GLB/GLTF avatars into a transparent canvas.
// Designed for StackBlitz/Firebase hosting.
//
// NOTE: Models are not included. Add them under /public/assets/models/ (see README).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function makeRenderer(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x000000, 0); // transparent
  return renderer;
}

function makeScene(){
  const scene = new THREE.Scene();

  // Faceted low-poly look: use hard-ish directional lighting + low ambient.
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(3, 4, 2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-3, 2, 3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.25);
  rim.position.set(-2, 4, -3);
  scene.add(rim);

  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(amb);

  return scene;
}

function makeCamera(size){
  // A gentle perspective that feels like toy photography.
  const aspect = size.w / size.h;
  const camera = new THREE.PerspectiveCamera(25, aspect, 0.01, 100);
  camera.position.set(0, 1.05, 3.2);
  camera.lookAt(0, 0.95, 0);
  return camera;
}

function applyFacetedMaterials(root){
  // Ensure materials read "faceted": prefer MeshStandardMaterial; disable flatShading only if you want smoother.
  root.traverse(obj => {
    if (!obj.isMesh) return;
    obj.castShadow = false;
    obj.receiveShadow = false;

    const m = obj.material;
    if (Array.isArray(m)){
      obj.material = m.map(mm => normalizeMaterial(mm));
    } else {
      obj.material = normalizeMaterial(m);
    }
  });

  function normalizeMaterial(mat){
    if (!mat) return mat;
    // Convert to standard if needed
    let out = mat;
    if (!(mat instanceof THREE.MeshStandardMaterial)){
      out = new THREE.MeshStandardMaterial({
        color: mat.color || new THREE.Color(0xffffff),
        map: mat.map || null,
        metalness: 0.0,
        roughness: 0.9
      });
    } else {
      out.metalness = 0.0;
      out.roughness = 0.9;
    }
    // Faceted: flatShading ON (requires computeVertexNormals to see effect if imported smooth)
    out.flatShading = true;
    out.needsUpdate = true;
    return out;
  }
}

function frameObjectToCamera(obj, camera, targetY = 0.95){
  // Compute bounds
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Recenter
  obj.position.x += (0 - center.x);
  obj.position.y += (targetY - center.y);
  obj.position.z += (0 - center.z);

  // Camera distance based on object height
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let dist = (maxDim / (2 * Math.tan(fov / 2)));
  dist *= 1.25; // padding
  camera.position.set(0, 1.05, dist * 1.25);
  camera.lookAt(0, 0.95, 0);
}

export class Avatar3D {
  constructor({ canvasSmall, canvasHero, statusEl }){
    this.statusEl = statusEl;
    this.small = this._makeViewport(canvasSmall);
    this.hero  = this._makeViewport(canvasHero);
    this.loader = new GLTFLoader();
    this.current = null;

    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _makeViewport(canvas){
    const renderer = makeRenderer(canvas);
    const scene = makeScene();
    const camera = makeCamera({ w: canvas.width, h: canvas.height });
    return { canvas, renderer, scene, camera };
  }

  async loadAvatar({ charType, species, variant }){
    const url = this._modelUrl({ charType, species, variant });
    this._log(`Loading model: ${url}`);

    // Clear prior
    this._disposeCurrent();
    this._clearScene(this.small.scene);
    this._clearScene(this.hero.scene);

    try{
      const gltf = await this.loader.loadAsync(url);
      const root = gltf.scene;
      root.rotation.y = Math.PI * 0.15; // nice angle
      applyFacetedMaterials(root);

      // Clone for each viewport
      const rootSmall = root;
      const rootHero  = root.clone(true);

      this.small.scene.add(rootSmall);
      this.hero.scene.add(rootHero);

      frameObjectToCamera(rootSmall, this.small.camera);
      frameObjectToCamera(rootHero,  this.hero.camera);

      this.current = { rootSmall, rootHero };
      this._log('Avatar loaded ✅');
      return true;
    } catch (err){
      this._log(`Failed to load model ❌\n${String(err)}`);
      this._log(`Make sure the model exists at: ${url}`);
      return false;
    }
  }

  exportPNG(){
    // Returns data URLs for both canvases.
    return {
      small: this.small.canvas.toDataURL('image/png'),
      hero:  this.hero.canvas.toDataURL('image/png'),
    };
  }

  _modelUrl({ charType, species, variant }){
    const v = (variant || 'v1').replace(/[^a-z0-9_-]/gi,'');
    if (charType === 'human'){
      return `/assets/models/human/${v}.glb`;
    }
    const sp = (species || 'dog').replace(/[^a-z0-9_-]/gi,'');
    return `/assets/models/animal/${sp}/${v}.glb`;
  }

  _clearScene(scene){
    // remove all except lights
    const keep = new Set();
    scene.traverse(o => { if (o.isLight) keep.add(o); });
    [...scene.children].forEach(ch => { if (!keep.has(ch)) scene.remove(ch); });
  }

  _disposeCurrent(){
    if (!this.current) return;
    const disposeRoot = (root) => {
      root.traverse(obj => {
        if (obj.isMesh){
          if (obj.geometry) obj.geometry.dispose?.();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach(mm => mm.dispose?.());
          else m?.dispose?.();
        }
      });
    };
    disposeRoot(this.current.rootSmall);
    disposeRoot(this.current.rootHero);
    this.current = null;
  }

  _tick(){
    // idle rotate gently
    if (this.current){
      this.current.rootSmall.rotation.y += 0.004;
      this.current.rootHero.rotation.y  += 0.004;
    }
    this.small.renderer.render(this.small.scene, this.small.camera);
    this.hero.renderer.render(this.hero.scene, this.hero.camera);
    requestAnimationFrame(this._tick);
  }

  _log(msg){
    if (!this.statusEl) return;
    this.statusEl.textContent = msg;
  }
}
