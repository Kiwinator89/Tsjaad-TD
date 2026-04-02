// ============================================================
// ui.js — Language system, settings, tooltips, end screens,
//         mode selection, speedrun timer, utility buttons
// ============================================================

// ===== LANGUAGE SYSTEM =====
let currentLang = 'nl';
const STRINGS = {
  nl: {
    'stg-title': '⚙️ INSTELLINGEN',
    'stg-lang-label': '🌍 TAAL / LANGUAGE / SPRACHE',
    'title-subtitle': '⚔️ VECHT VOOR TSJAAD!!! ⚔️',
    'btn-standard': '🦟 STANDAARD MODUS',
    'btn-plaag': '🌋 PLAAG MODUS 🦠',
    'btn-hard': '💀 HARD MODUS ⚡',
    'btn-speed': '⚡ DUBBEL SNELHEID 🏎️',
    'btn-armoede': 'Slechte oogst🌾',
    'btn-boss': '👹 BOSS BATTLE 👹',
    'btn-mutatie': '🧬 MUTATIE MODUS 🧬',
    'btn-dubbelhealth': '💙 DUBBEL HEALTH 💙',
    'btn-tsjaad': '🔥 TSJAAD MODUS 🔥',
    'btn-tsjaadplus': '💀☠️ TSJAAD MODUS PLUS ☠️💀',
    'vs-title': '🏆 OVERWINNING! 🏆',
    'vs-line1': 'JE HEBT DE MALARIA MUG VERSLAGEN!',
    'vs-line2': 'JE HEBT DE PLAAG IN TSJAAD OVERLEEFD!',
    'vs-line3': 'JE BENT TSJAADTASTISCH!!!',
    'vs-rounds-label': '⚔️ Rondes Overleefd:',
    'vs-money-label': '💰 Totaal Verdiend:',
    'vs-time-label': '⏱️ Speedrun Tijd:',
    'vs-restart': '🔄 Opnieuw Spelen',
    'ds-title': '💀 GAME OVER LOSER 💀',
    'ds-restart': '🔄 Opnieuw Proberen',
    'lb-title': '🏆 LEADERBOARD 🏆',
    'ui-money-label': '💰 Geld:',
    'ui-lives-label': '❤️ Levens:',
    'ui-round-label': '🌊 Ronde:',
    'tower-speer': '⚔️ Speer Werper (€80)',
    'tower-boog': '🏹 Boog Schutter (€125)',
    'tower-fakkel': '🔥 Fakkel Drager (€150)',
    'tower-plaag': '💉 Plaag Dokter (€300)',
    'tower-aap': '🐵 Wilde Aap (€400)',
    'tower-geweer': '🔫 Soldaat (€550)',
    'tower-atoom': '💣 Atoombommenwerper (€600)',
    'tower-katoen': '🌾 Katoen Plantage (€950)',
    'tower-tsjaad': '⚡ Tsjaadinator (€2500)',
    'tower-sniper': '🎯 Sniper (€3000)',
    'btn-startround': '▶️ Start Ronde',
    'ui-upgrade-hint': '💡 Hover toren = info & upgrade | Backspace = verkopen',
    'death-survived': 'JE OVERLEEFDE',
    'death-rounds': 'RONDES IN',
    'death-toostrong': 'DE VIJANDEN WAREN TE STERK...',
    'death-fell': '💀 Gevallen op Ronde:',
    'death-earned': '💰 Totaal Verdiend:',
    'round-farms': '🌾 Plantages: €',
    'round-label': '▶️ Ronde ',
    'auto-hard': '⚡ AUTO-START INSTANT!',
    'auto-tsjaad': '🔥 AUTO-START INSTANT!',
    'mode-standard': 'STANDAARD',
    'mode-plaag': 'PLAAG MODUS',
    'mode-hard': 'HARD MODUS',
    'mode-speed': 'DUBBEL SNELHEID',
    'mode-armoede': 'ARMOEDE MODUS',
    'mode-boss': 'BOSS MODE',
    'mode-mutatie': 'MUTATIE MODUS',
    'mode-dubbelhealth': 'DUBBEL HEALTH',
    'mode-tsjaadmodus': 'TSJAAD MODUS',
    'mode-tsjaadplus': 'TSJAAD MODUS PLUS',
  },
  en: {
    'stg-title': '⚙️ SETTINGS',
    'stg-lang-label': '🌍 LANGUAGE',
    'title-subtitle': '⚔️ FIGHT FOR CHAD!!! ⚔️',
    'btn-standard': '🦟 STANDARD MODE',
    'btn-plaag': '🌋 PLAGUE MODE 🦠',
    'btn-hard': '💀 HARD MODE ⚡',
    'btn-speed': '⚡ DOUBLE SPEED 🏎️',
    'btn-armoede': '💀 POVERTY MODE 💀',
    'btn-boss': '👹 BOSS BATTLE 👹',
    'btn-mutatie': '🧬 MUTATION MODE 🧬',
    'btn-dubbelhealth': '💙 DOUBLE HEALTH 💙',
    'btn-tsjaad': '🔥 CHAD MODE 🔥',
    'btn-tsjaadplus': '💀☠️ CHAD MODE PLUS ☠️💀',
    'vs-title': '🏆 VICTORY! 🏆',
    'vs-line1': 'YOU DEFEATED THE MALARIA MOSQUITO!',
    'vs-line2': 'YOU SURVIVED THE PLAGUE IN CHAD!',
    'vs-line3': 'YOU ARE CHADTASTIC!!!',
    'vs-rounds-label': '⚔️ Rounds Survived:',
    'vs-money-label': '💰 Total Earned:',
    'vs-time-label': '⏱️ Speedrun Time:',
    'vs-restart': '🔄 Play Again',
    'ds-title': '💀 GAME OVER LOSER 💀',
    'ds-restart': '🔄 Try Again',
    'lb-title': '🏆 LEADERBOARD 🏆',
    'ui-money-label': '💰 Money:',
    'ui-lives-label': '❤️ Lives:',
    'ui-round-label': '🌊 Round:',
    'tower-speer': '⚔️ Spear Thrower (€80)',
    'tower-boog': '🏹 Archer (€125)',
    'tower-fakkel': '🔥 Torch Bearer (€150)',
    'tower-plaag': '💉 Plague Doctor (€300)',
    'tower-aap': '🐵 Wild Monkey (€400)',
    'tower-geweer': '🔫 Soldier (€550)',
    'tower-atoom': '💣 Atom Bomber (€600)',
    'tower-katoen': '🌾 Cotton Plantation (€950)',
    'tower-tsjaad': '⚡ Chadinator (€2500)',
    'tower-sniper': '🎯 Sniper (€3000)',
    'btn-startround': '▶️ Start Round',
    'ui-upgrade-hint': '💡 Hover tower = info & upgrade | Backspace = sell',
    'death-survived': 'YOU SURVIVED',
    'death-rounds': 'ROUNDS IN',
    'death-toostrong': 'THE ENEMIES WERE TOO STRONG...',
    'death-fell': '💀 Fell at Round:',
    'death-earned': '💰 Total Earned:',
    'round-farms': '🌾 Plantations: €',
    'round-label': '▶️ Round ',
    'auto-hard': '⚡ AUTO-START INSTANT!',
    'auto-tsjaad': '🔥 AUTO-START INSTANT!',
    'mode-standard': 'STANDARD',
    'mode-plaag': 'PLAGUE MODE',
    'mode-hard': 'HARD MODE',
    'mode-speed': 'DOUBLE SPEED',
    'mode-armoede': 'POVERTY MODE',
    'mode-boss': 'BOSS MODE',
    'mode-mutatie': 'MUTATION MODE',
    'mode-dubbelhealth': 'DOUBLE HEALTH',
    'mode-tsjaadmodus': 'CHAD MODE',
    'mode-tsjaadplus': 'CHAD MODE PLUS',
  },
  de: {
    'stg-title': '⚙️ EINSTELLUNGEN',
    'stg-lang-label': '🌍 SPRACHE',
    'title-subtitle': '⚔️ KÄMPFE FÜR TSCHAD!!! ⚔️',
    'btn-standard': '🦟 STANDARD-MODUS',
    'btn-plaag': '🌋 SEUCHEN-MODUS 🦠',
    'btn-hard': '💀 HARD-MODUS ⚡',
    'btn-speed': '⚡ DOPPELTE GESCHWINDIGKEIT 🏎️',
    'btn-armoede': '💀 ARMUTS-MODUS 💀',
    'btn-boss': '👹 BOSS BATTLE 👹',
    'btn-mutatie': '🧬 MUTATIONS-MODUS 🧬',
    'btn-dubbelhealth': '💙 DOPPELTE GESUNDHEIT 💙',
    'btn-tsjaad': '🔥 TSCHAD-MODUS 🔥',
    'btn-tsjaadplus': '💀☠️ TSCHAD-MODUS PLUS ☠️💀',
    'vs-title': '🏆 SIEG! 🏆',
    'vs-line1': 'DU HAST DIE MALARIA-MÜCKE BESIEGT!',
    'vs-line2': 'DU HAST DIE SEUCHE IN TSCHAD ÜBERLEBT!',
    'vs-line3': 'DU BIST TSCHADTASTISCH!!!',
    'vs-rounds-label': '⚔️ Überlebte Runden:',
    'vs-money-label': '💰 Gesamtverdienst:',
    'vs-time-label': '⏱️ Speedrun-Zeit:',
    'vs-restart': '🔄 Nochmal Spielen',
    'ds-title': '💀 GAME OVER VERLIERER 💀',
    'ds-restart': '🔄 Nochmal Versuchen',
    'lb-title': '🏆 BESTENLISTE 🏆',
    'ui-money-label': '💰 Geld:',
    'ui-lives-label': '❤️ Leben:',
    'ui-round-label': '🌊 Runde:',
    'tower-speer': '⚔️ Speerwerfer (€80)',
    'tower-boog': '🏹 Bogenschütze (€125)',
    'tower-fakkel': '🔥 Fackelträger (€150)',
    'tower-plaag': '💉 Seuchenarzt (€300)',
    'tower-aap': '🐵 Wilder Affe (€400)',
    'tower-geweer': '🔫 Soldat (€550)',
    'tower-atoom': '💣 Atombomber (€600)',
    'tower-katoen': '🌾 Baumwollplantage (€950)',
    'tower-tsjaad': '⚡ Tschadinator (€2500)',
    'tower-sniper': '🎯 Scharfschütze (€3000)',
    'btn-startround': '▶️ Runde Starten',
    'ui-upgrade-hint': '💡 Turm-Hover = Info & Upgrade | Backspace = Verkaufen',
    'death-survived': 'DU HAST',
    'death-rounds': 'RUNDEN IN',
    'death-toostrong': 'DIE FEINDE WAREN ZU STARK...',
    'death-fell': '💀 Gefallen in Runde:',
    'death-earned': '💰 Gesamtverdienst:',
    'round-farms': '🌾 Plantagen: €',
    'round-label': '▶️ Runde ',
    'auto-hard': '⚡ AUTO-START SOFORT!',
    'auto-tsjaad': '🔥 AUTO-START SOFORT!',
    'mode-standard': 'STANDARD',
    'mode-plaag': 'SEUCHENMODUS',
    'mode-hard': 'HARD MODUS',
    'mode-speed': 'DOPPELTE GESCHWINDIGKEIT',
    'mode-armoede': 'ARMUTS-MODUS',
    'mode-boss': 'BOSS MODE',
    'mode-mutatie': 'MUTATIONS-MODUS',
    'mode-dubbelhealth': 'DOPPELTE GESUNDHEIT',
    'mode-tsjaadmodus': 'TSCHAD-MODUS',
    'mode-tsjaadplus': 'TSCHAD-MODUS PLUS',
  }
};

/** Translate a string key using the current language (falls back to nl). */
function t(key) {
  return (STRINGS[currentLang] && STRINGS[currentLang][key]) || (STRINGS['nl'][key]) || key;
}

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('lang-' + lang).classList.add('active');
  applyTranslations();
  localStorage.setItem('tsjaadTD_lang', lang);
}

function applyTranslations() {
  const ids = [
    'stg-title','stg-lang-label','title-subtitle',
    'btn-standard','btn-plaag','btn-hard','btn-speed','btn-armoede','btn-boss',
    'btn-mutatie','btn-dubbelhealth','btn-tsjaad','btn-tsjaadplus',
    'vs-title','vs-line1','vs-line2','vs-line3',
    'vs-rounds-label','vs-money-label','vs-time-label','vs-restart',
    'ds-title','ds-restart','lb-title',
    'ui-money-label','ui-lives-label','ui-round-label',
    'tower-speer','tower-boog','tower-fakkel','tower-plaag','tower-aap',
    'tower-geweer','tower-atoom','tower-katoen','tower-tsjaad','tower-sniper',
    'btn-startround','ui-upgrade-hint'
  ];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(id);
  }

  // Re-inject money / lives / round labels preserving inner spans
  const moneyEl = document.getElementById('ui-money-label');
  if (moneyEl) {
    const val = document.getElementById('money') ? document.getElementById('money').textContent : '500';
    moneyEl.innerHTML = t('ui-money-label') + ' <strong><span id="money">' + val + '</span></strong>';
  }
  const livesEl = document.getElementById('ui-lives-label');
  if (livesEl) {
    const val = document.getElementById('lives') ? document.getElementById('lives').textContent : '20';
    livesEl.innerHTML = t('ui-lives-label') + ' <strong><span id="lives">' + val + '</span></strong>';
  }
  const roundEl = document.getElementById('ui-round-label');
  if (roundEl) {
    const val = document.getElementById('round') ? document.getElementById('round').textContent : '1';
    const max = document.getElementById('roundMax') ? document.getElementById('roundMax').textContent : '/30';
    roundEl.innerHTML = t('ui-round-label') + ' <strong><span id="round">' + val + '</span><span id="roundMax">' + max + '</span></strong>';
  }
}

// ===== SETTINGS PANEL =====
function openSettings()  { document.getElementById('settingsOverlay').classList.add('open'); }
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }
function handleOverlayClick(e) { if (e.target === document.getElementById('settingsOverlay')) closeSettings(); }

// Load saved language preference on startup
(function loadSettings() {
  const savedLang = localStorage.getItem('tsjaadTD_lang');
  if (savedLang) {
    currentLang = savedLang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('lang-' + savedLang);
    if (btn) btn.classList.add('active');
    applyTranslations();
  }
})();

// ===== SPEEDRUN TIMER =====
let timerStartTime = null, timerElapsed = 0, timerRunning = false, timerVisible = false, timerRAF = null;

function formatTime(ms) {
  const totalSecs = Math.floor(ms / 100);
  const mins = Math.floor(totalSecs / 600);
  const secs = Math.floor((totalSecs % 600) / 10);
  const tenths = totalSecs % 10;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

function tickTimer() {
  if (!timerRunning) return;
  timerElapsed = Date.now() - timerStartTime;
  if (timerVisible) document.getElementById('timerDisplay').textContent = '⏱ ' + formatTime(timerElapsed);
  timerRAF = requestAnimationFrame(tickTimer);
}

function startTimer() {
  timerStartTime = Date.now();
  timerElapsed = 0;
  timerRunning = true;
  timerRAF = requestAnimationFrame(tickTimer);
}

function stopTimer() {
  timerRunning = false;
  if (timerRAF) cancelAnimationFrame(timerRAF);
  timerElapsed = Date.now() - timerStartTime;
}

function toggleTimer() {
  timerVisible = !timerVisible;
  document.getElementById('timerDisplay').style.display = timerVisible ? 'block' : 'none';
  document.getElementById('timerToggleBtn').classList.toggle('active', timerVisible);
}

// ===== ANTI-LAG TOGGLE =====
let antiLagMode = false;

function toggleAntiLag() {
  antiLagMode = !antiLagMode;
  document.getElementById('antiLagBtn').classList.toggle('active', antiLagMode);
}

// ===== TOOLTIP SYSTEM =====
const tooltipEl = document.getElementById('towerTooltip');

function getTowerName(key) {
  const names = {
    speer:'Speer Werper', boog:'Boog Schutter', fakkel:'Fakkel Drager',
    plaagdokter:'Plaag Dokter', aap:'Wilde Aap', geweer:'Soldaat',
    atoom:'Atoombommenwerper', katoen:'Katoen Plantage',
    tsjaadinator:'Tsjaadinator', sniper:'Sniper'
  };
  return names[key] || key;
}

function fmtRate(frames)  { return (60 / frames).toFixed(2) + '/s'; }
function fmtDmg(d)        { return d >= 1000 ? (d / 1000).toFixed(1) + 'K' : d.toFixed(1); }
function fmtRange(r)      { return Math.round(r) + ''; }

function statRow(label, cur, next) {
  if (next === null || next === undefined || cur === next) {
    return `<div class="tt-stat-row"><span class="tt-stat-label">${label}</span><span class="tt-stat-val">${cur}</span></div>`;
  }
  return `<div class="tt-stat-row"><span class="tt-stat-label">${label}</span><span class="tt-stat-val">${cur}</span><span class="tt-stat-arrow">→</span><span class="tt-stat-next">${next}</span></div>`;
}

function updateTooltip(tw, cx, cy) {
  const icons = { speer:'⚔️', boog:'🏹', fakkel:'🔥', plaagdokter:'💉', aap:'🐵', geweer:'🔫', atoom:'💣', katoen:'🌾', tsjaadinator:'⚡', sniper:'🎯' };
  const icon = icons[tw.key] || '🏰';
  const name = getTowerName(tw.key);

  let lvlLabel, lvlColor;
  if (tw.secret)       { lvlLabel = '⭐ GOD MODE'; lvlColor = '#ffd700'; }
  else if (tw.ultimate){ lvlLabel = '✨ ULTIMATE — Lvl 4'; lvlColor = '#ffd700'; }
  else                 { lvlLabel = `Lvl ${tw.level} / 4`; lvlColor = '#cd853f'; }

  document.getElementById('tt-name').innerHTML  = `${icon} ${name}`;
  document.getElementById('tt-level').innerHTML = `<span style="color:${lvlColor}">${lvlLabel}</span>`;

  const cfg       = towerTypes[tw.key];
  const effRange  = getTowerRange(tw);
  const canUpgrade = !tw.secret && (!tw.ultimate || tw.key === 'tsjaadinator');
  const isMaxed   = tw.secret || (tw.ultimate && tw.key !== 'tsjaadinator');
  const isUltNext = tw.level === 3 && !tw.ultimate;
  const next      = (canUpgrade && !isMaxed) ? getNextLevelStats(tw) : null;

  let html = '';

  if (tw.farm) {
    const curIncome  = 80 + tw.level * 40 + (tw.ultimate ? 500 : 0);
    const nextIncome = next ? (80 + (tw.level + 1) * 40 + (isUltNext ? 500 : 0)) : null;
    html += `<div class="tt-stats-title">📊 Huidige Stats</div>`;
    html += statRow('💰 Inkomen/ronde', `€${curIncome}`, nextIncome ? `€${nextIncome}` : null);
    html += statRow('📏 Range', fmtRange(effRange), next ? fmtRange(next.range) : null);
  } else if (tw.monkey) {
    html += `<div class="tt-stats-title">📊 Huidige Stats</div>`;
    html += statRow('🍌 Dmg/banaan', fmtDmg(tw.dmg * 3), next ? fmtDmg(next.dmg * 3) : null);
    html += statRow('📏 Gebiedsradius', fmtRange(effRange), next ? fmtRange(next.range) : null);
  } else {
    html += `<div class="tt-stats-title">📊 Huidige Stats</div>`;
    html += statRow('⚔️ Schade',     fmtDmg(tw.dmg),       next ? fmtDmg(next.dmg) : null);
    html += statRow('🔁 Vuursnelheid', fmtRate(tw.rate),   next ? fmtRate(next.rate) : null);
    html += statRow('📏 Range',       fmtRange(effRange),   next ? fmtRange(next.range) : null);

    if (tw.slow || (next && next.slow)) {
      const curSlow  = tw.slowAmount ? Math.round(tw.slowAmount * 100) + '%' : '—';
      const nextSlow = next && next.slow ? Math.round(next.slow * 100) + '%' : null;
      html += statRow('🧊 Vertraging', curSlow, nextSlow);
    }
    if (tw.key === 'plaagdokter') {
      const curBonus  = tw.plaagDmgBonus ? '+' + Math.round((tw.plaagDmgBonus - 1) * 100) + '%' : '+5%';
      const nextBonus = next && next.plaagBonus ? '+' + Math.round((next.plaagBonus - 1) * 100) + '%' : null;
      html += statRow('🩸 Debuff dmg', curBonus, nextBonus);
    }
    if (tw.key === 'atoom') {
      const cooldownSecs     = tw.ultimate ? 10 : 25;
      const nextCooldownSecs = next ? (isUltNext ? 10 : 25) : null;
      html += statRow('💥 Nuke cooldown', cooldownSecs + 's', nextCooldownSecs ? nextCooldownSecs + 's' : null);
      const nukeDmg     = getAtoomNukeDamage(tw);
      const nextNukeDmg = next ? (isUltNext ? 40 : [10, 20, 25, 30][Math.min(tw.level + 1, 3)]) : null;
      html += statRow('💣 Nuke schade', nukeDmg, nextNukeDmg);
      const curFire     = '+' + Math.round(((tw.fireBonusMultiplier || 1.20) - 1) * 100) + '%';
      const nextFire    = next ? '+' + Math.round(((tw.fireBonusMultiplier || 1.20) - 1 + 0.10) * 100) + '%' : null;
      html += statRow('🔥 Bonus vs brand', curFire, nextFire);
    }
    if (tw.key === 'boog' && (tw.ultimate || isUltNext)) {
      const curPoison  = tw.poisonArrows ? '☠️ 10/s · 3s · -10%' : '—';
      const nextPoison = isUltNext ? '☠️ 10/s · 3s · -10%' : null;
      html += statRow('☠️ Vergif', curPoison, !tw.poisonArrows ? nextPoison : null);
    }
    if (tw.key === 'fakkel') {
      const burnDmg     = getFakkelBurnDmg(tw.level, tw.ultimate);
      const nextBurnDmg = next ? getFakkelBurnDmg(isUltNext ? 4 : tw.level + 1, isUltNext) : null;
      html += statRow('🔥 Brand dmg/s', burnDmg, nextBurnDmg !== burnDmg ? nextBurnDmg : null);
      html += statRow('⏱️ Brand duur', '8s', null);
    }
    if (tw.key === 'sniper' && (tw.ultimate || isUltNext)) {
      const curSlow2  = tw.ultimate ? '50% · 0.3s' : '—';
      const nextSlow2 = isUltNext ? '50% · 0.3s' : null;
      html += statRow('❄️ Raakshot slow', curSlow2, !tw.ultimate ? nextSlow2 : null);
    }
    if (tw.key === 'speer' && (tw.ultimate || isUltNext)) {
      const curAura  = tw.ultimate ? '+30% range' : '—';
      const nextAura = isUltNext ? '+30% range' : null;
      html += statRow('📡 Range aura', curAura, !tw.ultimate ? nextAura : null);
    }
  }

  html += `<hr class="tt-divider">`;
  if (tw.secret) {
    html += `<div class="tt-upgrade-header max">✅ GOD MODE ACTIEF</div>`;
  } else if (tw.ultimate && tw.key !== 'tsjaadinator') {
    html += `<div class="tt-upgrade-header max">✅ MAX LEVEL</div>`;
  } else if (tw.level < 3) {
    const cost      = getUpgradeCostForTower(tw);
    const canAfford = money >= cost;
    html += `<div class="tt-upgrade-header" style="color:${canAfford ? '#4fc3f7' : '#f44'}">⬆️ Upgrade Lvl ${tw.level + 1} — €${cost}</div>`;
  } else if (!tw.ultimate) {
    const cost      = cfg.ultCost;
    const canAfford = money >= cost;
    if (tw.key === 'speer') {
      html += `<div class="tt-upgrade-header ult" style="color:${canAfford ? '#ffd700' : '#f44'}">⭐ ULTIMATE — €${cost} | 📡 +30% range aura</div>`;
    } else if (tw.key === 'sniper') {
      html += `<div class="tt-upgrade-header ult" style="color:${canAfford ? '#ffd700' : '#f44'}">⭐ ULTIMATE — €${cost} | ❄️ Shot slow 50%</div>`;
    } else {
      html += `<div class="tt-upgrade-header ult" style="color:${canAfford ? '#ffd700' : '#f44'}">⭐ ULTIMATE — €${cost}</div>`;
    }
  } else if (tw.key === 'tsjaadinator') {
    const canAfford = money >= 500000;
    html += `<div class="tt-upgrade-header ult" style="color:${canAfford ? '#ffd700' : '#f44'}">👁️ GOD MODE — €500,000</div>`;
    html += `<div style="font-size:9px;color:#aaa;margin-top:2px;">TSJAADINATOR ONTWAAKT!!!</div>`;
  }

  if (tw.ultimate) {
    if (tw.key === 'speer') {
      const activeBoost = tw.speerRangeBoostUntil && Date.now() < tw.speerRangeBoostUntil;
      html += `<div class="tt-passive">📡 Range Aura: geeft alle torens in radius +30% range voor 3s bij schot${activeBoost ? ' <span style="color:#4fc3f7">[ACTIEF]</span>' : ''}</div>`;
    }
    if (tw.key === 'sniper') {
      const critPct     = Math.round((0.10 + tw.level * 0.05) * 100);
      html += statRow('🎯 Crit kans', critPct + '%', null);
      html += `<div class="tt-passive">❄️ Raakshot: vertraagt doel 50% voor 0.3 seconde</div>`;
    }
  }

  document.getElementById('tt-stats-section').innerHTML = html;

  const sellVal = Math.floor(getTowerTotalInvestedCost(tw) * 0.8);
  document.getElementById('tt-sell').textContent = `🗑️ [Backspace] Verkopen: €${sellVal}`;

  // Position tooltip, keeping it on-screen
  let tx = cx + 18, ty = cy - 10;
  const ttW = 280, ttH = 260;
  if (tx + ttW > window.innerWidth) tx = cx - ttW - 10;
  if (ty + ttH > window.innerHeight) ty = cy - ttH + 10;
  if (ty < 0) ty = 5;
  tooltipEl.style.left = tx + 'px';
  tooltipEl.style.top  = ty + 'px';
}

// ===== CANVAS MOUSE EVENTS =====
canvas.onmousemove = e => {
  const r = canvas.getBoundingClientRect();
  mouseX = e.clientX - r.left;
  mouseY = e.clientY - r.top;
  hoveredTower = null;
  for (const tw of towers) {
    const towerSize = 18 * (1 + tw.level * 0.05);
    if (Math.hypot(tw.x - mouseX, tw.y - mouseY) < towerSize) { hoveredTower = tw; break; }
  }
  if (hoveredTower) {
    updateTooltip(hoveredTower, e.clientX, e.clientY);
    tooltipEl.style.display = 'block';
  } else {
    tooltipEl.style.display = 'none';
  }
};
canvas.onmouseleave = () => { hoveredTower = null; tooltipEl.style.display = 'none'; };

// ===== SELL via BACKSPACE =====
document.addEventListener('keydown', e => {
  if (e.key === 'Backspace' && hoveredTower && !gameWon) {
    e.preventDefault();
    sellTower(hoveredTower);
  }
});

// ===== WIN / LOSS SCREENS =====
function winGame() {
  gameWon = true;
  stopMusic();
  stopTimer();
  document.getElementById('finalRound').textContent = round;
  document.getElementById('finalMoney').textContent = totalMoneyEarned;
  document.getElementById('finalTime').textContent  = formatTime(timerElapsed);
  document.getElementById('victoryScreen').style.display = 'flex';
}

function loseGame() {
  gameWon = true;
  stopMusic();
  stopTimer();
  const modeKey  = 'mode-' + gameMode;
  const modeName = t(modeKey) || 'STANDAARD';
  let deathMsg, deathStat;
  if (currentLang === 'de') {
    deathMsg  = `<strong>DU HAST ${round} RUNDEN IN ${modeName} ÜBERLEBT!</strong><br>DIE FEINDE WAREN ZU STARK...`;
    deathStat = `💀 Gefallen in Runde: <strong>${round}</strong><br>💰 Gesamtverdienst: <strong>€${totalMoneyEarned}</strong>`;
  } else if (currentLang === 'en') {
    deathMsg  = `<strong>YOU SURVIVED ${round} ROUNDS IN ${modeName}!</strong><br>THE ENEMIES WERE TOO STRONG...`;
    deathStat = `💀 Fell at Round: <strong>${round}</strong><br>💰 Total Earned: <strong>€${totalMoneyEarned}</strong>`;
  } else {
    deathMsg  = `<strong>JE OVERLEEFDE ${round} RONDES IN ${modeName}!</strong><br>DE VIJANDEN WAREN TE STERK...`;
    deathStat = `💀 Gevallen op Ronde: <strong>${round}</strong><br>💰 Totaal Verdiend: <strong>€${totalMoneyEarned}</strong>`;
  }
  document.getElementById('deathMessage').innerHTML = deathMsg;
  document.getElementById('deathStats').innerHTML   = deathStat;
  if (gameMode === 'plaag' || gameMode === 'hard') {
    document.getElementById('leaderboard').style.display = 'block';
    document.getElementById('lb-title').textContent = t('lb-title');
    saveAndShowLeaderboard(round, gameMode === 'hard' ? 'hard' : 'plaag');
  }
  document.getElementById('deathScreen').style.display = 'flex';
}

function saveAndShowLeaderboard(score, mode = 'plaag') {
  const key = mode === 'hard' ? 'tsjaadTD_leaderboard_hard' : 'tsjaadTD_leaderboard';
  let lb = JSON.parse(localStorage.getItem(key) || '[]');
  const entry = { score, date: new Date().toLocaleDateString('nl-NL'), time: new Date().toLocaleTimeString('nl-NL'), id: Date.now() };
  lb.push(entry); lb.sort((a, b) => b.score - a.score); lb = lb.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(lb));
  const listEl = document.getElementById('leaderboardList');
  listEl.innerHTML = '';
  lb.forEach((e, i) => {
    const isPlayer = e.id === entry.id;
    const div = document.createElement('div');
    div.className = 'leaderboard-entry' + (isPlayer ? ' player' : '');
    div.innerHTML = `<span><strong>#${i + 1}</strong> - Ronde ${e.score}</span><span style="opacity:0.7">${e.date}</span>`;
    listEl.appendChild(div);
  });
}

// ===== ROUND MESSAGE =====
function showRoundMsg(txt) {
  const el = document.getElementById('roundMsg');
  el.textContent = txt;
  setTimeout(() => el.textContent = '', 2000);
}

// ===== GAME MODE SELECTION =====
function startGame(mode) {
  gameMode = mode;
  path = getPathForMode(mode); // from maps.js

  document.getElementById('titleScreen').style.display  = 'none';
  document.getElementById('settingsBtn').style.display  = 'none';
  document.getElementById('ui').style.display           = 'block';

  // Per-mode setup
  if (mode === 'plaag') {
    document.getElementById('gameTitle').innerHTML = '🌋 <span style="color:#ff6b35">' + t('mode-plaag') + '</span> 🦠';
    document.getElementById('roundMax').textContent = '';
    lives = 12; money = 700; autoStartRounds = false;

  } else if (mode === 'hard') {
    document.getElementById('gameTitle').innerHTML = '💀 <span style="color:#c70039">' + t('mode-hard') + '</span> ⚡';
    document.getElementById('roundMax').textContent = '/50';
    lives = 20; money = 300; autoStartRounds = true; autoRoundCountdown = 0;
    document.getElementById('startRoundBtn').style.display = 'none';
    document.getElementById('autoRoundMsg').textContent = t('auto-hard');

  } else if (mode === 'speed') {
    document.getElementById('gameTitle').innerHTML = '⚡ <span style="color:#00ffff">' + t('mode-speed') + '</span> 🏎️';
    document.getElementById('roundMax').textContent = '/30';
    lives = 20; money = 2000; autoStartRounds = false;

  } else if (mode === 'armoede') {
    document.getElementById('gameTitle').innerHTML = '💀 <span style="color:#888">' + t('mode-armoede') + '</span> 💀';
    document.getElementById('roundMax').textContent = '/30';
    lives = 1; money = 500; autoStartRounds = false;
    document.getElementById('katoenBtn').disabled = true;
    document.getElementById('katoenBtn').classList.add('crossed-out');

  } else if (mode === 'boss') {
    document.getElementById('gameTitle').innerHTML = '👹 <span style="color:#ff0000">' + t('mode-boss') + '</span> 👹';
    document.getElementById('roundMax').textContent = '/1';
    lives = 20; money = 1000; autoStartRounds = false;

  } else if (mode === 'mutatie') {
    document.getElementById('gameTitle').innerHTML = '🧬 <span style="color:#00ff44">' + t('mode-mutatie') + '</span> 🧬';
    document.getElementById('roundMax').textContent = '/35';
    lives = 20; money = 600; autoStartRounds = false;

  } else if (mode === 'dubbelhealth') {
    document.getElementById('gameTitle').innerHTML = '💙 <span style="color:#4fc3f7">' + t('mode-dubbelhealth') + '</span> 💙';
    document.getElementById('roundMax').textContent = '/30';
    lives = 20; money = 500; autoStartRounds = false;

  } else if (mode === 'tsjaadmodus') {
    document.getElementById('gameTitle').innerHTML = '🔥 <span style="color:#ff9800">' + t('mode-tsjaadmodus') + '</span> 🔥';
    document.getElementById('roundMax').textContent = '/50';
    lives = 1; money = 800; autoStartRounds = true; autoRoundCountdown = 0;
    document.getElementById('startRoundBtn').style.display = 'none';
    document.getElementById('autoRoundMsg').textContent = t('auto-tsjaad');

  } else if (mode === 'tsjaadplus') {
    document.getElementById('gameTitle').innerHTML = '☠️ <span style="color:#ffd700;text-shadow:0 0 20px #ff0000,0 0 40px #ff4400">TSJAAD MODUS PLUS</span> ☠️';
    document.getElementById('roundMax').textContent = '/50';
    lives = 1; money = 1000; autoStartRounds = false;

  } else {
    // standard
    document.getElementById('gameTitle').textContent = '🛡️ Tsjaad TD';
    document.getElementById('roundMax').textContent = '/30';
    autoStartRounds = false;
  }

  document.getElementById('lives').textContent = lives;
  document.getElementById('money').textContent = money;

  // Background music
  const themeMap = {
    plaag:'themePlaag', hard:'themeHard', speed:'themeSpeed',
    boss:'themeBoss', mutatie:'themeMutatie', tsjaadmodus:'themeTsjaad',
    tsjaadplus:'themeTsjaad', dubbelhealth:'themeDubbelHealth', armoede:'themeArmoede'
  };
  playMusic(themeMap[mode] || 'themeStandaard');

  // Speedrun timer
  startTimer();
  document.getElementById('utilBtns').style.display = 'flex';

  loop(); // from game.js
}
