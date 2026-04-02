// ============================================================
// maps.js — All path definitions and map/background drawing
// ============================================================

// ===== PATH DEFINITIONS =====
const standardPath     = [{x:-20,y:350},{x:240,y:350},{x:240,y:160},{x:560,y:160},{x:560,y:510},{x:930,y:510},{x:930,y:290},{x:1220,y:290}];
const volcanoPath      = [{x:-20,y:130},{x:200,y:130},{x:200,y:400},{x:470,y:400},{x:470,y:200},{x:730,y:200},{x:730,y:530},{x:1000,y:530},{x:1000,y:270},{x:1220,y:270}];
const hardPath         = [{x:-20,y:350},{x:180,y:350},{x:180,y:180},{x:400,y:180},{x:400,y:520},{x:650,y:520},{x:650,y:280},{x:900,y:280},{x:900,y:480},{x:1220,y:480}];
const racePath         = [{x:-20,y:350},{x:150,y:350},{x:200,y:300},{x:250,y:250},{x:300,y:200},{x:400,y:180},{x:500,y:190},{x:600,y:220},{x:700,y:270},{x:800,y:280},{x:900,y:260},{x:1000,y:230},{x:1100,y:220},{x:1220,y:220}];
const bossPath         = [{x:-20,y:350},{x:150,y:350},{x:150,y:180},{x:350,y:180},{x:350,y:520},{x:550,y:520},{x:550,y:150},{x:750,y:150},{x:750,y:550},{x:950,y:550},{x:950,y:250},{x:1220,y:250}];
const mutatiePath      = [{x:-20,y:100},{x:120,y:100},{x:120,y:600},{x:280,y:600},{x:280,y:200},{x:450,y:200},{x:450,y:500},{x:620,y:500},{x:620,y:150},{x:800,y:150},{x:800,y:450},{x:970,y:450},{x:970,y:280},{x:1220,y:280}];
const dubbelHealthPath = [{x:-20,y:250},{x:200,y:250},{x:200,y:500},{x:450,y:500},{x:450,y:150},{x:700,y:150},{x:700,y:400},{x:950,y:400},{x:950,y:200},{x:1100,y:200},{x:1100,y:550},{x:1220,y:550}];
const tsjaadPath       = [{x:-20,y:50},{x:100,y:50},{x:100,y:200},{x:250,y:200},{x:250,y:80},{x:420,y:80},{x:420,y:350},{x:600,y:350},{x:600,y:120},{x:780,y:120},{x:780,y:480},{x:980,y:480},{x:980,y:300},{x:1100,y:300},{x:1100,y:600},{x:1220,y:600}];
const tsjaadPlusPath   = [
  {x:-20,y:60},{x:60,y:60},{x:60,y:620},{x:180,y:620},{x:180,y:80},{x:320,y:80},{x:320,y:500},{x:480,y:500},
  {x:480,y:40},{x:640,y:40},{x:640,y:640},{x:800,y:640},{x:800,y:100},{x:940,y:100},{x:940,y:560},{x:1080,y:560},{x:1080,y:200},{x:1220,y:200}
];

// ===== PATH GETTER — returns the correct path array for a given game mode =====
function getPathForMode(mode) {
  switch (mode) {
    case 'plaag':        return volcanoPath;
    case 'hard':         return hardPath;
    case 'speed':        return racePath;
    case 'boss':         return bossPath;
    case 'mutatie':      return mutatiePath;
    case 'dubbelhealth': return dubbelHealthPath;
    case 'tsjaadmodus':  return tsjaadPath;
    case 'tsjaadplus':   return tsjaadPlusPath;
    default:             return standardPath; // standard, armoede, etc.
  }
}

// ===== BACKGROUND / PATH DRAWING =====

/**
 * drawTsjaadPlusBg — draws the hellfire lava-crack background for Tsjaad Modus Plus.
 * Expects globals: ctx, canvas, path
 */
function drawTsjaadPlusBg() {
  const t_now = Date.now() * 0.001;

  // Dark red gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#080000');
  bgGrad.addColorStop(0.3, '#1a0000');
  bgGrad.addColorStop(0.6, '#0d0000');
  bgGrad.addColorStop(1, '#050005');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lava crack lines
  ctx.save();
  ctx.globalAlpha = 0.12 + Math.sin(t_now * 0.7) * 0.05;
  const crackPositions = [
    {x:150,y:0,w:3,h:700},{x:380,y:0,w:2,h:700},{x:620,y:0,w:4,h:700},
    {x:850,y:0,w:2,h:700},{x:1100,y:0,w:3,h:700},
    {x:0,y:150,w:1200,h:3},{x:0,y:350,w:1200,h:2},{x:0,y:550,w:1200,h:3}
  ];
  for (const crack of crackPositions) {
    const lavaGrad = ctx.createLinearGradient(crack.x, crack.y, crack.x + crack.w, crack.y + crack.h);
    lavaGrad.addColorStop(0, 'rgba(255,60,0,0)');
    lavaGrad.addColorStop(0.5, `rgba(255,${80 + Math.sin(t_now * 2) * 30},0,0.9)`);
    lavaGrad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(crack.x, crack.y, crack.w, crack.h);
  }
  ctx.restore();

  // Red vignette pulse
  ctx.save();
  const vigAlpha = 0.25 + Math.sin(t_now * 1.2) * 0.1;
  const vigGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 200, canvas.width / 2, canvas.height / 2, 750);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, `rgba(180,0,0,${vigAlpha})`);
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Path track
  ctx.strokeStyle = '#8b0000'; ctx.lineWidth = 34; ctx.lineCap = 'round';
  ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
  ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
  for (const p of path) ctx.lineTo(p.x, p.y);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,${40 + Math.sin(t_now * 3) * 20},0,0.8)`;
  ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
  for (const p of path) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/**
 * drawPath — master draw function; picks the correct background and path style for
 * the current gameMode. Expects globals: ctx, canvas, path, gameMode
 */
function drawPath() {
  if (gameMode === 'tsjaadplus') { drawTsjaadPlusBg(); return; }

  if (gameMode === 'mutatie') {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0a1a0a'); grad.addColorStop(0.5, '#0d2b0d'); grad.addColorStop(1, '#0a1a0a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a5c1a'; ctx.lineWidth = 30; ctx.lineCap = 'round';
    ctx.shadowBlur = 20; ctx.shadowColor = '#00ff44';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0;

  } else if (gameMode === 'dubbelhealth') {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#001233'); grad.addColorStop(0.5, '#003166'); grad.addColorStop(1, '#001233');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0d47a1'; ctx.lineWidth = 28; ctx.lineCap = 'round';
    ctx.shadowBlur = 15; ctx.shadowColor = '#4fc3f7';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0;

  } else if (gameMode === 'tsjaadmodus') {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1a0500'); grad.addColorStop(0.5, '#3d1100'); grad.addColorStop(1, '#1a0500');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#8b2500'; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.shadowBlur = 25; ctx.shadowColor = '#ff6600';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0;

  } else if (gameMode === 'plaag') {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#5a2d0c'); gradient.addColorStop(0.5, '#8b4513'); gradient.addColorStop(1, '#654321');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff4500'; ctx.lineWidth = 28; ctx.lineCap = 'round';
    ctx.shadowBlur = 25; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0;

  } else if (gameMode === 'hard') {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a0033'); gradient.addColorStop(0.5, '#2c003e'); gradient.addColorStop(1, '#1a0033');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c70039'; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.shadowBlur = 30; ctx.shadowColor = '#ff0080';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0;

  } else if (gameMode === 'speed') {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2c3e50'); gradient.addColorStop(0.5, '#34495e'); gradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 35; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 3; ctx.setLineDash([15, 10]);
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);

  } else if (gameMode === 'armoede') {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#3a3a3a'); gradient.addColorStop(0.5, '#2a2a2a'); gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke();

  } else if (gameMode === 'boss') {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2a0a0a'); gradient.addColorStop(0.5, '#440000'); gradient.addColorStop(1, '#2a0a0a');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#8b0000'; ctx.lineWidth = 32; ctx.lineCap = 'round';
    ctx.shadowBlur = 30; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0;

  } else {
    // standard / fallback
    ctx.fillStyle = '#7ab86d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c2b280'; ctx.lineWidth = 26; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y); ctx.stroke();
  }
}
