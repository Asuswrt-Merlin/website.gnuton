// Lightweight Canvas 2D particle horizon for the home hero.
//
// The scene is a seeded, orthographic globe: surface dots, a few dotted
// meridians and three orbital bands. A static layer caches the body, haze and
// rim so the animation only redraws moving dots. No third-party dependency and
// no WebGL context are required.

const WORLD_SELECTOR = '[data-particle-world]';
const CANVAS_SELECTOR = '[data-particle-canvas]';
const STATIC_CANVAS_SELECTOR = '[data-particle-static]';
const MOTION_TOGGLE_SELECTOR = '[data-particle-motion-toggle]';
const MOTION_STORAGE_KEY = 'gm-particle-motion';
const TAU = Math.PI * 2;
const ROTATION_SPEED = 0.025; // radians per second
const GLOBE_TILT = -0.24;
const SEED_YAW = 0.55;
const SEED = 0x9e3779b9;

interface SurfacePoint {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  blue: boolean;
}

interface OrbitBand {
  points: SurfacePoint[];
  speed: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

interface ParticleWorldOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  staticCanvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  staticCtx: CanvasRenderingContext2D;
  toggle: HTMLButtonElement | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Deterministic PRNG so every visit (and every reduced-motion frame) starts
// from the same composed constellation.
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function readPaused(): boolean {
  try {
    return localStorage.getItem(MOTION_STORAGE_KEY) === 'paused';
  } catch {
    return false;
  }
}

function writePaused(paused: boolean): void {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, paused ? 'paused' : 'playing');
  } catch {
    // The in-page control still works for the current session.
  }
}

function createDotSprite(color: readonly [number, number, number]): HTMLCanvasElement {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  const [red, green, blue] = color;
  // A solid core survives the downscale to a 1-3 px dot; the falloff only
  // softens the edge so the sphere does not look like a grid of squares.
  gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 1)`);
  gradient.addColorStop(0.55, `rgba(${red}, ${green}, ${blue}, 1)`);
  gradient.addColorStop(0.8, `rgba(${red}, ${green}, ${blue}, 0.65)`);
  gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function createSurfacePoints(count: number, random: () => number): SurfacePoint[] {
  const points: SurfacePoint[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * goldenAngle + (random() - 0.5) * 0.04;

    points.push({
      x: Math.cos(theta) * ringRadius,
      y,
      z: Math.sin(theta) * ringRadius,
      size: 0.9 + random() * 1.7,
      alpha: 0.42 + random() * 0.58,
      blue: random() < 0.2,
    });
  }

  return points;
}

function createMeridians(random: () => number): SurfacePoint[][] {
  const longitudes = [0.15, 1.35, 2.55, 3.8, 5.1];

  return longitudes.map((longitude, columnIndex) => {
    const points: SurfacePoint[] = [];
    const bright = columnIndex < 3;

    for (let latitude = 18; latitude <= 86; latitude += 2.2) {
      if (random() < 0.35) continue;

      const phi = (latitude * Math.PI) / 180;
      const radius = Math.cos(phi);
      points.push({
        x: Math.cos(longitude) * radius,
        y: Math.sin(phi),
        z: Math.sin(longitude) * radius,
        size: bright ? 0.9 + random() * 0.7 : 0.6 + random() * 0.5,
        alpha: bright ? 0.5 + random() * 0.3 : 0.22 + random() * 0.2,
        blue: bright,
      });
    }

    return points;
  });
}

function createOrbitBand(
  radius: number,
  tiltX: number,
  tiltZ: number,
  speed: number,
  random: () => number,
): OrbitBand {
  const points: SurfacePoint[] = [];
  const dashCount = 48;

  for (let dash = 0; dash < dashCount; dash += 1) {
    if (random() < 0.22) continue;

    const center = (dash / dashCount) * TAU + (random() - 0.5) * 0.02;
    const dotCount = 2 + Math.floor(random() * 3);

    for (let dot = 0; dot < dotCount; dot += 1) {
      const theta = center + (dot - (dotCount - 1) / 2) * 0.012;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);
      const tiltedY = -z * sinX;
      const tiltedZ = z * cosX;

      const cosZ = Math.cos(tiltZ);
      const sinZ = Math.sin(tiltZ);

      points.push({
        x: x * cosZ - tiltedY * sinZ,
        y: x * sinZ + tiltedY * cosZ,
        z: tiltedZ,
        size: 0.9 + random() * 1.2,
        alpha: 0.35 + random() * 0.45,
        blue: false,
      });
    }
  }

  return { points, speed };
}

class ParticleWorld {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly staticCanvas: HTMLCanvasElement;
  private readonly staticCtx: CanvasRenderingContext2D;
  private readonly motionQuery: MediaQueryList;
  private readonly toggle: HTMLButtonElement | null;
  private readonly toggleLabel: HTMLElement | null;
  private readonly projected: ProjectedPoint = { x: 0, y: 0, z: 0 };

  private surface: SurfacePoint[] = [];
  private meridians: SurfacePoint[][] = [];
  private bands: OrbitBand[] = [];
  private sprite!: HTMLCanvasElement;
  private blueSprite!: HTMLCanvasElement;
  private geometryReady = false;
  private staticReady = false;
  private canvasSized = false;
  private mobileLayout: boolean | null = null;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private centerX = 0;
  private centerY = 0;
  private radius = 0;
  private yaw = SEED_YAW;
  private raf = 0;
  private resizeRaf = 0;
  private lastTime = 0;
  private running = false;
  private ready = false;
  private visible = true;
  private disposed = false;
  private paused: boolean;
  private reduced: boolean;
  private saveData: boolean;

  private themeObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;

  constructor({
    root,
    canvas,
    staticCanvas,
    ctx,
    staticCtx,
    toggle,
  }: ParticleWorldOptions) {
    this.root = root;
    this.canvas = canvas;
    this.staticCanvas = staticCanvas;
    this.staticCtx = staticCtx;
    this.ctx = ctx;
    this.toggle = toggle;
    this.toggleLabel =
      toggle?.querySelector<HTMLElement>('[data-particle-motion-label]') ?? null;
    this.paused = readPaused();

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this.motionQuery.matches;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    this.saveData = Boolean(connection?.saveData);

    this.motionQuery.addEventListener('change', this.handleMotionChange);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('pageshow', this.handlePageShow);

    this.resizeObserver = new ResizeObserver(() => this.queueResize());
    this.resizeObserver.observe(root);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        this.sync();
      },
      { rootMargin: '120px 0px' },
    );
    this.intersectionObserver.observe(root);

    this.themeObserver = new MutationObserver(() => this.sync());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this.toggle?.addEventListener('click', this.handleToggle);

    this.resize();
    this.updateToggle();
    this.queueInitialDraw();
  }

  private readonly handleMotionChange = (): void => {
    this.reduced = this.motionQuery.matches;
    this.sync();
  };

  private readonly handleVisibilityChange = (): void => {
    this.sync();
  };

  private readonly handlePageHide = (): void => {
    this.stop();
  };

  private readonly handlePageShow = (): void => {
    this.sync();
  };

  private readonly handleToggle = (): void => {
    this.paused = !this.paused;
    writePaused(this.paused);
    this.updateToggle();

    if (this.paused) {
      this.stop();
      if (!this.ready) this.drawCurrentFrame();
      return;
    }

    this.sync();
  };

  private updateToggle(): void {
    if (!this.toggle) return;

    const available = this.isDark() && !this.reduced && !this.saveData;
    this.toggle.hidden = !available;
    this.toggle.setAttribute('aria-pressed', String(this.paused));
    this.toggle.setAttribute(
      'aria-label',
      this.paused ? 'Play background animation' : 'Pause background animation',
    );

    if (this.toggleLabel) {
      this.toggleLabel.textContent = this.paused ? 'Play motion' : 'Pause motion';
    }
  }

  private readonly frame = (now: number): void => {
    if (!this.running || this.disposed) return;

    const delta = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = now;
    this.yaw += delta * ROTATION_SPEED;
    this.draw(this.yaw);
    this.markReady();
    this.raf = requestAnimationFrame(this.frame);
  };

  private isDark(): boolean {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  private queueInitialDraw(): void {
    const draw = () => {
      if (this.disposed) return;
      if (this.reduced || this.saveData) {
        if (this.isDark()) this.drawStaticFrame();
        return;
      }
      this.sync();
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(draw, { timeout: 1200 });
    } else {
      setTimeout(draw, 120);
    }
  }

  private queueResize(): void {
    if (this.resizeRaf || this.disposed) return;
    this.resizeRaf = requestAnimationFrame(() => {
      this.resizeRaf = 0;
      this.resize();
    });
  }

  private resize(): void {
    if (this.disposed) return;

    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width <= 1 || height <= 1) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width > 1600) dpr = Math.min(dpr, 1.5);
    dpr = Math.min(dpr, 2560 / width);

    if (
      width === this.width &&
      height === this.height &&
      Math.abs(dpr - this.dpr) < 0.01
    ) {
      return;
    }

    this.width = width;
    this.height = height;
    this.dpr = dpr;

    // Defer the backing-store allocation until the dark canvas actually
    // draws, so a light-theme visit never allocates a full-size canvas.
    this.canvasSized = false;

    this.computeComposition();

    // Geometry is seeded per layout, so crossing the mobile breakpoint must
    // rebuild it with the smaller point budget. The static layer always needs
    // a repaint after a size change.
    const mobile = width < 769;
    if (this.mobileLayout === null) {
      this.mobileLayout = mobile;
    } else if (this.mobileLayout !== mobile) {
      this.mobileLayout = mobile;
      this.geometryReady = false;
    }
    this.staticReady = false;

    if (!this.running) {
      if (this.isDark()) this.drawCurrentFrame();
    }
  }

  private ensureCanvasSize(): void {
    if (this.canvasSized) return;

    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.canvasSized = true;
  }

  // Build the seeded constellation lazily: the light theme never draws the
  // canvas, so it should not pay for the points, sprites or static layer.
  private ensureGeometry(): void {
    if (this.geometryReady) return;

    const random = mulberry32(SEED);
    const area = this.width * this.height;
    const pointCount =
      this.width < 769
        ? clamp(Math.round(area / 750), 480, 760)
        : clamp(Math.round(area / 750), 1000, 1500);

    this.surface = createSurfacePoints(pointCount, random);
    this.meridians = createMeridians(random);
    this.bands = [
      createOrbitBand(1.015, 0.18, -0.12, 0.94, random),
      createOrbitBand(1.03, -0.22, 0.16, 1, random),
      createOrbitBand(1.045, 0.3, 0.04, 1.06, random),
    ];
    this.sprite = createDotSprite([255, 255, 255]);
    this.blueSprite = createDotSprite([170, 210, 255]);
    this.geometryReady = true;
  }

  private ensureStaticLayer(): void {
    if (this.staticReady) return;

    // Size the offscreen layer only when it is actually needed, so a
    // light-theme visit never allocates a full-size backing store.
    this.staticCanvas.width = this.canvas.width;
    this.staticCanvas.height = this.canvas.height;
    this.staticCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.buildStaticLayer();
    this.staticReady = true;
  }

  private computeComposition(): void {
    if (this.width < 769) {
      this.centerX = this.width * 0.62;
      this.centerY = this.height * 1.02;
      this.radius = this.height * 0.45;
      return;
    }

    this.centerX = this.width * 0.8;
    this.centerY = this.height * 1.18;
    this.radius = this.height * 0.66;
  }

  private buildStaticLayer(): void {
    const ctx = this.staticCtx;
    const { width, height, centerX, centerY, radius } = this;
    ctx.clearRect(0, 0, width, height);

    const haze = ctx.createRadialGradient(
      centerX,
      centerY - radius * 0.08,
      radius * 0.15,
      centerX,
      centerY - radius * 0.08,
      radius * 1.22,
    );
    haze.addColorStop(0, 'rgba(90, 150, 255, 0.1)');
    haze.addColorStop(0.5, 'rgba(90, 150, 255, 0.035)');
    haze.addColorStop(1, 'rgba(90, 150, 255, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, TAU);
    ctx.clip();

    const body = ctx.createLinearGradient(
      centerX + radius * 0.6,
      centerY - radius * 0.9,
      centerX - radius * 0.6,
      centerY + radius * 0.7,
    );
    body.addColorStop(0, '#0d1a2b');
    body.addColorStop(0.45, '#091321');
    body.addColorStop(1, '#060b14');
    ctx.fillStyle = body;
    ctx.fillRect(
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
    );

    const inner = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.84,
      centerX,
      centerY,
      radius,
    );
    inner.addColorStop(0, 'rgba(127, 184, 255, 0)');
    inner.addColorStop(0.8, 'rgba(127, 184, 255, 0.03)');
    inner.addColorStop(1, 'rgba(127, 184, 255, 0.09)');
    ctx.fillStyle = inner;
    ctx.fillRect(
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
    );
    ctx.restore();

    const halo = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.97,
      centerX,
      centerY,
      radius * 1.16,
    );
    halo.addColorStop(0, 'rgba(127, 184, 255, 0)');
    halo.addColorStop(0.45, 'rgba(127, 184, 255, 0.04)');
    halo.addColorStop(0.68, 'rgba(190, 220, 255, 0.12)');
    halo.addColorStop(0.8, 'rgba(190, 220, 255, 0.02)');
    halo.addColorStop(1, 'rgba(127, 184, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.16, 0, TAU);
    ctx.fill();

    const rim = ctx.createLinearGradient(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius * 0.15,
    );
    rim.addColorStop(0, 'rgba(180, 215, 255, 0.03)');
    rim.addColorStop(0.45, 'rgba(200, 230, 255, 0.28)');
    rim.addColorStop(0.72, 'rgba(235, 248, 255, 0.7)');
    rim.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, TAU);
    ctx.stroke();

    this.drawRimDust();
  }

  // Dashed particle arcs hugging the silhouette. They are part of the cached
  // layer because the rim is rotationally symmetric; only the surface dots
  // and orbit bands need to move.
  private drawRimDust(): void {
    const ctx = this.staticCtx;
    const { centerX, centerY, radius } = this;
    const random = mulberry32(SEED ^ 0x5f3759df);
    const bands: Array<[number, number, number]> = [
      [1.002, 150, 0.85],
      [1.024, 110, 0.6],
      [1.052, 78, 0.38],
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const [scale, clusters, strength] of bands) {
      const bandRadius = radius * scale;

      for (let cluster = 0; cluster < clusters; cluster += 1) {
        if (random() < 0.22) continue;

        const theta = -Math.PI + random() * Math.PI * 0.98;
        const tangentX = -Math.sin(theta);
        const tangentY = Math.cos(theta);
        const dotCount = 1 + Math.floor(random() * 3);
        const baseX = centerX + Math.cos(theta) * bandRadius;
        const baseY = centerY + Math.sin(theta) * bandRadius;

        for (let dot = 0; dot < dotCount; dot += 1) {
          const offset = (dot - (dotCount - 1) / 2) * (1.2 + random() * 1.4);
          const size = 0.8 + random() * 1.4;
          ctx.globalAlpha = strength * (0.55 + random() * 0.45);
          ctx.fillStyle = random() < 0.22 ? '#dcecff' : '#ffffff';
          ctx.beginPath();
          ctx.arc(
            baseX + tangentX * offset,
            baseY + tangentY * offset,
            size / 2,
            0,
            TAU,
          );
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private project(
    x: number,
    y: number,
    z: number,
    cosYaw: number,
    sinYaw: number,
    cosTilt: number,
    sinTilt: number,
  ): ProjectedPoint {
    const x1 = x * cosYaw - z * sinYaw;
    const z1 = x * sinYaw + z * cosYaw;
    const y1 = y * cosTilt - z1 * sinTilt;
    const z2 = y * sinTilt + z1 * cosTilt;

    // Reuse one object: each caller consumes x/y/z before the next projection.
    this.projected.x = this.centerX + x1 * this.radius;
    this.projected.y = this.centerY - y1 * this.radius;
    this.projected.z = z2;
    return this.projected;
  }

  private drawParticles(yaw: number): void {
    const ctx = this.ctx;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosTilt = Math.cos(GLOBE_TILT);
    const sinTilt = Math.sin(GLOBE_TILT);

    ctx.globalCompositeOperation = 'lighter';

    for (const point of this.surface) {
      const projected = this.project(
        point.x,
        point.y,
        point.z,
        cosYaw,
        sinYaw,
        cosTilt,
        sinTilt,
      );
      if (projected.z <= 0) continue;

      const depth = projected.z;
      const alpha = point.alpha * (0.55 + 0.45 * (1 - depth));
      if (alpha < 0.02) continue;

      const size = point.size * (0.95 + 0.5 * depth);
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.drawImage(
        point.blue ? this.blueSprite : this.sprite,
        projected.x - size / 2,
        projected.y - size / 2,
        size,
        size,
      );
    }

    for (const meridian of this.meridians) {
      for (const point of meridian) {
        const projected = this.project(
          point.x,
          point.y,
          point.z,
          cosYaw,
          sinYaw,
          cosTilt,
          sinTilt,
        );
        if (projected.z <= 0) continue;

        const depth = projected.z;
        const alpha = point.alpha * (0.55 + 0.45 * (1 - depth));
        if (alpha < 0.02) continue;

        const size = point.size * (0.95 + 0.4 * depth);
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.drawImage(
          point.blue ? this.blueSprite : this.sprite,
          projected.x - size / 2,
          projected.y - size / 2,
          size,
          size,
        );
      }
    }

    for (const band of this.bands) {
      const bandYaw = yaw * band.speed;
      const bandCos = Math.cos(bandYaw);
      const bandSin = Math.sin(bandYaw);

      for (const point of band.points) {
        const projected = this.project(
          point.x,
          point.y,
          point.z,
          bandCos,
          bandSin,
          cosTilt,
          sinTilt,
        );
        if (projected.z <= 0) continue;

        const alpha = point.alpha * (0.6 + 0.4 * (1 - projected.z));
        const size = point.size * 1.15;
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.drawImage(
          point.blue ? this.blueSprite : this.sprite,
          projected.x - size / 2,
          projected.y - size / 2,
          size,
          size,
        );
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private draw(yaw: number): void {
    if (!this.width || !this.height) return;

    this.ensureCanvasSize();
    this.ensureGeometry();
    this.ensureStaticLayer();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawParticles(yaw);
  }

  private drawCurrentFrame(): void {
    this.draw(this.yaw);
    this.markReady();
  }

  private drawStaticFrame(): void {
    this.draw(SEED_YAW);
    this.markReady();
  }

  private markReady(): void {
    if (this.ready) return;
    this.ready = true;
    if (this.isDark()) this.root.classList.add('is-ready');
  }

  private clearReady(): void {
    if (!this.ready) return;
    this.ready = false;
    this.root.classList.remove('is-ready');
  }

  private sync(): void {
    if (this.disposed) return;
    this.updateToggle();

    const active = this.isDark() && this.visible && !document.hidden;
    if (!active) {
      this.stop();
      this.clearReady();
      return;
    }

    if (this.reduced || this.saveData) {
      this.stop();
      this.drawStaticFrame();
      return;
    }

    if (this.paused) {
      this.stop();
      if (!this.ready) this.drawCurrentFrame();
      return;
    }

    this.start();
  }

  private start(): void {
    if (this.running || this.disposed) return;
    if (!this.isDark() || !this.visible || document.hidden) return;
    if (this.reduced || this.saveData) {
      this.drawStaticFrame();
      return;
    }
    if (this.paused) {
      this.drawCurrentFrame();
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private stop(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.running = false;
    this.lastTime = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();

    if (this.resizeRaf) {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = 0;
    }

    this.themeObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.motionQuery.removeEventListener('change', this.handleMotionChange);
    this.toggle?.removeEventListener('click', this.handleToggle);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('pagehide', this.handlePageHide);
    window.removeEventListener('pageshow', this.handlePageShow);
    this.root.classList.remove('is-ready');
    if (this.toggle) this.toggle.hidden = true;
  }
}

function createParticleWorld(root: HTMLElement): ParticleWorld | null {
  const canvas = root.querySelector<HTMLCanvasElement>(CANVAS_SELECTOR);
  const staticCanvas = root.querySelector<HTMLCanvasElement>(
    STATIC_CANVAS_SELECTOR,
  );
  if (!canvas || !staticCanvas) {
    root.classList.add('is-fallback');
    return null;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  const staticCtx = staticCanvas.getContext('2d');
  if (!ctx || !staticCtx) {
    root.classList.add('is-fallback');
    return null;
  }

  const toggle = document.querySelector<HTMLButtonElement>(MOTION_TOGGLE_SELECTOR);

  try {
    return new ParticleWorld({
      root,
      canvas,
      staticCanvas,
      ctx,
      staticCtx,
      toggle,
    });
  } catch {
    root.classList.add('is-fallback');
    return null;
  }
}

let current: ParticleWorld | null = null;

function disposeCurrent(): void {
  current?.dispose();
  current = null;
}

function initFromDom(): void {
  const root = document.querySelector<HTMLElement>(WORLD_SELECTOR);
  if (!root) {
    disposeCurrent();
    return;
  }

  // The client router recreates the hero on every visit, so only the current
  // root may keep its instance.
  if (root.dataset.particleInitialized === 'true' && current) return;

  disposeCurrent();
  current = createParticleWorld(root);
  if (current) root.dataset.particleInitialized = 'true';
}

declare global {
  interface Window {
    __gmParticleHorizon?: boolean;
  }
}

if (!window.__gmParticleHorizon) {
  window.__gmParticleHorizon = true;

  document.addEventListener('astro:page-load', initFromDom);
  document.addEventListener('astro:before-swap', disposeCurrent);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromDom, { once: true });
  } else {
    initFromDom();
  }
}

export {};
