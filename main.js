const routes = { 'home': 'page-home', 'features': 'page-features', 'playground': 'page-playground', 'pricing': 'page-pricing', 'docs': 'page-docs' };
let heroNet, pgNet;
let playgroundInitialized = false;

// Set dynamic year
document.getElementById('copyright-year').textContent = `© ${new Date().getFullYear()} FLOWAI Labs, Inc. All flows reserved.`;

// Intersection Observer for Scroll Animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.classList.contains('counter') && !entry.target.dataset.animated) {
        animateCounter(entry.target);
        entry.target.dataset.animated = "true";
      }
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
  const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
  mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
  if (isExpanded) {
    mobileMenu.classList.add('hidden-menu');
  } else {
    mobileMenu.classList.remove('hidden-menu');
  }
});

function router() {
  let hash = window.location.hash.replace('#/', '').trim();
  if (!hash || !routes[hash]) hash = 'home';
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const activePage = document.getElementById(routes[hash]);
  activePage.classList.add('active');
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.dataset.link === hash ? link.classList.add('active') : link.classList.remove('active');
  });

  // Close mobile menu on route change
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.add('hidden-menu');

  // Reset scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.getElementById('scroll-progress').style.width = '0%';

  // Re-trigger scroll animations for the active page
  const elementsToReveal = activePage.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  elementsToReveal.forEach(el => {
    el.classList.remove('visible');
    observer.observe(el);
  });
  
  activePage.querySelectorAll('.counter').forEach(el => {
    if (!el.dataset.animated) {
      observer.observe(el);
    }
  });

  // Initialize specific page logic
  if (hash === 'home' && !heroNet) initHeroCanvas();
  if (hash === 'playground' && !playgroundInitialized) initPlayground();
  if (hash === 'docs') loadDocContent('intro');

  // Update parallax positions for the new page
  setTimeout(updateScrollEffects, 50);
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Prevent default on placeholder links
document.querySelectorAll('[data-placeholder-link]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const toast = document.getElementById('toast');
    toast.textContent = 'This feature is coming soon.';
    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 2000);
  });
});

// Scroll Progress & Parallax Logic
let ticking = false;
function updateScrollEffects() {
  const scrollY = window.scrollY;
  
  // Progress bar
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = height > 0 ? (scrollY / height) * 100 : 0;
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) progressBar.style.width = progress + '%';

  // Parallax
  document.querySelectorAll('.page.active .parallax').forEach(el => {
    const speed = parseFloat(el.dataset.speed || 0.2);
    const section = el.closest('section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom > -200 && rect.top < window.innerHeight + 200) {
      const offset = (rect.top + rect.height / 2) - window.innerHeight / 2;
      el.style.transform = `translateY(${-offset * speed}px)`;
    }
  });
  
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
});

class FlowNetwork {
  constructor(canvas, options = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.dpr = window.devicePixelRatio || 1;
    this.particles = []; this.time = 0; this.options = options; this.maxParticles = options.maxParticles || 28; this.active = true;
    this.nodes = options.nodes || [
      { x: 0.08, y: 0.5, label: 'API', color: '#b6ff3c', size: 14 },
      { x: 0.26, y: 0.2, label: 'Router', color: '#4dd2ff', size: 11 },
      { x: 0.26, y: 0.8, label: 'Cache', color: '#4dd2ff', size: 11 },
      { x: 0.46, y: 0.13, label: 'GPT-4', color: '#ff5e3a', size: 12 },
      { x: 0.46, y: 0.5, label: 'Claude', color: '#ff5e3a', size: 12 },
      { x: 0.46, y: 0.87, label: 'Llama', color: '#ff5e3a', size: 12 },
      { x: 0.68, y: 0.32, label: 'Merge', color: '#b6ff3c', size: 11 },
      { x: 0.68, y: 0.68, label: 'Embed', color: '#4dd2ff', size: 11 },
      { x: 0.9, y: 0.5, label: 'Out', color: '#b6ff3c', size: 14 }
    ];
    this.edges = options.edges || [
      { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
      { from: 2, to: 4 }, { from: 2, to: 5 }, { from: 3, to: 6 }, { from: 4, to: 6 }, 
      { from: 4, to: 7 }, { from: 5, to: 7 }, { from: 6, to: 8 }, { from: 7, to: 8 }
    ];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    for (let i = 0; i < 12; i++) this.spawnParticle(Math.random());
    this.animate();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, rect.width * this.dpr);
    this.canvas.height = Math.max(1, rect.height * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.scale(this.dpr, this.dpr);
    this.width = rect.width; this.height = rect.height;
  }
  getNodePos(node) { return { x: node.x * this.width, y: node.y * this.height }; }
  spawnParticle(initialT = 0) {
    const edge = this.edges[Math.floor(Math.random() * this.edges.length)];
    const colors = ['#b6ff3c', '#ff5e3a', '#4dd2ff'];
    this.particles.push({ edge, t: initialT, speed: 0.0035 + Math.random() * 0.006, color: colors[Math.floor(Math.random() * colors.length)], size: 1.6 + Math.random() * 1.4 });
  }
  getBezierPoint(from, to, t) {
    const cp1x = from.x + (to.x - from.x) * 0.5, cp1y = from.y;
    const cp2x = from.x + (to.x - from.x) * 0.5, cp2y = to.y;
    const omt = 1 - t;
    return { x: omt*omt*omt*from.x + 3*omt*omt*t*cp1x + 3*omt*t*t*cp2x + t*t*t*to.x, y: omt*omt*omt*from.y + 3*omt*omt*t*cp1y + 3*omt*t*t*cp2y + t*t*t*to.y };
  }
  animate() {
    if (!this.active) return;
    this.time += 0.016; const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6, 7, 13, 0.35)'; ctx.fillRect(0, 0, this.width, this.height);
    this.edges.forEach(edge => {
      const from = this.getNodePos(this.nodes[edge.from]), to = this.getNodePos(this.nodes[edge.to]);
      const cp1x = from.x + (to.x - from.x) * 0.5, cp1y = from.y, cp2x = from.x + (to.x - from.x) * 0.5, cp2y = to.y;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'; ctx.lineWidth = 1; ctx.stroke();
    });
    this.particles = this.particles.filter(p => {
      p.t += p.speed; if (p.t >= 1) return false;
      const from = this.getNodePos(this.nodes[p.edge.from]), to = this.getNodePos(this.nodes[p.edge.to]);
      const pos = this.getBezierPoint(from, to, p.t);
      const glowR = Math.max(0.1, p.size * 5);
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
      gradient.addColorStop(0, p.color); gradient.addColorStop(0.3, p.color + '60'); gradient.addColorStop(1, p.color + '00');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2); ctx.fill();
      return true;
    });
    this.nodes.forEach((node, i) => {
      const pos = this.getNodePos(node); const pulse = Math.sin(this.time * 2 + i * 0.7) * 0.15 + 0.85;
      const r = Math.max(2, node.size), glowR = Math.max(0.1, r * 3);
      const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
      grad.addColorStop(0, node.color + '40'); grad.addColorStop(1, node.color + '00');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0c14'; ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = node.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pos.x, pos.y, r * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = node.color; ctx.beginPath(); ctx.arc(pos.x, pos.y, Math.max(0.5, r * 0.25), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'; ctx.font = '500 9px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(node.label, pos.x, pos.y + r + 14);
    });
    if (this.particles.length < this.maxParticles && Math.random() < 0.35) this.spawnParticle();
    requestAnimationFrame(() => this.animate());
  }
  burst() { for (let i = 0; i < 8; i++) setTimeout(() => this.spawnParticle(0), i * 80); }
}

function initHeroCanvas() {
  const heroCanvas = document.getElementById('flow-canvas');
  if (!heroCanvas) return;
  heroNet = new FlowNetwork(heroCanvas);
  const throughputEl = document.getElementById('throughput-val');
  let throughput = 1284;
  setInterval(() => {
    if (!heroNet || !heroNet.active) return;
    throughput += Math.floor((Math.random() - 0.4) * 30);
    throughput = Math.max(1100, Math.min(1600, throughput));
    if (throughputEl) throughputEl.innerHTML = throughput.toLocaleString() + ' <span class="text-gray-500">req/s</span>';
  }, 1500);
}

function initPlayground() {
  playgroundInitialized = true;
  const pgCanvas = document.getElementById('playground-canvas');
  if (!pgCanvas) return;
  const pgNodes = [
    { x: 0.08, y: 0.5, label: 'Input', color: '#b6ff3c', size: 16 },
    { x: 0.3, y: 0.5, label: 'Router', color: '#4dd2ff', size: 13 },
    { x: 0.55, y: 0.22, label: 'GPT-4o', color: '#ff5e3a', size: 12 },
    { x: 0.55, y: 0.78, label: 'Claude', color: '#ff5e3a', size: 12 },
    { x: 0.85, y: 0.5, label: 'Output', color: '#b6ff3c', size: 16 }
  ];
  const pgEdges = [ { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 4 }, { from: 3, to: 4 } ];
  pgNet = new FlowNetwork(pgCanvas, { nodes: pgNodes, edges: pgEdges, maxParticles: 0 });

  const runBtn = document.getElementById('run-btn');
  const terminal = document.getElementById('terminal');
  const statusEl = document.getElementById('playground-status');
  let isRunning = false;
  
  const templates = {
    router: [
      { type: 'com', text: '# Initializing Smart Router pipeline...' },
      { type: 'key', text: '[flow] ', suffix: 'edge connection established (12ms)', suffixType: 'line' },
      { type: 'key', text: '[router] ', suffix: 'selected: claude-3.5 (cheapest)', suffixType: 'line' },
      { type: 'fn', text: '→ POST ', suffix: '/v1/pipeline/smart-router', suffixType: 'str' },
      { type: 'str', text: '  ✓ response complete · 659ms · $0.0034' },
      { type: 'fn', text: '← 200 OK ', suffix: '(p99: 23ms)', suffixType: 'line' }
    ],
    rag: [
      { type: 'com', text: '# Initializing RAG Pipeline...' },
      { type: 'key', text: '[vector] ', suffix: 'embedding query (1536 dim)', suffixType: 'line' },
      { type: 'key', text: '[search] ', suffix: 'matched 8 chunks from Pinecone', suffixType: 'line' },
      { type: 'fn', text: '→ POST ', suffix: '/v1/pipeline/rag-search', suffixType: 'str' },
      { type: 'str', text: '  ✓ synthesized answer · 1.2s · 824 tokens' },
      { type: 'fn', text: '← 200 OK ', suffix: 'citations: [4, 7, 12]', suffixType: 'line' }
    ],
    vision: [
      { type: 'com', text: '# Initializing Vision Analysis...' },
      { type: 'key', text: '[preproc] ', suffix: 'image resized to 512x512', suffixType: 'line' },
      { type: 'key', text: '[model] ', suffix: 'gpt-4o-vision executing', suffixType: 'line' },
      { type: 'fn', text: '→ POST ', suffix: '/v1/pipeline/vision', suffixType: 'str' },
      { type: 'str', text: '  ✓ objects detected: [car, person, tree]' },
      { type: 'fn', text: '← 200 OK ', suffix: 'confidence: 0.94', suffixType: 'line' }
    ],
    batch: [
      { type: 'com', text: '# Initializing Batch Processor...' },
      { type: 'key', text: '[queue] ', suffix: 'loaded 1,204 records from S3', suffixType: 'line' },
      { type: 'key', text: '[workers] ', suffix: 'spawning 16 parallel workers', suffixType: 'line' },
      { type: 'fn', text: '→ POST ', suffix: '/v1/pipeline/batch-run', suffixType: 'str' },
      { type: 'str', text: '  ✓ batch complete · 4m 12s · 1,204/1,204' },
      { type: 'fn', text: '← 200 OK ', suffix: 'saved to warehouse', suffixType: 'line' }
    ]
  };

  function typeLine(line, container) {
    return new Promise(resolve => {
      const div = document.createElement('div'); div.className = 'whitespace-pre-wrap'; container.appendChild(div);
      let html = '';
      if (line.type === 'com') html = `<span class="code-com">${line.text}</span>`;
      else if (line.type === 'key') html = `<span class="code-key">${line.text}</span><span class="code-line">${line.suffix || ''}</span>`;
      else if (line.type === 'fn') {
        const cls = line.suffixType === 'str' ? 'code-str' : 'code-line';
        html = `<span class="code-fn">${line.text}</span><span class="${cls}">${line.suffix || ''}</span>`;
      } else if (line.type === 'str') html = `<span class="code-str">${line.text}</span>`;
      div.innerHTML = html; container.scrollTop = container.scrollHeight;
      setTimeout(resolve, 180 + Math.random() * 120);
    });
  }
  
  window.runPipeline = async function(template = 'router') {
    if (isRunning) return; isRunning = true;
    runBtn.disabled = true; runBtn.style.opacity = '0.6';
    runBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="20" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/></circle></svg> Running...`;
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full pulse-dot" style="background:#b6ff3c"></span> <span style="color:#b6ff3c">RUNNING</span>`;
    terminal.innerHTML = ''; pgNet.maxParticles = 35; pgNet.burst();
    const logLines = templates[template] || templates.router;
    for (const line of logLines) {
      await typeLine(line, terminal);
      if (Math.random() < 0.4) pgNet.burst();
    }
    const finalLine = document.createElement('div'); finalLine.className = 'mt-1 text-gray-500'; finalLine.innerHTML = `$ <span class="cursor-blink"></span>`;
    terminal.appendChild(finalLine); terminal.scrollTop = terminal.scrollHeight;
    setTimeout(() => {
      runBtn.disabled = false; runBtn.style.opacity = '1';
      runBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2l10 6-10 6V2z" fill="currentColor"/></svg> Run again`;
      statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full" style="background:#b6ff3c"></span> <span style="color:#b6ff3c">IDLE</span>`;
      isRunning = false;
    }, 1200);
  }

  runBtn.addEventListener('click', () => runPipeline('router'));
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active-template'));
      btn.classList.add('active-template');
      const template = e.target.dataset.template;
      if (!isRunning) runPipeline(template);
    });
  });
}

const monthlyBtn = document.getElementById('billing-monthly');
const yearlyBtn = document.getElementById('billing-yearly');
if (monthlyBtn && yearlyBtn) {
  monthlyBtn.addEventListener('click', () => {
    monthlyBtn.classList.add('bg-white/10', 'text-white'); monthlyBtn.classList.remove('text-gray-400');
    yearlyBtn.classList.remove('bg-white/10', 'text-white'); yearlyBtn.classList.add('text-gray-400');
    document.querySelectorAll('.price').forEach(el => el.textContent = '$' + el.dataset.monthly);
  });
  yearlyBtn.addEventListener('click', () => {
    yearlyBtn.classList.add('bg-white/10', 'text-white'); yearlyBtn.classList.remove('text-gray-400');
    monthlyBtn.classList.remove('bg-white/10', 'text-white'); monthlyBtn.classList.add('text-gray-400');
    document.querySelectorAll('.price').forEach(el => el.textContent = '$' + el.dataset.yearly);
  });
}

const docsContent = {
  intro: { body: `<h1 class="font-display text-4xl font-bold mb-4">Welcome to FLOWAI</h1><p class="text-gray-400 leading-relaxed mb-6">FLOWAI is the visual orchestration layer for modern AI. It allows you to build, deploy, and scale AI pipelines using a visual canvas or code. Whether you're routing between models, processing streams, or building complex RAG pipelines, FLOWAI handles the infrastructure so you can focus on logic.</p><h2 class="font-display text-2xl font-bold mt-8 mb-3">Why FLOWAI?</h2><p class="text-gray-400 leading-relaxed mb-6">Traditional AI orchestration requires writing thousands of lines of boilerplate glue code to handle retries, routing, streaming, and observability. FLOWAI replaces this with a declarative visual interface and a simple TypeScript SDK.</p><div class="glass rounded-xl p-6 mt-8 border-l-2" style="border-color: #b6ff3c;"><div class="text-xs font-mono text-gray-500 mb-2">PRO TIP</div><p class="text-sm text-gray-300">You can switch between visual and code modes at any time. Changes in the canvas are reflected in your code instantly, and vice versa.</p></div>` },
  install: { body: `<h1 class="font-display text-4xl font-bold mb-4">Installation</h1><p class="text-gray-400 leading-relaxed mb-6">Get started with the FLOWAI SDK in your project. We support Node.js, Deno, Bun, and the browser.</p><div class="rounded-xl overflow-hidden border border-white/5 mt-6"><div class="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/30"><span class="w-2 h-2 rounded-full bg-red-500/60"></span><span class="w-2 h-2 rounded-full bg-yellow-500/60"></span><span class="w-2 h-2 rounded-full bg-green-500/60"></span><span class="ml-2 text-xs font-mono text-gray-500">terminal</span></div><pre class="p-4 text-xs font-mono bg-black/40 overflow-x-auto"><code><span class="code-com"># Install via npm, yarn, or pnpm</span>\n<span class="code-fn">npm</span> install <span class="code-str">@flowai/sdk</span>\n\n<span class="code-com"># Or use the CLI to scaffold a new project</span>\n<span class="code-fn">npx</span> create-flowai@latest my-pipeline</code></pre></div><h2 class="font-display text-2xl font-bold mt-8 mb-3">Authentication</h2><p class="text-gray-400 leading-relaxed mb-6">Set your API key as an environment variable. You can generate keys in the dashboard.</p><pre class="p-4 text-xs font-mono bg-black/40 rounded-xl overflow-x-auto"><code><span class="code-com"># .env</span>\n<span class="code-key">FLOWAI_API_KEY</span>=<span class="code-str">fa_live_1234567890abcdef</span></pre>` },
  quickstart: { body: `<h1 class="font-display text-4xl font-bold mb-4">Quickstart</h1><p class="text-gray-400 leading-relaxed mb-6">Create your first pipeline in under 5 minutes. This guide walks you through building a simple router pipeline that chooses between GPT-4 and Claude based on cost.</p><div class="rounded-xl overflow-hidden border border-white/5 mt-6"><div class="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/30"><span class="ml-2 text-xs font-mono text-gray-500">pipeline.ts</span></div><pre class="p-4 text-xs font-mono bg-black/40 overflow-x-auto"><code><span class="code-key">import</span> { <span class="code-fn">flow</span>, <span class="code-fn">models</span>, <span class="code-fn">route</span> } <span class="code-key">from</span> <span class="code-str">'@flowai/sdk'</span>;\n\n<span class="code-key">const</span> pipeline = <span class="code-fn">flow</span>.<span class="code-fn">create</span>({\n  name: <span class="code-str">'my-first-pipeline'</span>,\n  input: <span class="code-fn">route</span>.<span class="code-fn">smart</span>({\n    models: [<span class="code-str">'gpt-4o'</span>, <span class="code-str">'claude-3.5'</span>],\n    strategy: <span class="code-str">'cost-optimal'</span>,\n  }),\n  output: <span class="code-fn">flow</span>.<span class="code-fn">stream</span>(),\n});\n\n<span class="code-key">await</span> pipeline.<span class="code-fn">deploy</span>();</code></pre></div><p class="text-gray-400 leading-relaxed mt-6">That's it! Your pipeline is now live at a global edge endpoint.</p>` },
  pipelines: { body: `<h1 class="font-display text-4xl font-bold mb-4">Pipelines</h1><p class="text-gray-400 leading-relaxed mb-6">A pipeline is a directed graph of nodes. Data flows from the input node, through transformation and model nodes, to the output node. Pipelines can be linear, branching, or looping.</p><h2 class="font-display text-2xl font-bold mt-8 mb-3">Lifecycle</h2><p class="text-gray-400 leading-relaxed mb-6">Pipelines exist in three states: Draft, Deployed, and Archived. You can have multiple deployed versions, and route traffic between them using A/B testing.</p>` },
  nodes: { body: `<h1 class="font-display text-4xl font-bold mb-4">Nodes & Edges</h1><p class="text-gray-400 leading-relaxed mb-6">Nodes are the processing units of a pipeline. FLOWAI includes 50+ pre-built nodes for common operations, and you can build custom nodes for your own APIs.</p><h2 class="font-display text-2xl font-bold mt-8 mb-3">Node Types</h2><ul class="space-y-3 text-gray-400"><li><span class="font-mono text-sm" style="color:#b6ff3c">Model Nodes</span> - Call AI models like GPT-4, Claude, Llama</li><li><span class="font-mono text-sm" style="color:#ff5e3a">Transform Nodes</span> - Map, filter, reduce data structures</li><li><span class="font-mono text-sm" style="color:#4dd2ff">Logic Nodes</span> - Branch, merge, loop based on conditions</li><li><span class="font-mono text-sm" style="color:#b6ff3c">I/O Nodes</span> - Connect to APIs, databases, queues</li></ul>` },
  routing: { body: `<h1 class="font-display text-4xl font-bold mb-4">Routing</h1><p class="text-gray-400 leading-relaxed mb-6">Routing allows a single pipeline to dynamically select which model or sub-pipeline to use based on the input. FLOWAI supports several routing strategies out of the box.</p><h2 class="font-display text-2xl font-bold mt-8 mb-3">Strategies</h2><div class="grid md:grid-cols-2 gap-4 mt-4"><div class="glass rounded-xl p-5"><div class="font-mono text-sm mb-2" style="color:#b6ff3c">cost-optimal</div><p class="text-sm text-gray-400">Selects the cheapest model that meets your quality threshold.</p></div><div class="glass rounded-xl p-5"><div class="font-mono text-sm mb-2" style="color:#ff5e3a">latency-optimal</div><p class="text-sm text-gray-400">Selects the fastest model based on historical p99 latency.</p></div><div class="glass rounded-xl p-5"><div class="font-mono text-sm mb-2" style="color:#4dd2ff">quality-optimal</div><p class="text-sm text-gray-400">Selects the highest quality model regardless of cost.</p></div><div class="glass rounded-xl p-5"><div class="font-mono text-sm mb-2" style="color:#b6ff3c">round-robin</div><p class="text-sm text-gray-400">Distributes requests evenly across all models.</p></div></div>` },
  sdk: { body: `<h1 class="font-display text-4xl font-bold mb-4">SDK Reference</h1><p class="text-gray-400 leading-relaxed mb-6">The FLOWAI SDK provides typed methods for creating, deploying, and invoking pipelines programmatically.</p><pre class="p-4 text-xs font-mono bg-black/40 rounded-xl overflow-x-auto"><code><span class="code-key">import</span> { <span class="code-fn">flow</span> } <span class="code-key">from</span> <span class="code-str">'@flowai/sdk'</span>;\n\n<span class="code-com">// Get a deployed pipeline by name</span>\n<span class="code-key">const</span> myPipeline = <span class="code-fn">flow</span>.<span class="code-fn">get</span>(<span class="code-str">'my-pipeline'</span>);\n\n<span class="code-com">// Execute synchronously</span>\n<span class="code-key">const</span> result = <span class="code-key">await</span> myPipeline.<span class="code-fn">run</span>({ input: <span class="code-str">'Hello'</span> });\n\n<span class="code-com">// Stream execution</span>\n<span class="code-key">const</span> stream = myPipeline.<span class="code-fn">stream</span>({ input: <span class="code-str">'Hello'</span> });\n<span class="code-key">for await</span> (<span class="code-key">const</span> chunk <span class="code-key">of</span> stream) {\n  console.<span class="code-fn">log</span>(chunk);\n}</code></pre>` },
  rest: { body: `<h1 class="font-display text-4xl font-bold mb-4">REST Endpoints</h1><p class="text-gray-400 leading-relaxed mb-6">Every pipeline is automatically exposed as a REST API endpoint. You can invoke pipelines via standard HTTP requests.</p><div class="glass rounded-xl p-6 mt-6"><div class="flex items-center gap-3 mb-4"><span class="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">POST</span><span class="font-mono text-sm">https://api.flowai.dev/v1/pipelines/&#123;name&#125;/run</span></div><pre class="text-xs font-mono bg-black/40 p-4 rounded-lg overflow-x-auto"><code><span class="code-key">curl</span> -X POST https://api.flowai.dev/v1/pipelines/my-pipeline/run \\\n  -H <span class="code-str">"Authorization: Bearer $FLOWAI_API_KEY"</span> \\\n  -H <span class="code-str">"Content-Type: application/json"</span> \\\n  -d <span class="code-str">'&#123;"input": "Hello world"&#125;'</span></code></pre></div>` }
};

function loadDocContent(docKey) {
  const contentEl = document.getElementById('doc-content');
  if (!contentEl || !docsContent[docKey]) return;
  contentEl.style.opacity = '0';
  contentEl.style.transform = 'translateX(20px)';
  setTimeout(() => { 
    contentEl.innerHTML = docsContent[docKey].body; 
    contentEl.style.opacity = '1'; 
    contentEl.style.transform = 'translateX(0)';
  }, 250);
  document.querySelectorAll('.doc-link').forEach(link => link.dataset.doc === docKey ? link.classList.add('active') : link.classList.remove('active'));
}

document.querySelectorAll('.doc-link').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); loadDocContent(link.dataset.doc); });
});

function animateCounter(el) {
  const target = parseFloat(el.dataset.target), suffix = el.dataset.suffix || '';
  const decimals = parseInt(el.dataset.decimal || '0'), duration = 2000, start = performance.now();
  function step(now) {
    const elapsed = now - start, progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3), value = target * eased;
    let formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString();
    el.textContent = formatted + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.addEventListener('mousemove', e => {
  document.querySelectorAll('.feature-card').forEach(card => {
    const rect = card.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100, y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%'); card.style.setProperty('--my', y + '%');
  });
});
