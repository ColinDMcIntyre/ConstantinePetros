/**
 * Progressive archive selector. Its HTML links work without WebGL.
 * Click/tap a visible folio to bring it forward; wheel over the stage to browse
 * (at the endpoints, wheel resumes normal page scrolling); swipe horizontally
 * on touch screens or use arrow keys. "Open selected" performs navigation.
 */
const archiveStage = document.querySelector('[data-archive-stage]');
if (archiveStage) setupArchive(archiveStage);

function setupArchive(stage) {
  const pages = [
    { title: 'Profile', href: '/about/' },
    { title: 'Business', href: '/business/' },
    { title: 'Public record', href: '/public-record/' }
  ];
  const canvas = stage.querySelector('[data-archive-canvas]');
  const fallbackButtons = [...stage.querySelectorAll('[data-folio-select]')];
  const sectionLinks = [...document.querySelectorAll('[data-folio-link]')];
  const openLink = document.querySelector('[data-archive-open]');
  const selectionLabel = document.querySelector('[data-archive-selection]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;
  let onSelectionChanged = null;
  let touchPoint = null;
  let suppressClickUntil = 0;
  let wheelSum = 0;
  let lastWheelSelection = 0;

  function select(index) {
    if (index < 0 || index >= pages.length) return false;
    selected = index;
    stage.dataset.active = String(selected);
    fallbackButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === selected));
    });
    sectionLinks.forEach((link, i) => {
      link.classList.toggle('is-selected', i === selected);
    });
    if (openLink) {
      openLink.href = pages[selected].href;
      openLink.textContent = 'Open ' + pages[selected].title + ' →';
      openLink.setAttribute('aria-label', 'Open ' + pages[selected].title + ' page');
    }
    if (selectionLabel) selectionLabel.textContent = 'Selected: ' + pages[selected].title;
    if (onSelectionChanged) onSelectionChanged(selected);
    return true;
  }

  fallbackButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil) return;
      select(Number(button.dataset.folioSelect));
    });
  });
  sectionLinks.forEach((link) => {
    const index = Number(link.dataset.folioLink);
    link.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') select(index);
    });
    link.addEventListener('focus', () => select(index));
  });

  stage.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = selected;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, selected - 1);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(2, selected + 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 2;
    select(next);
  });

  stage.addEventListener('wheel', (event) => {
    // Never intercept browser zoom or horizontal page gestures.
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1);
    const direction = Math.sign(delta);
    if ((direction > 0 && selected === pages.length - 1) ||
        (direction < 0 && selected === 0)) {
      wheelSum = 0;
      return; // At the ends, allow normal page scrolling.
    }
    event.preventDefault();
    if (performance.now() - lastWheelSelection < 320) return;
    wheelSum += delta;
    if (Math.abs(wheelSum) < 55) return;
    const move = Math.sign(wheelSum);
    wheelSum = 0;
    lastWheelSelection = performance.now();
    select(selected + move);
  }, { passive: false });

  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    touchPoint = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', (event) => {
    if (!touchPoint || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;
    const dx = event.clientX - touchPoint.x;
    const dy = event.clientY - touchPoint.y;
    touchPoint = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    const direction = dx < 0 ? 1 : -1;
    select(Math.min(2, Math.max(0, selected + direction)));
    suppressClickUntil = performance.now() + 420;
  });
  stage.addEventListener('pointercancel', () => { touchPoint = null; });

  // The interaction above is available with CSS, even if Three.js cannot load.
  select(selected);
  if (!canvas || reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const intersection = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      intersection.disconnect();
      startThreeScene().catch(() => {
        stage.classList.remove('three-ready');
        fallbackButtons.forEach((button) => { button.tabIndex = 0; });
      });
    }
  }, { rootMargin: '150px' });
  intersection.observe(stage);

  async function startThreeScene() {
    const THREE = await import('three');
    const context = canvas.getContext('webgl2', {
      alpha: true, antialias: true, powerPreference: 'low-power'
    }) || canvas.getContext('webgl', {
      alpha: true, antialias: true, powerPreference: 'low-power'
    });
    if (!context) return;

    const renderer = new THREE.WebGLRenderer({
      canvas, context, alpha: true, antialias: true, powerPreference: 'low-power'
    });
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, .1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const warm = new THREE.DirectionalLight(0xffe9cd, 3.6);
    warm.position.set(-4, 6, 8);
    scene.add(warm);
    const cool = new THREE.DirectionalLight(0xc7ddf3, 2);
    cool.position.set(4, -2, 6);
    scene.add(cool);

    const archive = new THREE.Group();
    scene.add(archive);

    function createTexture(title, number, color, foreground, subtitle) {
      const surface = document.createElement('canvas');
      surface.width = 640;
      surface.height = 850;
      const ctx = surface.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 640, 850);
      ctx.fillStyle = foreground;
      ctx.strokeStyle = foreground;
      ctx.globalAlpha = .38;
      ctx.strokeRect(34, 34, 572, 782);
      ctx.beginPath(); ctx.moveTo(60, 138); ctx.lineTo(580, 138); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.font = 'bold 25px Arial, sans-serif';
      ctx.fillText('THE RECORD', 60, 104);
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText(number + '  /  ARCHIVE', 60, 196);
      ctx.font = '45px Georgia, serif';
      ctx.fillText(title, 60, 280);
      ctx.font = '20px Arial, sans-serif';
      ctx.globalAlpha = .78;
      ctx.fillText(subtitle, 60, 337);
      ctx.globalAlpha = .27;
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(60, 423 + i * 44, i % 3 === 2 ? 365 : 490, 2);
      }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(60, 754); ctx.lineTo(580, 754); ctx.stroke();
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('CP', 60, 794);
      const texture = new THREE.CanvasTexture(surface);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      return texture;
    }

    const specs = [
      { title: 'Profile', subtitle: 'Background & context', number: '01',
        paper: '#1b324b', ink: '#fff7e7', edge: '#0e2138',
        position: [-1.7, -.18, -.7], rz: -.16, ry: .15 },
      { title: 'Business', subtitle: 'Public filing information', number: '02',
        paper: '#d6bfa0', ink: '#152539', edge: '#a99576',
        position: [1.55, .2, -.65], rz: .15, ry: -.18 },
      { title: 'Public record', subtitle: 'Sources & attribution', number: '03',
        paper: '#fffaf1', ink: '#152539', edge: '#c5bdae',
        position: [.05, -.22, -.6], rz: -.045, ry: -.07 }
    ];

    const folios = specs.map((spec, i) => {
      const edge = new THREE.MeshStandardMaterial({ color: spec.edge, roughness: .85 });
      const front = new THREE.MeshStandardMaterial({
        map: createTexture(spec.title, spec.number, spec.paper, spec.ink, spec.subtitle),
        roughness: .92
      });
      const back = new THREE.MeshStandardMaterial({ color: spec.paper, roughness: .93 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(3.28, 4.35, .13),
        [edge, edge, edge, edge, front, back]);
      mesh.position.set(...spec.position);
      mesh.rotation.set(0, spec.ry, spec.rz);
      mesh.userData.folioIndex = i;
      archive.add(mesh);
      return { mesh, spec };
    });

    function resize() {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.25 : 1.5);
      renderer.setSize(Math.round(width * pixelRatio), Math.round(height * pixelRatio), false);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      camera.aspect = width / height;
      camera.position.z = width < 500 ? 10.6 : 11.5;
      camera.updateProjectionMatrix();
    }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize, { passive: true });
    resize();

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    function pick(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(folios.map(({ mesh }) => mesh), false)[0]?.object?.userData?.folioIndex;
    }

    // The canvas is interactive on mobile as well as desktop.
    canvas.addEventListener('click', (event) => {
      if (performance.now() < suppressClickUntil) return;
      const index = pick(event);
      if (index !== undefined) select(index);
    });
    let over = false;
    const target = { x: 0, y: 0 };
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      target.y = ((event.clientY - rect.top) / rect.height - .5) * 2;
      if (event.pointerType === 'mouse') {
        canvas.style.cursor = pick(event) === undefined ? 'default' : 'pointer';
      }
      over = true;
    }, { passive: true });
    canvas.addEventListener('pointerleave', () => {
      over = false;
      target.x = 0;
      target.y = 0;
      canvas.style.cursor = 'default';
    });

    let running = false;
    let frame = 0;
    let lastFrame = 0;
    const clock = new THREE.Clock();

    function render(now) {
      if (!running) return;
      frame = requestAnimationFrame(render);
      if (now - lastFrame < 32) return; // Limit to approximately 30 fps.
      lastFrame = now;
      const seconds = clock.getElapsedTime();
      const ease = reducedMotion.matches ? 1 : .14;
      const rotationX = over ? -target.y * .04 : 0;
      const rotationY = over ? target.x * .07 : 0;
      archive.rotation.x += (rotationX - archive.rotation.x) * ease;
      archive.rotation.y += (rotationY - archive.rotation.y) * ease;

      for (const [index, folio] of folios.entries()) {
        const active = selected === index;
        const { mesh, spec } = folio;
        const targetX = spec.position[0] * (active ? .72 : 1.13);
        const targetY = spec.position[1] + (active ? .07 : -.05);
        const targetZ = active ? 1.65 : -.9 + index * .04;
        mesh.position.x += (targetX - mesh.position.x) * ease;
        mesh.position.y += (targetY + Math.sin(seconds * .65 + index * 1.8) * .045 - mesh.position.y) * ease;
        mesh.position.z += (targetZ - mesh.position.z) * ease;
        mesh.rotation.y += ((active ? 0 : spec.ry) - mesh.rotation.y) * ease;
        mesh.rotation.z += ((active ? -.015 : spec.rz) - mesh.rotation.z) * ease;
        const scale = active ? 1.07 : .91;
        mesh.scale.x += (scale - mesh.scale.x) * ease;
        mesh.scale.y += (scale - mesh.scale.y) * ease;
      }
      renderer.render(scene, camera);
    }

    let inView = true;
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: .03 });
    viewObserver.observe(stage);

    function sync() {
      const shouldRun = inView && !document.hidden && !reducedMotion.matches;
      if (shouldRun && !running) {
        running = true;
        lastFrame = 0;
        frame = requestAnimationFrame(render);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
    }
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        stage.classList.remove('three-ready');
        fallbackButtons.forEach((button) => { button.tabIndex = 0; });
      } else {
        stage.classList.add('three-ready');
        fallbackButtons.forEach((button) => { button.tabIndex = -1; });
      }
      sync();
    });

    onSelectionChanged = () => {
      if (!running) {
        // Update the selected pose immediately if animation is paused.
        for (const [index, { mesh, spec }] of folios.entries()) {
          const active = index === selected;
          mesh.position.set(spec.position[0] * (active ? .72 : 1.13),
            spec.position[1] + (active ? .07 : -.05), active ? 1.65 : -.9 + index * .04);
          mesh.rotation.set(0, active ? 0 : spec.ry, active ? -.015 : spec.rz);
          mesh.scale.setScalar(active ? 1.07 : .91);
        }
        renderer.render(scene, camera);
      }
    };

    onSelectionChanged(selected);
    stage.classList.add('three-ready');
    fallbackButtons.forEach((button) => { button.tabIndex = -1; });
    sync();
  }
}
