/**
 * ═══════════════════════════════════════════════════════════
 * IRONMACRO — food.js  (Module 03)
 * Food Logger: form handling, quick-add, history rendering.
 *
 * Depends on:  IronMacro (app.js) — must load after app.js
 * Public API:  FoodLogger.refresh()  — re-render history
 *              FoodLogger.addQuickItem(item) — add custom quick-add
 * ═══════════════════════════════════════════════════════════
 */

const FoodLogger = (() => {
  'use strict';

  /* ─── WAIT FOR IRONMACRO CORE ────────────────────────────
     app.js boots on DOMContentLoaded. food.js hooks in
     immediately after via its own DOMContentLoaded listener
     (scripts load in order, so IronMacro is defined by now).
  ─────────────────────────────────────────────────────────── */

  /* ─── QUICK-ADD ITEM DATABASE ────────────────────────────
     Each item maps directly to the IronMacro.addFoodEntry()
     payload shape. Add more items to pre-populate the panel.
  ─────────────────────────────────────────────────────────── */
  const QUICK_ITEMS = [
    {
      id:       'qa-espresso',
      name:     'Morning Espresso',
      tag:      'DRINK',
      calories: 5,
      protein:  0.1,
      carbs:    0.8,
      fats:     0.1,
      meal:     'breakfast',
    },
    {
      id:       'qa-pb-smoothie',
      name:     'PB & Banana Soy Protein Smoothie',
      tag:      'SHAKE',
      calories: 385,
      protein:  32,
      carbs:    38,
      fats:     11,
      meal:     'breakfast',
    },
    {
      id:       'qa-salsa',
      name:     'Custom Salsa / Hot Sauce',
      tag:      'CONDIMENT',
      calories: 10,
      protein:  0.4,
      carbs:    2.1,
      fats:     0.1,
      meal:     'lunch',
    },
  ];

  /* ─── MEAL CONFIG ─────────────────────────────────────── */
  const MEAL_CONFIG = {
    breakfast: { label: 'BREAKFAST', order: 0 },
    lunch:     { label: 'LUNCH',     order: 1 },
    dinner:    { label: 'DINNER',    order: 2 },
    snack:     { label: 'SNACK',     order: 3 },
  };

  /* ─── STATE ──────────────────────────────────────────────
     food.js only manages its own UI state; the source of
     truth for entries lives in IronMacro / localStorage.
  ─────────────────────────────────────────────────────────── */
  let selectedMeal = 'breakfast';

  /* ─── ELEMENT CACHE ──────────────────────────────────────
     Resolved once on init to avoid repeated querySelector.
  ─────────────────────────────────────────────────────────── */
  const el = {};

  function cacheElements() {
    el.form        = document.getElementById('foodEntryForm');
    el.name        = document.getElementById('foodName');
    el.calories    = document.getElementById('foodCalories');
    el.protein     = document.getElementById('foodProtein');
    el.carbs       = document.getElementById('foodCarbs');
    el.fats        = document.getElementById('foodFats');
    el.mealSel     = document.getElementById('mealSelector');
    el.clearBtn    = document.getElementById('fl-clearForm');
    el.submitBtn   = document.getElementById('fl-submit');
    el.autocalHint = document.getElementById('autocal-hint');
    el.quickGrid   = document.getElementById('fl-quickGrid');
    el.history     = document.getElementById('fl-history');
    el.historyEmpty= document.getElementById('fl-historyEmpty');
    el.foodCount   = document.getElementById('fl-foodCount');
    el.totalCal    = document.getElementById('fl-totalCal');
    el.entryCount  = document.getElementById('fl-entryCount');
    // Preview elements
    el.prevCal     = document.getElementById('prev-cal');
    el.prevProtein = document.getElementById('prev-protein');
    el.prevCarbs   = document.getElementById('prev-carbs');
    el.prevFats    = document.getElementById('prev-fats');
    el.prevBarP    = document.getElementById('prev-bar-protein');
    el.prevBarC    = document.getElementById('prev-bar-carbs');
    el.prevBarF    = document.getElementById('prev-bar-fats');
  }

  /* ─── HELPERS ────────────────────────────────────────────── */
  const num   = (str) => Math.max(0, parseFloat(str) || 0);
  const round = (n, d = 1) => +n.toFixed(d);
  const fmt   = (n) => IronMacro.fmt(n);
  const { KCAL_PER_GRAM } = IronMacro;

  /**
   * Calculate estimated calories from macros.
   * Returns 0 if all macros are 0.
   */
  function estimateCal(protein, carbs, fats) {
    return round(
      protein * KCAL_PER_GRAM.protein +
      carbs   * KCAL_PER_GRAM.carbs   +
      fats    * KCAL_PER_GRAM.fats,
      0
    );
  }

  /**
   * Read current form values.
   * @returns {{ name, calories, protein, carbs, fats, meal }}
   */
  function readForm() {
    return {
      name:     el.name?.value.trim() || '',
      calories: num(el.calories?.value),
      protein:  num(el.protein?.value),
      carbs:    num(el.carbs?.value),
      fats:     num(el.fats?.value),
      meal:     selectedMeal,
    };
  }

  /**
   * Reset form fields to blank. Does NOT change meal selection.
   */
  function clearForm() {
    if (el.form) el.form.reset();
    updatePreview();
    updateAutocalHint();
    if (el.name) el.name.focus();
  }

  /**
   * Brief error pulse on a field.
   */
  function flashError(input) {
    if (!input) return;
    input.classList.remove('fl-input--error');
    // Force reflow to restart animation
    void input.offsetWidth;
    input.classList.add('fl-input--error');
    setTimeout(() => input.classList.remove('fl-input--error'), 500);
  }

  /* ─── LIVE PREVIEW ────────────────────────────────────── */
  function updatePreview() {
    const v = readForm();

    // If calories field is empty, show estimated value
    const displayCal = v.calories || estimateCal(v.protein, v.carbs, v.fats);

    if (el.prevCal)     el.prevCal.textContent     = fmt(displayCal);
    if (el.prevProtein) el.prevProtein.textContent  = `${round(v.protein)}g`;
    if (el.prevCarbs)   el.prevCarbs.textContent    = `${round(v.carbs)}g`;
    if (el.prevFats)    el.prevFats.textContent     = `${round(v.fats)}g`;

    // Stacked kcal breakdown bar
    // Each macro's kcal share as % of total displayed calories
    if (displayCal > 0) {
      const calP = (v.protein * KCAL_PER_GRAM.protein / displayCal) * 100;
      const calC = (v.carbs   * KCAL_PER_GRAM.carbs   / displayCal) * 100;
      const calF = (v.fats    * KCAL_PER_GRAM.fats    / displayCal) * 100;

      if (el.prevBarP) el.prevBarP.style.width = `${IronMacro.clamp(calP, 0, 100)}%`;
      if (el.prevBarC) el.prevBarC.style.width = `${IronMacro.clamp(calC, 0, 100)}%`;
      if (el.prevBarF) el.prevBarF.style.width = `${IronMacro.clamp(calF, 0, 100)}%`;
    } else {
      [el.prevBarP, el.prevBarC, el.prevBarF].forEach(b => {
        if (b) b.style.width = '0%';
      });
    }
  }

  /**
   * Show or hide the auto-calc hint under the calories field.
   * Triggered whenever protein/carbs/fats change and
   * calories field is empty.
   */
  function updateAutocalHint() {
    if (!el.autocalHint) return;
    const v = readForm();
    const hasMacros = v.protein > 0 || v.carbs > 0 || v.fats > 0;
    const calIsEmpty = !el.calories?.value;

    if (hasMacros && calIsEmpty) {
      const est = estimateCal(v.protein, v.carbs, v.fats);
      el.autocalHint.textContent = `AUTO-EST: ${fmt(est)} kcal from macros`;
    } else {
      el.autocalHint.textContent = '';
    }
  }

  /* ─── FORM SUBMISSION ─────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();

    let v = readForm();

    // Validation — name is the only hard requirement
    if (!v.name) {
      flashError(el.name);
      IronMacro.showToast('Enter a food name.', 'error');
      el.name?.focus();
      return;
    }

    // At least one numeric value required
    if (v.calories === 0 && v.protein === 0 && v.carbs === 0 && v.fats === 0) {
      flashError(el.calories);
      IronMacro.showToast('Enter at least calories or macros.', 'error');
      el.calories?.focus();
      return;
    }

    // Auto-fill calories from macros if left blank
    if (v.calories === 0 && (v.protein > 0 || v.carbs > 0 || v.fats > 0)) {
      v.calories = estimateCal(v.protein, v.carbs, v.fats);
    }

    // Commit to state via core API
    IronMacro.addFoodEntry({
      name:     v.name,
      calories: v.calories,
      protein:  v.protein,
      carbs:    v.carbs,
      fats:     v.fats,
      meal:     v.meal,
    });

    // Success feedback
    animateSubmitSuccess();
    IronMacro.showToast(`✓ ${v.name} logged`, 'success');

    // Reset form & refresh
    clearForm();
    refreshHistory();
    refreshHeaderStats();
  }

  function animateSubmitSuccess() {
    if (!el.submitBtn) return;
    const originalHTML = el.submitBtn.innerHTML;
    el.submitBtn.classList.add('fl-submit--success');
    el.submitBtn.innerHTML = `
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425z"/>
      </svg>
      LOGGED!
    `;
    setTimeout(() => {
      el.submitBtn.classList.remove('fl-submit--success');
      el.submitBtn.innerHTML = originalHTML;
    }, 1200);
  }

  /* ─── MEAL SELECTOR ──────────────────────────────────── */
  function initMealSelector() {
    if (!el.mealSel) return;
    el.mealSel.addEventListener('click', (e) => {
      const btn = e.target.closest('.fl-meal-btn');
      if (!btn) return;

      el.mealSel.querySelectorAll('.fl-meal-btn').forEach(b =>
        b.classList.remove('active')
      );
      btn.classList.add('active');
      selectedMeal = btn.dataset.meal;
    });
  }

  /* ─── QUICK-ADD RENDERING ────────────────────────────── */
  /**
   * Build the quick-add card HTML for one item.
   */
  function buildQuickCardHTML(item) {
    const chips = [
      item.protein ? `<span class="fl-qchip">P:${round(item.protein)}g</span>` : '',
      item.carbs   ? `<span class="fl-qchip">C:${round(item.carbs)}g</span>`   : '',
      item.fats    ? `<span class="fl-qchip">F:${round(item.fats)}g</span>`    : '',
    ].join('');

    return `
      <button
        class="fl-quick-card"
        data-quick-id="${item.id}"
        data-tag="${item.tag}"
        title="Log ${item.name} (${item.calories} kcal)"
        type="button"
      >
        <div class="fl-quick-header">
          <span class="fl-quick-tag" data-tag="${item.tag}">${item.tag}</span>
          <span class="fl-quick-add-icon" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1a.5.5 0 01.5.5v4h4a.5.5 0 010 1h-4v4a.5.5 0 01-1 0v-4h-4a.5.5 0 010-1h4v-4A.5.5 0 016 1z"/>
            </svg>
          </span>
        </div>
        <div class="fl-quick-name">${escapeHtml(item.name)}</div>
        <div class="fl-quick-macros">
          <span class="fl-quick-cal">${item.calories}</span>
          <span class="fl-quick-cal-unit">KCAL</span>
          <span class="fl-quick-macro-chips">${chips}</span>
        </div>
      </button>`;
  }

  function renderQuickGrid(items) {
    if (!el.quickGrid) return;
    el.quickGrid.innerHTML = items.map(buildQuickCardHTML).join('');
  }

  /**
   * Handle quick-add card clicks via event delegation.
   */
  function handleQuickAdd(e) {
    const card = e.target.closest('[data-quick-id]');
    if (!card) return;

    const itemId = card.dataset.quickId;
    const item   = QUICK_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    // Log via core API — use item's preferred meal time
    IronMacro.addFoodEntry({
      name:     item.name,
      calories: item.calories,
      protein:  item.protein,
      carbs:    item.carbs,
      fats:     item.fats,
      meal:     item.meal || selectedMeal,
    });

    // Visual feedback on the card
    card.classList.add('fl-quick--logged');
    setTimeout(() => card.classList.remove('fl-quick--logged'), 700);

    IronMacro.showToast(`✓ ${item.name} logged`, 'success');
    refreshHistory();
    refreshHeaderStats();
  }

  /* ─── HISTORY RENDERING ──────────────────────────────── */
  /**
   * Get today's food entries from IronMacro core state,
   * grouped by meal time in chronological meal order.
   *
   * @returns {Map<string, Array>}  mealKey → entries[]
   */
  function getFoodEntriesByMeal() {
    const { log } = IronMacro.getState();
    const foodEntries = log.filter(e => e.type === 'food');

    // Group by meal
    const groups = new Map();
    for (const [key] of Object.entries(MEAL_CONFIG).sort(
      ([,a],[,b]) => a.order - b.order
    )) {
      const group = foodEntries.filter(e => e.meal === key || (!e.meal && key === 'snack'));
      if (group.length) groups.set(key, group);
    }

    return groups;
  }

  /**
   * Build HTML for a single food entry row.
   */
  function buildEntryHTML(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const meal = entry.meal || 'snack';

    const macroChips = [
      entry.protein > 0 ? `<span class="fl-entry-macro-chip fl-entry-macro-chip--protein">P: ${round(entry.protein)}g</span>` : '',
      entry.carbs   > 0 ? `<span class="fl-entry-macro-chip fl-entry-macro-chip--carbs">C: ${round(entry.carbs)}g</span>`   : '',
      entry.fats    > 0 ? `<span class="fl-entry-macro-chip fl-entry-macro-chip--fats">F: ${round(entry.fats)}g</span>`     : '',
    ].join('');

    return `
      <div class="fl-entry" data-entry-id="${entry.id}">
        <div class="fl-entry-left">
          <div class="fl-entry-name">${escapeHtml(entry.name)}</div>
          <div class="fl-entry-meta">
            <span class="fl-entry-meal-badge" data-meal="${meal}">${MEAL_CONFIG[meal]?.label || 'SNACK'}</span>
            <span class="fl-entry-time">${time}</span>
          </div>
          <div class="fl-entry-macros">${macroChips}</div>
        </div>
        <div class="fl-entry-right">
          <div>
            <div class="fl-entry-cal-value">${fmt(entry.calories)}</div>
            <div class="fl-entry-cal-unit">KCAL</div>
          </div>
          <button
            class="fl-entry-delete"
            data-delete-id="${entry.id}"
            title="Remove entry"
            aria-label="Remove ${escapeHtml(entry.name)}"
            type="button"
          >
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 11.708-.708L6 5.293l3.146-3.147a.5.5 0 01.708.708L6.707 6l3.147 3.146a.5.5 0 01-.708.708L6 6.707 2.854 9.854a.5.5 0 01-.708-.708L5.293 6 2.146 2.854z"/>
            </svg>
          </button>
        </div>
      </div>`;
  }

  /**
   * Build the totals footer row for the history panel.
   */
  function buildTotalsHTML(entries) {
    const totals = entries.reduce((acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein:  acc.protein  + (e.protein  || 0),
      carbs:    acc.carbs    + (e.carbs    || 0),
      fats:     acc.fats     + (e.fats     || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return `
      <div class="fl-history-totals">
        <span class="fl-totals-label">TOTAL</span>
        <div class="fl-totals-macro fl-totals-macro--cal">
          <span class="fl-totals-val">${fmt(round(totals.calories, 0))}</span>
          <span class="fl-totals-lbl">KCAL</span>
        </div>
        <div class="fl-totals-divider"></div>
        <div class="fl-totals-macro fl-totals-macro--pro">
          <span class="fl-totals-val">${round(totals.protein)}g</span>
          <span class="fl-totals-lbl">PRO</span>
        </div>
        <div class="fl-totals-macro fl-totals-macro--carb">
          <span class="fl-totals-val">${round(totals.carbs)}g</span>
          <span class="fl-totals-lbl">CARB</span>
        </div>
        <div class="fl-totals-macro fl-totals-macro--fat">
          <span class="fl-totals-val">${round(totals.fats)}g</span>
          <span class="fl-totals-lbl">FAT</span>
        </div>
      </div>`;
  }

  /**
   * Full history panel refresh — called after any state change.
   */
  function refreshHistory() {
    if (!el.history) return;

    const groups = getFoodEntriesByMeal();

    // Count total food entries
    let totalEntries = 0;
    groups.forEach(g => { totalEntries += g.length; });

    // Update entry count badge
    if (el.foodCount) {
      el.foodCount.textContent = `${totalEntries} ${totalEntries === 1 ? 'ENTRY' : 'ENTRIES'}`;
    }

    if (totalEntries === 0) {
      el.history.innerHTML = `
        <div class="fl-history-empty">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
            <rect x="10" y="6" width="28" height="36" rx="2"/>
            <line x1="17" y1="16" x2="31" y2="16"/>
            <line x1="17" y1="23" x2="31" y2="23"/>
            <line x1="17" y1="30" x2="24" y2="30"/>
          </svg>
          <p>Nothing logged yet today.</p>
        </div>`;
      return;
    }

    // Collect all entries for totals
    const allEntries = [];
    let html = '';

    groups.forEach((entries, mealKey) => {
      allEntries.push(...entries);

      const groupCal = entries.reduce((s, e) => s + (e.calories || 0), 0);
      const mealLabel = MEAL_CONFIG[mealKey]?.label || mealKey.toUpperCase();

      html += `
        <div class="fl-history-group-header">
          <span class="fl-group-meal-label">${mealLabel}</span>
          <span class="fl-group-subtotal">${fmt(round(groupCal, 0))} kcal · ${entries.length} item${entries.length !== 1 ? 's' : ''}</span>
        </div>`;

      entries.slice().reverse().forEach(entry => {
        html += buildEntryHTML(entry);
      });
    });

    html += buildTotalsHTML(allEntries);

    el.history.innerHTML = html;
  }

  /**
   * Refresh the module header stat numbers.
   */
  function refreshHeaderStats() {
    const { log } = IronMacro.getState();
    const foodEntries = log.filter(e => e.type === 'food');
    const totalCal = foodEntries.reduce((s, e) => s + (e.calories || 0), 0);

    if (el.totalCal)   el.totalCal.textContent   = fmt(round(totalCal, 0));
    if (el.entryCount) el.entryCount.textContent  = String(foodEntries.length);
  }

  /* ─── DELETE ENTRY ───────────────────────────────────── */
  /**
   * Handle delete button clicks inside the history panel
   * via event delegation on el.history.
   */
  function handleDelete(e) {
    const btn = e.target.closest('[data-delete-id]');
    if (!btn) return;

    const id  = btn.dataset.deleteId;
    const row = el.history.querySelector(`[data-entry-id="${id}"]`);

    if (row) {
      // Animate out, then remove from state
      row.classList.add('fl-entry--removing');
      row.addEventListener('animationend', () => {
        IronMacro.removeEntry(id);
        refreshHistory();
        refreshHeaderStats();
        IronMacro.showToast('Entry removed.', 'info');
      }, { once: true });
    } else {
      IronMacro.removeEntry(id);
      refreshHistory();
      refreshHeaderStats();
    }
  }

  /* ─── KEYBOARD SHORTCUTS ─────────────────────────────── */
  /**
   * Tab through macro inputs with Enter key —
   * makes numeric entry faster on mobile and desktop.
   */
  function initKeyboardFlow() {
    const macroInputs = [el.calories, el.protein, el.carbs, el.fats];

    macroInputs.forEach((input, i) => {
      if (!input) return;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const next = macroInputs[i + 1];
          if (next) {
            next.focus();
            next.select();
          } else {
            el.submitBtn?.focus();
          }
        }
      });
    });
  }

  /* ─── UTILITY ────────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── INIT ───────────────────────────────────────────── */
  function init() {
    // Bail early if panel isn't in the DOM
    if (!document.getElementById('panel-food')) return;

    cacheElements();

    // Wire form events
    el.form?.addEventListener('submit', handleSubmit);
    el.clearBtn?.addEventListener('click', clearForm);

    // Live preview — update on any input change
    [el.calories, el.protein, el.carbs, el.fats].forEach(inp => {
      inp?.addEventListener('input', () => {
        updatePreview();
        updateAutocalHint();
      });
    });

    // Meal selector
    initMealSelector();

    // Quick-add delegation
    el.quickGrid?.addEventListener('click', handleQuickAdd);

    // Delete delegation
    el.history?.addEventListener('click', handleDelete);

    // Keyboard tab-flow through numeric inputs
    initKeyboardFlow();

    // Render quick-add cards
    renderQuickGrid(QUICK_ITEMS);

    // Initial history render (load persisted state)
    refreshHistory();
    refreshHeaderStats();
    updatePreview();

    console.info(
      '%cFOOD LOGGER%c initialized · %d quick-add items',
      'color:#f5b731;font-weight:bold;font-family:monospace',
      'color:#8a90aa;font-family:monospace',
      QUICK_ITEMS.length
    );
  }

  /* ─── PUBLIC API ─────────────────────────────────────── */
  /**
   * Force a full re-render of the history panel.
   * Call this if entries are added from outside this module.
   */
  function refresh() {
    refreshHistory();
    refreshHeaderStats();
  }

  /**
   * Dynamically add a new item to the Quick Add grid.
   * Useful for persisting user-created favourites in Phase 3+.
   * @param {{ id, name, tag, calories, protein, carbs, fats, meal }} item
   */
  function addQuickItem(item) {
    if (!item?.id || QUICK_ITEMS.find(i => i.id === item.id)) return;
    QUICK_ITEMS.push(item);
    renderQuickGrid(QUICK_ITEMS);
  }

  /* ─── BOOTSTRAP ──────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  return { refresh, addQuickItem };

})();