import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GlitchShader } from './glitch.js';

const LOW_RES_WIDTH = 500; // internal render width → soft look
const OVERSCAN = 0.85;     // <1 zooms in so edges never show while moving

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: false });
document.body.appendChild(renderer.domElement);

// Scene + camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);

// Photo plane (unlit, so no lights needed)
let imageAspect = 4 / 3;
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff00ff }) // magenta until loaded
);
scene.add(plane);

new THREE.TextureLoader().load(
  `${import.meta.env.BASE_URL}photo.jpg`,
  (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    plane.material.map = tex;
    plane.material.color.set(0xffffff);
    plane.material.needsUpdate = true;
    imageAspect = tex.image.width / tex.image.height;
    fit();
  },
  undefined,
  () => console.error('photo.jpg not found in public/')
);

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const glitchPass = new ShaderPass(GlitchShader);
composer.addPass(glitchPass);
composer.addPass(new OutputPass()); // colour conversion, always last

// Sizing
let baseZ = 2;
function fit() {
  const w = innerWidth, h = innerHeight;
  const ratio = Math.min(1, LOW_RES_WIDTH / w);
  renderer.setPixelRatio(ratio);
  renderer.setSize(w, h);
  composer.setPixelRatio(ratio);
  composer.setSize(w, h);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  plane.scale.set(imageAspect, 1, 1);
  const visibleH = Math.min(1, imageAspect / camera.aspect) * OVERSCAN;
  baseZ = visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}
addEventListener('resize', fit);
fit();

// Mouse
const mouse = new THREE.Vector2();
const smooth = new THREE.Vector2();
addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});

// Loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  smooth.lerp(mouse, 0.05);

  plane.rotation.y = Math.sin(t * 0.3) * 0.04 + smooth.x * 0.08;
  plane.rotation.x = Math.cos(t * 0.25) * 0.03 - smooth.y * 0.06;

  camera.position.set(smooth.x * 0.03, smooth.y * 0.03, baseZ + Math.sin(t * 0.2) * 0.02);
  camera.lookAt(0, 0, 0);

  glitchPass.uniforms.uTime.value = t;
  composer.render();
}
animate();