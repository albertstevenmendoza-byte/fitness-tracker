/**
 * =============================================================
 * IRONMACRO -- recommendations.js  (Module 04)
 * Smart Recipe Recommendation Engine
 *
 * Two data sources, one unified interface:
 *
 *   SEARCH MODE  (query >= 2 chars)
 *     -> Fetches Open Food Facts API (3M+ products)
 *     -> Maps nutriments to macro objects
 *     -> Scores results against remaining budget
 *     -> Shows top 8 matches (broader set since user is searching)
 *
 *   CURATED MODE (empty search)
 *     -> Local 23-recipe database
 *     -> Filtered by selected cook-time chip
 *     -> Same scoring algorithm, shows top 3
 *
 * Scoring: (protein_ratio * 2 + carbs_ratio + fats_ratio) / 4 * 100
 * Protein weighted 2x -- hardest macro to close.
 *
 * Depends on: IronMacro (app.js)
 * =============================================================
 */

const Recommendations = (() => {
  'use strict';

  /* --- OPEN FOOD FACTS API ---------------------------------- */
  const OFF_API = 'https://world.openfoodfacts.org/cgi/search.pl';
  const SEARCH_LIMIT    = 20;   // items fetched per query
  const MAX_API_DISPLAY = 8;    // cards shown from API results
  const MAX_CURATED     = 3;    // cards shown from local DB
  const DEBOUNCE_MS     = 380;  // ms to wait after keystroke
  const MIN_QUERY_LEN   = 2;    // min chars before searching

  /* --- COOK TIME CONSTANTS ---------------------------------- */
  const COOK = { QUICK: 'quick', MEDIUM: 'medium', BATCH: 'batch' };

  const COOK_LABELS = {
    quick:  '< 5 MIN',
    medium: '10-15 MIN',
    batch:  'BATCH PREP',
  };

  /* --- LOCAL RECIPE DATABASE (23 items) --------------------- */
  const RECIPE_DB = [
    /* Under 5 mins */
    {
      id: 'espresso', name: 'Double Shot Morning Espresso',
      cookTime: COOK.QUICK, category: 'ZERO CAL',
      desc: 'Two tight ristretto pulls. Practically zero calories, instant caffeine. Log it for completeness.',
      calories: 5, protein: 0.1, carbs: 0.8, fats: 0.1, meal: 'breakfast',
    },
    {
      id: 'pb-spirulina-smoothie', name: 'PB & Banana Soy Protein Smoothie (with Spirulina)',
      cookTime: COOK.QUICK, category: 'HIGH PROTEIN',
      desc: 'Soy isolate, frozen banana, natural PB, oat milk, and a teaspoon of spirulina. Shake, done.',
      calories: 400, protein: 34, carbs: 38, fats: 12, meal: 'breakfast',
    },
    {
      id: 'protein-oats', name: 'Quick Protein Oats',
      cookTime: COOK.QUICK, category: 'BALANCED',
      desc: 'Rolled oats microwaved 90 seconds, one scoop vanilla whey stirred in after. Top with almond butter.',
      calories: 340, protein: 26, carbs: 42, fats: 9, meal: 'breakfast',
    },
    {
      id: 'greek-yogurt-bowl', name: 'Greek Yogurt & Honey Bowl',
      cookTime: COOK.QUICK, category: 'HIGH PROTEIN',
      desc: 'Full-fat Greek yogurt, raw honey drizzle, and crushed walnuts. High in casein and probiotics.',
      calories: 185, protein: 17, carbs: 22, fats: 5, meal: 'snack',
    },
    {
      id: 'cottage-cheese', name: 'Cottage Cheese + Tajin & Hot Sauce',
      cookTime: COOK.QUICK, category: 'HIGH PROTEIN',
      desc: 'Low-fat cottage cheese with heavy Tajin and hot sauce. Slow casein protein, zero cook.',
      calories: 175, protein: 26, carbs: 7, fats: 3, meal: 'snack',
    },
    {
      id: 'whey-shake', name: 'Whey Protein Shake (Water)',
      cookTime: COOK.QUICK, category: 'HIGH PROTEIN',
      desc: 'One scoop whey in cold water. Bare-bones, fast-digesting protein hit.',
      calories: 125, protein: 25, carbs: 4, fats: 1.5, meal: 'snack',
    },
    {
      id: 'banana-ab', name: 'Banana + Almond Butter',
      cookTime: COOK.QUICK, category: 'QUICK CARB',
      desc: 'Medium banana and 1.5 tbsp almond butter. Fast carbs, healthy fat, potassium for recovery.',
      calories: 225, protein: 5, carbs: 32, fats: 10, meal: 'snack',
    },

    /* 10-15 mins */
    {
      id: 'serrano-egg-white', name: 'Serrano Pepper & Egg White Scramble',
      cookTime: COOK.MEDIUM, category: 'HIGH PROTEIN',
      desc: 'Six egg whites, one minced serrano, diced onion, and a crumble of cotija. Lean and fast.',
      calories: 125, protein: 24, carbs: 4, fats: 1.5, meal: 'breakfast',
    },
    {
      id: 'charred-chicken-bowl', name: 'Quick Charred Chicken Bowl',
      cookTime: COOK.MEDIUM, category: 'HIGH PROTEIN',
      desc: 'Cast-iron seared chicken thigh over brown rice, dressed with lime and chile flakes.',
      calories: 390, protein: 42, carbs: 30, fats: 11, meal: 'lunch',
    },
    {
      id: 'tuna-avocado', name: 'Tuna & Avocado Bowl',
      cookTime: COOK.MEDIUM, category: 'BALANCED',
      desc: 'Canned albacore, half an avocado, jalapeño, lime. Omega-3s and solid protein.',
      calories: 285, protein: 30, carbs: 10, fats: 14, meal: 'lunch',
    },
    {
      id: 'turkey-spinach', name: 'Turkey & Spinach Scramble',
      cookTime: COOK.MEDIUM, category: 'HIGH PROTEIN',
      desc: 'Ground turkey crumbled with wilted spinach, garlic, and red pepper flakes.',
      calories: 230, protein: 30, carbs: 3, fats: 10, meal: 'lunch',
    },
    {
      id: 'shrimp-zucchini', name: 'Shrimp & Zucchini Saute',
      cookTime: COOK.MEDIUM, category: 'LEAN PROTEIN',
      desc: 'Shrimp sauteed with zucchini, butter, lemon, and capers. Done in one pan.',
      calories: 195, protein: 26, carbs: 6, fats: 6, meal: 'dinner',
    },
    {
      id: 'three-egg-omelette', name: '3-Egg Veggie Omelette',
      cookTime: COOK.MEDIUM, category: 'BALANCED',
      desc: 'Three whole eggs folded over bell pepper, mushroom, and onion.',
      calories: 255, protein: 20, carbs: 5, fats: 17, meal: 'breakfast',
    },
    {
      id: 'salmon-toast', name: 'Smoked Salmon & Cream Cheese Toast',
      cookTime: COOK.MEDIUM, category: 'BALANCED',
      desc: 'Two slices whole-grain toast, whipped cream cheese, smoked salmon, capers, red onion.',
      calories: 290, protein: 18, carbs: 24, fats: 13, meal: 'breakfast',
    },
    {
      id: 'rice-cakes-ab', name: 'Rice Cakes (3) with Almond Butter',
      cookTime: COOK.MEDIUM, category: 'SNACK',
      desc: 'Plain rice cakes topped with natural almond butter. Crunchy, portable, hits carbs and fat.',
      calories: 240, protein: 6, carbs: 28, fats: 12, meal: 'snack',
    },

    /* Batch Prep / 30+ mins */
    {
      id: 'chile-salsa', name: 'Dry-Roasted Chile de Arbol & Habanero Salsa',
      cookTime: COOK.BATCH, category: 'FLAVOR BOOST',
      desc: 'Dry-toasted arbol and habanero chiles, charred tomatillo, and garlic blended into a fire-orange sauce. ~2 kcal per tbsp.',
      calories: 10, protein: 0.4, carbs: 2.1, fats: 0.1, meal: 'snack',
    },
    {
      id: 'bulk-chicken', name: 'Bulk Grilled Chicken Breast (per serving)',
      cookTime: COOK.BATCH, category: 'HIGH PROTEIN',
      desc: 'Oven-roasted at 425F for 22 min. Season 6 at once, portion into containers.',
      calories: 280, protein: 52, carbs: 0, fats: 6, meal: 'lunch',
    },
    {
      id: 'quinoa-black-bean', name: 'Quinoa & Black Bean Base (per serving)',
      cookTime: COOK.BATCH, category: 'COMPLEX CARB',
      desc: 'Simmered quinoa and black beans with cumin and smoked paprika. Batch cook on Sunday.',
      calories: 345, protein: 15, carbs: 60, fats: 5, meal: 'lunch',
    },
    {
      id: 'sweet-potato', name: 'Slow-Roasted Sweet Potato Wedges',
      cookTime: COOK.BATCH, category: 'COMPLEX CARB',
      desc: 'Tossed with olive oil, smoked paprika, and cayenne. Roast at 400F for 35 min.',
      calories: 140, protein: 3, carbs: 32, fats: 2, meal: 'snack',
    },
    {
      id: 'turkey-meatballs', name: 'Turkey Meatball Batch (4 meatballs)',
      cookTime: COOK.BATCH, category: 'HIGH PROTEIN',
      desc: 'Lean ground turkey, oat flour binder, garlic, and Italian herbs. Bake 25 min at 375F.',
      calories: 280, protein: 32, carbs: 9, fats: 12, meal: 'dinner',
    },
    {
      id: 'baked-salmon', name: 'Baked Salmon Fillet (6oz)',
      cookTime: COOK.BATCH, category: 'BALANCED',
      desc: 'Skin-on salmon with olive oil, lemon, dill, and cracked pepper. 400F for 12-15 min.',
      calories: 355, protein: 40, carbs: 0, fats: 21, meal: 'dinner',
    },
    {
      id: 'lentil-soup', name: 'Red Lentil & Vegetable Soup (per bowl)',
      cookTime: COOK.BATCH, category: 'PLANT PROTEIN',
      desc: 'Red lentils, carrots, cumin, coriander, lemon. Simmers in 30 min, feeds you all week.',
      calories: 265, protein: 17, carbs: 42, fats: 3, meal: 'dinner',
    },
    {
      id: 'beef-broccoli', name: 'Beef & Broccoli Stir Fry',
      cookTime: COOK.BATCH, category: 'HIGH PROTEIN',
      desc: 'Flank steak strips with broccoli and ginger-soy-sesame sauce. Prep the sauce ahead.',
      calories: 425, protein: 38, carbs: 20, fats: 20, meal: 'dinner',
    },
  ];

  /* --- ALGORITHM -------------------------------------------- */
  const PROTEIN_WEIGHT = 2;
  const CARB_WEIGHT    = 1;
  const FAT_WEIGHT     = 1;
  const WEIGHT_SUM     = PROTEIN_WEIGHT + CARB_WEIGHT + FAT_WEIGHT;
  const MIN_CAL_FLOOR  = 5;

  function scoreFit(item, budget) {
    const ratio = (val, bud) => bud > 0 ? Math.min(val / bud, 1) : 0;
    const s =
      ratio(item.protein, budget.protein) * PROTEIN_WEIGHT +
      ratio(item.carbs,   budget.carbs)   * CARB_WEIGHT    +
      ratio(item.fats,    budget.fats)    * FAT_WEIGHT;
    return Math.round((s / WEIGHT_SUM) * 100);
  }

  function calFitPct(item, budget) {
    const floor = Math.max(budget.cal, MIN_CAL_FLOOR);
    return IronMacro.clamp(Math.round((item.calories / floor) * 100), 0, 100);
  }

  function fitsWithinBudget(item, budget) {
    const floor = Math.max(budget.cal, MIN_CAL_FLOOR);
    return (
      item.calories <= floor         &&
      item.protein  <= budget.protein + 1 &&
      item.carbs    <= budget.carbs   + 2 &&
      item.fats     <= budget.fats    + 1
    );
  }

  /* --- STATE ------------------------------------------------ */
  let activeFilter    = 'all';
  let searchMode      = false;
  let debounceTimer   = null;
  let abortController = null;

  /* --- ELEMENT CACHE ---------------------------------------- */
  const el = {};

  function cacheElements() {
    el.modal           = document.getElementById('recModal');
    el.modalClose      = document.getElementById('recModalClose');
    el.modalBody       = document.getElementById('rec-modalBody');
    el.modalCal        = document.getElementById('rec-modalCal');
    el.modalProtein    = document.getElementById('rec-modalProtein');
    el.modalCarbs      = document.getElementById('rec-modalCarbs');
    el.modalFats       = document.getElementById('rec-modalFats');
    el.modalBudgetNote = document.getElementById('rec-modalBudgetNote');
    el.timeFilters     = document.getElementById('rec-timeFilters');
    el.searchRow       = document.getElementById('rec-searchRow');
    el.searchInput     = document.getElementById('rec-searchInput');
    el.searchClear     = document.getElementById('rec-searchClear');
    el.dashTrigger     = document.getElementById('rec-dashboardTrigger');
  }

  /* --- BUDGET HELPER ---------------------------------------- */
  function getBudget() {
    const { goals, totals } = IronMacro.getState();
    const calTarget = (goals.calMin + goals.calMax) / 2;
    const netCal    = totals.calories - totals.burned;
    return {
      calTarget,
      cal:     Math.max(0, calTarget - netCal),
      protein: Math.max(0, goals.protein - totals.protein),
      carbs:   Math.max(0, goals.carbs   - totals.carbs),
      fats:    Math.max(0, goals.fats    - totals.fats),
    };
  }

  /* --- OPEN / CLOSE MODAL ----------------------------------- */
  function openModal() {
    const budget = getBudget();
    renderBudgetChips(budget);

    if (searchMode && el.searchInput?.value.trim().length >= MIN_QUERY_LEN) {
      // Re-run last search
      doSearch(el.searchInput.value.trim(), budget);
    } else {
      renderCuratedResults(budget);
    }

    el.modal?.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => el.searchInput?.focus(), 200);
  }

  function closeModal() {
    el.modal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* --- RENDER BUDGET CHIPS ---------------------------------- */
  function renderBudgetChips(budget) {
    const set = (domEl, val, unit) => {
      if (!domEl) return;
      domEl.textContent = `${Math.round(val)}${unit}`;
      domEl.closest('.rec-budget-chip')?.classList.toggle('rec-over', val <= 0);
    };
    set(el.modalCal,     budget.cal,     ' kcal');
    set(el.modalProtein, budget.protein, 'g');
    set(el.modalCarbs,   budget.carbs,   'g');
    set(el.modalFats,    budget.fats,    'g');

    const allMet = [budget.protein, budget.carbs, budget.fats, budget.cal].every(v => v <= 2);
    if (el.modalBudgetNote) {
      el.modalBudgetNote.textContent = allMet ? 'All targets met!' : 'until targets are hit';
    }
  }

  /* =========================================================
     CURATED RESULTS (local DB)
  ========================================================= */
  function renderCuratedResults(budget) {
    if (!el.modalBody) return;

    const allMet =
      budget.protein <= 2 && budget.carbs <= 5 &&
      budget.fats    <= 2 && budget.cal   <= 10;

    if (allMet) { el.modalBody.innerHTML = buildTargetsMetHTML(); return; }

    const results = RECIPE_DB
      .filter(r => activeFilter === 'all' || r.cookTime === activeFilter)
      .filter(r => fitsWithinBudget(r, budget))
      .map(r => ({ item: r, fitScore: scoreFit(r, budget), fitPct: calFitPct(r, budget) }))
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, MAX_CURATED);

    if (!results.length) {
      el.modalBody.innerHTML = buildEmptyHTML(budget, false);
      return;
    }

    const filterLabel = activeFilter === 'all'
      ? 'CURATED PICKS'
      : COOK_LABELS[activeFilter] + ' PICKS';

    const totalInFilter = RECIPE_DB.filter(r => activeFilter === 'all' || r.cookTime === activeFilter).length;

    el.modalBody.innerHTML =
      buildResultsHeader(filterLabel, results.length, totalInFilter) +
      results.map((r, i) => buildCuratedCardHTML(r.item, r.fitScore, r.fitPct, i)).join('');
  }

  /* =========================================================
     LIVE SEARCH (Open Food Facts)
  ========================================================= */
  function handleSearchInput(e) {
    const query = e.target.value.trim();

    // Update clear button and search row state
    el.searchRow?.classList.toggle('rec-has-query', query.length > 0);

    if (query.length < MIN_QUERY_LEN) {
      // Return to curated mode
      searchMode = false;
      el.timeFilters?.classList.remove('rec-hidden');

      // Cancel any pending search
      clearTimeout(debounceTimer);
      abortController?.abort();

      const budget = getBudget();
      renderBudgetChips(budget);
      renderCuratedResults(budget);
      return;
    }

    // Enter search mode
    searchMode = true;
    el.timeFilters?.classList.add('rec-hidden');

    // Show loading immediately
    el.modalBody.innerHTML = buildLoadingHTML(query);

    // Debounce the actual API call
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const budget = getBudget();
      renderBudgetChips(budget);
      doSearch(query, budget);
    }, DEBOUNCE_MS);
  }

  function clearSearch() {
    if (el.searchInput) el.searchInput.value = '';
    el.searchRow?.classList.remove('rec-has-query');
    handleSearchInput({ target: { value: '' } });
    el.searchInput?.focus();
  }

  async function doSearch(query, budget) {
    // Cancel any in-flight request
    abortController?.abort();
    abortController = new AbortController();

    try {
      const params = new URLSearchParams({
        search_terms: query,
        action:       'process',
        json:         '1',
        page_size:    String(SEARCH_LIMIT),
        fields:       'product_name,brands,serving_size,serving_quantity,nutriments',
        sort_by:      'unique_scans_n',   // popularity sort = more complete data
      });

      const res = await fetch(`${OFF_API}?${params}`, {
        signal: abortController.signal,
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      renderSearchResults(data.products || [], query, budget);

    } catch (err) {
      if (err.name === 'AbortError') return;  // user started a new search
      el.modalBody.innerHTML = buildErrorHTML(query);
      console.warn('OFF API error:', err);
    }
  }

  /**
   * Map a raw Open Food Facts product to a normalized macro object.
   * Prefers per-serving values; falls back to per-100g.
   * Returns null if essential nutrition data is missing.
   */
  function mapProduct(product) {
    const n = product.nutriments || {};

    // Prefer serving values — more realistic portion sizes
    const hasServing   = product.serving_size && n['energy-kcal_serving'] != null;
    const suffix       = hasServing ? '_serving' : '_100g';
    const servingLabel = hasServing ? `per ${product.serving_size}` : 'per 100g';

    const calories = Math.round(n[`energy-kcal${suffix}`] ?? n['energy-kcal_100g'] ?? 0);
    const protein  = Math.round((n[`proteins${suffix}`]       ?? n['proteins_100g']       ?? 0) * 10) / 10;
    const carbs    = Math.round((n[`carbohydrates${suffix}`]  ?? n['carbohydrates_100g']  ?? 0) * 10) / 10;
    const fats     = Math.round((n[`fat${suffix}`]            ?? n['fat_100g']            ?? 0) * 10) / 10;

    // Skip products with no usable nutrition data
    if (!calories && !protein && !carbs && !fats) return null;

    const name  = (product.product_name || '').trim();
    if (!name) return null;

    const brand = product.brands
      ? product.brands.split(',')[0].trim()
      : '';

    return {
      id:           `off-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name:         brand ? `${name} — ${brand}` : name,
      source:       'api',
      servingLabel,
      calories,
      protein,
      carbs,
      fats,
      meal:         'snack',
    };
  }

  function renderSearchResults(products, query, budget) {
    if (!el.modalBody) return;

    // Map, filter nulls, filter budget fits, score, sort
    const mapped = products
      .map(mapProduct)
      .filter(Boolean);

    // Split into: fits budget vs exceeds budget (show both, label exceeding ones)
    const fits    = mapped.filter(i => fitsWithinBudget(i, budget));
    const exceeds = mapped.filter(i => !fitsWithinBudget(i, budget));

    const scoredFits = fits
      .map(i => ({ item: i, fitScore: scoreFit(i, budget), fitPct: calFitPct(i, budget), over: false }))
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, MAX_API_DISPLAY);

    // Show a few over-budget items too so the user can see what's available
    const scoredOver = exceeds
      .slice(0, 3)
      .map(i => ({ item: i, fitScore: 0, fitPct: calFitPct(i, budget), over: true }));

    if (!scoredFits.length && !scoredOver.length) {
      el.modalBody.innerHTML = buildSearchEmptyHTML(query);
      return;
    }

    let html = '';

    if (scoredFits.length) {
      html += buildResultsHeader(
        `MATCHES FOR "${query.toUpperCase()}"`,
        scoredFits.length,
        mapped.length
      );
      html += scoredFits.map((r, i) => buildAPICardHTML(r.item, r.fitScore, r.fitPct, i, false)).join('');
    }

    if (scoredOver.length) {
      html += `
        <div class="rec-results-header" style="margin-top: var(--space-sm)">
          <span class="rec-results-label">EXCEEDS BUDGET</span>
          <div class="rec-result-sep"></div>
        </div>`;
      html += scoredOver.map((r, i) => buildAPICardHTML(r.item, 0, r.fitPct, i, true)).join('');
    }

    el.modalBody.innerHTML = html;
  }

  /* =========================================================
     HTML BUILDERS
  ========================================================= */
  function buildResultsHeader(label, count, total) {
    return `
      <div class="rec-results-header">
        <span class="rec-results-label">${label}</span>
        <div class="rec-result-sep"></div>
        <span class="rec-result-count">${count} of ${total} fit</span>
      </div>`;
  }

  function buildLoadingHTML(query) {
    return `
      <div class="rec-loading">
        <div class="rec-spinner"></div>
        <div class="rec-loading-text">SEARCHING OPEN FOOD FACTS</div>
        <div class="rec-loading-sub">Looking up "${query}"...</div>
      </div>`;
  }

  function buildCuratedCardHTML(recipe, fitScore, fitPct, index) {
    const cookClass = `rec-cook--${recipe.cookTime}`;
    const cookLabel = COOK_LABELS[recipe.cookTime];
    const clockSVG  = recipe.cookTime === 'batch'
      ? `<svg viewBox="0 0 12 12" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 012.5 1h7A1.5 1.5 0 0111 2.5v7A1.5 1.5 0 019.5 11h-7A1.5 1.5 0 011 9.5v-7zm1.5-.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h7a.5.5 0 00.5-.5v-7a.5.5 0 00-.5-.5h-7z"/></svg>`
      : `<svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 1a5 5 0 100 10A5 5 0 006 1zM0 6a6 6 0 1112 0A6 6 0 010 6z"/><path d="M6.5 3a.5.5 0 00-1 0v3.25l2 1.2a.5.5 0 00.5-.866L6.5 5.68V3z"/></svg>`;

    return `
      <div class="rec-card" data-cook="${recipe.cookTime}" data-recipe-id="${recipe.id}"
           style="animation-delay:${index * 60}ms">
        <div class="rec-card-body">
          <div class="rec-card-header">
            <div class="rec-card-name">${escapeHtml(recipe.name)}</div>
            <div class="rec-card-badges">
              <span class="rec-cook-badge ${cookClass}">${clockSVG}${cookLabel}</span>
              <span class="rec-cat-badge">${escapeHtml(recipe.category)}</span>
            </div>
          </div>
          ${macroPillsHTML(recipe)}
          <p class="rec-card-desc">${escapeHtml(recipe.desc)}</p>
          ${fitBarHTML(fitScore, fitPct)}
        </div>
        ${logButtonHTML(recipe.id)}
      </div>`;
  }

  function buildAPICardHTML(item, fitScore, fitPct, index, overBudget) {
    return `
      <div class="rec-card" data-cook="api" data-recipe-id="${item.id}"
           style="animation-delay:${index * 60}ms">
        <div class="rec-card-body">
          <div class="rec-card-header">
            <div class="rec-card-name">${escapeHtml(item.name)}</div>
            <div class="rec-card-badges">
              <span class="rec-cook-badge rec-cook--api">
                <svg viewBox="0 0 12 12" fill="currentColor"><path d="M0 3.5A1.5 1.5 0 011.5 2h9A1.5 1.5 0 0112 3.5V5a.5.5 0 01-.5.5 1.5 1.5 0 000 3 .5.5 0 01.5.5v1.5A1.5 1.5 0 0110.5 12h-9A1.5 1.5 0 010 10.5V9a.5.5 0 01.5-.5 1.5 1.5 0 000-3A.5.5 0 010 5V3.5z"/></svg>
                OPEN FOOD FACTS
              </span>
              <span class="rec-serving-note">${escapeHtml(item.servingLabel)}</span>
            </div>
          </div>
          ${macroPillsHTML(item)}
          ${overBudget ? `<div class="rec-exceeds-badge">Exceeds remaining budget</div>` : fitBarHTML(fitScore, fitPct)}
        </div>
        ${logButtonHTML(item.id)}
      </div>`;
  }

  function macroPillsHTML(item) {
    return `
      <div class="rec-card-macros">
        <div class="rec-macro-pill rec-pill--cal">
          <span class="rec-macro-pill-val">${item.calories}</span>
          <span class="rec-macro-pill-lbl">KCAL</span>
        </div>
        <div class="rec-macro-pill rec-pill--protein">
          <span class="rec-macro-pill-val">${item.protein}g</span>
          <span class="rec-macro-pill-lbl">PRO</span>
        </div>
        <div class="rec-macro-pill rec-pill--carbs">
          <span class="rec-macro-pill-val">${item.carbs}g</span>
          <span class="rec-macro-pill-lbl">CARB</span>
        </div>
        <div class="rec-macro-pill rec-pill--fats">
          <span class="rec-macro-pill-val">${item.fats}g</span>
          <span class="rec-macro-pill-lbl">FAT</span>
        </div>
      </div>`;
  }

  function fitBarHTML(fitScore, fitPct) {
    return `
      <div class="rec-fit-bar-wrap">
        <span class="rec-fit-label">MACRO FIT</span>
        <div class="rec-fit-track">
          <div class="rec-fit-fill" style="width:${fitScore}%"></div>
        </div>
        <span class="rec-fit-pct">${fitScore}%</span>
      </div>`;
  }

  function logButtonHTML(id) {
    return `
      <div class="rec-card-footer">
        <button class="rec-btn-log" data-recipe-id="${id}" type="button">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
          </svg>
          LOG THIS
        </button>
      </div>`;
  }

  function buildEmptyHTML(budget, isSearch, query = '') {
    const tooTight = budget.cal < 50;
    return `
      <div class="rec-empty-state">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
          <circle cx="24" cy="24" r="20"/>
          <line x1="24" y1="16" x2="24" y2="26"/>
          <circle cx="24" cy="32" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <div class="rec-empty-title">${tooTight ? 'BUDGET TOO TIGHT' : 'NO MATCHES'}</div>
        <p class="rec-empty-desc">
          ${tooTight
            ? `Only ${Math.round(budget.cal)} kcal remaining. Try logging a workout to open up more budget.`
            : `No curated picks match your current budget under the selected time filter. Try "Any Time" or search Open Food Facts above.`}
        </p>
      </div>`;
  }

  function buildSearchEmptyHTML(query) {
    return `
      <div class="rec-empty-state">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
          <circle cx="22" cy="22" r="16"/>
          <line x1="33" y1="33" x2="44" y2="44"/>
          <line x1="22" y1="14" x2="22" y2="30"/>
          <circle cx="22" cy="32" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <div class="rec-empty-title">NO RESULTS</div>
        <p class="rec-empty-desc">
          Open Food Facts returned no products for "<strong>${escapeHtml(query)}</strong>".
          Try a simpler term like "chicken", "oats", or "yogurt".
        </p>
      </div>`;
  }

  function buildErrorHTML(query) {
    return `
      <div class="rec-error-state">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
          <circle cx="24" cy="24" r="20"/>
          <line x1="24" y1="14" x2="24" y2="28"/>
          <circle cx="24" cy="34" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <div class="rec-error-title">CONNECTION ERROR</div>
        <p class="rec-error-desc">
          Could not reach Open Food Facts. Check your internet connection and try again.
          Your curated picks still work offline — clear the search box to see them.
        </p>
      </div>`;
  }

  function buildTargetsMetHTML() {
    return `
      <div class="rec-targets-met">
        <span class="rec-targets-met-badge">ALL TARGETS MET</span>
        <div class="rec-targets-met-title">You nailed it.</div>
        <p class="rec-targets-met-desc">
          Calories, protein, carbs, and fats are all dialed in for today.
          Come back tomorrow or log a workout to open up more budget.
        </p>
      </div>`;
  }

  /* --- EVENT HANDLERS --------------------------------------- */
  function handleFilterClick(e) {
    const chip = e.target.closest('[data-time]');
    if (!chip) return;
    activeFilter = chip.dataset.time;
    el.timeFilters?.querySelectorAll('.rec-time-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.time === activeFilter);
    });
    const budget = getBudget();
    renderBudgetChips(budget);
    renderCuratedResults(budget);
  }

  /**
   * "Log This" handler — works for both curated and API items.
   * API items are stored in a session map so we can look them up by ID.
   */
  const sessionItems = {};   // id -> item object (populated as cards are built)

  function handleLogThis(e) {
    const btn = e.target.closest('[data-recipe-id]');
    if (!btn || btn.classList.contains('rec-btn--logged')) return;

    const id = btn.dataset.recipeId;

    // Try curated DB first
    let item = RECIPE_DB.find(r => r.id === id);

    // Fall back to session item cache (API results)
    if (!item) item = sessionItems[id];

    if (!item) return;

    IronMacro.addFoodEntry({
      name:     item.name,
      calories: item.calories,
      protein:  item.protein,
      carbs:    item.carbs,
      fats:     item.fats,
      meal:     item.meal || 'snack',
    });

    if (typeof FoodLogger !== 'undefined') FoodLogger.refresh();

    btn.classList.add('rec-btn--logged');
    btn.innerHTML = `
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425z"/>
      </svg>
      LOGGED!
    `;

    const shortName = item.name.split(' ').slice(0, 4).join(' ');
    IronMacro.showToast(`${shortName}... added`, 'success');

    setTimeout(closeModal, 900);
  }

  /**
   * Before rendering API cards we need to cache the item objects
   * so handleLogThis can find them by ID. We hook into mapProduct.
   * Override mapProduct to also store in sessionItems.
   */
  const _origMapProduct = mapProduct;
  function mapProductAndCache(product) {
    const item = _origMapProduct(product);
    if (item) sessionItems[item.id] = item;
    return item;
  }

  /* --- UTILITY ---------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Patch renderSearchResults to use the caching version */
  const _origRenderSearch = renderSearchResults;
  function renderSearchResults(products, query, budget) {
    if (!el.modalBody) return;

    const mapped = products.map(mapProductAndCache).filter(Boolean);
    const fits   = mapped.filter(i => fitsWithinBudget(i, budget));
    const exceeds = mapped.filter(i => !fitsWithinBudget(i, budget));

    const scoredFits = fits
      .map(i => ({ item: i, fitScore: scoreFit(i, budget), fitPct: calFitPct(i, budget) }))
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, MAX_API_DISPLAY);

    const scoredOver = exceeds
      .slice(0, 3)
      .map(i => ({ item: i, fitScore: 0, fitPct: calFitPct(i, budget) }));

    if (!scoredFits.length && !scoredOver.length) {
      el.modalBody.innerHTML = buildSearchEmptyHTML(query);
      return;
    }

    let html = '';
    if (scoredFits.length) {
      html += buildResultsHeader(
        `MATCHES FOR "${query.toUpperCase()}"`,
        scoredFits.length,
        mapped.length
      );
      html += scoredFits.map((r, i) => buildAPICardHTML(r.item, r.fitScore, r.fitPct, i, false)).join('');
    }
    if (scoredOver.length) {
      html += `
        <div class="rec-results-header" style="margin-top:var(--space-sm)">
          <span class="rec-results-label">EXCEEDS BUDGET</span>
          <div class="rec-result-sep"></div>
        </div>`;
      html += scoredOver.map((r, i) => buildAPICardHTML(r.item, 0, r.fitPct, i, true)).join('');
    }
    el.modalBody.innerHTML = html;
  }

  /* --- INIT ------------------------------------------------- */
  function init() {
    if (!document.getElementById('recModal')) return;
    cacheElements();

    el.dashTrigger?.addEventListener('click', openModal);
    el.modalClose?.addEventListener('click', closeModal);
    el.modal?.addEventListener('click', e => { if (e.target === el.modal) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el.modal?.classList.contains('open')) closeModal();
    });

    el.timeFilters?.addEventListener('click', handleFilterClick);
    el.searchInput?.addEventListener('input', handleSearchInput);
    el.searchClear?.addEventListener('click', clearSearch);
    el.modalBody?.addEventListener('click', handleLogThis);

    console.info(
      '%cRECOMMENDATION ENGINE%c | %d curated recipes | OFF live search enabled',
      'color:#f4650c;font-weight:bold;font-family:monospace',
      'color:#8a90aa;font-family:monospace',
      RECIPE_DB.length
    );
  }

  document.addEventListener('DOMContentLoaded', init);

  return { open: openModal };

})();