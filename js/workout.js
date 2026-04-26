/**
 * =============================================================
 * MACROBASE -- workout.js  (Module 02)
 * Workout Logger: search-first activity picker, MET-based calorie
 * estimation, wger.de live exercise search, history feed.
 *
 * Activity selection flow:
 *   1. User searches or browses by category
 *   2. Local 55-exercise MET database is filtered immediately
 *   3. wger.de API is queried (>=2 chars, debounced 380ms)
 *   4. User taps a result row → activity is "selected"
 *   5. User enters duration → calories auto-estimated from MET
 *   6. Submit → MacroBase.addWorkoutEntry() → dashboard updates
 *
 * Depends on: MacroBase (app.js)
 * Public API: WorkoutLogger.refresh()
 * =============================================================
 */

const WorkoutLogger = (() => {
  'use strict';

  /* --- WGER API CONFIG -------------------------------------- */
  const WGER_SEARCH_URL = 'https://wger.de/api/v2/exercise/search/';
  const DEBOUNCE_MS     = 380;
  const MIN_QUERY_LEN   = 2;
  const MAX_API_RESULTS = 8;
  const DEFAULT_BODY_KG = 80;

  /* --- LOCAL EXERCISE DATABASE (55 items, MET values from
         Compendium of Physical Activities, Ainsworth et al.) --- */
  const EXERCISE_DB = [

    /* ---- STRENGTH ---------------------------------------- */
    { id: 'squat',        name: 'Barbell Squat',              category: 'strength',    met: 5.0, emoji: '🏋️', desc: 'Compound lower-body, quads & glutes primary' },
    { id: 'deadlift',     name: 'Deadlift',                   category: 'strength',    met: 6.0, emoji: '🏋️', desc: 'Full-body pull from the floor' },
    { id: 'bench',        name: 'Bench Press',                category: 'strength',    met: 4.0, emoji: '💪', desc: 'Horizontal push, chest primary' },
    { id: 'ohp',          name: 'Overhead Press',             category: 'strength',    met: 4.5, emoji: '💪', desc: 'Vertical push, shoulders primary' },
    { id: 'row',          name: 'Bent-over Row',              category: 'strength',    met: 4.5, emoji: '💪', desc: 'Horizontal pull, back primary' },
    { id: 'pullup',       name: 'Pull-ups / Chin-ups',        category: 'strength',    met: 8.0, emoji: '💪', desc: 'Bodyweight vertical pull' },
    { id: 'pushup',       name: 'Push-ups',                   category: 'strength',    met: 3.8, emoji: '💪', desc: 'Bodyweight horizontal push' },
    { id: 'dips',         name: 'Dips',                       category: 'strength',    met: 4.0, emoji: '💪', desc: 'Bodyweight tricep / chest movement' },
    { id: 'lunge',        name: 'Lunges',                     category: 'strength',    met: 4.0, emoji: '🦵', desc: 'Unilateral lower-body movement' },
    { id: 'legpress',     name: 'Leg Press',                  category: 'strength',    met: 4.0, emoji: '🦵', desc: 'Machine lower-body push' },
    { id: 'rdl',          name: 'Romanian Deadlift',          category: 'strength',    met: 4.5, emoji: '🏋️', desc: 'Hip hinge, hamstrings primary' },
    { id: 'curls',        name: 'Dumbbell Curls',             category: 'strength',    met: 3.0, emoji: '💪', desc: 'Bicep isolation' },
    { id: 'tricep-ext',   name: 'Tricep Extensions',          category: 'strength',    met: 3.0, emoji: '💪', desc: 'Tricep isolation' },
    { id: 'plank',        name: 'Plank',                      category: 'strength',    met: 3.0, emoji: '🔥', desc: 'Core isometric hold' },
    { id: 'crunches',     name: 'Sit-ups / Crunches',         category: 'strength',    met: 3.0, emoji: '🔥', desc: 'Core flexion movement' },
    { id: 'kettlebell',   name: 'Kettlebell Training',        category: 'strength',    met: 5.0, emoji: '🏋️', desc: 'Swings, cleans, carries' },
    { id: 'gen-strength', name: 'Strength Training (General)', category: 'strength',   met: 5.0, emoji: '🏋️', desc: 'Mixed resistance training session' },

    /* ---- CARDIO ------------------------------------------ */
    { id: 'run-easy',     name: 'Running (easy, ~5 mph)',     category: 'cardio',      met: 8.3,  emoji: '🏃', desc: '~12 min/mile pace' },
    { id: 'run-mod',      name: 'Running (moderate, ~6 mph)', category: 'cardio',      met: 9.8,  emoji: '🏃', desc: '~10 min/mile pace' },
    { id: 'run-fast',     name: 'Running (fast, ~8 mph)',     category: 'cardio',      met: 11.8, emoji: '🏃', desc: '~7.5 min/mile pace' },
    { id: 'walk',         name: 'Brisk Walking',              category: 'cardio',      met: 3.5,  emoji: '🚶', desc: '3.5–4 mph' },
    { id: 'cycle-mod',    name: 'Cycling (moderate)',         category: 'cardio',      met: 8.0,  emoji: '🚴', desc: '12–14 mph' },
    { id: 'cycle-vig',    name: 'Cycling (vigorous)',         category: 'cardio',      met: 12.0, emoji: '🚴', desc: '16–19 mph' },
    { id: 'elliptical',   name: 'Elliptical Trainer',         category: 'cardio',      met: 5.0,  emoji: '🔄', desc: 'Low-impact steady state' },
    { id: 'rowing-mach',  name: 'Rowing Machine',             category: 'cardio',      met: 7.0,  emoji: '🚣', desc: 'Moderate effort' },
    { id: 'jumprope',     name: 'Jump Rope',                  category: 'cardio',      met: 11.0, emoji: '⚡', desc: 'Continuous jumping' },
    { id: 'stairmaster',  name: 'Stairmaster / Step Mill',    category: 'cardio',      met: 9.0,  emoji: '🪜', desc: 'Moderate pace' },
    { id: 'swim-laps',    name: 'Swimming (laps, freestyle)', category: 'cardio',      met: 8.0,  emoji: '🏊', desc: 'Moderate effort' },
    { id: 'hiit',         name: 'HIIT / Interval Training',   category: 'cardio',      met: 8.0,  emoji: '⚡', desc: 'High-intensity intervals' },
    { id: 'burpees',      name: 'Burpees',                    category: 'cardio',      met: 8.0,  emoji: '⚡', desc: 'Full-body cardio movement' },
    { id: 'spin',         name: 'Spin Class',                 category: 'cardio',      met: 8.5,  emoji: '🚴', desc: 'High-intensity indoor cycling' },

    /* ---- SPORTS ------------------------------------------ */
    { id: 'basketball',   name: 'Basketball',                 category: 'sports',      met: 8.0,  emoji: '🏀', desc: 'Game play or pickup' },
    { id: 'soccer',       name: 'Soccer / Football',          category: 'sports',      met: 7.0,  emoji: '⚽', desc: 'Recreational or competitive' },
    { id: 'tennis',       name: 'Tennis (singles)',           category: 'sports',      met: 7.3,  emoji: '🎾', desc: 'Active competitive play' },
    { id: 'volleyball',   name: 'Volleyball',                 category: 'sports',      met: 4.0,  emoji: '🏐', desc: 'Non-competitive / recreational' },
    { id: 'baseball',     name: 'Baseball / Softball',        category: 'sports',      met: 5.0,  emoji: '⚾', desc: 'General play' },
    { id: 'golf',         name: 'Golf (walking the course)',  category: 'sports',      met: 4.3,  emoji: '⛳', desc: 'Walking, carrying clubs' },
    { id: 'boxing-bag',   name: 'Boxing (bag / pad work)',    category: 'sports',      met: 6.0,  emoji: '🥊', desc: 'Heavy bag or pad training' },
    { id: 'boxing-spar',  name: 'Boxing (sparring)',          category: 'sports',      met: 9.0,  emoji: '🥊', desc: 'Active sparring rounds' },
    { id: 'mma',          name: 'MMA Training',               category: 'sports',      met: 9.0,  emoji: '🥋', desc: 'Mixed martial arts practice' },
    { id: 'martial-arts', name: 'Martial Arts (general)',     category: 'sports',      met: 10.0, emoji: '🥋', desc: 'Karate, judo, jiu-jitsu' },

    /* ---- OUTDOOR ----------------------------------------- */
    { id: 'skate-flat',   name: 'Skateboarding (Flatground)', category: 'outdoor',     met: 5.0,  emoji: '🛹', desc: 'Street skating / trick practice' },
    { id: 'skate-park',   name: 'Skateboarding (Park / Bowl)', category: 'outdoor',    met: 6.5,  emoji: '🛹', desc: 'Transitions, ramps, bowl sessions' },
    { id: 'bouldering',   name: 'Bouldering / Rock Climbing', category: 'outdoor',     met: 7.5,  emoji: '🧗', desc: 'Indoor or outdoor climbing' },
    { id: 'hiking',       name: 'Hiking (moderate trail)',    category: 'outdoor',     met: 5.3,  emoji: '🥾', desc: 'Moderate terrain, light pack' },
    { id: 'hiking-hard',  name: 'Hiking (steep / heavy pack)', category: 'outdoor',   met: 7.0,  emoji: '🥾', desc: 'Uphill or backpacking' },
    { id: 'mtb',          name: 'Mountain Biking',            category: 'outdoor',     met: 8.5,  emoji: '🚵', desc: 'Trail riding' },
    { id: 'surfing',      name: 'Surfing',                    category: 'outdoor',     met: 3.0,  emoji: '🏄', desc: 'General surfing session' },
    { id: 'kayaking',     name: 'Kayaking',                   category: 'outdoor',     met: 5.0,  emoji: '🚣', desc: 'Moderate effort' },
    { id: 'skiing',       name: 'Skiing (downhill)',          category: 'outdoor',     met: 7.0,  emoji: '⛷️', desc: 'Active downhill runs' },
    { id: 'snowboard',    name: 'Snowboarding',               category: 'outdoor',     met: 5.3,  emoji: '🏂', desc: 'Active riding' },

    /* ---- FLEXIBILITY / MOBILITY -------------------------- */
    { id: 'yoga',         name: 'Yoga (hatha / general)',     category: 'flexibility', met: 3.0,  emoji: '🧘', desc: 'Poses, breathing, meditation' },
    { id: 'yoga-power',   name: 'Power Yoga / Vinyasa',       category: 'flexibility', met: 4.0,  emoji: '🧘', desc: 'Active flow yoga' },
    { id: 'pilates',      name: 'Pilates',                    category: 'flexibility', met: 3.0,  emoji: '🧘', desc: 'Mat or reformer' },
    { id: 'stretching',   name: 'Stretching / Mobility Work', category: 'flexibility', met: 2.5,  emoji: '🤸', desc: 'Active or passive stretching' },
    { id: 'foam-roll',    name: 'Foam Rolling / Recovery',    category: 'flexibility', met: 2.0,  emoji: '⬜', desc: 'Myofascial release' },
  ];

  /* --- MET mapping for wger.de category strings ------------ */
  const WGER_CATEGORY_MET = {
    'Arms':      { cat: 'strength',    met: 3.5 },
    'Legs':      { cat: 'strength',    met: 5.0 },
    'Back':      { cat: 'strength',    met: 4.5 },
    'Chest':     { cat: 'strength',    met: 4.0 },
    'Shoulders': { cat: 'strength',    met: 4.5 },
    'Biceps':    { cat: 'strength',    met: 3.0 },
    'Triceps':   { cat: 'strength',    met: 3.0 },
    'Abs':       { cat: 'strength',    met: 3.5 },
    'Calves':    { cat: 'strength',    met: 4.0 },
    'Core':      { cat: 'strength',    met: 3.5 },
    'Cardio':    { cat: 'cardio',      met: 8.0 },
  };

  /* --- INTENSITY LABELS (MET-based) ------------------------ */
  function intensityLabel(met) {
    if (met < 3)   return 'Very Light';
    if (met < 6)   return 'Moderate';
    if (met < 9)   return 'Vigorous';
    return 'Max Effort';
  }

  /* --- STATE ----------------------------------------------- */
  let selectedActivity = null;   // { id, name, category, met, emoji, source }
  let activeCategory   = 'all';
  let searchQuery      = '';
  let searchTimer      = null;
  let abortController  = null;

  /* --- ELEMENT CACHE --------------------------------------- */
  const el = {};

  function cacheElements() {
    el.form              = document.getElementById('workoutEntryForm');
    // Activity picker
    el.activitySelected  = document.getElementById('wl-activitySelected');
    el.selIcon           = document.getElementById('wl-selIcon');
    el.selName           = document.getElementById('wl-selName');
    el.selMeta           = document.getElementById('wl-selMeta');
    el.changeActivity    = document.getElementById('wl-changeActivity');
    el.activityPicker    = document.getElementById('wl-activityPicker');
    el.pickerSearchWrap  = document.querySelector('.wl-picker-search-wrap');
    el.activitySearch    = document.getElementById('wl-activitySearch');
    el.searchClear       = document.getElementById('wl-searchClear');
    el.categoryChips     = document.getElementById('wl-categoryChips');
    el.activityResults   = document.getElementById('wl-activityResults');
    // Metrics
    el.duration          = document.getElementById('wl-duration');
    el.calories          = document.getElementById('wl-calories');
    el.calEstHint        = document.getElementById('wl-calEstHint');
    el.notes             = document.getElementById('wl-notes');
    el.clearBtn          = document.getElementById('wl-clearForm');
    el.submitBtn         = document.getElementById('wl-submit');
    // History
    el.history           = document.getElementById('wl-history');
    el.sessionLabel      = document.getElementById('wl-sessionLabel');
    el.totalBurned       = document.getElementById('wl-totalBurned');
    el.sessionCount      = document.getElementById('wl-sessionCount');
    el.totalMinutes      = document.getElementById('wl-totalMinutes');
  }

  /* --- HELPERS --------------------------------------------- */
  const fmt = (n) => MacroBase.fmt(n);

  function estimateBurn(met, durationMin) {
    if (!met || !durationMin) return 0;
    return Math.round(met * DEFAULT_BODY_KG * (durationMin / 60));
  }

  function updateCalEstHint() {
    if (!el.calEstHint) return;
    const durationVal = parseFloat(el.duration?.value) || 0;
    const calIsEmpty  = !el.calories?.value;
    if (selectedActivity && durationVal > 0 && calIsEmpty) {
      const est = estimateBurn(selectedActivity.met, durationVal);
      el.calEstHint.textContent = `AUTO-EST: ${fmt(est)} kcal (MET ${selectedActivity.met})`;
    } else {
      el.calEstHint.textContent = '';
    }
  }

  /* =========================================================
     ACTIVITY PICKER
  ========================================================= */

  function initActivityPicker() {
    // Render initial local results
    renderLocalResults('', 'all');

    // Search input
    el.activitySearch?.addEventListener('input', handleSearchInput);

    // Clear button
    el.searchClear?.addEventListener('click', () => {
      if (el.activitySearch) el.activitySearch.value = '';
      el.pickerSearchWrap?.classList.remove('has-query');
      searchQuery = '';
      clearTimeout(searchTimer);
      abortController?.abort();
      renderLocalResults('', activeCategory);
    });

    // Category chips
    el.categoryChips?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      activeCategory = chip.dataset.cat;
      el.categoryChips.querySelectorAll('.wl-cat-chip').forEach(c =>
        c.classList.toggle('active', c.dataset.cat === activeCategory)
      );
      // Re-run current search with new category filter
      if (searchQuery.length >= MIN_QUERY_LEN) {
        renderLocalResults(searchQuery, activeCategory);
        debouncedFetchWger(searchQuery);
      } else {
        renderLocalResults(searchQuery, activeCategory);
      }
    });

    // Result row delegation (on the results container)
    el.activityResults?.addEventListener('click', handleResultClick);

    // "Change" button (deselect)
    el.changeActivity?.addEventListener('click', clearActivitySelection);
  }

  function handleSearchInput(e) {
    searchQuery = e.target.value.trim();
    el.pickerSearchWrap?.classList.toggle('has-query', searchQuery.length > 0);

    // Always update local results immediately
    renderLocalResults(searchQuery, activeCategory);

    // Debounce the API call
    clearTimeout(searchTimer);
    abortController?.abort();

    if (searchQuery.length >= MIN_QUERY_LEN) {
      searchTimer = setTimeout(() => debouncedFetchWger(searchQuery), DEBOUNCE_MS);
    }
  }

  /* --- Local DB filter ------------------------------------- */
  function filterLocalDB(query, category) {
    const q = query.toLowerCase();
    return EXERCISE_DB.filter(ex => {
      const matchesCat = category === 'all' || ex.category === category;
      const matchesQuery = !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.desc.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }

  function renderLocalResults(query, category) {
    const items = filterLocalDB(query, category);
    const html = items.length
      ? items.map((item, i) => buildResultHTML(item, i, 'local')).join('')
      : `<div class="wl-results-empty">
           <div class="wl-results-empty-text">No local matches — try the live search above</div>
         </div>`;

    el.activityResults.innerHTML =
      `<div class="wl-results-section-label">LOCAL DATABASE (${items.length})</div>` + html;
  }

  /* --- wger.de API search ---------------------------------- */
  async function debouncedFetchWger(query) {
    abortController = new AbortController();

    // Show loading under local results
    const loadingSection = `
      <div class="wl-results-section-label">WGER.DE EXERCISE DATABASE</div>
      <div class="wl-results-loading">
        <div class="wl-results-spinner"></div>
        <div class="wl-results-loading-text">SEARCHING WGER.DE...</div>
      </div>`;

    // Append loading indicator to existing local results
    const sectionLabel = el.activityResults.querySelector('.wl-results-section-label');
    if (sectionLabel) {
      sectionLabel.insertAdjacentHTML('afterend',
        `<div id="wl-apiSection">${loadingSection}</div>`);
    }

    try {
      const url = `${WGER_SEARCH_URL}?term=${encodeURIComponent(query)}&language=english&format=json`;
      const res = await fetch(url, {
        signal: abortController.signal,
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      appendWgerResults(data.suggestions || [], query);

    } catch (err) {
      if (err.name === 'AbortError') return;
      // Silently remove loading section on error -- local results still show
      document.getElementById('wl-apiSection')?.remove();
    }
  }

  function mapWgerExercise(suggestion) {
    const name = suggestion.value || '';
    const data = suggestion.data || {};
    const catStr  = data.category || '';
    const mapping = WGER_CATEGORY_MET[catStr] || { cat: 'strength', met: 4.0 };

    return {
      id:       `wger-${data.base_id || data.id || Math.random().toString(36).slice(2)}`,
      name:     name,
      category: mapping.cat,
      met:      mapping.met,
      emoji:    '🌐',
      desc:     catStr ? `${catStr} exercise` : 'Exercise from wger.de',
      source:   'wger',
    };
  }

  function appendWgerResults(suggestions, query) {
    const apiSection = document.getElementById('wl-apiSection');
    if (!apiSection) return;

    // Filter out any whose names already appear in local results
    const localNames = new Set(
      filterLocalDB(query, 'all').map(e => e.name.toLowerCase())
    );

    const mapped = suggestions
      .map(mapWgerExercise)
      .filter(e => e.name && !localNames.has(e.name.toLowerCase()))
      .slice(0, MAX_API_RESULTS);

    if (!mapped.length) {
      apiSection.remove();
      return;
    }

    apiSection.innerHTML =
      `<div class="wl-results-section-label">WGER.DE EXERCISE DATABASE (${mapped.length})</div>` +
      mapped.map((item, i) => buildResultHTML(item, i, 'wger')).join('');

    // Wire up clicks on newly injected rows
    apiSection.querySelectorAll('.wl-result-item').forEach(row => {
      row.addEventListener('click', handleResultClick);
    });
  }

  /* --- Result row HTML ------------------------------------- */
  function buildResultHTML(item, index, source) {
    const catClass = `wl-cat--${item.category}`;
    const sourceTag = source === 'wger'
      ? `<span class="wl-result-source">WGER</span>`
      : '';

    return `
      <div class="wl-result-item" data-exercise-id="${escapeHtml(item.id)}"
           style="animation-delay:${index * 25}ms" role="listitem">
        <div class="wl-result-emoji" aria-hidden="true">${item.emoji || '💪'}</div>
        <div class="wl-result-text">
          <div class="wl-result-name">${escapeHtml(item.name)}</div>
          <div class="wl-result-meta">
            <span class="wl-result-cat ${catClass}">${item.category.toUpperCase()}</span>
            <span class="wl-result-intensity">${intensityLabel(item.met)} · MET ${item.met}</span>
            ${sourceTag}
          </div>
        </div>
        <button class="wl-result-select" type="button" tabindex="-1" aria-hidden="true">SELECT</button>
      </div>`;
  }

  function handleResultClick(e) {
    const row = e.target.closest('.wl-result-item');
    if (!row) return;

    const exerciseId = row.dataset.exerciseId;

    // Find in local DB first, then session wger cache
    let activity = EXERCISE_DB.find(ex => ex.id === exerciseId);
    if (!activity) {
      // Look in rendered wger section by name (rebuilding from DOM)
      const nameEl = row.querySelector('.wl-result-name');
      const catEl  = row.querySelector('.wl-result-cat');
      const metText = row.querySelector('.wl-result-intensity')?.textContent || '';
      const metMatch = metText.match(/MET\s+([\d.]+)/);
      if (nameEl) {
        activity = {
          id:       exerciseId,
          name:     nameEl.textContent.trim(),
          category: catEl?.textContent.trim().toLowerCase() || 'strength',
          met:      metMatch ? parseFloat(metMatch[1]) : 4.0,
          emoji:    '🌐',
          source:   'wger',
        };
      }
    }

    if (activity) selectActivity(activity);
  }

  /* --- Select / deselect activity -------------------------- */
  function selectActivity(activity) {
    selectedActivity = activity;

    // Update selected display
    if (el.selIcon)  el.selIcon.textContent  = activity.emoji || '💪';
    if (el.selName)  el.selName.textContent  = activity.name;
    if (el.selMeta)  el.selMeta.textContent  =
      `${activity.category.toUpperCase()} · ${intensityLabel(activity.met)} · MET ${activity.met}`;

    // Toggle visibility
    el.activitySelected?.classList.add('visible');
    if (el.activityPicker) el.activityPicker.style.display = 'none';

    // Update cal hint
    updateCalEstHint();

    // Focus duration field
    setTimeout(() => el.duration?.focus(), 100);
  }

  function clearActivitySelection() {
    selectedActivity = null;
    el.activitySelected?.classList.remove('visible');
    if (el.activityPicker) el.activityPicker.style.display = '';
    updateCalEstHint();
    setTimeout(() => el.activitySearch?.focus(), 100);
  }

  /* =========================================================
     FORM HANDLING
  ========================================================= */

  function readForm() {
    return {
      duration: Math.max(0, parseFloat(el.duration?.value) || 0),
      calories: Math.max(0, parseFloat(el.calories?.value) || 0),
      notes:    el.notes?.value.trim() || '',
    };
  }

  function clearForm() {
    el.form?.reset();
    clearActivitySelection();
    updateCalEstHint();
    el.activitySearch?.focus();
  }

  function flashError(input) {
    if (!input) return;
    input.classList.remove('wl-input--error');
    void input.offsetWidth;
    input.classList.add('wl-input--error');
    setTimeout(() => input.classList.remove('wl-input--error'), 500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const v = readForm();

    // Validate: must have selected an activity
    if (!selectedActivity) {
      MacroBase.showToast('Select an activity first.', 'error');
      el.activitySearch?.focus();
      return;
    }

    // Validate duration
    if (!v.duration || v.duration < 1) {
      flashError(el.duration);
      MacroBase.showToast('Enter a duration (minutes).', 'error');
      el.duration?.focus();
      return;
    }

    // Auto-fill calories from MET if left blank
    const finalCalories = v.calories || estimateBurn(selectedActivity.met, v.duration);

    MacroBase.addWorkoutEntry({
      name:          selectedActivity.name,
      activityKey:   selectedActivity.id,
      activityEmoji: selectedActivity.emoji || '💪',
      caloriesBurned:finalCalories,
      duration:      v.duration,
      notes:         v.notes,
    });

    animateSubmitSuccess();
    MacroBase.showToast(`${selectedActivity.name.split(' ').slice(0,3).join(' ')}... logged`, 'success');

    clearForm();
    refreshHistory();
    refreshHeaderStats();
  }

  function animateSubmitSuccess() {
    if (!el.submitBtn) return;
    const original = el.submitBtn.innerHTML;
    el.submitBtn.classList.add('wl-submit--success');
    el.submitBtn.innerHTML = `
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425z"/>
      </svg>
      LOGGED!
    `;
    setTimeout(() => {
      el.submitBtn.classList.remove('wl-submit--success');
      el.submitBtn.innerHTML = original;
    }, 1300);
  }

  /* =========================================================
     HISTORY FEED
  ========================================================= */

  function getWorkoutEntries() {
    const { log } = MacroBase.getState();
    return log.filter(e => e.type === 'workout').slice().reverse();
  }

  function refreshHistory() {
    if (!el.history) return;
    const entries = getWorkoutEntries();
    const count   = entries.length;

    if (el.sessionLabel) {
      el.sessionLabel.textContent = `${count} ${count === 1 ? 'SESSION' : 'SESSIONS'}`;
    }

    if (count === 0) {
      el.history.innerHTML = `
        <div class="wl-history-empty">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
            <rect x="5" y="19" width="8" height="20" rx="2"/>
            <rect x="35" y="19" width="8" height="20" rx="2"/>
            <rect x="13" y="24" width="22" height="10" rx="1"/>
            <line x1="20" y1="10" x2="20" y2="19"/>
            <line x1="28" y1="10" x2="28" y2="19"/>
          </svg>
          <p>No sessions logged yet today.</p>
        </div>`;
      return;
    }

    el.history.innerHTML =
      entries.map(buildEntryHTML).join('') +
      buildTotalsHTML(entries);
  }

  function buildEntryHTML(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    const emoji   = entry.activityEmoji || '💪';
    const notes   = entry.notes ? `<div class="wl-entry-notes">${escapeHtml(entry.notes)}</div>` : '';
    const durBadge = entry.duration ? `<span class="wl-entry-duration-badge">${entry.duration} min</span>` : '';

    return `
      <div class="wl-entry" data-entry-id="${entry.id}">
        <div class="wl-entry-icon wl-entry-icon--other" aria-hidden="true" style="font-size:1.25rem;line-height:1">
          ${emoji}
        </div>
        <div class="wl-entry-info">
          <div class="wl-entry-name">${escapeHtml(entry.name)}</div>
          <div class="wl-entry-meta">
            ${durBadge}
            <span class="wl-entry-time">${time}</span>
          </div>
          ${notes}
        </div>
        <div class="wl-entry-right">
          <div>
            <div class="wl-entry-cal-value">-${fmt(entry.caloriesBurned || 0)}</div>
            <div class="wl-entry-cal-unit">KCAL</div>
          </div>
          <button class="wl-entry-delete" data-delete-id="${entry.id}"
                  title="Remove session" type="button"
                  aria-label="Remove ${escapeHtml(entry.name)}">
            <svg viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 11.708-.708L6 5.293l3.146-3.147a.5.5 0 01.708.708L6.707 6l3.147 3.146a.5.5 0 01-.708.708L6 6.707 2.854 9.854a.5.5 0 01-.708-.708L5.293 6 2.146 2.854z"/>
            </svg>
          </button>
        </div>
      </div>`;
  }

  function buildTotalsHTML(entries) {
    const burned  = entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
    const minutes = entries.reduce((s, e) => s + (e.duration || 0), 0);
    return `
      <div class="wl-history-totals">
        <span class="wl-totals-label">TOTAL</span>
        <div class="wl-totals-stat">
          <span class="wl-totals-val">${fmt(burned)}</span>
          <span class="wl-totals-lbl">KCAL BURNED</span>
        </div>
        <div class="wl-totals-divider"></div>
        <div class="wl-totals-stat">
          <span class="wl-totals-val">${minutes}</span>
          <span class="wl-totals-lbl">MINUTES</span>
        </div>
        <div class="wl-totals-divider"></div>
        <div class="wl-totals-stat">
          <span class="wl-totals-val">${entries.length}</span>
          <span class="wl-totals-lbl">SESSIONS</span>
        </div>
      </div>`;
  }

  function refreshHeaderStats() {
    const { log } = MacroBase.getState();
    const workouts = log.filter(e => e.type === 'workout');
    const burned   = workouts.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
    const minutes  = workouts.reduce((s, e) => s + (e.duration || 0), 0);
    if (el.totalBurned)  el.totalBurned.textContent  = fmt(burned);
    if (el.sessionCount) el.sessionCount.textContent  = String(workouts.length);
    if (el.totalMinutes) el.totalMinutes.textContent  = String(minutes);
  }

  /* --- Delete handler -------------------------------------- */
  function handleDelete(e) {
    const btn = e.target.closest('[data-delete-id]');
    if (!btn) return;
    const id  = btn.dataset.deleteId;
    const row = el.history.querySelector(`[data-entry-id="${id}"]`);
    if (row) {
      row.classList.add('wl-entry--removing');
      row.addEventListener('animationend', () => {
        MacroBase.removeEntry(id);
        refreshHistory();
        refreshHeaderStats();
        MacroBase.showToast('Session removed.', 'info');
      }, { once: true });
    } else {
      MacroBase.removeEntry(id);
      refreshHistory();
      refreshHeaderStats();
    }
  }

  /* --- Keyboard flow --------------------------------------- */
  function initKeyboardFlow() {
    el.duration?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.calories?.focus(); el.calories?.select(); }
    });
    el.calories?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.submitBtn?.focus(); }
    });
    el.duration?.addEventListener('input', updateCalEstHint);
  }

  /* --- Utility -------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    if (!document.getElementById('panel-workout')) return;
    cacheElements();

    el.form?.addEventListener('submit', handleSubmit);
    el.clearBtn?.addEventListener('click', clearForm);
    el.history?.addEventListener('click', handleDelete);

    initActivityPicker();
    initKeyboardFlow();

    refreshHistory();
    refreshHeaderStats();

    console.info(
      '%cWORKOUT LOGGER%c | %d exercises | wger.de live search enabled',
      'color:#00796B;font-weight:bold;font-family:monospace',
      'color:#8a90aa;font-family:monospace',
      EXERCISE_DB.length
    );
  }

  /* =========================================================
     BOOTSTRAP
  ========================================================= */
  document.addEventListener('DOMContentLoaded', init);

  /* =========================================================
     PUBLIC API
  ========================================================= */
  function refresh() {
    refreshHistory();
    refreshHeaderStats();
  }

  return { refresh };

})();