/**
 * Decorative Three.js archive: no critical copy or navigation depends on WebGL.
 * The static HTML/CSS scene remains visible if the CDN, JS, or GPU is unavailable.
 */
const stage = document.querySelector('[data-archive-stage]');
const canvas = document.querySelector('[data-archive-canvas]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = window.matchMedia('(max-width: 760px)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

if (stage && canvas && !reduceMotion.matches && !smallScreen.matches && !coarsePointer.matches) {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      initializeArchive().catch(() => {
        // Keep the accessible CSS fallback if WebGL cannot start.
        stage.classList.remove('three-ready');
      });
    }
  }, { rootMargin: '180px' });
  observer.observe(stage);
}

async function initializeArchive() {
  const THREE = await import('three');
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  if (!stageWidth || !stageHeight) return;

  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
    || canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) return;

  const renderer = new THREE.WebGLRenderer({
    canvas, context: gl, alpha: true, antialias: true,
    powerPreference: 'low-power'
  });
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  camera.position.set(0, 0, 12.6);
  scene.add(new THREE.AmbientLight(0xffffff, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffefcf, 3.8);
  keyLight.position.set(-3, 7, 8);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xb8d7ee, 2.3);
  rimLight.position.set(5, -1, 5);
  scene.add(rimLight);

  const archive = new THREE.Group();
  scene.add(archive);
  const ink = '#152539';

  function folioTexture(title, number, color, textColor, subtitle) {
    const surface = document.createElement('canvas');
    surface.width = 640;
    surface.height = 850;
    const c = surface.getContext('2d');
    c.fillStyle = color;
    c.fillRect(0, 0, 640, 850);
    c.fillStyle = textColor;
    c.strokeStyle = textColor;
    c.globalAlpha = 0.35;
    c.strokeRect(34, 34, 572, 782);
    c.beginPath(); c.moveTo(60, 138); c.lineTo(580, 138); c.stroke();
    c.globalAlpha = 1;
    c.font = 'bold 25px Arial, sans-serif';
    c.fillText('THE RECORD', 60, 104);
    c.font = 'bold 16px Arial, sans-serif';
    c.fillText(number + '  /  ARCHIVE', 60, 196);
    c.font = '45px Georgia, serif';
    c.fillText(title, 60, 280);
    c.font = '20px Arial, sans-serif';
    c.globalAlpha = .78;
    c.fillText(subtitle, 60, 337);
    c.globalAlpha = .28;
    for (let i = 0; i < 7; i++) {
      c.fillRect(60, 423 + i * 44, i % 3 === 2 ? 365 : 490, 2);
    }
    c.globalAlpha = 1;
    c.beginPath(); c.moveTo(60, 754); c.lineTo(580, 754); c.stroke();
    c.font = 'bold 19px Arial, sans-serif';
    c.fillText('CP', 60, 794);
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    return texture;
  }

  function createFolio(spec) {
    const geometry = new THREE.BoxGeometry(3.28, 4.35, 0.12);
    const edge = new THREE.MeshStandardMaterial({
      color: spec.edge, roughness: .83, metalness: .04
    });
    const front = new THREE.MeshStandardMaterial({
      map: folioTexture(spec.title, spec.num, spec.paper, spec.ink, spec.subtitle),
      roughness: .92, metalness: 0
    });
    const back = new THREE.MeshStandardMaterial({
      color: spec.paper, roughness: .93, metalness: 0
    });
    const mesh = new THREE.Mesh(geometry, [edge, edge, edge, edge, front, back]);
    mesh.position.set(...spec.position);
    mesh.rotation.set(0, spec.ry, spec.rz);
    archive.add(mesh);
    return { mesh, baseZ: spec.position[2], baseY: spec.position[1] };
  }

  const folios = [
    createFolio({
      title: 'Profile', subtitle: 'Background & context', num: '01',
      paper: '#1b324b', ink: '#fff7e7', edge: '#0e2138',
      position: [-1.8, -.15, -.75], ry: .17, rz: -.18
    }),
    createFolio({
      title: 'Business', subtitle: 'Public filing information', num: '02',
      paper: '#d6bfa0', ink: ink, edge: '#a99576',
      position: [1.55, .3, -.55], ry: -.2, rz: .18
    }),
    createFolio({
      title: 'Public record', subtitle: 'Sources & attribution', num: '03',
      paper: '#fffaf1', ink: ink, edge: '#c5bdae',
      position: [.14, -.22, .95], ry: -.07, rz: -.045
    })
  ];

  let visible = true;
  let running = false;
  let frame = 0;
  let active = -1;
  const mouse = { x: 0, y: 0 };
  let lastFrame = 0;
  const clock = new THREE.Clock();

  function resize() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setSize(Math.floor(width * dpr), Math.floor(height * dpr), false);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    camera.aspect = width / height;
    camera.position.z = width < 650 ? 15 : 12.6;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  stage.addEventListener('pointermove', (event) => {
    const r = stage.getBoundingClientRect();
    mouse.x = ((event.clientX - r.left) / r.width - .5) * 2;
    mouse.y = ((event.clientY - r.top) / r.height - .5) * 2;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; });

  const links = document.querySelectorAll('[data-folio-link]');
  links.forEach((link) => {
    const id = Number(link.dataset.folioLink);
    link.addEventListener('pointerenter', () => { active = id; });
    link.addEventListener('pointerleave', () => { active = -1; });
    link.addEventListener('focus', () => { active = id; });
    link.addEventListener('blur', () => { active = -1; });
  });

  function animate(now) {
    if (!running) return;
    frame = requestAnimationFrame(animate);
    if (now - lastFrame < 32) return; // Approximately 30 fps.
    lastFrame = now;
    const time = clock.getElapsedTime();
    archive.rotation.y += ((mouse.x * .085) - archive.rotation.y) * .035;
    archive.rotation.x += ((mouse.y * -.05) - archive.rotation.x) * .035;
    folios.forEach((item, index) => {
      const z = item.baseZ + (index === active ? .36 : 0);
      item.mesh.position.z += (z - item.mesh.position.z) * .07;
      const y = item.baseY + Math.sin(time * .63 + index * 1.8) * .06;
      item.mesh.position.y += (y - item.mesh.position.y) * .06;
    });
    renderer.render(scene, camera);
  }

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncRendering();
  }, { threshold: 0.03 });
  visibilityObserver.observe(stage);
  function syncRendering() {
    const shouldRun = visible && !document.hidden && !reduceMotion.matches;
    if (shouldRun && !running) {
      running = true;
      lastFrame = 0;
      frame = requestAnimationFrame(animate);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }
  document.addEventListener('visibilitychange', syncRendering);
  reduceMotion.addEventListener('change', syncRendering);
  renderer.render(scene, camera);
  stage.classList.add('three-ready');
  syncRendering();
}
