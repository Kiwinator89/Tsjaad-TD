// ============================================================
// game.js — All game logic: state, towers, enemies, spawning,
//           projectiles, explosions, audio, rendering, game loop
// ============================================================

// ===== CANVAS & GLOBALS =====
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

let gameMode = null;
let path     = []; // set by ui.js → startGame() via getPathForMode()

// Core state
let money = 500, lives = 20, round = 1;
let selectedTower = null;
let enemies = [], towers = [], projectiles = [], explosions = [], bananas = [];
let spawning = false, spawnLeft = 0, spawnTimer = 0;
let gameWon = false;
let totalMoneyEarned = 0;
let hoveredTower = null;
let mouseX = 0, mouseY = 0;
let autoStartRounds = false, autoRoundCountdown = 0;
let monkeyBoosts    = [];
let nuclearExplosions = [];
let towersSlowedUntil = new Map();
let visualEffects   = [];
let nukeStrikes     = [];
let critTexts       = [];
let birdEggs        = [];

// ===== AUDIO =====
const BASE_AUDIO = 'https://raw.githubusercontent.com/Kiwinator89/Tsjaad-TD/main/Audio/';
const sounds = {
  themeStandaard:    new Audio(BASE_AUDIO + 'MainTheme.mp3'),
  themePlaag:        new Audio(BASE_AUDIO + 'VolcanoTheme.mp3'),
  themeHard:         new Audio(BASE_AUDIO + 'HardTheme.mp3'),
  themeSpeed:        new Audio(BASE_AUDIO + 'DoubleSpeedMode.mp3'),
  themeBoss:         new Audio(BASE_AUDIO + 'BossMode.mp3'),
  themeMutatie:      new Audio(BASE_AUDIO + 'MutatieModus.mp3'),
  themeTsjaad:       new Audio(BASE_AUDIO + 'TsjaadModus.mp3'),
  themeDubbelHealth: new Audio(BASE_AUDIO + 'DubbelHealthModus.mp3'),
  themeArmoede:      new Audio(BASE_AUDIO + 'ArmoedeModus.mp3'),
  explode:   new Audio(BASE_AUDIO + 'Explosion.mp3'),
  kill:      new Audio(BASE_AUDIO + 'Kill.mp3'),
  monkey:    new Audio(BASE_AUDIO + 'Monkey.mp3'),
  placement: new Audio(BASE_AUDIO + 'Placement.mp3'),
  round:     new Audio(BASE_AUDIO + 'Round.mp3'),
  sacrifice: new Audio(BASE_AUDIO + 'Sacrifice.mp3'),
  sell:      new Audio(BASE_AUDIO + 'Sell.mp3'),
  sniper:    new Audio(BASE_AUDIO + 'Sniper.mp3'),
  upgrade:   new Audio(BASE_AUDIO + 'Upgrade.mp3'),
};
['themeStandaard','themePlaag','themeHard','themeSpeed','themeBoss','themeMutatie','themeTsjaad','themeDubbelHealth','themeArmoede'].forEach(k => {
  sounds[k].loop = true; sounds[k].volume = 0.5;
});
let currentTheme = null, musicPlaying = false;

function playMusic(themeKey) {
  if (currentTheme) { currentTheme.pause(); currentTheme.currentTime = 0; }
  currentTheme = sounds[themeKey] || sounds.themeStandaard;
  currentTheme.volume = 0.5;
  currentTheme.play().catch(() => {});
  musicPlaying = true;
}
function stopMusic() {
  if (currentTheme) { currentTheme.pause(); currentTheme.currentTime = 0; }
  musicPlaying = false;
}
function playSound(name, vol = 0.7) {
  const s = sounds[name];
  if (!s) return;
  try { const c = new Audio(s.src); c.volume = vol; c.play().catch(() => {}); } catch(e) {}
}

// ===== MUTATIONS =====
const MUTATIONS = ['ondode','snelle','hydra','random','dodelijke','radioactieve','metalen','kogelvrije',
  'beschermde','terugkerende','arme','Nutteloze','verslomende','accelererende','genezende','elite','onstabiele'];

function pickMutation(round, mode) {
  const available = MUTATIONS.filter(m => !(m === 'metalen' && round < 10));
  return available[Math.floor(Math.random() * available.length)];
}
function getMutationDisplayName(m1, m2, baseName, m3) {
  const pfx = { ondode:'Ondode',snelle:'Snelle',hydra:'Hydra',random:'Random',dodelijke:'Dodelijke',
    radioactieve:'Radioactieve',metalen:'Metalen',kogelvrije:'Kogelvrije',beschermde:'Beschermde',
    terugkerende:'Terugkerende',arme:'Arme',onzichtbare:'Onzichtbare',verslomende:'Verslomende',
    accelererende:'Accelererende',genezende:'Genezende',elite:'ELITE',onstabiele:'ONSTABIELE' };
  if (m3)  return (pfx[m1]||'') + '-' + (pfx[m2]||'') + '-' + (pfx[m3]||'') + ' ' + baseName;
  if (m2)  return (pfx[m1]||'') + '-' + (pfx[m2]||'') + ' ' + baseName;
  return (pfx[m1]||'') + ' ' + baseName;
}

// ===== TOWER DEFINITIONS =====
const towerBaseRanges = {
  speer:90, boog:130, plaagdokter:140, geweer:240, sniper:550,
  tsjaadinator:180, atoom:180, katoen:0, aap:120, fakkel:95
};
const towerTypes = {
  speer:        { range:90,  rate:40,  dmg:3.6,  speed:3.2, cost:80,   ultCost:800  },
  boog:         { range:130, rate:55,  dmg:7,    speed:2,   cost:125,  ultCost:1500 },
  plaagdokter:  { range:140, rate:40,  dmg:8,    speed:3.5, cost:300,  ultCost:2000, slow:true },
  geweer:       { range:240, rate:12,  dmg:3.8,  speed:7,   cost:550,  ultCost:5000 },
  sniper:       { range:550, rate:300, dmg:300,  speed:10,  cost:5000, ultCost:28000 },
  tsjaadinator: { range:180, rate:4,   dmg:4.8,  speed:8,   cost:2500, ultCost:15000, secretCost:500000 },
  atoom:        { range:180, rate:100, dmg:15,   speed:3,   cost:600,  ultCost:4500,  bomb:true },
  katoen:       { range:0,   rate:9999,dmg:0,    speed:0,   cost:950,  ultCost:4000,  farm:true },
  aap:          { range:120, rate:70,  dmg:1.9,  speed:0,   cost:400,  ultCost:2500,  monkey:true },
  fakkel:       { range:95,  rate:45,  dmg:3,    speed:3,   cost:150,  ultCost:4000,  fire:true },
};

function getTowerRange(tw) {
  const base = towerBaseRanges[tw.key] || towerTypes[tw.key].range || 0;
  let range  = base * (1 + tw.level * 0.05);
  if (tw.speerRangeBoostUntil && Date.now() < tw.speerRangeBoostUntil) range *= 1.30;
  return range;
}
function getFakkelBurnDmg(level, ultimate) {
  if (ultimate) return 80;
  return [3, 3, 5, 15][Math.min(level, 3)];
}
function getAtoomNukeCooldown(tw) { return tw.ultimate ? 10 * 60 : 25 * 60; }
function getAtoomNukeDamage(tw) {
  if (tw.ultimate) return 40;
  return [10, 20, 25, 30][Math.min(tw.level, 3)];
}

function getUpgradeCostForTower(tw) {
  const map = { speer:50, boog:100, plaagdokter:250, geweer:225, atoom:400,
    sniper:1000, tsjaadinator:800, katoen:200, aap:150, fakkel:125 };
  return map[tw.key] || 200;
}
function getTowerTotalInvestedCost(tw) {
  const base = towerTypes[tw.key].cost || 0;
  let total  = base + tw.level * getUpgradeCostForTower(tw);
  if (tw.ultimate) total += towerTypes[tw.key].ultCost || 0;
  if (tw.secret)   total += towerTypes[tw.key].secretCost || 0;
  return total;
}
function getNextLevelStats(tw) {
  const cfg = towerTypes[tw.key];
  let dmg   = tw.dmg, rate = tw.rate;
  let slow  = tw.slowAmount || null, plaagBonus = tw.plaagDmgBonus || null;
  const nextLevel = tw.level + 1;
  const nextRange = (towerBaseRanges[tw.key] || cfg.range || 0) * (1 + nextLevel * 0.05);

  if (tw.level < 3) {
    if (tw.key === 'sniper')      { dmg = tw.dmg + 200; }
    else if (tw.key === 'plaagdokter') { dmg = tw.dmg * 1.25; rate = tw.rate * 0.85; slow = (tw.slowAmount || 0.20) + 0.05; plaagBonus = (tw.plaagDmgBonus || 1.05) + 0.05; }
    else if (tw.key === 'aap')    { dmg = tw.dmg * 1.5; }
    else if (tw.key === 'fakkel') { dmg = tw.dmg * 5.5; rate = tw.rate * 0.85; }
    else if (!tw.farm)            { dmg = tw.dmg * 1.25; rate = tw.rate * 0.85; }
  } else if (!tw.ultimate) {
    if (tw.key === 'atoom')        { dmg = tw.dmg * 2.8; rate = tw.rate * 0.55; }
    else if (tw.key === 'tsjaadinator') { dmg = tw.dmg * 2; rate = tw.rate * 0.25; }
    else if (tw.key === 'speer')   { dmg = tw.dmg * 3; rate = tw.rate * 1.2; }
    else if (tw.key === 'geweer')  { dmg = 25; rate = tw.rate * 0.35; }
    else if (tw.key === 'boog')    { dmg = tw.dmg * 1.9; rate = tw.rate * 0.50; }
    else if (tw.key === 'sniper')  { dmg = 5000; }
    else if (tw.key === 'plaagdokter') { dmg = tw.dmg * 4; slow = null; plaagBonus = (tw.plaagDmgBonus || 1.05) + 0.05; }
    else if (tw.key === 'aap')    { dmg = tw.dmg * 2; }
    else if (tw.key === 'fakkel') { dmg = tw.dmg * 1.4; }
  }
  return { dmg, rate, range: nextRange, slow, plaagBonus };
}

// ===== ENEMY TYPES =====
const animalTypes = [
  { name:'Giraffe',    hp:4,   speed:1.1,   size:14, reward:10, type:'giraffe' },
  { name:'Leeuw',      hp:6,   speed:1.25,  size:14, reward:12, type:'leeuw' },
  { name:'Neushoorn',  hp:12,  speed:0.95,  size:18, reward:18, type:'neushoorn' },
  { name:'Olifant',    hp:20,  speed:0.8,   size:20, reward:25, type:'olifant' },
  { name:'Cheetah',    hp:5.6, speed:1.485, size:14, reward:15, type:'cheetah',  minRound:15 },
  { name:'Nijlpaard',  hp:28,  speed:0.4,   size:22, reward:30, type:'nijlpaard',minRound:12 },
  { name:'Kameel',     hp:35,  speed:0.4,   size:20, reward:35, type:'kameel',   minRound:18 },
  { name:'Robo Leeuw', hp:20,  speed:1.25,  size:16, reward:40, type:'roboleeuw',minRound:16 },
  { name:'Vogel',      hp:10,  speed:1.4,   size:13, reward:30, type:'vogel',    minRound:16 },
  { name:'Krokodil',   hp:40,  speed:0.75,  size:20, reward:38, type:'krokodil', minRound:20 },
];
const bossType           = { name:'Malaria Mug',             hp:50000,    speed:0.7,  size:80,  reward:1000, boss:true, type:'mug' };
const mutatedBossType    = { name:'Gemuteerde Malaria Mug',  hp:5000000,  speed:0.75, size:95,  reward:2500, boss:true, type:'mutatedmug' };
const slowBossType       = { name:'Malaria Mug',             hp:6500000,  speed:0.15, size:120, reward:1000, boss:true, type:'mug' };
const zwangereMugBossType= { name:'Zwangere Malaria Mug',    hp:200000,   speed:0.6,  size:110, reward:3000, boss:true, type:'zwangeremug' };

// ===== TOWER SELECTION =====
function selectTower(key) {
  if (gameMode === 'armoede' && key === 'katoen') return;
  selectedTower = key;
}

// ===== CANVAS CLICK — PLACE OR UPGRADE =====
canvas.onclick = e => {
  if (gameWon) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;

  // Click on existing tower → upgrade
  for (const tw of towers) {
    const sz = 18 * (1 + tw.level * 0.05);
    if (Math.hypot(tw.x - x, tw.y - y) < sz) { handleUpgrade(tw); return; }
  }

  if (!selectedTower) return;
  const cfg = towerTypes[selectedTower];
  if (money < cfg.cost) return;

  // Block placement on the path (except monkey)
  if (selectedTower !== 'aap') {
    for (let i = 0; i < path.length - 1; i++) {
      if (distanceToLineSegment(x, y, path[i].x, path[i].y, path[i+1].x, path[i+1].y) < 30) return;
    }
  }

  money -= cfg.cost;
  const tw = {
    x, y, key: selectedTower, cool: 0, dmg: cfg.dmg, rate: cfg.rate, level: 0,
    ultimate: false, upText: 0,
    farm: cfg.farm || false, slow: cfg.slow || false,
    monkey: cfg.monkey || false, fire: cfg.fire || false,
    monkeyTimer: 0, boosted: false, boostEndTime: 0, nukeTimer: 0,
    investedCost: cfg.cost, speerRangeBoostUntil: 0,
  };
  if (selectedTower === 'plaagdokter') { tw.slowAmount = 0.20; tw.slowDuration = 180; tw.plaagDmgBonus = 1.05; }
  if (selectedTower === 'fakkel')      { tw.fireChance = 1.0; }
  if (selectedTower === 'atoom')       { tw.fireBonusMultiplier = 1.20; }
  towers.push(tw);
  playSound('placement', 0.6);
};

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t  = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ===== UPGRADE =====
function handleUpgrade(tw) {
  const upgradeCost = getUpgradeCostForTower(tw);

  if (tw.level < 3) {
    if (money < upgradeCost) return;
    money -= upgradeCost;
    tw.level++;
    if (tw.key === 'sniper')      { tw.dmg += 200; }
    else if (tw.key === 'plaagdokter') { tw.dmg *= 1.25; tw.rate *= 0.85; tw.slowAmount += 0.05; tw.plaagDmgBonus = (tw.plaagDmgBonus || 1.05) + 0.05; }
    else if (tw.key === 'aap')    { tw.dmg *= 1.5; }
    else if (tw.key === 'fakkel') { tw.dmg *= 1.25; tw.rate *= 0.85; }
    else if (!tw.farm)            { tw.dmg *= 1.25; tw.rate *= 0.85; }
    if (tw.key === 'atoom') tw.fireBonusMultiplier = (tw.fireBonusMultiplier || 1.20) + 0.10;
    playSound('upgrade', 0.6);
    tw.upText = 90;
    return;
  }

  if (tw.ultimate) {
    if (tw.key === 'tsjaadinator' && !tw.secret) {
      if (money < 300000) return;
      money -= 300000;
      tw.secretDmgBonus = 5.0;
      tw.secret = true; tw.level = 5;
      playSound('sacrifice', 0.8);
      tw.upText = 200;
    }
    return;
  }

  const cost = towerTypes[tw.key].ultCost;
  if (money < cost) return;
  money -= cost;
  tw.ultimate = true; tw.level = 4;

  if (tw.key === 'atoom')        { tw.dmg *= 3.8; tw.rate *= 0.55; tw.nukeTimer = 0; tw.fireBonusMultiplier = (tw.fireBonusMultiplier || 1.20) + 0.10; }
  else if (tw.key === 'tsjaadinator') { tw.dmg *= 2; tw.rate *= 0.25; }
  else if (tw.key === 'speer')   { tw.dmg *= 3; tw.rate *= 1.2; tw.speerRangeBoostUntil = 0; }
  else if (tw.key === 'geweer')  { tw.dmg = 10; tw.rate *= 0.45; }
  else if (tw.key === 'boog')    { tw.dmg *= 1.9; tw.rate *= 0.50; tw.poisonArrows = true; }
  else if (tw.key === 'sniper')  { tw.dmg = 5000; tw.sniperSlowOnHit = true; }
  else if (tw.key === 'plaagdokter') { tw.dmg *= 4; tw.slowDuration = 999999; tw.plaagDmgBonus = (tw.plaagDmgBonus || 1.05) + 0.05; }
  else if (tw.key === 'aap')    { tw.dmg *= 2; }
  else if (tw.key === 'fakkel') { tw.dmg *= 30; tw.fireChance = 1.0; }
  playSound('upgrade', 0.7);
  tw.upText = 140;
}

// ===== SELL =====
function sellTower(tw) {
  const sellVal = Math.floor(getTowerTotalInvestedCost(tw) * 0.8);
  money += sellVal;
  totalMoneyEarned += sellVal;
  towers = towers.filter(t => t !== tw);
  hoveredTower = null;
  document.getElementById('towerTooltip').style.display = 'none';
  const flash = document.getElementById('sellFlash');
  flash.style.display = 'block';
  setTimeout(() => { flash.style.display = 'none'; }, 400);
  playSound('sell', 0.7);
}

// ===== ROUND START =====
function startRound() {
  if (spawning || gameWon) return;
  playSound('round', 0.7);
  document.getElementById('round').textContent = round;

  let farmCash = 0;
  for (const tw of towers) {
    if (tw.farm) { const base = 80 + tw.level * 40 + (tw.ultimate ? 500 : 0); money += base; farmCash += base; }
  }
  showRoundMsg(farmCash > 0 ? t('round-farms') + farmCash : t('round-label') + round);

  const maxRound = getMaxRound();
  if (round === maxRound) {
    spawnLeft = gameMode === 'mutatie' ? 3 : 1;
    spawning  = true;
    return;
  }

  // Tsjaad Plus mini-boss rounds
  const miniBossRounds = [10, 20, 30, 40];
  if (gameMode === 'tsjaadplus' && miniBossRounds.includes(round)) {
    spawnLeft = Math.floor(4 + round * 1.5) + 1;
    spawning = true; spawnTimer = 0;
    window._tsjaadPlusMiniBossQueued = true;
    return;
  }

  let baseEnemies = Math.floor(5 + round * 1.8);
  if (gameMode === 'plaag')        baseEnemies = Math.floor(10 + round * 2.5);
  else if (gameMode === 'hard')    baseEnemies = Math.floor(7 + round * 2.5);
  else if (gameMode === 'mutatie') baseEnemies = Math.floor(6 + round * 2);
  else if (gameMode === 'tsjaadmodus') baseEnemies = Math.floor(8 + round * 2.5);
  else if (gameMode === 'tsjaadplus')  baseEnemies = Math.floor(8 + round * 3);

  spawnLeft = baseEnemies; spawning = true; spawnTimer = 0;
  if (autoStartRounds) autoRoundCountdown = 0;
}

function getMaxRound() {
  if (['standard','speed','armoede','dubbelhealth'].includes(gameMode)) return 30;
  if (['hard','tsjaadmodus','tsjaadplus'].includes(gameMode)) return 50;
  if (gameMode === 'boss')    return 1;
  if (gameMode === 'mutatie') return 35;
  if (gameMode === 'plaag')   return 999;
  return 30;
}

// ===== SPAWN ENEMIES =====
function spawnEnemy() {
  const maxRound = getMaxRound();

  // Tsjaad Plus mini-boss injection
  if (gameMode === 'tsjaadplus') {
    const miniBossMap = { 10:'giraffe', 20:'leeuw', 30:'cheetah', 40:'nijlpaard' };
    const mbType = miniBossMap[round];
    if (mbType && window._tsjaadPlusMiniBossQueued) {
      window._tsjaadPlusMiniBossQueued = false;
      const baseData = animalTypes.find(a => a.type === mbType) || animalTypes[0];
      const hpScale  = (1 + round * 0.14) * 11.0;
      const spScale  = 1 + round * 0.02;
      const m1 = pickMutation(round, 'tsjaadplus');
      let m2 = pickMutation(round, 'tsjaadplus'), tries = 0;
      while (m2 === m1 && tries++ < 10) m2 = pickMutation(round, 'tsjaadplus');
      const boss = makeEnemy({ ...baseData, hp: Math.floor(baseData.hp * hpScale * (m1==='elite'||m2==='elite'?4:1)), speed: baseData.speed * spScale * (m1==='snelle'||m2==='snelle'?3:1), size: baseData.size * 1.8, reward: Math.floor(baseData.reward * 20) });
      boss.mutation = m1; boss.mutation2 = m2; boss.name = '⚠️ Gemuteerde ' + baseData.name; boss.isMiniBoss = true;
      applyMutationToEnemy(boss, m1); applyMutationToEnemy(boss, m2);
      enemies.push(boss); return;
    }
  }

  // Final-round bosses
  if (round === maxRound) {
    if (gameMode === 'mutatie')      { enemies.push(makeEnemy({...zwangereMugBossType})); return; }
    if (['standard','speed','armoede'].includes(gameMode)) { enemies.push(makeEnemy({...bossType})); return; }
    if (gameMode === 'hard')          { enemies.push(makeEnemy({...mutatedBossType})); return; }
    if (gameMode === 'boss')          { enemies.push(makeEnemy({...slowBossType}));    return; }
    if (gameMode === 'dubbelhealth')  { enemies.push(makeEnemy({...bossType})); return; }
    if (['tsjaadmodus','tsjaadplus'].includes(gameMode)) { enemies.push(makeEnemy({...mutatedBossType})); return; }
  }

  // Normal enemy
  const available = animalTypes.filter(a => !a.minRound || round >= a.minRound);
  const base      = available[Math.floor(Math.random() * available.length)];
  let hpScale = 1 + round * 0.14, spScale = 1 + round * 0.02;

  if (gameMode === 'plaag')        { hpScale *= 1.80; spScale *= 1.35; }
  else if (gameMode === 'hard')    { hpScale *= 1.5;  spScale *= 1.15; }
  else if (gameMode === 'speed')   { spScale *= 2.0; }
  else if (gameMode === 'dubbelhealth') { hpScale *= 2.0; }
  else if (gameMode === 'tsjaadmodus')  { hpScale *= 2.0; spScale *= 2.0; }
  else if (gameMode === 'tsjaadplus')   { hpScale *= 2.5; spScale *= 2.5; }
  if (round > 8)  { hpScale *= 1 + 0.08 * (round - 8); spScale *= 1 + 0.01 * (round - 8); }
  if (round > 20) { hpScale *= 1.70; spScale *= 1.3; }
  if (gameMode === 'plaag' && round > 20) { hpScale *= 1 + 0.06 * (round - 20); spScale *= 1 + 0.015 * (round - 20); }
  if (round > 30) { const inc = Math.floor((round - 30) / 5); if (inc > 0) { hpScale *= Math.pow(1.40, inc); spScale *= (1 + 0.01 * inc); } }

  const baseHp = Math.floor(base.hp * hpScale), baseSp = base.speed * spScale;

  // Mutation chances
  let mutChance = 0, dblChance = 0, triChance = 0;
  if (gameMode === 'mutatie')     { mutChance = 0.20; if (round > 15) dblChance = 0.40; }
  else if (gameMode === 'tsjaadmodus') { mutChance = 0.02; if (round > 15) dblChance = 0.50; }
  else if (gameMode === 'tsjaadplus')  { mutChance = 1.0; dblChance = 0.50; }
  else if (gameMode === 'plaag') {
    if (round >= 60) { mutChance = 1.0; dblChance = 1.0; triChance = 1.0; }
    else if (round >= 50) { mutChance = 1.0; dblChance = 1.0; }
    else if (round >= 40) { mutChance = 1.0; dblChance = 0.50; }
    else if (round >= 30) { mutChance = 1.0; }
    else if (round >= 20) { mutChance = 0.10; }
  }

  let m1 = null, m2 = null, m3 = null;
  if (mutChance > 0 && Math.random() < mutChance) {
    m1 = pickMutation(round, gameMode);
    if (dblChance > 0 && Math.random() < dblChance) { let s = pickMutation(round, gameMode), tr = 0; while (s === m1 && tr++ < 10) s = pickMutation(round, gameMode); if (s !== m1) m2 = s; }
    if (m2 && triChance > 0 && Math.random() < triChance) { let s = pickMutation(round, gameMode), tr = 0; while ((s === m1 || s === m2) && tr++ < 10) s = pickMutation(round, gameMode); if (s !== m1 && s !== m2) m3 = s; }
  }

  let finalHp = baseHp, finalSp = baseSp;
  for (const m of [m1, m2, m3]) {
    if (m === 'snelle') { finalSp *= 3.0; finalHp = Math.floor(finalHp * 0.6); }
    if (m === 'elite')  { finalSp *= 1.5; finalHp = Math.floor(finalHp * 4.0); }
  }

  const enemy = makeEnemy({ ...base, hp: finalHp, speed: finalSp, reward: Math.floor(base.reward * (1 + round * 0.15)), infected: gameMode === 'plaag' });
  if (m1) {
    enemy.mutation = m1; enemy.mutation2 = m2 || null; enemy.mutation3 = m3 || null;
    enemy.name = getMutationDisplayName(m1, m2, base.name, m3);
    applyMutationToEnemy(enemy, m1);
    if (m2) applyMutationToEnemy(enemy, m2);
    if (m3) applyMutationToEnemy(enemy, m3);
  }
  enemies.push(enemy);
}

function applyMutationToEnemy(e, mutation) {
  if (mutation === 'beschermde')   { e.beschermdShieldUsed = false; e.beschermdActive = false; e.beschermdTimer = 0; }
  if (mutation === 'terugkerende') { e.terugkerendeCount = (e.terugkerendeCount || 0) + 3; }
  if (mutation === 'accelererende'){ e.baseSpeedForAccel = e.speed; e.accelFactor = 0; }
  if (mutation === 'genezende')    { e.healTimer = 0; }
  if (mutation === 'onstabiele')   { e.onstabielTimer = 300; e.onstabielExploded = false; }
}

function makeEnemy(t2) {
  return {
    x: path[0].x, y: path[0].y, i: 0,
    hp: t2.hp, max: t2.hp, speed: t2.speed, baseSpeed: t2.speed,
    size: t2.size, reward: t2.reward, name: t2.name, type: t2.type,
    boss: t2.boss || false, infected: t2.infected || false, slowEndTime: 0,
    burning: false, burnDamage: 0, burnDuration: 0, burnDamagePerSec: 0, burnTickTimer: 0,
    mutation: null, mutation2: null,
    beschermdShieldUsed: false, beschermdActive: false, beschermdTimer: 0,
    terugkerendeCount: 0, accelFactor: 0, baseSpeedForAccel: t2.speed,
    healTimer: 0, kameelBoosted: false, kameelBoostTimer: 0, kameelLionsSpawned: false,
    plaagDebuffed: false, poisoned: false, poisonTimer: 0, poisonDmgPerSec: 0,
    isBird: t2.type === 'vogel', windRadius: t2.type === 'vogel' ? 80 : 0,
    isChildBird: t2.isChildBird || false, eggLaid: false,
    isRoboLeeuw: t2.type === 'roboleeuw', isKrokodil: t2.type === 'krokodil',
    onstabielTimer: 0, onstabielExploded: false,
    lastSpawnHp: t2.hp,
  };
}

function makeGhostEnemy(original) {
  const ghost = makeEnemy({ hp: original.max, speed: original.baseSpeed * 1.1, size: original.size, reward: Math.floor(original.reward * 0.5), name: '👻 Geest ' + original.name.replace(/^[^ ]+ /, ''), type: original.type, boss: false });
  ghost.i = original.i; ghost.x = original.x; ghost.y = original.y; ghost.isGhost = true;
  return ghost;
}

// ===== NUCLEAR EXPLOSION (enemy-triggered) =====
function triggerEnemyNuclearExplosion(e, mega = false) {
  const range = mega ? 150 : 90;
  nuclearExplosions.push({ x: e.x, y: e.y, range, t: 120, maxT: 120 });
  visualEffects.push({ type: 'nuclear', x: e.x, y: e.y, r: 5, maxR: range, t: 60, maxT: 60 });
  for (const other of enemies) {
    if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < range) {
      if (!other.beschermdActive) other.hp -= mega ? 9999999 : other.max * 0.5;
    }
  }
}

// ===== NUKE STRIKE (atoom tower) =====
function triggerNukeStrike(tower) {
  const dmg = getAtoomNukeDamage(tower);
  for (const e of enemies) { if (!e.beschermdActive) e.hp -= dmg; }
  if (!antiLagMode) playSound('explode', 0.8);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  nukeStrikes.push({ x: cx, y: cy, r: 10, maxR: 600, t: 90, maxT: 90 });
  for (const e of enemies) explosions.push({ x: e.x, y: e.y, r: 8, t: 30, gold: true });
  visualEffects.push({ type: 'nukeFlash', x: cx, y: cy, r: 5, maxR: 700, t: 45, maxT: 45 });
}

// ===== UPDATE =====
function update() {
  if (autoStartRounds && !spawning && !gameWon && enemies.length === 0) startRound();

  // Spawn
  if (spawning) {
    spawnTimer--;
    if (spawnTimer <= 0 && spawnLeft > 0) { spawnEnemy(); spawnLeft--; spawnTimer = 60 - Math.min(40, round); }
    if (spawnLeft === 0 && enemies.length === 0) {
      spawning = false;
      const maxRound = getMaxRound();
      if (round < maxRound) round++;
    }
  }

  // Bird eggs aging
  for (const egg of birdEggs) egg.timer--;

  // Bird wind aura
  for (const bird of enemies) {
    if (!bird.isBird || bird.hp <= 0) continue;
    for (const other of enemies) {
      if (other === bird || other.hp <= 0) continue;
      if (Math.hypot(other.x - bird.x, other.y - bird.y) < (bird.windRadius || 80)) {
        other.birdWindBoosted = true; other.birdWindTimer = 5;
      }
    }
  }

  for (const e of enemies) {
    if (e.birdWindTimer > 0) e.birdWindTimer--; else e.birdWindBoosted = false;

    // Zwangere Mug: spawn child every 1000 HP lost
    if (e.type === 'zwangeremug' && e.hp < e.lastSpawnHp - 1000) {
      const spawns = Math.floor((e.lastSpawnHp - e.hp) / 1000);
      e.lastSpawnHp -= spawns * 1000;
      const avail = animalTypes.filter(a => !a.minRound || round >= a.minRound);
      for (let s = 0; s < spawns; s++) {
        const b = avail[Math.floor(Math.random() * avail.length)];
        const child = makeEnemy({ ...b, hp: Math.floor(b.hp * (1 + round * 0.14)), speed: b.speed * (1 + round * 0.02), reward: Math.floor(b.reward * 0.5) });
        child.i = 0; child.x = path[0].x; child.y = path[0].y;
        enemies.push(child);
      }
    }

    // Onstabiele countdown
    const hasOnstabiel = e.mutation === 'onstabiele' || e.mutation2 === 'onstabiele';
    if (hasOnstabiel && !e.onstabielExploded && e.onstabielTimer > 0) {
      e.onstabielTimer--;
      if (e.onstabielTimer <= 0) { e.onstabielExploded = true; e.hp = 0; triggerEnemyNuclearExplosion(e, true); continue; }
    }

    // Shield
    if (e.mutation === 'beschermde' && !e.beschermdShieldUsed && e.hp <= e.max * 0.5)  { e.beschermdShieldUsed = true; e.beschermdActive = true; e.beschermdTimer = 180; }
    if (e.beschermdActive) { e.beschermdTimer--; if (e.beschermdTimer <= 0) e.beschermdActive = false; }
    if (e.mutation2 === 'beschermde' && !e.beschermd2ShieldUsed && e.hp <= e.max * 0.3) { e.beschermd2ShieldUsed = true; e.beschermdActive = true; e.beschermdTimer = 120; }

    // Healing
    if (e.mutation === 'genezende' || e.mutation2 === 'genezende' || e.mutation3 === 'genezende') {
      e.healTimer = (e.healTimer || 0) + 1;
      if (e.healTimer >= 60) { e.healTimer = 0; e.hp = Math.min(e.max, e.hp + e.max * 0.05); }
    }

    // Slow timer
    if (e.slowEndTime > 0) { e.slowEndTime--; if (e.slowEndTime <= 0) e.speed = e.baseSpeed; }

    // Fire burn
    if (e.burning && e.burnDuration > 0) {
      e.burnDuration--; e.burnTickTimer++;
      if (e.burnTickTimer >= 60) { e.burnTickTimer = 0; e.hp -= e.burnDamagePerSec; }
      if (e.burnDuration <= 0) { e.burning = false; e.burnTickTimer = 0; }
    }

    // Poison
    if (e.poisoned && e.poisonTimer > 0) {
      e.poisonTimer--;
      if (!e._poisonTickTimer) e._poisonTickTimer = 0;
      e._poisonTickTimer++;
      if (e._poisonTickTimer >= 60) { e._poisonTickTimer = 0; e.hp -= e.poisonDmgPerSec; }
      if (e.poisonTimer <= 0) {
        e.poisoned = false; e._poisonTickTimer = 0;
        if (e.poisonSlowApplied) { e.speed /= 0.90; e.baseSpeed /= 0.90; e.poisonSlowApplied = false; }
      }
    }

    // Accelererende
    if (e.mutation === 'accelererende' || e.mutation2 === 'accelererende' || e.mutation3 === 'accelererende') {
      e.speed = e.baseSpeedForAccel * (1 + (e.i / Math.max(1, path.length - 1)) * 3);
    }

    // Kameel boost
    if (e.type === 'kameel' && !e.kameelBoosted && e.hp <= e.max * 0.5) { e.kameelBoosted = true; e.kameelBoostTimer = 60; e.speed *= 4; e.baseSpeed *= 4; }
    if (e.kameelBoosted && e.kameelBoostTimer > 0) { e.kameelBoostTimer--; if (e.kameelBoostTimer <= 0) { e.kameelBoosted = false; e.speed /= 4; e.baseSpeed /= 4; } }

    // Move along path
    const effSpeed = (e.birdWindBoosted && !e.isBird) ? e.speed * 1.3 : e.speed;
    const p = path[e.i + 1];
    if (!p) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    if (d < effSpeed) e.i++; else { e.x += dx / d * effSpeed; e.y += dy / d * effSpeed; }
    if (e.boss && e.i >= path.length - 1) { lives = 0; loseGame(); }
  }

  // Tower logic
  for (const tw of towers) {
    if (tw.upText > 0) tw.upText--;

    if (tw.key === 'atoom') {
      tw.nukeTimer = (tw.nukeTimer || 0) + 1;
      if (tw.nukeTimer >= getAtoomNukeCooldown(tw)) { tw.nukeTimer = 0; triggerNukeStrike(tw); }
    }

    if (tw.monkey && tw.ultimate) {
      tw.monkeyTimer++;
      if (tw.monkeyTimer >= 1500) {
        tw.monkeyTimer = 0;
        for (const other of towers) { if (other !== tw && !other.boosted && Math.hypot(other.x - tw.x, other.y - tw.y) <= getTowerRange(tw)) { other.boosted = true; other.boostEndTime = 500; } }
        tw.boosted = true; tw.boostEndTime = 300;
        if (!antiLagMode) playSound('monkey', 0.7);
      }
    }
    if (tw.boosted && tw.boostEndTime > 0) { tw.boostEndTime--; if (tw.boostEndTime <= 0) tw.boosted = false; }
  }

  // Hatch bird eggs
  const eggsToHatch = birdEggs.filter(e => e.timer <= 0 && !e.destroyed);
  for (const egg of eggsToHatch) {
    const birdBase = animalTypes.find(a => a.type === 'vogel');
    const child = makeEnemy({ ...birdBase, hp: Math.floor(birdBase.hp * (1 + round * 0.14)), speed: 1.4 * (1 + round * 0.02), reward: 15 });
    child.isBird = true; child.isChildBird = true; child.windRadius = 80; child.eggLaid = false;
    let ci = 0, cd = 999999;
    for (let pi = 0; pi < path.length; pi++) { const d = Math.hypot(path[pi].x - egg.x, path[pi].y - egg.y); if (d < cd) { cd = d; ci = pi; } }
    child.i = Math.max(0, ci - 1); child.x = egg.x; child.y = egg.y;
    enemies.push(child);
  }

  // Projectile vs egg collision
  for (const p of projectiles) {
    for (const egg of birdEggs) {
      if (Math.hypot(p.x - egg.x, p.y - egg.y) < 15) { egg.destroyed = true; p.dead = true; }
    }
  }
  birdEggs = birdEggs.filter(e => e.timer > 0 && !e.destroyed);

  // Banana hits
  for (const banana of bananas) {
    banana.lifetime--;
    for (const e of enemies) {
      if (e.isBird) continue;
      if (Math.hypot(e.x - banana.x, e.y - banana.y) < e.size + 10) { e.hp -= banana.dmg; banana.dead = true; break; }
    }
  }
  bananas = bananas.filter(b => !b.dead && b.lifetime > 0);

  // Nuclear slowdown on towers
  for (const ne of nuclearExplosions) {
    ne.t--;
    if (ne.t <= 0) continue;
    for (const tw of towers) { if (Math.hypot(tw.x - ne.x, tw.y - ne.y) < ne.range) tw.nuclearSlowUntil = Math.max(tw.nuclearSlowUntil || 0, Date.now() + 2000); }
  }
  nuclearExplosions = nuclearExplosions.filter(n => n.t > 0);
  nukeStrikes = nukeStrikes.filter(ns => { ns.t--; ns.r = ns.maxR * (1 - ns.t / ns.maxT); return ns.t > 0; });
  critTexts   = critTexts.filter(ct => { ct.t--; ct.y -= 0.4; return ct.t > 0; });

  // Tower shooting
  for (const tw of towers) {
    if (tw.farm) continue;
    if (tw.nuclearSlowUntil && Date.now() < tw.nuclearSlowUntil) continue;
    const rateMultiplier = tw.boosted ? 0.7 : 1.0;
    tw.cool--;
    if (tw.cool > 0) continue;
    const effRange = getTowerRange(tw);

    // Monkey — scatter bananas on path
    if (tw.monkey) {
      let pathPoints = [];
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i], p2 = path[i + 1];
        for (let t3 = 0; t3 <= 1; t3 += 0.05) {
          const px = p1.x + (p2.x - p1.x) * t3, py = p1.y + (p2.y - p1.y) * t3;
          if (Math.hypot(px - tw.x, py - tw.y) < effRange) pathPoints.push({ x: px, y: py });
        }
      }
      if (pathPoints.length > 0) {
        const rp = pathPoints[Math.floor(Math.random() * pathPoints.length)];
        bananas.push({ x: rp.x + (Math.random() - 0.5) * 40, y: rp.y + (Math.random() - 0.5) * 40, dmg: tw.dmg * 3, lifetime: 1800, dead: false });
        tw.cool = tw.rate * rateMultiplier;
      }
      continue;
    }

    // Verslomende aura slow
    let verslomendeSlow = 1.0;
    for (const e of enemies) {
      if ((e.mutation === 'verslomende' || e.mutation2 === 'verslomende' || e.mutation3 === 'verslomende') && Math.hypot(e.x - tw.x, e.y - tw.y) < 120) { verslomendeSlow = 0.6; break; }
    }

    const target = enemies.find(e => {
      if (tw.key === 'tsjaadinator' && tw.secret) { return !((e.mutation === 'kogelvrije' || e.mutation2 === 'kogelvrije' || e.mutation3 === 'kogelvrije')); }
      if (Math.hypot(e.x - tw.x, e.y - tw.y) >= effRange) return false;
      if (e.isRoboLeeuw && (tw.key === 'geweer' || tw.key === 'sniper')) return false;
      if (e.isKrokodil  && (tw.key === 'geweer' || tw.key === 'sniper')) return false;
      if ((e.mutation === 'metalen' || e.mutation2 === 'metalen' || e.mutation3 === 'metalen') && tw.key !== 'atoom') return false;
      if ((e.mutation === 'kogelvrije' || e.mutation2 === 'kogelvrije' || e.mutation3 === 'kogelvrije') && (tw.key === 'geweer' || tw.key === 'sniper')) return false;
      if (e.mutation === 'onzichtbare' || e.mutation2 === 'onzichtbare' || e.mutation3 === 'onzichtbare') {
        let inRange = false;
        for (const otw of towers) { if (Math.hypot(e.x - otw.x, e.y - otw.y) < getTowerRange(otw)) { inRange = true; break; } }
        if (!inRange) return false;
      }
      return true;
    });
    if (!target) continue;

    let finalDmg = tw.dmg;
    if (tw.key === 'tsjaadinator' && tw.secret) { finalDmg *= 11.0; if (tw.secretDmgBonus) finalDmg *= tw.secretDmgBonus; }
    if (tw.key === 'plaagdokter' && target.plaagDebuffed)    finalDmg *= (tw.plaagDmgBonus || 1.05);
    if (tw.key === 'atoom' && target.burning && target.burnDuration > 0) finalDmg *= (tw.fireBonusMultiplier || 1.20);

    let isCrit = false;
    if (tw.key === 'sniper' && Math.random() < (0.10 + tw.level * 0.05)) { isCrit = true; finalDmg *= 2; }

    const cfg = towerTypes[tw.key];
    projectiles.push({
      x: tw.x, y: tw.y, tx: target.x, ty: target.y, target,
      speed: (tw.secret && tw.key === 'tsjaadinator') ? 20 : cfg.speed,
      dmg: finalDmg, bomb: cfg.bomb, gold: tw.ultimate, secret: tw.secret || false,
      towerKey: tw.key, tower: tw, fire: tw.fire,
      fireBurnDmg: tw.fire ? getFakkelBurnDmg(tw.level, tw.ultimate) : 0,
      poisonArrow: tw.key === 'boog' && tw.poisonArrows,
      sniperSlowOnHit: tw.key === 'sniper' && tw.sniperSlowOnHit,
      speerUltAura: tw.key === 'speer' && tw.ultimate, speerTower: tw.key === 'speer' ? tw : null,
      isCrit,
    });
    if (!antiLagMode && tw.key === 'sniper') playSound('sniper', 0.5);
    tw.cool = tw.rate * rateMultiplier * verslomendeSlow;
  }

  // Move projectiles & apply hits
  for (const p of projectiles) {
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d < p.speed) {
      if (p.target.beschermdActive) { p.dead = true; continue; }
      p.target.hp -= p.dmg;
      if (p.isCrit) critTexts.push({ x: p.target.x, y: p.target.y - p.target.size, t: 60 });
      if (gameMode === 'boss' && p.target.boss) { money += Math.floor(p.dmg); totalMoneyEarned += Math.floor(p.dmg); }

      if (p.towerKey === 'plaagdokter') {
        const tw2 = p.tower;
        if (p.target.slowEndTime <= 0 || tw2.ultimate) { p.target.speed = p.target.baseSpeed * (1 - tw2.slowAmount); p.target.slowEndTime = tw2.slowDuration; }
        p.target.plaagDebuffed = true;
      }
      if (p.poisonArrow) {
        p.target.poisoned = true; p.target.poisonTimer = 180; p.target.poisonDmgPerSec = 10;
        if (!p.target.poisonSlowApplied) { p.target.speed *= 0.90; p.target.baseSpeed *= 0.90; p.target.poisonSlowApplied = true; }
      }
      if (p.fire) {
        p.target.burning = true; p.target.burnDuration = 480; p.target.burnTickTimer = 0;
        p.target.burnDamagePerSec = Math.max(p.target.burnDamagePerSec || 0, p.fireBurnDmg);
      }
      if (p.sniperSlowOnHit && p.target.hp > 0 && !p.target.sniperSlowed) {
        p.target.sniperSlowedPrevSpeed = p.target.speed; p.target.sniperSlowedPrevBaseSpeed = p.target.baseSpeed;
        p.target.speed *= 0.5; p.target.baseSpeed *= 0.5; p.target.sniperSlowed = true; p.target.sniperSlowEndTime = 18;
      }
      if (p.speerUltAura && p.speerTower) {
        const boostUntil = Date.now() + 3000;
        for (const other of towers) { if (Math.hypot(other.x - p.speerTower.x, other.y - p.speerTower.y) <= getTowerRange(p.speerTower)) other.speerRangeBoostUntil = Math.max(other.speerRangeBoostUntil || 0, boostUntil); }
      }
      if (p.bomb) explosions.push({ x: p.target.x, y: p.target.y, r: 12, t: 22, gold: p.gold });
      if (p.secret && p.towerKey === 'tsjaadinator') {
        explosions.push({ x: p.target.x, y: p.target.y, r: 5, t: 20, gold: true, subtle: true });
        for (const e2 of enemies) { if (e2 !== p.target && Math.hypot(e2.x - p.target.x, e2.y - p.target.y) < 80) e2.hp -= p.dmg * 0.5; }
      }
      p.dead = true;
    } else { p.x += dx / d * p.speed; p.y += dy / d * p.speed; }
  }

  // Sniper slow timeout
  for (const e of enemies) {
    if (e.sniperSlowed && e.sniperSlowEndTime > 0) {
      e.sniperSlowEndTime--;
      if (e.sniperSlowEndTime <= 0) { e.speed = e.sniperSlowedPrevSpeed || e.baseSpeed; e.baseSpeed = e.sniperSlowedPrevBaseSpeed || e.baseSpeed; e.sniperSlowed = false; }
    }
  }

  for (const ex of explosions) { ex.r += 2.5; ex.t--; }
  explosions = explosions.filter(e => e.t > 0);

  // Process dead enemies
  const toSpawn = [];
  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      if (e.boss) { winGame(); return false; }
      if ((e.mutation === 'radioactieve' || e.mutation2 === 'radioactieve' || e.mutation3 === 'radioactieve') || e.isRoboLeeuw) triggerEnemyNuclearExplosion(e, false);
      if (e.mutation === 'ondode' || e.mutation2 === 'ondode' || e.mutation3 === 'ondode') toSpawn.push(makeGhostEnemy(e));
      if ((e.mutation === 'hydra' || e.mutation2 === 'hydra') && !e.isHydraChild) {
        const copies = e.mutation2 === 'hydra' ? 3 : 4;
        const baseData = animalTypes.find(a => a.type === e.type) || animalTypes[0];
        for (let h = 0; h < copies; h++) {
          const child = makeEnemy({ ...baseData, hp: Math.floor(baseData.hp * (1 + round * 0.14) * 0.7), speed: baseData.speed * (1 + round * 0.02), reward: 0 });
          child.i = Math.max(0, e.i - 1); child.x = path[Math.max(0, e.i - 1)].x + (Math.random() - 0.5) * 60; child.y = path[Math.max(0, e.i - 1)].y + (Math.random() - 0.5) * 60; child.isHydraChild = true;
          toSpawn.push(child);
        }
      }
      if ((e.mutation === 'random' || e.mutation2 === 'random' || e.mutation3 === 'random')) {
        const b = animalTypes[Math.floor(Math.random() * animalTypes.length)];
        const ne = makeEnemy({ ...b, hp: Math.floor(b.hp * (1 + round * 0.14)), speed: b.speed * (1 + round * 0.02), reward: 0 });
        ne.i = Math.max(0, e.i - 1); ne.x = path[Math.max(0, e.i - 1)].x; ne.y = path[Math.max(0, e.i - 1)].y;
        toSpawn.push(ne);
      }
      if ((e.mutation === 'terugkerende' || e.mutation2 === 'terugkerende') && e.terugkerendeCount > 0) { e.terugkerendeCount--; e.i = 0; e.x = path[0].x; e.y = path[0].y; e.hp = e.max; return true; }
      if (e.type === 'kameel' && !e.kameelLionsSpawned) {
        e.kameelLionsSpawned = true;
        const leeuwBase = animalTypes.find(a => a.type === 'leeuw');
        for (let l = 0; l < 4; l++) {
          const lion = makeEnemy({ ...leeuwBase, hp: Math.floor(6 * (1 + round * 0.14)), speed: 1.25 * (1 + round * 0.02), reward: 8 });
          lion.i = Math.max(0, e.i - 1); lion.x = path[Math.max(0, e.i - 1)].x + (Math.random() - 0.5) * 50; lion.y = path[Math.max(0, e.i - 1)].y + (Math.random() - 0.5) * 50;
          toSpawn.push(lion);
        }
      }
      if (e.isBird && !e.isChildBird && !e.eggLaid) { e.eggLaid = true; birdEggs.push({ x: e.x, y: e.y, timer: 180, destroyed: false, pathI: e.i }); }
      if (!(e.mutation === 'arme' || e.mutation2 === 'arme' || e.mutation3 === 'arme')) { money += e.reward; totalMoneyEarned += e.reward; }
      if (!e.boss && !antiLagMode) playSound('kill', 0.4);
      return false;
    }
    if (e.i >= path.length - 1) {
      if (e.mutation === 'dodelijke' || e.mutation2 === 'dodelijke' || e.mutation3 === 'dodelijke') lives -= 5; else lives--;
      if ((e.mutation === 'terugkerende' || e.mutation2 === 'terugkerende') && e.terugkerendeCount > 0) { e.terugkerendeCount--; e.i = 0; e.x = path[0].x; e.y = path[0].y; lives--; if (lives <= 0) { loseGame(); return false; } return true; }
      if (lives <= 0) { loseGame(); return false; }
      return false;
    }
    return true;
  });

  for (const e of toSpawn) enemies.push(e);
  for (const vf of visualEffects) { vf.t--; vf.r = vf.maxR * (1 - vf.t / vf.maxT); }
  visualEffects = visualEffects.filter(v => v.t > 0);
  projectiles   = projectiles.filter(p => !p.dead);

  document.getElementById('money').textContent = money;
  document.getElementById('lives').textContent = lives;
}

// ===== DRAW HELPERS =====
function drawOlifant(e, bc)   { ctx.fillStyle=bc||'#8b8b8b'; ctx.beginPath(); ctx.ellipse(0,0,16,12,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(14,-2,8,7,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=bc||'#8b8b8b'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(20,-2); ctx.quadraticCurveTo(26,4,24,10); ctx.stroke(); ctx.fillStyle=e.infected?'#3a4a1a':'#7a7a7a'; ctx.beginPath(); ctx.ellipse(12,-8,5,6,0,0,Math.PI*2); ctx.fill(); ctx.fillRect(-12,8,4,6); ctx.fillRect(-4,8,4,6); ctx.fillRect(4,8,4,6); ctx.fillRect(12,8,4,6); }
function drawNeushoorn(e, bc) { ctx.fillStyle=bc||'#6b6b6b'; ctx.fillRect(-14,-10,28,18); ctx.fillRect(10,-8,10,14); ctx.fillStyle='#d4d4d4'; ctx.beginPath(); ctx.moveTo(20,-4); ctx.lineTo(28,-6); ctx.lineTo(20,-2); ctx.fill(); ctx.fillStyle=e.infected?'#3a4a1a':'#5a5a5a'; ctx.fillRect(-12,8,5,8); ctx.fillRect(-2,8,5,8); ctx.fillRect(8,8,5,8); }
function drawGiraffe(e, bc)   { ctx.fillStyle=e.infected?'#6b6b00':'#daa520'; ctx.fillRect(-12,-8,20,14); ctx.fillRect(6,-20,5,12); ctx.beginPath(); ctx.ellipse(8.5,-22,4,3,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=e.infected?'#4a5a00':'#8b4513'; ctx.fillRect(-8,-4,3,3); ctx.fillRect(-2,-6,3,3); ctx.fillRect(2,0,3,3); ctx.fillStyle=e.infected?'#5a5a00':'#b8860b'; ctx.fillRect(-10,6,3,10); ctx.fillRect(-2,6,3,10); ctx.fillRect(4,6,3,10); }
function drawLeeuw(e, bc)     { ctx.fillStyle='#cd853f'; ctx.fillRect(-12,-8,22,14); ctx.fillStyle='#8b6914'; ctx.beginPath(); ctx.arc(12,-2,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#cd853f'; ctx.beginPath(); ctx.arc(12,-2,5,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#cd853f'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-20,2); ctx.stroke(); ctx.fillStyle='#cd853f'; ctx.fillRect(-8,6,3,8); ctx.fillRect(0,6,3,8); ctx.fillRect(8,6,3,8); }
function drawCheetah(e, bc)   { ctx.fillStyle=e.infected?'#6b6b00':'#daa520'; ctx.fillRect(-10,-6,20,11); ctx.beginPath(); ctx.arc(12,-1,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#000'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(14,-4); ctx.lineTo(14,2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(10,-4); ctx.lineTo(10,2); ctx.stroke(); ctx.fillStyle=e.infected?'#4a5a00':'#8b4513'; ctx.fillRect(-6,-3,2,2); ctx.fillRect(-2,-5,2,2); ctx.fillRect(2,-2,2,2); ctx.fillRect(6,-4,2,2); ctx.strokeStyle=e.infected?'#6b6b00':'#daa520'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-18,4); ctx.stroke(); ctx.fillRect(-7,5,2,9); ctx.fillRect(-1,5,2,9); ctx.fillRect(7,5,2,9); }
function drawNijlpaard(e, bc) { ctx.fillStyle=e.infected?'#3a4a2a':'#5a5a5a'; ctx.beginPath(); ctx.ellipse(0,0,18,14,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=e.infected?'#2a3a1a':'#4a4a4a'; ctx.fillRect(12,-10,14,16); ctx.fillStyle=e.infected?'#3a4a2a':'#5a5a5a'; ctx.beginPath(); ctx.ellipse(14,-9,3,2,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(24,-9,3,2,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#2a2a2a'; ctx.beginPath(); ctx.arc(16,-6,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(22,-6,2,0,Math.PI*2); ctx.fill(); ctx.fillStyle=e.infected?'#6b0000':'#ff69b4'; ctx.fillRect(14,2,12,4); ctx.fillStyle='#fff'; ctx.fillRect(16,2,2,3); ctx.fillRect(20,2,2,3); ctx.fillRect(24,2,2,3); ctx.fillStyle=e.infected?'#2a3a1a':'#4a4a4a'; ctx.fillRect(-14,8,6,10); ctx.fillRect(-4,8,6,10); ctx.fillRect(6,8,6,10); ctx.fillRect(16,8,6,10); }
function drawKameel(e, bc)    { const r2=e.kameelBoosted; ctx.fillStyle=r2?'#ff4400':(bc||'#c8860a'); ctx.beginPath(); ctx.ellipse(0,2,16,10,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(-5,-8,7,6,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(5,-6,6,5,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=r2?'#ff6600':(bc||'#d4961a'); ctx.beginPath(); ctx.arc(18,-2,7,0,Math.PI*2); ctx.fill(); ctx.fillRect(10,-4,10,4); ctx.fillStyle=r2?'#ff4400':'#c8860a'; ctx.beginPath(); ctx.arc(16,-8,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(22,-8,3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(20,-2,2,0,Math.PI*2); ctx.fill(); ctx.fillStyle=r2?'#ff6600':'#a06a00'; ctx.fillRect(22,0,5,4); ctx.fillStyle=r2?'#ff4400':(bc||'#c8860a'); ctx.fillRect(-12,10,4,12); ctx.fillRect(-4,10,4,12); ctx.fillRect(4,10,4,12); ctx.fillRect(12,10,4,12); ctx.strokeStyle=r2?'#ff4400':'#a06a00'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-16,2); ctx.lineTo(-22,8); ctx.stroke(); }
function drawMug(e)            { ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.ellipse(0,0,12,5,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(200,200,255,0.3)'; ctx.beginPath(); ctx.ellipse(-8,-4,10,6,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(8,-4,10,6,0.3,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1.5; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*6,4); ctx.lineTo(i*8,12); ctx.stroke(); } ctx.strokeStyle='#3a3a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(20,0); ctx.stroke(); }
function drawMutatedMug(e)     { ctx.save(); const ps=1+Math.sin(Date.now()*0.005)*0.1; ctx.scale(ps,ps); ctx.shadowBlur=25; ctx.shadowColor='#ff0080'; ctx.fillStyle='#0a0a0a'; ctx.beginPath(); ctx.ellipse(0,0,15,7,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(0,255,0,0.3)'; ctx.beginPath(); ctx.ellipse(-5,0,4,2,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(5,0,4,2,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(138,43,226,0.4)'; ctx.shadowColor='#8a2be2'; ctx.shadowBlur=20; ctx.beginPath(); ctx.ellipse(-12,-6,14,8,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(12,-6,14,8,0.3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle='#2a0a0a'; ctx.lineWidth=2.5; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*6,5); ctx.lineTo(i*8,15); ctx.stroke(); } ctx.strokeStyle='#c70039'; ctx.lineWidth=3; ctx.shadowBlur=15; ctx.shadowColor='#ff0080'; ctx.beginPath(); ctx.moveTo(15,0); ctx.lineTo(28,-2); ctx.stroke(); ctx.fillStyle='#ff0080'; ctx.beginPath(); ctx.moveTo(28,-2); ctx.lineTo(32,-3); ctx.lineTo(30,0); ctx.fill(); ctx.shadowBlur=0; ctx.restore(); }
function drawZwangereMug(e)    { ctx.save(); const t2=Date.now()*0.003; const pulse=1+Math.sin(t2*1.5)*0.06; ctx.shadowBlur=30; ctx.shadowColor='rgba(0,200,80,0.6)'; ctx.fillStyle='#1a0a2e'; ctx.beginPath(); ctx.ellipse(0,2,22*pulse,13,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#2a1040'; ctx.beginPath(); ctx.ellipse(2,10,16*pulse,12*pulse,0.2,0,Math.PI*2); ctx.fill(); const bg=ctx.createRadialGradient(2,10,2,2,10,13); bg.addColorStop(0,'rgba(0,255,120,0.35)'); bg.addColorStop(0.6,'rgba(0,180,80,0.15)'); bg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=bg; ctx.beginPath(); ctx.ellipse(2,10,14,11,0.2,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=0.25+Math.sin(t2*2)*0.1; ctx.fillStyle='#00ff88'; for(let b=0;b<3;b++){ const bx=-6+b*6+Math.sin(t2+b*2)*2; const by=10+Math.cos(t2*1.3+b)*2; ctx.beginPath(); ctx.ellipse(bx,by,3,2,0,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1; ctx.fillStyle='rgba(140,0,200,0.45)'; ctx.beginPath(); ctx.ellipse(-16,-7,16,9,-0.35,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(16,-7,16,9,0.35,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=12; ctx.shadowColor='#ff0040'; ctx.fillStyle='#ff0040'; ctx.beginPath(); ctx.arc(-7,-1,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(7,-1,3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffcccc'; ctx.beginPath(); ctx.arc(-6,-2,1.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8,-2,1.2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle='#880000'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(30,2); ctx.stroke(); ctx.strokeStyle='#330033'; ctx.lineWidth=1.5; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*5,12); ctx.lineTo(i*7,22); ctx.stroke(); } ctx.strokeStyle='rgba(0,255,100,0.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(2,10,16*pulse,12*pulse,0.2,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.restore(); }

function drawMetalenEnemy(e) {
  const sg=ctx.createRadialGradient(-5,-5,2,0,0,e.size*1.5); sg.addColorStop(0,'#fff'); sg.addColorStop(0.3,'#c0c0c0'); sg.addColorStop(0.7,'#808080'); sg.addColorStop(1,'#404040');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.ellipse(0,0,e.size,e.size*0.7,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#a0a0a0'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,e.size*0.7,e.size*0.5,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#606060';
  for(const pos of [{x:e.size*0.6,y:0},{x:-e.size*0.6,y:0},{x:0,y:e.size*0.5},{x:0,y:-e.size*0.5}]){ ctx.beginPath(); ctx.arc(pos.x,pos.y,3,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#c0c0c0'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pos.x-2,pos.y); ctx.lineTo(pos.x+2,pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x,pos.y-2); ctx.lineTo(pos.x,pos.y+2); ctx.stroke(); }
  ctx.fillStyle='#333'; ctx.font='bold 9px Arial'; ctx.textAlign='center'; ctx.fillText(e.type.toUpperCase().slice(0,3),0,3);
}

function drawRoboLeeuw(e) {
  const t_r=Date.now()*0.005;
  const mg=ctx.createRadialGradient(-4,-4,1,0,0,16); mg.addColorStop(0,'#e0e0e0'); mg.addColorStop(0.4,'#8a8a9a'); mg.addColorStop(0.7,'#555566'); mg.addColorStop(1,'#222233');
  ctx.fillStyle=mg; ctx.fillRect(-12,-8,22,14);
  ctx.fillStyle='#9090aa'; ctx.beginPath(); ctx.arc(12,-2,8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#c0c0d0'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(12,-2,8,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='#aaaacc'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(12,-2,6,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle=`rgba(255,50,50,${0.7+Math.sin(t_r*3)*0.3})`; ctx.shadowBlur=5; ctx.shadowColor='#ff0000';
  ctx.beginPath(); ctx.arc(10,-4,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(14,-4,2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  ctx.strokeStyle='#8a8a9a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-20,2); ctx.stroke();
  ctx.fillStyle='#7a7a8a'; ctx.fillRect(-10,6,4,8); ctx.fillRect(-2,6,4,8); ctx.fillRect(6,6,4,8);
  ctx.save(); ctx.globalAlpha=0.6; drawRadiationSymbol(0,0,8); ctx.restore();
  ctx.strokeStyle=`rgba(0,255,100,${0.3+Math.sin(t_r*2)*0.15})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,e.size+5,0,Math.PI*2); ctx.stroke();
}

function drawVogel(e) {
  const t_v=Date.now()*0.006; const wf=Math.sin(t_v*4)*0.4; const radius=e.windRadius||80;
  ctx.save(); ctx.globalAlpha=0.12; ctx.strokeStyle='rgba(180,220,255,0.5)'; ctx.lineWidth=2; ctx.setLineDash([8,4]);
  for(let wi=0;wi<3;wi++){ ctx.beginPath(); ctx.arc(0,0,radius*(0.4+wi*0.3)+Math.sin(t_v*3+wi*1.0)*5,0,Math.PI*2); ctx.stroke(); } ctx.setLineDash([]); ctx.restore();
  ctx.save(); ctx.globalAlpha=0.15; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(0,8,12,4,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.fillStyle='#4a7ab8'; ctx.beginPath(); ctx.ellipse(0,0,9,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3a6aa8'; ctx.beginPath(); ctx.arc(8,-2,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffa500'; ctx.beginPath(); ctx.moveTo(12,-2); ctx.lineTo(16,-1); ctx.lineTo(12,0); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(9,-3,1.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(9.5,-3.5,0.6,0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.rotate(wf); ctx.fillStyle='#5a8ac8'; ctx.beginPath(); ctx.moveTo(-2,0); ctx.lineTo(-14,-12); ctx.lineTo(-8,-2); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.rotate(-wf); ctx.fillStyle='#5a8ac8'; ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(12,-12); ctx.lineTo(7,-2); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle='#3a5a88'; ctx.beginPath(); ctx.moveTo(-9,1); ctx.lineTo(-16,4); ctx.lineTo(-16,7); ctx.lineTo(-9,3); ctx.closePath(); ctx.fill();
}

function drawKrokodil(e, bc) {
  const bodyCol=e.infected?'#2a4a1a':'#2d6a2d', scaleCol=e.infected?'#1a3a0a':'#1e4d1e', bellyCol=e.infected?'#4a6a2a':'#7aaa4a';
  ctx.fillStyle=bodyCol; ctx.beginPath(); ctx.ellipse(0,2,20,10,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=scaleCol; for(let si=-3;si<=3;si++){ const sx=si*5; ctx.beginPath(); ctx.moveTo(sx-3,-6); ctx.lineTo(sx,-13); ctx.lineTo(sx+3,-6); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle=bellyCol; ctx.beginPath(); ctx.ellipse(0,6,16,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=bodyCol; ctx.beginPath(); ctx.moveTo(14,-4); ctx.lineTo(26,-2); ctx.lineTo(28,2); ctx.lineTo(26,4); ctx.lineTo(14,6); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f0f0e0'; ctx.fillRect(20,-2,2,3); ctx.fillRect(24,-1,2,3); ctx.fillRect(18,3,2,2); ctx.fillRect(22,3,2,2);
  ctx.fillStyle='#d4aa00'; ctx.beginPath(); ctx.ellipse(16,-3,3,2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.ellipse(16,-3,1,2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=scaleCol; ctx.fillRect(-16,8,5,8); ctx.fillRect(-6,9,5,7); ctx.fillRect(4,9,5,7); ctx.fillRect(14,8,5,8);
  ctx.strokeStyle=bodyCol; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-20,2); ctx.quadraticCurveTo(-28,0,-30,6); ctx.stroke();
  ctx.fillStyle='rgba(255,215,0,0.9)'; ctx.font='bold 9px Arial'; ctx.textAlign='center'; ctx.fillText('🛡️',0,-20);
}

function drawRadiationSymbol(x,y,r){ ctx.save(); ctx.translate(x,y); ctx.globalAlpha=0.25; ctx.fillStyle='#00ff44'; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#0a1a0a'; ctx.beginPath(); ctx.arc(0,0,r*0.33,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#00ff44'; for(let i=0;i<3;i++){ ctx.save(); ctx.rotate(i*Math.PI*2/3); ctx.beginPath(); ctx.arc(0,0,r,Math.PI*0.1,Math.PI*0.56); ctx.lineTo(0,0); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.globalAlpha=1; ctx.restore(); }

function drawMutationEffects(e) {
  if (!e.mutation && !e.isMiniBoss) return;
  if (e.isMiniBoss) { const t_mb=Date.now()*0.004; ctx.strokeStyle=`rgba(255,215,0,${0.6+Math.sin(t_mb)*0.3})`; ctx.lineWidth=5; ctx.shadowBlur=20; ctx.shadowColor='#ffd700'; ctx.beginPath(); ctx.arc(0,0,e.size+10+Math.sin(t_mb)*3,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; }
  if (!e.mutation) return;
  const muts=[e.mutation,e.mutation2].filter(Boolean);
  for(const m of muts){ if(m==='beschermde'&&e.beschermdActive){ ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=4; ctx.shadowBlur=15; ctx.shadowColor='#fff'; ctx.beginPath(); ctx.arc(0,0,e.size+6,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(0,0,e.size+6,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; } }
  if(e.slowEndTime>0){ ctx.strokeStyle='#9333ea'; ctx.lineWidth=2; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.arc(0,0,e.size+3,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }
  if(e.sniperSlowed&&e.sniperSlowEndTime>0){ ctx.strokeStyle='rgba(150,220,255,0.9)'; ctx.lineWidth=3; ctx.shadowBlur=8; ctx.shadowColor='#88ccff'; ctx.beginPath(); ctx.arc(0,0,e.size+7,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.fillStyle='rgba(150,220,255,0.12)'; ctx.beginPath(); ctx.arc(0,0,e.size+7,0,Math.PI*2); ctx.fill(); }
  if(e.poisoned&&e.poisonTimer>0){ const tp=Date.now()*0.005; ctx.strokeStyle=`rgba(50,220,50,${0.5+Math.sin(tp*3)*0.2})`; ctx.lineWidth=2.5; ctx.shadowBlur=8; ctx.shadowColor='#00ff44'; ctx.beginPath(); ctx.arc(0,0,e.size+5+Math.sin(tp*4)*2,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; }
  if(e.burning&&e.burnDuration>0){ const tf=Date.now()*0.008; const fi=Math.min(1,e.burnDuration/180); for(let f=0;f<5;f++){ const ang=(f/5)*Math.PI*2+tf*(f%2===0?1:-0.7); const r2=e.size*0.6+Math.sin(tf*3+f*1.3)*e.size*0.3; const fh=e.size*0.8+Math.sin(tf*4+f*0.9)*e.size*0.5; const fx2=Math.cos(ang)*r2; const fy2=Math.sin(ang)*r2-e.size*0.3; ctx.save(); ctx.globalAlpha=fi*(0.6+Math.sin(tf*5+f)*0.3); const fg=ctx.createRadialGradient(fx2,fy2,0,fx2,fy2,fh); fg.addColorStop(0,'rgba(255,220,50,1)'); fg.addColorStop(0.3,'rgba(255,100,0,0.9)'); fg.addColorStop(0.7,'rgba(200,20,0,0.5)'); fg.addColorStop(1,'rgba(100,0,0,0)'); ctx.fillStyle=fg; ctx.beginPath(); ctx.moveTo(fx2,fy2+fh*0.3); ctx.quadraticCurveTo(fx2-fh*0.2,fy2-fh*0.2,fx2,fy2-fh); ctx.quadraticCurveTo(fx2+fh*0.2,fy2-fh*0.3,fx2+fh*0.15,fy2+fh*0.2); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  if(e.isGhost){ ctx.strokeStyle='rgba(180,200,255,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,e.size+4,0,Math.PI*2); ctx.stroke(); }
  for(const m of muts){
    if(m==='radioactieve'){ const t2=Date.now()*0.005; ctx.strokeStyle='rgba(0,255,0,0.4)'; ctx.lineWidth=2; ctx.globalAlpha=0.5+Math.sin(t2)*0.3; ctx.beginPath(); ctx.arc(0,0,e.size+5+Math.sin(t2)*2,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }
    if(m==='metalen'){ ctx.strokeStyle='#c0c0c0'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,e.size+4,0,Math.PI*2); ctx.stroke(); }
    if(m==='elite'){ ctx.strokeStyle='rgba(255,50,50,0.8)'; ctx.lineWidth=3; ctx.shadowBlur=10; ctx.shadowColor='#ff0000'; ctx.beginPath(); ctx.arc(0,0,e.size+6,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; }
    if(m==='genezende'){ const t3=Date.now()*0.003; ctx.fillStyle='rgba(0,255,100,0.7)'; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.arc(Math.cos(t3)*e.size*1.3,-Math.sin(t3)*e.size*1.3,3,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
    if(m==='accelererende'){ ctx.strokeStyle='rgba(255,200,0,0.6)'; ctx.lineWidth=1.5; ctx.globalAlpha=0.7; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-e.size-5-i*4,-(i-1)*4); ctx.lineTo(-e.size-15-i*4,-(i-1)*4); ctx.stroke(); } ctx.globalAlpha=1; }
    if(m==='verslomende'){ ctx.strokeStyle='rgba(100,100,255,0.4)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.globalAlpha=0.3; ctx.beginPath(); ctx.arc(0,0,120,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1; }
    if(m==='kogelvrije'){ ctx.strokeStyle='rgba(200,150,50,0.6)'; ctx.lineWidth=3; ctx.setLineDash([4,2]); ctx.beginPath(); ctx.arc(0,0,e.size+2,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
    if(m==='onstabiele'){ const to=Date.now()*0.01; const pf=Math.sin(to*5)*0.4+0.6; ctx.strokeStyle=`rgba(255,${100+pf*100},0,0.9)`; ctx.lineWidth=4; ctx.shadowBlur=15; ctx.shadowColor='#ff4400'; ctx.beginPath(); ctx.arc(0,0,e.size+8,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.fillStyle=`rgba(255,80,0,${0.08*pf})`; ctx.beginPath(); ctx.arc(0,0,e.size+8,0,Math.PI*2); ctx.fill(); }
  }
  if(e.mutation==='terugkerende'&&e.terugkerendeCount>0){ ctx.fillStyle='rgba(255,200,0,0.9)'; ctx.font='bold 10px Arial'; ctx.textAlign='center'; ctx.fillText('↩'+e.terugkerendeCount,0,-e.size-12); }
  if(e.mutation2){ ctx.strokeStyle='rgba(255,215,0,0.7)'; ctx.lineWidth=2; ctx.setLineDash([3,2]); ctx.beginPath(); ctx.arc(0,0,e.size+10,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
}

function drawEnemyHUD(e) {
  const bw=e.isMiniBoss?60:40, half=bw/2;
  ctx.fillStyle='red'; ctx.fillRect(-half,-24,bw,5);
  ctx.fillStyle=e.isMiniBoss?'#ffd700':'lime'; ctx.fillRect(-half,-24,bw*(e.hp/e.max),5);
  if(e.isMiniBoss){ ctx.strokeStyle='#ffd700'; ctx.lineWidth=1.5; ctx.strokeRect(-half,-24,bw,5); }
  ctx.fillStyle='white'; ctx.font=e.isMiniBoss?'bold 10px Arial':'9px Arial'; ctx.textAlign='center'; ctx.fillText(e.name,0,-28);
  if(e.mutation){ const mc={ondode:'#aaaaff',snelle:'#ffff00',hydra:'#ff6600',random:'#ff00ff',dodelijke:'#ff0000',radioactieve:'#00ff00',metalen:'#c0c0c0',kogelvrije:'#ffa500',beschermde:'#ffffff',terugkerende:'#ffcc00',arme:'#888888',verslomende:'#4444ff',accelererende:'#ffaa00',genezende:'#00ff88',elite:'#ff4444',onstabiele:'#ff6600'}; let ml='['+e.mutation.toUpperCase()+']'; if(e.mutation2) ml='['+e.mutation.toUpperCase()+'+'+e.mutation2.toUpperCase()+']'; ctx.fillStyle=mc[e.mutation]||'#ffff00'; ctx.font='bold 8px Arial'; ctx.fillText(ml,0,-38); }
  if(e.burning&&e.burnDuration>0){ ctx.fillStyle='rgba(255,120,0,0.9)'; ctx.font='bold 8px Arial'; ctx.fillText('🔥'+(e.burnDamagePerSec||0).toFixed(1)+'/s',0,-48); }
  if(e.poisoned&&e.poisonTimer>0){ ctx.fillStyle='rgba(0,255,80,0.95)'; ctx.font='bold 8px Arial'; ctx.fillText('☠️10/s',e.burning?22:0,-48); }
  if(e.sniperSlowed&&e.sniperSlowEndTime>0){ ctx.fillStyle='rgba(150,220,255,0.95)'; ctx.font='bold 8px Arial'; ctx.fillText('❄️-50%',0,-56); }
  const ho=e.mutation==='onstabiele'||e.mutation2==='onstabiele';
  if(ho&&!e.onstabielExploded&&e.onstabielTimer>0){ const sl=Math.ceil(e.onstabielTimer/60); ctx.fillStyle=sl<=2?'#ff0000':'#ff8800'; ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.fillText('💥'+sl+'s',0,-64); }
  if(e.plaagDebuffed){ ctx.fillStyle='rgba(233,30,99,0.8)'; ctx.font='7px Arial'; ctx.fillText('💉',bw/2+4,-24); }
  if(e.isKrokodil){ ctx.fillStyle='rgba(255,215,0,0.9)'; ctx.font='bold 7px Arial'; ctx.textAlign='center'; ctx.fillText('🔫❌🎯❌',-bw/2+bw*0.5,-37); }
}

function drawEnemy(e) {
  if(e.mutation==='onzichtbare'||e.mutation2==='onzichtbare'||e.mutation3==='onzichtbare'){ let ir=false; for(const tw of towers){ if(Math.hypot(e.x-tw.x,e.y-tw.y)<getTowerRange(tw)){ir=true;break;} } if(!ir) return; }
  ctx.save(); ctx.translate(e.x,e.y);
  if(e.isGhost) ctx.globalAlpha=0.6;
  const bc=e.infected?'#4a5a2a':null;
  if(e.mutation==='metalen'||e.mutation2==='metalen'||e.mutation3==='metalen'){ drawMetalenEnemy(e); drawEnemyHUD(e); ctx.restore(); return; }
  if(e.isRoboLeeuw)      drawRoboLeeuw(e);
  else if(e.isBird)       drawVogel(e);
  else if(e.type==='krokodil') drawKrokodil(e,bc);
  else if(e.type==='olifant')  drawOlifant(e,bc);
  else if(e.type==='neushoorn')drawNeushoorn(e,bc);
  else if(e.type==='giraffe')  drawGiraffe(e,bc);
  else if(e.type==='leeuw')    drawLeeuw(e,bc);
  else if(e.type==='cheetah')  drawCheetah(e,bc);
  else if(e.type==='nijlpaard')drawNijlpaard(e,bc);
  else if(e.type==='kameel')   drawKameel(e,bc);
  else if(e.type==='mug')      drawMug(e);
  else if(e.type==='mutatedmug') drawMutatedMug(e);
  else if(e.type==='zwangeremug') drawZwangereMug(e);
  ctx.globalAlpha=1;
  drawMutationEffects(e);
  drawEnemyHUD(e);
  ctx.restore();
}

// ===== TOWER DRAW HELPERS =====
function drawAapTower(tw){ const u=tw.ultimate; const mc=u?'#ffd700':'#8b4513'; const fc=u?'#ffed4e':'#d2691e'; const ec=u?'#ff4500':'#000'; ctx.fillStyle=mc; ctx.beginPath(); ctx.ellipse(0,2,10,12,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0,-6,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle=fc; ctx.beginPath(); ctx.ellipse(0,-5,5,6,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=ec; ctx.beginPath(); ctx.arc(-3,-7,u?2:1.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3,-7,u?2:1.5,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=ec; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,-3,2,0,Math.PI); ctx.stroke(); ctx.fillStyle=mc; ctx.beginPath(); ctx.arc(-7,-6,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(7,-6,3,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=mc; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-12,6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(12,6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4,12); ctx.lineTo(-6,18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(4,12); ctx.lineTo(6,18); ctx.stroke(); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(8,8); ctx.quadraticCurveTo(15,5,12,-2); ctx.stroke(); }
function drawFakkelTower(tw){ ctx.fillStyle=tw.ultimate?'#ff6b35':'#8b4513'; ctx.fillRect(-8,-10,16,20); ctx.fillStyle='#d2b48c'; ctx.beginPath(); ctx.arc(0,-12,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle=tw.ultimate?'#ff4500':'#8b7355'; ctx.fillRect(8,-8,3,12); ctx.fillStyle=tw.ultimate?'#ff0000':'#ff8800'; ctx.beginPath(); ctx.moveTo(9.5,-10); ctx.lineTo(7,-16); ctx.lineTo(9.5,-14); ctx.lineTo(12,-16); ctx.closePath(); ctx.fill(); if(tw.level>=2){ ctx.fillStyle='#ffeb3b'; ctx.beginPath(); ctx.arc(9.5,-13,2,0,Math.PI*2); ctx.fill(); } if(tw.level>=3){ ctx.fillStyle='#ff4500'; ctx.beginPath(); ctx.moveTo(9.5,-16); ctx.lineTo(6,-22); ctx.lineTo(9.5,-19); ctx.lineTo(13,-22); ctx.closePath(); ctx.fill(); } if(tw.ultimate){ ctx.strokeStyle='#ff0000'; ctx.lineWidth=2; ctx.globalAlpha=0.7; ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; ctx.fillStyle='rgba(255,50,0,0.8)'; ctx.beginPath(); ctx.moveTo(9.5,-20); ctx.lineTo(5,-30); ctx.lineTo(9.5,-26); ctx.lineTo(14,-30); ctx.closePath(); ctx.fill(); } }
function drawSpeerTower(tw){ if(tw.ultimate&&tw.speerRangeBoostUntil&&Date.now()<tw.speerRangeBoostUntil){ ctx.fillStyle='rgba(180,150,255,0.25)'; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill(); } ctx.fillStyle=tw.ultimate?'#9b59b6':'#3f8f4a'; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=tw.ultimate?'#8e44ad':'#e0e0e0'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(12,0); ctx.stroke(); ctx.fillStyle=tw.ultimate?'#dcd6f7':'#ccc'; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(6,-4); ctx.lineTo(6,4); ctx.fill(); if(tw.level>=2){ ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,-6); ctx.lineTo(8,-6); ctx.stroke(); ctx.fillStyle='#ccc'; ctx.beginPath(); ctx.moveTo(8,-6); ctx.lineTo(4,-9); ctx.lineTo(4,-3); ctx.fill(); } if(tw.level>=3){ ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,6); ctx.lineTo(8,6); ctx.stroke(); ctx.fillStyle='#ccc'; ctx.beginPath(); ctx.moveTo(8,6); ctx.lineTo(4,3); ctx.lineTo(4,9); ctx.fill(); } if(tw.ultimate){ ctx.strokeStyle='rgba(180,150,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.stroke(); } }
function drawBoogTower(tw){ ctx.strokeStyle=tw.ultimate?'#00ff44':'#c68642'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,10,-Math.PI/2,Math.PI/2); if(tw.ultimate){ctx.shadowBlur=10;ctx.shadowColor='#00ff44';} ctx.stroke(); ctx.shadowBlur=0; ctx.strokeStyle=tw.ultimate?'#aaffcc':'#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(0,10); ctx.stroke(); ctx.fillStyle=tw.ultimate?'#006622':'#8b5a2b'; ctx.fillRect(-3,-3,6,6); if(tw.level>=2){ ctx.strokeStyle='#c68642'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(-6,0,8,-Math.PI/2,Math.PI/2); ctx.stroke(); } if(tw.level>=3){ ctx.strokeStyle='#c68642'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(6,0,8,-Math.PI/2,Math.PI/2); ctx.stroke(); } }
function drawPlaagdokterTower(tw){ ctx.fillStyle=tw.ultimate?'#ffd700':'#e91e63'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(-2,-7,4,14); ctx.fillRect(-7,-2,14,4); if(tw.level>=2){ ctx.strokeStyle=tw.ultimate?'#ffd700':'#c2185b'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(8,-8); ctx.lineTo(11,-11); ctx.stroke(); ctx.fillStyle=tw.ultimate?'#ffd700':'#fff'; ctx.fillRect(10,-12,2,2); } if(tw.level>=3){ ctx.strokeStyle=tw.ultimate?'#ffd700':'#c2185b'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(-11,-11); ctx.stroke(); ctx.fillStyle=tw.ultimate?'#ffd700':'#fff'; ctx.fillRect(-12,-12,2,2); ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(11,11); ctx.stroke(); ctx.fillRect(10,10,2,2); } if(tw.ultimate){ ctx.strokeStyle='#ffed4e'; ctx.lineWidth=3; ctx.globalAlpha=0.6; ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; } }
function drawGeweerTower(tw){ ctx.fillStyle=tw.ultimate?'#2c3e50':'#444'; ctx.fillRect(-8,-6,16,12); ctx.fillStyle=tw.ultimate?'#2980b9':'#777'; ctx.fillRect(8,-2,10,4); ctx.fillStyle=tw.ultimate?'#ecf0f1':'#999'; ctx.fillRect(-4,-14,8,6); if(tw.level>=2){ ctx.fillStyle='#777'; ctx.fillRect(-7,3,2,8); ctx.fillRect(5,3,2,8); } if(tw.level>=3){ ctx.strokeStyle='#888'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-4,7,0,Math.PI); ctx.stroke(); } }
function drawSniperTower(tw){ ctx.fillStyle=tw.ultimate?'#01579b':'#0d47a1'; ctx.fillRect(-7,-6,14,12); ctx.fillStyle=tw.ultimate?'#263238':'#37474f'; ctx.fillRect(7,-2,18,4); ctx.fillStyle=tw.ultimate?'#ffd700':'#546e7a'; ctx.beginPath(); ctx.arc(-2,-9,4,0,Math.PI*2); ctx.fill(); ctx.fillRect(-4,-10,4,2); if(tw.level>=2){ ctx.fillStyle=tw.ultimate?'#01579b':'#1565c0'; ctx.fillRect(20,-1,5,2); } if(tw.level>=3){ ctx.fillStyle=tw.ultimate?'#ffd700':'#78909c'; ctx.fillRect(-7,6,3,6); ctx.fillRect(4,6,3,6); } if(tw.ultimate){ ctx.strokeStyle='#00e5ff'; ctx.lineWidth=2; ctx.globalAlpha=0.7; ctx.strokeRect(-8,-7,16,14); ctx.globalAlpha=1; ctx.strokeStyle='rgba(150,220,255,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([3,2]); ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); } }
function drawAtoomTower(tw){ ctx.fillStyle=tw.ultimate?'#e74c3c':'#4caf50'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle=tw.ultimate?'#e67e22':'#b2ffb2'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); const sym=tw.level>=3?4:3; ctx.strokeStyle='#000'; ctx.lineWidth=2; for(let i=0;i<sym;i++){ ctx.save(); ctx.rotate(i*Math.PI*2/sym); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-8); ctx.stroke(); ctx.restore(); } if(tw.level>=3){ ctx.fillStyle='#76ff03'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill(); } }
function drawKatoenTower(tw){ ctx.fillStyle=tw.ultimate?'#27ae60':'#e8e2b8'; ctx.fillRect(-12,-12,24,24); ctx.fillStyle=tw.ultimate?'#2ecc71':'#fff'; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill(); const bollen=[[0,0],[-4,-4],[4,-4],[4,4],[-4,4]]; for(let i=1;i<=tw.level&&i<bollen.length;i++){ ctx.beginPath(); ctx.arc(bollen[i][0],bollen[i][1],3,0,Math.PI*2); ctx.fill(); } }
function drawTsjaadinator(tw){ if(tw.secret){ const tn=Date.now()*0.002; ctx.strokeStyle='rgba(255,215,0,0.55)'; ctx.lineWidth=3; ctx.shadowBlur=15; ctx.shadowColor='rgba(255,215,0,0.5)'; ctx.beginPath(); ctx.arc(0,0,18+Math.sin(tn)*3,0,Math.PI*2); ctx.stroke(); ctx.save(); ctx.rotate(tn); ctx.strokeStyle='rgba(0,255,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(16,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(0,16); ctx.stroke(); ctx.restore(); const cg=ctx.createRadialGradient(0,0,0,0,0,11); cg.addColorStop(0,'rgba(255,255,255,0.9)'); cg.addColorStop(0.3,'rgba(255,215,0,0.85)'); cg.addColorStop(0.7,'rgba(255,102,0,0.8)'); cg.addColorStop(1,'rgba(255,0,0,0.7)'); ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; return; } ctx.fillStyle=tw.ultimate?'#00ffff':'#00bcd4'; ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=tw.ultimate?'#003366':'#00363a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(10,10); ctx.moveTo(10,-10); ctx.lineTo(-10,10); ctx.stroke(); if(tw.level>=2){ ctx.strokeStyle='#00bcd4'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.stroke(); } if(tw.level>=3){ ctx.strokeStyle='#00bcd4'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.stroke(); } }

function drawTower(tw) {
  const scale = 1 + tw.level * 0.05;
  ctx.save(); ctx.translate(tw.x, tw.y); ctx.scale(scale, scale);

  if (hoveredTower === tw) { const er=getTowerRange(tw)/scale; ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(0,0,er,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
  if (tw.key==='speer'&&tw.ultimate&&tw.speerRangeBoostUntil&&Date.now()<tw.speerRangeBoostUntil){ const er=getTowerRange(tw)/scale; const tl=tw.speerRangeBoostUntil-Date.now(); const al=Math.min(1,tl/500)*0.4; ctx.strokeStyle=`rgba(200,220,255,${al+0.2})`; ctx.lineWidth=2; ctx.setLineDash([3,3]); ctx.shadowBlur=10; ctx.shadowColor='rgba(150,200,255,0.7)'; ctx.beginPath(); ctx.arc(0,0,er,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.setLineDash([]); ctx.fillStyle=`rgba(150,200,255,${al*0.3})`; ctx.beginPath(); ctx.arc(0,0,er,0,Math.PI*2); ctx.fill(); }
  if (tw.nuclearSlowUntil&&Date.now()<tw.nuclearSlowUntil){ ctx.strokeStyle='rgba(0,255,0,0.6)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(0,255,0,0.1)'; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill(); }
  if (tw.boosted){ ctx.strokeStyle='rgba(255,215,0,0.6)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke(); }
  if (tw.key==='atoom'){ const c=getAtoomNukeCooldown(tw); const prog=(tw.nukeTimer||0)/c; const col=tw.ultimate?'rgba(255,50,50,0.9)':'rgba(255,150,0,0.7)'; ctx.strokeStyle=col; ctx.lineWidth=tw.ultimate?3:2; ctx.beginPath(); ctx.arc(0,0,24,-Math.PI/2,-Math.PI/2+prog*Math.PI*2); ctx.stroke(); if(prog>0.85){ ctx.shadowBlur=tw.ultimate?10:6; ctx.shadowColor='#ffaa00'; ctx.strokeStyle=tw.ultimate?'rgba(255,200,0,0.9)':'rgba(255,220,0,0.8)'; ctx.lineWidth=tw.ultimate?4:2.5; ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; } }

  if      (tw.key==='aap')         drawAapTower(tw);
  else if (tw.key==='fakkel')      drawFakkelTower(tw);
  else if (tw.key==='speer')       drawSpeerTower(tw);
  else if (tw.key==='boog')        drawBoogTower(tw);
  else if (tw.key==='plaagdokter') drawPlaagdokterTower(tw);
  else if (tw.key==='geweer')      drawGeweerTower(tw);
  else if (tw.key==='sniper')      drawSniperTower(tw);
  else if (tw.key==='atoom')       drawAtoomTower(tw);
  else if (tw.key==='katoen')      drawKatoenTower(tw);
  else if (tw.key==='tsjaadinator')drawTsjaadinator(tw);

  if (tw.upText > 0) { ctx.fillStyle = tw.secret ? '#ffd700' : 'yellow'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText(tw.secret ? '⭐ GOD MODE!' : 'UPGRADED!', 0, -20 / scale); }
  ctx.restore();
}

// ===== DRAW PROJECTILES =====
function drawProjectiles() {
  if (antiLagMode) return;
  for (const p of projectiles) {
    ctx.save(); ctx.translate(p.x, p.y);
    const angle = Math.atan2(p.ty - p.y, p.tx - p.x); ctx.rotate(angle);
    if (p.towerKey==='fakkel'){ const fc=['#ff4500','#ff8800','#ffcc00']; ctx.fillStyle=p.gold?'#ffd700':fc[Math.floor(Date.now()*0.02)%3]; ctx.shadowBlur=8; ctx.shadowColor='#ff6600'; ctx.beginPath(); ctx.moveTo(-4,0); ctx.quadraticCurveTo(0,-5,8,-2); ctx.quadraticCurveTo(12,0,8,2); ctx.quadraticCurveTo(0,5,-4,0); ctx.fill(); ctx.shadowBlur=0; }
    else if(p.towerKey==='plaagdokter'){ ctx.strokeStyle=p.gold?'#ffd700':'#e91e63'; ctx.fillStyle=p.gold?'#ffd700':'#f8bbd0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.stroke(); ctx.fillStyle=p.gold?'#ffd700':'#e91e63'; ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(9,-2); ctx.lineTo(9,2); ctx.closePath(); ctx.fill(); ctx.fillRect(-8,-1,3,2); }
    else if(p.towerKey==='sniper'){ ctx.fillStyle=p.sniperSlowOnHit?'rgba(150,220,255,0.95)':(p.gold?'#ffd700':'#ffeb3b'); ctx.beginPath(); ctx.ellipse(0,0,4,1.5,0,0,Math.PI*2); ctx.fill(); if(p.sniperSlowOnHit){ ctx.shadowBlur=6; ctx.shadowColor='#88ddff'; ctx.strokeStyle='rgba(100,200,255,0.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,0,4,1.5,0,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; } ctx.strokeStyle=p.sniperSlowOnHit?'rgba(100,180,255,0.7)':(p.gold?'#ff6b35':'#ff9800'); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-8,0); ctx.stroke(); }
    else if(p.towerKey==='atoom'){ ctx.fillStyle=p.gold?'#ffd700':'#2d5016'; ctx.strokeStyle=p.gold?'#ffed4e':'#4caf50'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
    else if(p.towerKey==='speer'){ ctx.strokeStyle=p.gold?'#ffd700':(p.speerUltAura?'#bb99ff':'#8b7355'); ctx.fillStyle=p.gold?'#ffd700':(p.speerUltAura?'#dcd6f7':'#c0c0c0'); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(6,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(11,-3); ctx.lineTo(11,3); ctx.closePath(); ctx.fill(); }
    else if(p.towerKey==='boog'){ ctx.strokeStyle=p.poisonArrow?'#00ff44':(p.gold?'#ffd700':'#8b4513'); ctx.fillStyle=p.poisonArrow?'#00cc33':(p.gold?'#ffd700':'#696969'); ctx.lineWidth=1.5; if(p.poisonArrow){ctx.shadowBlur=6;ctx.shadowColor='#00ff44';} ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(11,-2.5); ctx.lineTo(11,2.5); ctx.closePath(); ctx.fill(); if(p.poisonArrow){ ctx.fillStyle='rgba(0,255,80,0.8)'; ctx.beginPath(); ctx.arc(0,1,2,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; } }
    else if(p.towerKey==='tsjaadinator'){ if(p.secret){ ctx.fillStyle='rgba(255,215,0,0.85)'; ctx.strokeStyle='rgba(255,102,0,0.7)'; ctx.lineWidth=2; ctx.shadowBlur=8; ctx.shadowColor='rgba(255,215,0,0.5)'; ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(6,-4); ctx.lineTo(-8,-3); ctx.lineTo(-10,0); ctx.lineTo(-8,3); ctx.lineTo(6,4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0; } else { ctx.strokeStyle=p.gold?'#ffd700':'#00bcd4'; ctx.fillStyle=p.gold?'#ffd700':'#00e5ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(7,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(7,0); ctx.lineTo(12,-3); ctx.lineTo(12,3); ctx.closePath(); ctx.fill(); } }
    else if(p.towerKey==='geweer'){ ctx.fillStyle=p.gold?'#ffd700':'#ffeb3b'; ctx.beginPath(); ctx.ellipse(0,0,3.5,1.5,0,0,Math.PI*2); ctx.fill(); }
    else { ctx.fillStyle=p.gold?'#ffd700':'black'; ctx.beginPath(); ctx.arc(0,0,2.5,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
}

function drawBananas() { for(const b of bananas){ ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(-0.3); ctx.fillStyle='#ffeb3b'; ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(-6,-4,0,-5); ctx.quadraticCurveTo(6,-4,8,0); ctx.quadraticCurveTo(6,2,0,3); ctx.quadraticCurveTo(-6,2,-8,0); ctx.fill(); ctx.strokeStyle='#f9a825'; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); } }

function drawBirdEggs() { for(const egg of birdEggs){ ctx.save(); ctx.translate(egg.x,egg.y); const pf=1-egg.timer/180; ctx.fillStyle='#f5e6c8'; ctx.beginPath(); ctx.ellipse(0,0,7,9,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#c4a567'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(0,0,7,9,0,0,Math.PI*2); ctx.stroke(); if(pf>0.4){ ctx.strokeStyle=`rgba(180,100,50,${pf})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(-3,-2); ctx.lineTo(2,4); ctx.stroke(); } if(pf>0.7){ ctx.beginPath(); ctx.moveTo(3,-8); ctx.lineTo(5,-1); ctx.stroke(); } ctx.fillStyle='#ff6600'; ctx.font='bold 8px Arial'; ctx.textAlign='center'; ctx.fillText(Math.ceil(egg.timer/60)+'s',0,-13); ctx.restore(); } }

function drawExplosions() { for(const ex of explosions){ const ma=ex.subtle?0.18:(ex.t/22); ctx.globalAlpha=Math.min(ma,ex.t/22); if(ex.gold){ const g=ctx.createRadialGradient(ex.x,ex.y,0,ex.x,ex.y,ex.r); if(ex.subtle){g.addColorStop(0,'rgba(255,215,0,0.5)');g.addColorStop(0.5,'rgba(255,237,78,0.25)');g.addColorStop(1,'rgba(255,215,0,0)');}else{g.addColorStop(0,'#ffd700');g.addColorStop(0.5,'#ffed4e');g.addColorStop(1,'rgba(255,215,0,0)');} ctx.fillStyle=g; } else { const g=ctx.createRadialGradient(ex.x,ex.y,0,ex.x,ex.y,ex.r); g.addColorStop(0,'#4caf50'); g.addColorStop(0.5,'#8bc34a'); g.addColorStop(1,'rgba(76,175,80,0)'); ctx.fillStyle=g; } ctx.beginPath(); ctx.arc(ex.x,ex.y,ex.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; } }

function drawNuclearExplosions() { for(const ne of nuclearExplosions){ const a=(ne.t/ne.maxT)*0.6, r=ne.range*(1-(ne.t/ne.maxT)); ctx.globalAlpha=a; const g=ctx.createRadialGradient(ne.x,ne.y,0,ne.x,ne.y,r); g.addColorStop(0,'rgba(255,255,100,0.9)'); g.addColorStop(0.3,'rgba(0,255,0,0.7)'); g.addColorStop(0.6,'rgba(0,150,0,0.4)'); g.addColorStop(1,'rgba(0,100,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ne.x,ne.y,r,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(0,255,0,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(ne.x,ne.y,r,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; } }

function drawNukeStrikes() {
  for(const ns of nukeStrikes){ const a=ns.t/ns.maxT; ctx.globalAlpha=a*0.8; ctx.strokeStyle='#ff4400'; ctx.lineWidth=6; ctx.shadowBlur=40; ctx.shadowColor='#ff0000'; ctx.beginPath(); ctx.arc(ns.x,ns.y,ns.r,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; if(ns.r<ns.maxR*0.5){ const g=ctx.createRadialGradient(ns.x,ns.y,0,ns.x,ns.y,ns.r); g.addColorStop(0,'rgba(255,255,255,0.9)'); g.addColorStop(0.2,'rgba(255,200,50,0.7)'); g.addColorStop(0.6,'rgba(255,60,0,0.4)'); g.addColorStop(1,'rgba(255,0,0,0)'); ctx.fillStyle=g; ctx.globalAlpha=a*0.7; ctx.beginPath(); ctx.arc(ns.x,ns.y,ns.r,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1; }
  for(const vf of visualEffects){ if(vf.type==='nukeFlash'){ const a=(vf.t/vf.maxT)*0.6; ctx.globalAlpha=a; const g=ctx.createRadialGradient(vf.x,vf.y,0,vf.x,vf.y,vf.r); g.addColorStop(0,'rgba(255,255,200,1)'); g.addColorStop(0.3,'rgba(255,150,0,0.7)'); g.addColorStop(0.7,'rgba(255,50,0,0.3)'); g.addColorStop(1,'rgba(255,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(vf.x,vf.y,vf.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; } }
}

function drawCritTexts() { for(const ct of critTexts){ const a=ct.t/60; ctx.save(); ctx.globalAlpha=a; ctx.font='bold 9px Arial'; ctx.textAlign='center'; ctx.fillStyle='#ff4444'; ctx.strokeStyle='rgba(0,0,0,0.8)'; ctx.lineWidth=2; ctx.strokeText('CRIT!',ct.x,ct.y); ctx.fillText('CRIT!',ct.x,ct.y); ctx.restore(); } }

// ===== MASTER DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPath();             // from maps.js
  towers.forEach(drawTower);
  drawBananas();
  drawBirdEggs();
  enemies.forEach(drawEnemy);
  drawProjectiles();
  drawExplosions();
  drawNuclearExplosions();
  drawNukeStrikes();
  drawCritTexts();
}

// ===== GAME LOOP =====
function loop() {
  update();
  draw();
  if (!gameWon) requestAnimationFrame(loop);
}

console.log('🏜️ Tsjaad TD – Ultimate Edition v4 🐪');
