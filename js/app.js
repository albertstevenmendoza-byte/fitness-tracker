/**
 * ═══════════════════════════════════════════════════════════
 * IRONMACRO — app.js
 * Core state management, localStorage persistence, and
 * dashboard rendering engine.
 *
 * Architecture:
 *   MacroBase.state   → in-memory state (goals + daily log)
 *   MacroBase.storage → localStorage read/write helpers
 *   MacroBase.ui      → DOM rendering helpers
 *   MacroBase.init()  → boot sequence
 * ═══════════════════════════════════════════════════════════
 */

const MacroBase = (() => {
  'use strict';

  /* ─── CONSTANTS ─────────────────────────────────────────── */
  const STORAGE_KEYS = {
    GOALS:     'ironmacro_goals',
    DAILY_LOG: 'ironmacro_daily_',   // + YYYY-MM-DD suffix
    USER_PREFS:'ironmacro_prefs',
  };

  /** Caloric value of each macro gram */
  const KCAL_PER_GRAM = { protein: 4, carbs: 4, fats: 9 };

  /** SVG circumference of the calorie ring (r=82, C = 2πr) */
  const RING_CIRCUMFERENCE = 2 * Math.PI * 82; // ≈ 515.22

  /* ─── DEFAULT STATE ──────────────────────────────────────── */
  const DEFAULT_GOALS = {
    calMin:   1500,
    calMax:   1700,
    protein:  150,   // grams
    carbs:    150,   // grams
    fats:      60,   // grams
  };

  /** A daily log entry (food or workout). */
  const makeEntry = (type, data) => ({
    id:        crypto.randomUUID(),
    type,          // 'food' | 'workout'
    timestamp: Date.now(),
    ...data,
  });

  /* ─── STATE ──────────────────────────────────────────────── */
  const state = {
    goals: { ...DEFAULT_GOALS },

    /** All log entries for today (food + workouts). */
    dailyLog: [],

    /** User display name + preferences */
    prefs: {
      name: '',
    },

    /** Today's date string YYYY-MM-DD — used as log key */
    todayKey: '',
  };

  /* ─── DERIVED STATE ──────────────────────────────────────── */
  /**
   * Calculate totals from today's log.
   * @returns {{ calories, protein, carbs, fats, burned }}
   */
  function computeTotals() {
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, burned: 0 };

    for (const entry of state.dailyLog) {
      if (entry.type === 'food') {
        totals.calories += entry.calories || 0;
        totals.protein  += entry.protein  || 0;
        totals.carbs    += entry.carbs    || 0;
        totals.fats     += entry.fats     || 0;
      } else if (entry.type === 'workout') {
        totals.burned   += entry.caloriesBurned || 0;
      }
    }

    return totals;
  }

  /* ─── STORAGE ────────────────────────────────────────────── */
  const storage = {
    /** Save the user's macro goals. */
    saveGoals() {
      try {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
      } catch (e) {
        console.warn('MacroBase: could not save goals', e);
      }
    },

    /** Load the user's macro goals (merges with defaults). */
    loadGoals() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
        if (raw) {
          const saved = JSON.parse(raw);
          state.goals = { ...DEFAULT_GOALS, ...saved };
        }
      } catch (e) {
        console.warn('MacroBase: could not load goals', e);
      }
    },

    /** Save today's log entries. */
    saveDailyLog() {
      try {
        const key = STORAGE_KEYS.DAILY_LOG + state.todayKey;
        localStorage.setItem(key, JSON.stringify(state.dailyLog));
      } catch (e) {
        console.warn('MacroBase: could not save daily log', e);
      }
    },

    /** Load today's log entries. */
    loadDailyLog() {
      try {
        const key = STORAGE_KEYS.DAILY_LOG + state.todayKey;
        const raw = localStorage.getItem(key);
        state.dailyLog = raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.warn('MacroBase: could not load daily log', e);
        state.dailyLog = [];
      }
    },

    /** Purge the current day's log from localStorage. */
    clearDailyLog() {
      try {
        const key = STORAGE_KEYS.DAILY_LOG + state.todayKey;
        localStorage.removeItem(key);
        state.dailyLog = [];
      } catch (e) {
        console.warn('MacroBase: could not clear daily log', e);
      }
    },

    /** Save user preferences (name, etc.) */
    savePrefs() {
      try {
        localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(state.prefs));
      } catch (e) {
        console.warn('MacroBase: could not save prefs', e);
      }
    },

    /** Load user preferences */
    loadPrefs() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
        if (raw) state.prefs = { ...state.prefs, ...JSON.parse(raw) };
      } catch (e) {
        console.warn('MacroBase: could not load prefs', e);
      }
    },
  };

  /* ─── UI HELPERS ─────────────────────────────────────────── */
  /** Cache of frequently accessed DOM nodes */
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  /**
   * Format a number with locale commas. Returns '—' for falsy.
   * @param {number} n
   * @param {number} [decimals=0]
   */
  const fmt = (n, decimals = 0) =>
    n != null ? n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) : '—';

  /**
   * Clamp a value between min and max (inclusive).
   */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /**
   * Get today's date string in YYYY-MM-DD format.
   */
  function getTodayKey() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  /**
   * Format today's date for the header: "SUN · 27 APR 2025"
   */
  function formatHeaderDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase().replace(',', ' ·');
  }

  /* ─── TOAST ──────────────────────────────────────────────── */
  let _toastTimer = null;

  /**
   * Show a transient toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'} [type='info']
   * @param {number} [duration=2500]
   */
  function showToast(message, type = 'info', duration = 2500) {
    const el = $('toast');
    if (!el) return;

    el.textContent = message;
    el.className = `toast toast--${type} show`;

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, duration);
  }

  /* ─── DASHBOARD RENDERING ────────────────────────────────── */
  /**
   * Full dashboard refresh — reads from state, writes to DOM.
   * Called after any state mutation.
   */
  function renderDashboard() {
    const totals = computeTotals();
    const goals  = state.goals;

    /* ── Calorie Ring ──────────────────────────────────── */
    const calTarget = (goals.calMin + goals.calMax) / 2;  // midpoint as display target
    const calNet    = totals.calories - totals.burned;
    const pct       = clamp(totals.calories / calTarget, 0, 1.05);
    const offset    = RING_CIRCUMFERENCE * (1 - Math.min(pct, 1));

    const ring = $('calorieRingProgress');
    if (ring) {
      ring.style.strokeDashoffset = offset.toFixed(2);
      // Turn ring red if over max target
      ring.style.stroke = totals.calories > goals.calMax
        ? 'var(--danger)'
        : 'var(--accent)';
      ring.style.filter = totals.calories > goals.calMax
        ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))'
        : 'drop-shadow(0 0 6px var(--accent-glow))';
    }

    setTextSafe('caloriesConsumed', fmt(totals.calories));
    setTextSafe('calorieGoalDisplay', `— / ${fmt(calTarget)}`);

    /* ── Calorie Stats ─────────────────────────────────── */
    const remaining = Math.max(0, calTarget - totals.calories);
    setTextSafe('caloriesRemaining', fmt(remaining));
    setTextSafe('calorieBurned',     fmt(totals.burned));
    setTextSafe('calorieNet',        fmt(Math.max(0, calTarget - calNet)));

    // Remaining fill bar (100% = goal, green shrinks as you eat)
    const remPct = clamp((remaining / calTarget) * 100, 0, 100);
    setStyleProp('remainingFill', 'width', `${remPct}%`);

    // Burned fill bar
    const burnPct = clamp((totals.burned / calTarget) * 100, 0, 100);
    setStyleProp('burnedFill', 'width', `${burnPct}%`);

    // Status badge
    const statusEl = $('calorieStatus');
    if (statusEl) {
      if (totals.calories > goals.calMax) {
        statusEl.textContent = 'OVER TARGET';
        statusEl.style.cssText = 'background:rgba(239,68,68,0.15);color:var(--danger);border-color:rgba(239,68,68,0.3)';
      } else if (totals.calories >= goals.calMin) {
        statusEl.textContent = 'TARGET HIT';
        statusEl.style.cssText = 'background:rgba(34,197,94,0.12);color:var(--success);border-color:rgba(34,197,94,0.3)';
      } else {
        statusEl.textContent = 'ON TRACK';
        statusEl.style.cssText = '';
      }
    }

    /* ── Goal Range Indicator ──────────────────────────── */
    renderGoalRange(totals.calories);

    /* ── Macro Cards ───────────────────────────────────── */
    renderMacroCard('protein', totals.protein, goals.protein);
    renderMacroCard('carbs',   totals.carbs,   goals.carbs);
    renderMacroCard('fats',    totals.fats,    goals.fats);

    /* ── Log Feed ──────────────────────────────────────── */
    renderLogFeed();
  }

  /**
   * Render the calorie goal-range track.
   * Positions the min/max markers and the current indicator.
   */
  function renderGoalRange(caloriesIn) {
    const { calMin, calMax } = state.goals;
    const trackMax = calMax * 1.25;  // track represents 0 → 125% of max

    const pctMin = clamp((calMin / trackMax) * 100, 0, 100);
    const pctMax = clamp((calMax / trackMax) * 100, 0, 100);
    const pctNow = clamp((caloriesIn / trackMax) * 100, 0, 100);

    const zone    = $('goalRangeZone');
    const marker  = $('goalRangeIndicator');
    const minMkr  = $('goalMinMarker');
    const maxMkr  = $('goalMaxMarker');
    const status  = $('goalRangeStatus');
    const minDisp = $('goalMinDisplay');
    const maxDisp = $('goalMaxDisplay');

    if (zone) {
      zone.style.left  = `${pctMin}%`;
      zone.style.width = `${pctMax - pctMin}%`;
    }
    if (marker)  marker.style.left  = `${pctNow}%`;
    if (minMkr)  minMkr.style.left  = `${pctMin}%`;
    if (maxMkr)  maxMkr.style.left  = `${pctMax}%`;
    if (minDisp) minDisp.textContent = fmt(calMin);
    if (maxDisp) maxDisp.textContent = fmt(calMax);

    if (status) {
      if (caloriesIn < calMin) {
        const diff = calMin - caloriesIn;
        status.textContent = `${fmt(diff)} kcal below minimum`;
        status.className = 'grm-status text-warning';
      } else if (caloriesIn > calMax) {
        const diff = caloriesIn - calMax;
        status.textContent = `${fmt(diff)} kcal over maximum`;
        status.className = 'grm-status text-danger';
      } else {
        status.textContent = `✓ Within target range`;
        status.className = 'grm-status text-success';
      }
    }
  }

  /**
   * Render a single macro card.
   * @param {'protein'|'carbs'|'fats'} macro
   * @param {number} consumed - grams consumed
   * @param {number} target   - grams target
   */
  function renderMacroCard(macro, consumed, target) {
    const safeTarget = target || 1;  // avoid division by zero
    const pct = clamp((consumed / safeTarget) * 100, 0, 100);
    const over = consumed > target;
    const left = Math.max(0, target - consumed);

    const capMacro = macro.charAt(0).toUpperCase() + macro.slice(1);

    // Fill bar
    const fillEl = $(macro + 'Fill');
    if (fillEl) {
      fillEl.style.width = `${over ? 100 : pct}%`;
      fillEl.classList.toggle('overage', over);
    }

    // Percentage display
    setTextSafe(macro + 'Pct', `${Math.round(pct)}%`);

    // Numbers
    setTextSafe(macro + 'Consumed', fmt(consumed));
    setTextSafe(macro + 'Target',   fmt(target));

    // Remaining badge
    const remEl = $(macro + 'Remaining');
    if (remEl) {
      remEl.textContent = over
        ? `+${fmt(consumed - target)}g over`
        : `${fmt(left)}g left`;
      remEl.style.color = over ? 'var(--danger)' : '';
      remEl.style.borderColor = over ? 'rgba(239,68,68,0.3)' : '';
    }
  }

  /**
   * Render the log feed entries on the dashboard.
   */
  function renderLogFeed() {
    const feed = $('logFeed');
    const countEl = $('logEntryCount');
    if (!feed) return;

    const entries = [...state.dailyLog].reverse();  // newest first

    if (countEl) {
      countEl.textContent = `${entries.length} ${entries.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
    }

    if (entries.length === 0) {
      feed.innerHTML = `
        <div class="log-empty">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="8" y="4" width="24" height="32" rx="2"/>
            <line x1="14" y1="12" x2="26" y2="12"/>
            <line x1="14" y1="18" x2="26" y2="18"/>
            <line x1="14" y1="24" x2="20" y2="24"/>
          </svg>
          <p>No entries logged today.<br/>Start by adding food or a workout.</p>
        </div>`;
      return;
    }

    feed.innerHTML = entries.map(entry => buildLogEntryHTML(entry)).join('');
  }

  /**
   * Build the HTML string for a single log entry row.
   * @param {object} entry
   * @returns {string}
   */
  function buildLogEntryHTML(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    if (entry.type === 'food') {
      const macroChips = [
        entry.protein ? `P: ${fmt(entry.protein, 0)}g` : null,
        entry.carbs   ? `C: ${fmt(entry.carbs,   0)}g` : null,
        entry.fats    ? `F: ${fmt(entry.fats,    0)}g` : null,
      ].filter(Boolean).map(t => `<span class="log-macro-chip">${t}</span>`).join('');

      return `
        <div class="log-entry" data-id="${entry.id}">
          <div class="log-entry-info">
            <div class="log-entry-name">${escapeHtml(entry.name || 'Food Entry')}</div>
            <div class="log-entry-type">
              <span class="log-entry-badge log-entry-badge--food">FOOD</span>
              <span style="font-family:var(--font-data);font-size:0.5625rem;color:var(--text-muted)">${time}</span>
            </div>
            <div class="log-entry-macros">${macroChips}</div>
          </div>
          <div class="log-entry-cal">
            <div class="log-cal-value">${fmt(entry.calories || 0)}</div>
            <div class="log-cal-unit">KCAL</div>
          </div>
        </div>`;
    }

    if (entry.type === 'workout') {
      return `
        <div class="log-entry" data-id="${entry.id}">
          <div class="log-entry-info">
            <div class="log-entry-name">${escapeHtml(entry.name || 'Workout')}</div>
            <div class="log-entry-type">
              <span class="log-entry-badge log-entry-badge--workout">WORKOUT</span>
              <span style="font-family:var(--font-data);font-size:0.5625rem;color:var(--text-muted)">${time}</span>
            </div>
          </div>
          <div class="log-entry-cal">
            <div class="log-cal-value" style="color:var(--fats)">−${fmt(entry.caloriesBurned || 0)}</div>
            <div class="log-cal-unit">BURNED</div>
          </div>
        </div>`;
    }

    return '';
  }

  /**
   * Render the goals display labels.
   * Called on load and after settings are saved.
   */
  function renderGoalsUI() {
    const calMid = Math.round((state.goals.calMin + state.goals.calMax) / 2);

    setTextSafe('goalMinDisplay', fmt(state.goals.calMin));
    setTextSafe('goalMaxDisplay', fmt(state.goals.calMax));
    setTextSafe('proteinTarget',  fmt(state.goals.protein));
    setTextSafe('carbsTarget',    fmt(state.goals.carbs));
    setTextSafe('fatsTarget',     fmt(state.goals.fats));
    setTextSafe('calorieGoalDisplay', `— / ${fmt(calMid)}`);
  }

  /* ─── DOM HELPERS ────────────────────────────────────────── */
  function setTextSafe(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setStyleProp(id, prop, value) {
    const el = $(id);
    if (el) el.style[prop] = value;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── PANEL / TAB SWITCHING ──────────────────────────────── */
  function initNavigation() {
    const tabs   = $$('.nav-tab');
    const panels = $$('.panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.panel;

        // Deactivate all
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        // Activate selected
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const panel = document.getElementById(`panel-${target}`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ─── SETTINGS MODAL ─────────────────────────────────────── */
  function initSettings() {
    const overlay    = $('settingsModal');
    const openBtn    = $('openSettings');
    const closeBtn   = $('closeSettings');
    const cancelBtn  = $('cancelSettings');
    const saveBtn    = $('saveSettings');

    function openSettings() {
      // Populate inputs with current goals
      $('settingCalMin').value  = state.goals.calMin;
      $('settingCalMax').value  = state.goals.calMax;
      $('settingProtein').value = state.goals.protein;
      $('settingCarbs').value   = state.goals.carbs;
      $('settingFats').value    = state.goals.fats;
      $('settingName').value    = state.prefs.name || '';

      overlay.classList.add('open');
      $('settingCalMin').focus();
    }

    function closeSettings() {
      overlay.classList.remove('open');
    }

    function saveSettings() {
      const calMin   = parseInt($('settingCalMin').value,  10);
      const calMax   = parseInt($('settingCalMax').value,  10);
      const protein  = parseInt($('settingProtein').value, 10);
      const carbs    = parseInt($('settingCarbs').value,   10);
      const fats     = parseInt($('settingFats').value,    10);
      const name     = $('settingName').value.trim().toUpperCase();

      // Validation
      if (isNaN(calMin) || isNaN(calMax) || calMin < 200 || calMax < calMin) {
        showToast('Invalid calorie range.', 'error');
        return;
      }
      if ([protein, carbs, fats].some(v => isNaN(v) || v < 0)) {
        showToast('Invalid macro values.', 'error');
        return;
      }

      // Commit
      state.goals = { calMin, calMax, protein, carbs, fats };
      state.prefs.name = name;

      storage.saveGoals();
      storage.savePrefs();

      renderGoalsUI();
      renderDashboard();
      closeSettings();

      showToast('Targets saved.', 'success');
    }

    if (openBtn)   openBtn.addEventListener('click', openSettings);
    if (closeBtn)  closeBtn.addEventListener('click', closeSettings);
    if (cancelBtn) cancelBtn.addEventListener('click', closeSettings);
    if (saveBtn)   saveBtn.addEventListener('click', saveSettings);

    // Close on backdrop click
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeSettings();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('open')) {
        closeSettings();
      }
    });
  }

  /* ─── RESET DAY ──────────────────────────────────────────── */
  function initResetDay() {
    const resetBtn   = $('resetDay');
    const overlay    = $('resetModal');
    const confirmBtn = $('confirmReset');
    const cancelBtn  = $('cancelReset');

    resetBtn?.addEventListener('click', () => {
      overlay.classList.add('open');
    });

    confirmBtn?.addEventListener('click', () => {
      storage.clearDailyLog();
      renderDashboard();
      overlay.classList.remove('open');
      showToast('Day reset. Fresh start!', 'info');
    });

    cancelBtn?.addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  /* ─── CLEAR ALL DATA ─────────────────────────────────────── */
  /**
   * Wipes every macrobase_* key from localStorage and reloads
   * the page so in-memory state resets cleanly.
   */
  function initClearAllData() {
    const openBtn    = $('clearAllData');
    const overlay    = $('clearAllModal');
    const confirmBtn = $('confirmClearAll');
    const cancelBtn  = $('cancelClearAll');

    openBtn?.addEventListener('click', () => {
      // Close settings first so modals don't stack
      $('settingsModal')?.classList.remove('open');
      overlay?.classList.add('open');
    });

    confirmBtn?.addEventListener('click', () => {
      // Collect all macrobase_ keys first (can't remove while iterating)
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('macrobase_')) toRemove.push(key);
      }
      toRemove.forEach(key => localStorage.removeItem(key));

      // Hard reload resets all in-memory state cleanly
      location.reload();
    });

    cancelBtn?.addEventListener('click', () => {
      overlay?.classList.remove('open');
    });

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) overlay?.classList.remove('open');
    });
  }

  /* ─── PUBLIC API ─────────────────────────────────────────── */
  /**
   * Add a food entry to today's log.
   * Exported for use by food.js in Phase 2.
   *
   * @param {{ name, calories, protein, carbs, fats }} foodData
   */
  function addFoodEntry(foodData) {
    const entry = makeEntry('food', {
      name:     foodData.name     || 'Food',
      calories: Number(foodData.calories || 0),
      protein:  Number(foodData.protein  || 0),
      carbs:    Number(foodData.carbs    || 0),
      fats:     Number(foodData.fats     || 0),
    });

    state.dailyLog.push(entry);
    storage.saveDailyLog();
    renderDashboard();

    return entry;
  }

  /**
   * Add a workout entry to today's log.
   * Exported for use by workout.js in Phase 2.
   *
   * @param {{ name, caloriesBurned }} workoutData
   */
  function addWorkoutEntry(workoutData) {
    const entry = makeEntry('workout', {
      name:          workoutData.name          || 'Workout',
      caloriesBurned:Number(workoutData.caloriesBurned || 0),
    });

    state.dailyLog.push(entry);
    storage.saveDailyLog();
    renderDashboard();

    return entry;
  }

  /**
   * Remove an entry by ID.
   * @param {string} id
   */
  function removeEntry(id) {
    state.dailyLog = state.dailyLog.filter(e => e.id !== id);
    storage.saveDailyLog();
    renderDashboard();
  }

  /**
   * Get current state snapshot (for external modules).
   */
  function getState() {
    return {
      goals:   { ...state.goals },
      prefs:   { ...state.prefs },
      log:     [...state.dailyLog],
      totals:  computeTotals(),
      todayKey: state.todayKey,
    };
  }

  /* ─── INIT ───────────────────────────────────────────────── */
  function init() {
    // 1. Establish today's date key
    state.todayKey = getTodayKey();

    // 2. Load persisted data
    storage.loadGoals();
    storage.loadPrefs();
    storage.loadDailyLog();

    // 3. Set header date
    setTextSafe('headerDate', formatHeaderDate(state.todayKey));

    // 4. Initial render
    renderGoalsUI();
    renderDashboard();

    // 5. Wire up interactions
    initNavigation();
    initSettings();
    initResetDay();
    initClearAllData();

    // 6. Auto-reset at midnight (if browser stays open)
    scheduleMidnightReset();

    console.info(
      `%cIRONMACRO%c initialized · ${state.todayKey} · goals:`,
      'color:#f4650c;font-weight:bold;font-family:monospace',
      'color:#8a90aa;font-family:monospace',
      state.goals
    );
  }

  /**
   * Schedules a check at midnight to reset the today key
   * (in case the user keeps the browser tab open overnight).
   */
  function scheduleMidnightReset() {
    const now  = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 5, 0);  // 00:00:05 tomorrow

    const msUntilMidnight = next - now;

    setTimeout(() => {
      const newKey = getTodayKey();
      if (newKey !== state.todayKey) {
        state.todayKey = newKey;
        storage.loadDailyLog();      // loads empty log for new day
        setTextSafe('headerDate', formatHeaderDate(state.todayKey));
        renderDashboard();
        console.info('MacroBase: New day detected, log reset.');
      }
      scheduleMidnightReset();       // re-schedule for next midnight
    }, msUntilMidnight);
  }

  /* ─── BOOTSTRAP ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  /* ─── EXPORTED API (for Phase 2 modules) ─────────────────── */
  return {
    addFoodEntry,
    addWorkoutEntry,
    removeEntry,
    getState,
    renderDashboard,
    showToast,
    fmt,
    clamp,
    KCAL_PER_GRAM,
  };

})();