/* ============================================================
   SHREDDED — Lift Tab Module (Phase 3)
   ------------------------------------------------------------
   Owns the Lift surface: workout selector, in-session view,
   overload recommendation engine, set logging spinners,
   rest timer (persists across tab changes), and history modal.

   Exposes window.SHREDDED.Modal & window.SHREDDED.RestTimer
   so future tabs (Meals USDA search, etc.) can reuse them.
   ============================================================ */
(function () {
  'use strict';

  const App        = window.SHREDDED_APP;
  const EXERCISES  = window.SHREDDED_EXERCISES;
  const TEMPLATES  = window.SHREDDED_TEMPLATES;
  const findDay    = window.SHREDDED_FIND_DAY;
  if (!App || !EXERCISES || !TEMPLATES) {
    console.error('[lift] dependencies missing'); return;
  }

  /* ---------------------------------------------------------- */
  /* PURE HELPERS                                                */
  /* ---------------------------------------------------------- */

  // Brzycki estimated 1RM
  const brzycki = (w, r) => (r >= 37 ? w : w * (36 / (37 - r)));

  // Rest duration in seconds: f(type, RPE)
  // Calibrated to current hypertrophy literature (Schoenfeld 2016, Grgic 2017,
  // Henselmans & Schoenfeld 2014). Longer rest preserves volume load — old short-rest
  // hormonal hypothesis didn't hold up; total weekly volume drives growth, and short
  // rest forces rep drop-off on later sets.
  //   Compound at RPE 8+: 3–5 min for ATP/PCr replenishment + CNS recovery
  //   Compound moderate: 2–3 min
  //   Isolation heavy: 90–120s, moderate 60–90s
  const REST = {
    compound:  { 5: 120, 6: 150, 7: 180, 8: 240, 9: 300, 10: 300 },
    isolation: { 5: 60,  6: 60,  7: 75,  8: 90,  9: 120, 10: 120 }
  };
  function getRestDuration(exercise, rpe) {
    const r = Math.min(10, Math.max(5, Math.round(rpe)));
    return REST[exercise.type][r];
  }

  // Quick-pick durations for the manual timer launcher (seconds)
  const QUICK_REST = [
    { s: 45,  label: '0:45' },
    { s: 60,  label: '1:00' },
    { s: 90,  label: '1:30' },
    { s: 120, label: '2:00' },
    { s: 180, label: '3:00' },
    { s: 240, label: '4:00' },
    { s: 300, label: '5:00' }
  ];

  // Most recent prior session (strictly before today)
  function findLastSession(state, exId, beforeDate) {
    const today = beforeDate || SHREDDED.DateUtil.todayYMD();
    const workouts = state.get('workouts') || {};
    const dates = Object.keys(workouts).filter((d) => d < today).sort().reverse();
    for (const date of dates) {
      const sets = workouts[date]?.exercises?.[exId];
      if (sets && sets.length) return { date, sets };
    }
    return null;
  }

  // Today's logged sets for an exercise (in-progress session)
  function todaysSets(state, exId) {
    const today = SHREDDED.DateUtil.todayYMD();
    return state.get(`workouts.${today}.exercises.${exId}`) || [];
  }

  // Overload recommendation
  function recommendation(state, ex, dayEx) {
    const last = findLastSession(state, ex.id);
    if (!last) {
      return {
        type: 'baseline',
        title: 'Establish baseline',
        detail: `Pick a weight you can hit ${dayEx.reps[0]}–${dayEx.reps[1]} reps cleanly.`,
        weight: null
      };
    }
    const allHitTop = last.sets.every((s) => s.reps >= dayEx.reps[1]);
    const lastWeight = last.sets[0].weight;
    if (allHitTop) {
      const inc = (ex.muscle === 'lower' && ex.type === 'compound') ? 10 : 5;
      return {
        type: 'increase',
        title: `Increase to ${lastWeight + inc} lbs`,
        detail: `All sets hit top of range last time · +${inc} lb jump.`,
        weight: lastWeight + inc
      };
    }
    return {
      type: 'repeat',
      title: `Repeat ${lastWeight} lbs`,
      detail: `Push for the top of ${dayEx.reps[0]}–${dayEx.reps[1]} reps before adding weight.`,
      weight: lastWeight
    };
  }

  // PR check (returns true if this set is a new weight PR)
  function checkPR(state, exId, weight, reps) {
    const cur = state.get(`prs.${exId}`);
    const today = SHREDDED.DateUtil.todayYMD();
    const e1rm = Math.round(brzycki(weight, reps));
    if (!cur || weight > cur.weight) {
      state.mutate((d) => {
        d.prs[exId] = { weight, reps, e1rm, achievedOn: today };
      }, { path: `prs.${exId}` });
      return true;
    }
    // Tied weight, more reps → still note it but don't fire toast
    if (weight === cur.weight && reps > (cur.reps || 0)) {
      state.mutate((d) => {
        d.prs[exId] = { weight, reps, e1rm, achievedOn: today };
      }, { path: `prs.${exId}` });
    }
    return false;
  }

  // Volume load helper
  const setsVolume = (sets) => sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  // Pretty time
  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  }

  /* ---------------------------------------------------------- */
  /* MODAL (generic — exposed for reuse)                         */
  /* ---------------------------------------------------------- */
  const Modal = (() => {
    let root = null;
    let onClose = null;

    function ensureRoot() {
      if (root) return root;
      root = document.createElement('div');
      root.className = 'modal';
      root.innerHTML = `
        <div class="modal__backdrop" data-modal-close></div>
        <div class="modal__sheet" role="dialog" aria-modal="true">
          <div class="modal__grip" aria-hidden="true"></div>
          <div class="modal__body" data-modal-body></div>
        </div>
      `;
      document.body.appendChild(root);
      root.addEventListener('click', (e) => {
        if (e.target.dataset.modalClose !== undefined) close();
      });
      // Touch-drag-down to dismiss (simple)
      const sheet = root.querySelector('.modal__sheet');
      let startY = null, dragY = 0;
      sheet.addEventListener('touchstart', (e) => {
        if (sheet.scrollTop > 0) return;
        startY = e.touches[0].clientY;
      }, { passive: true });
      sheet.addEventListener('touchmove', (e) => {
        if (startY == null) return;
        dragY = Math.max(0, e.touches[0].clientY - startY);
        sheet.style.transform = `translateY(${dragY}px)`;
      }, { passive: true });
      sheet.addEventListener('touchend', () => {
        if (startY == null) return;
        if (dragY > 80) {
          close();
        } else {
          sheet.style.transform = '';
        }
        startY = null; dragY = 0;
      });
      return root;
    }

    function open(html, opts = {}) {
      ensureRoot();
      root.querySelector('[data-modal-body]').innerHTML = html;
      root.classList.add('is-open');
      document.body.classList.add('modal-locked');
      onClose = opts.onClose || null;
      SHREDDED.Haptic.tick();
    }

    function close() {
      if (!root) return;
      root.classList.remove('is-open');
      document.body.classList.remove('modal-locked');
      const sheet = root.querySelector('.modal__sheet');
      if (sheet) sheet.style.transform = '';
      if (onClose) { try { onClose(); } catch {} onClose = null; }
    }

    return { open, close, get root() { return ensureRoot(); } };
  })();

  /* ---------------------------------------------------------- */
  /* REST TIMER (state machine + floating bar)                   */
  /* ---------------------------------------------------------- */
  const RestTimer = (() => {
    let bar = null;
    let interval = null;
    let total = 0;        // total seconds for this rest
    let endsAt = 0;       // wall-clock target ms
    let context = '';     // exercise label

    function ensureBar() {
      if (bar) return bar;
      bar = document.createElement('div');
      bar.className = 'rest-bar';
      bar.innerHTML = `
        <div class="rest-bar__fill" data-rest-fill></div>
        <div class="rest-bar__inner">
          <div class="rest-bar__col">
            <span class="rest-bar__label" data-rest-context>Rest</span>
            <span class="rest-bar__time tnum" data-rest-time>0:00</span>
          </div>
          <div class="rest-bar__actions">
            <button class="rest-bar__btn" data-rest-extend aria-label="Add 30 seconds">+30s</button>
            <button class="rest-bar__btn rest-bar__btn--skip" data-rest-skip aria-label="Skip rest">Skip</button>
          </div>
        </div>
      `;
      document.body.appendChild(bar);
      bar.querySelector('[data-rest-skip]').addEventListener('click', () => stop(true));
      bar.querySelector('[data-rest-extend]').addEventListener('click', () => extend(30));
      return bar;
    }

    function start(seconds, contextLabel) {
      ensureBar();
      total = seconds;
      endsAt = Date.now() + seconds * 1000;
      context = contextLabel || 'Rest';
      bar.querySelector('[data-rest-context]').textContent = context;
      bar.classList.add('is-active');
      paint();
      clearInterval(interval);
      interval = setInterval(tick, 200);
      SHREDDED.Haptic.tick();
    }

    function extend(seconds) {
      if (!isActive()) return;
      endsAt += seconds * 1000;
      total += seconds;
      paint();
      SHREDDED.Haptic.tick();
    }

    function tick() {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      if (remaining <= 0) { stop(false); return; }
      paint();
    }

    function paint() {
      if (!bar) return;
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      const pct = total > 0 ? ((total - remaining) / total) * 100 : 100;
      bar.querySelector('[data-rest-time]').textContent = fmtTime(remaining);
      bar.querySelector('[data-rest-fill]').style.width = pct + '%';
    }

    function stop(skipped) {
      clearInterval(interval); interval = null;
      if (!bar) return;
      bar.classList.remove('is-active');
      total = 0; endsAt = 0;
      if (!skipped) {
        SHREDDED.Haptic.success();
        SHREDDED.Toast.show('Rest complete · go', { tone: 'good', duration: 1600 });
      }
    }

    function isActive() {
      return interval !== null;
    }

    return { start, extend, stop, isActive };
  })();

  /* ---------------------------------------------------------- */
  /* HISTORY MODAL — content                                     */
  /* ---------------------------------------------------------- */
  function openHistory(state, exId) {
    const ex = EXERCISES[exId];
    const workouts = state.get('workouts') || {};
    const dates = Object.keys(workouts).sort().reverse();
    const sessions = [];
    for (const d of dates) {
      const sets = workouts[d]?.exercises?.[exId];
      if (sets && sets.length) sessions.push({ date: d, sets });
    }
    const pr = state.get(`prs.${exId}`);
    const html = `
      <div class="hist">
        <header class="hist__head">
          <p class="card__eyebrow">History</p>
          <h2 class="hist__title">${ex.name}</h2>
          ${pr ? `
            <div class="hist__pr">
              <span class="hist__pr-tag">PR</span>
              <span class="hist__pr-num tnum">${pr.weight}</span>
              <span class="unit">lbs · ${pr.reps} rep${pr.reps === 1 ? '' : 's'}</span>
              <span class="hist__pr-date">${fmtDate(pr.achievedOn)}</span>
            </div>` : ''}
        </header>
        ${sessions.length === 0 ? `
          <div class="hist__empty">No history yet — your first set will land here.</div>
        ` : sessions.map((s) => `
          <div class="hist__session">
            <div class="hist__date">${fmtDate(s.date)}</div>
            <div class="hist__sets">
              ${s.sets.map((set, i) => `
                <div class="hist__set">
                  <span class="hist__set-i">S${i + 1}</span>
                  <span class="hist__set-w tnum">${set.weight}</span>
                  <span class="hist__set-x">×</span>
                  <span class="hist__set-r tnum">${set.reps}</span>
                  <span class="hist__set-rpe">RPE ${set.rpe}</span>
                </div>
              `).join('')}
            </div>
            <div class="hist__vol">Volume <span class="tnum">${setsVolume(s.sets).toLocaleString()}</span> lbs · e1RM <span class="tnum">${Math.round(brzycki(s.sets[0].weight, s.sets[0].reps))}</span></div>
          </div>
        `).join('')}
      </div>
    `;
    Modal.open(html);
  }
  function fmtDate(ymd) {
    const [y, m, d] = ymd.split('-');
    const dt = new Date(+y, +m - 1, +d);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /* ---------------------------------------------------------- */
  /* TEMPLATES                                                   */
  /* ---------------------------------------------------------- */

  function tplSelector(state) {
    const phase = state.get('program.currentPhase') || 1;
    const tpl = TEMPLATES[phase];
    const today = SHREDDED.DateUtil.todayYMD();
    const todaysDayId = state.get(`workouts.${today}.dayId`);
    return `
      <div class="lift lift--selector">
        <div class="lift__intro">
          <p class="card__eyebrow">Today's session</p>
          <h2 class="lift__heading">${tpl.label}</h2>
          <p class="lift__sub">Pick a day to start. Your sets autosave.</p>
        </div>
        <div class="day-grid">
          ${tpl.days.map((d, i) => `
            <button class="day-card ${todaysDayId === d.id ? 'day-card--active' : ''}" data-day="${d.id}">
              <div class="day-card__head">
                <span class="day-card__num tnum">${String(i + 1).padStart(2, '0')}</span>
                <span class="day-card__rpe">RPE ${tpl.rpe[0]}–${tpl.rpe[1]}</span>
              </div>
              <h3 class="day-card__name">${d.name}</h3>
              <p class="day-card__focus">${d.focus}</p>
              <div class="day-card__meta">
                <span>${d.exercises.length} exercises</span>
                <span class="day-card__chev" aria-hidden="true">→</span>
              </div>
              ${todaysDayId === d.id ? `<span class="day-card__pin">In progress</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function tplExerciseCard(state, ex, dayEx) {
    const sets = todaysSets(state, ex.id);
    const last = findLastSession(state, ex.id);
    const rec  = recommendation(state, ex, dayEx);
    const pr   = state.get(`prs.${ex.id}`);
    const done = sets.length >= dayEx.sets;
    const nextSetIdx = sets.length;
    const isCompound = ex.type === 'compound';
    const wStep = isCompound ? 5 : 2.5;

    // Default spinner values: prefer today's most recent set, then recommendation, then last session
    const todaysLast = sets[sets.length - 1];
    const defaultW = todaysLast?.weight ?? rec.weight ?? (last?.sets[0]?.weight ?? 0);
    const defaultR = todaysLast?.reps ?? dayEx.reps[1];
    const defaultRPE = todaysLast?.rpe
      ?? (state.get('program.currentPhase') === 3 ? 8.5
        : state.get('program.currentPhase') === 2 ? 7.5
        : 6.5);

    return `
      <article class="ex" data-ex="${ex.id}" data-ex-type="${ex.type}" data-ex-muscle="${ex.muscle}">
        <header class="ex__head">
          <div class="ex__head-text">
            <h3 class="ex__name">${ex.name}</h3>
            <p class="ex__meta">${dayEx.sets} sets · ${dayEx.reps[0]}–${dayEx.reps[1]} reps · <span class="ex__group">${ex.group}</span></p>
          </div>
          <div class="ex__head-actions">
            ${pr ? `<span class="ex__pr-chip" title="Personal Record">PR ${pr.weight}</span>` : ''}
            <button class="ex__hist-btn" data-ex-history="${ex.id}" aria-label="History">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </button>
          </div>
        </header>

        <div class="ex__rec ex__rec--${rec.type}">
          <span class="ex__rec-tag">${rec.type === 'baseline' ? 'BASELINE' : rec.type === 'increase' ? 'PROGRESS' : 'REPEAT'}</span>
          <span class="ex__rec-title">${rec.title}</span>
          <span class="ex__rec-detail">${rec.detail}</span>
        </div>

        ${last ? `
          <div class="ex__last">
            <span class="ex__last-tag">Last</span>
            <span class="ex__last-text">
              ${last.sets.map((s) => `${s.weight}×${s.reps}`).join(' · ')}
              <span class="ex__last-rpe">@ RPE ${last.sets[0].rpe}</span>
              <span class="ex__last-date">${fmtDate(last.date)}</span>
            </span>
          </div>` : ''}

        <div class="ex__sets-row">
          ${Array.from({ length: dayEx.sets }, (_, i) => {
            const s = sets[i];
            if (s) {
              return `<div class="set-chip set-chip--done" data-set-press="${i}" title="Long-press to delete">
                <span class="set-chip__i">S${i + 1}</span>
                <span class="set-chip__w tnum">${s.weight}</span><span class="set-chip__x">×</span><span class="set-chip__r tnum">${s.reps}</span>
                <span class="set-chip__rpe">@${s.rpe}</span>
              </div>`;
            }
            return `<div class="set-chip ${i === nextSetIdx ? 'set-chip--next' : ''}" title="Set ${i + 1}"><span class="set-chip__i">S${i + 1}</span><span class="set-chip__pending">—</span></div>`;
          }).join('')}
        </div>

        ${done ? `
          <div class="ex__complete">
            <span class="ex__complete-check">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
            </span>
            <span class="ex__complete-text">Complete · Volume <span class="tnum">${setsVolume(sets).toLocaleString()}</span> lbs</span>
          </div>
        ` : `
          <div class="logger" data-logger>
            <p class="logger__heading">Set ${nextSetIdx + 1} of ${dayEx.sets}</p>
            <div class="logger__spinners">
              ${tplSpinner('w', defaultW, wStep, 'lbs', 0)}
              ${tplSpinner('r', defaultR, 1, 'reps', 0)}
              ${tplSpinner('rpe', defaultRPE, 0.5, 'RPE', 1)}
            </div>
            <button class="btn btn--primary logger__log" data-log-set>
              <span>Log Set ${nextSetIdx + 1}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
            </button>
          </div>
        `}
      </article>
    `;
  }

  function tplSpinner(field, value, step, unit, decimals) {
    return `
      <div class="spin" data-spin-field="${field}" data-spin-step="${step}" data-spin-decimals="${decimals}" data-spin-value="${value}">
        <button class="spin__btn" data-spin-act="dec" aria-label="Decrease ${field}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
        <div class="spin__value">
          <span class="spin__num tnum" data-spin-display>${(+value).toFixed(decimals)}</span>
          <span class="spin__unit">${unit}</span>
        </div>
        <button class="spin__btn" data-spin-act="inc" aria-label="Increase ${field}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    `;
  }

  function tplSession(state) {
    const today = SHREDDED.DateUtil.todayYMD();
    const phase = state.get('program.currentPhase') || 1;
    const todayWk = state.get(`workouts.${today}`);
    const day = findDay(phase, todayWk.dayId);
    if (!day) {
      // Inconsistent state — bail to selector
      return tplSelector(state);
    }
    const totalSets = day.exercises.reduce((n, e) => n + e.sets, 0);
    const loggedSets = day.exercises.reduce((n, e) =>
      n + (todayWk.exercises?.[e.id]?.length || 0), 0);
    const totalVol = day.exercises.reduce((sum, e) =>
      sum + setsVolume(todayWk.exercises?.[e.id] || []), 0);

    return `
      <div class="lift lift--session">
        <header class="sess-head">
          <button class="sess-head__back" data-back-to-selector aria-label="Back to selector">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div class="sess-head__text">
            <p class="card__eyebrow">${TEMPLATES[phase].label.split('·')[1]?.trim() || 'Session'}</p>
            <h2 class="sess-head__name">${day.name}</h2>
            <p class="sess-head__focus">${day.focus}</p>
          </div>
          <button class="sess-head__timer" data-manual-timer aria-label="Start rest timer" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="13" r="8"/>
              <path d="M12 9v4l2.5 1.5"/>
              <path d="M9 2h6"/>
              <path d="M12 5V2"/>
            </svg>
          </button>
        </header>

        <div class="sess-stats">
          <div class="sess-stats__item">
            <span class="sess-stats__num tnum">${loggedSets}<span class="sess-stats__den">/${totalSets}</span></span>
            <span class="sess-stats__label">Sets</span>
          </div>
          <div class="sess-stats__sep"></div>
          <div class="sess-stats__item">
            <span class="sess-stats__num tnum">${totalVol.toLocaleString()}</span>
            <span class="sess-stats__label">Volume (lbs)</span>
          </div>
          <div class="sess-stats__sep"></div>
          <div class="sess-stats__item">
            <span class="sess-stats__num tnum">${day.exercises.length}</span>
            <span class="sess-stats__label">Exercises</span>
          </div>
        </div>

        <div class="ex-list">
          ${day.exercises.map((dayEx) => {
            const ex = { id: dayEx.id, ...EXERCISES[dayEx.id] };
            return tplExerciseCard(state, ex, dayEx);
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------- */
  /* WIRING                                                      */
  /* ---------------------------------------------------------- */

  function attachHold(btn, fn) {
    let timeout, interval, fired = false;
    const start = (e) => {
      e.preventDefault();
      fired = false;
      fn(); fired = true;
      timeout = setTimeout(() => {
        interval = setInterval(fn, 80);
      }, 400);
    };
    const end = () => {
      clearTimeout(timeout);
      clearInterval(interval);
      timeout = null; interval = null;
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function wireSpinners(scope) {
    scope.querySelectorAll('.spin').forEach((spin) => {
      const step = parseFloat(spin.dataset.spinStep);
      const decimals = +spin.dataset.spinDecimals;
      const display = spin.querySelector('[data-spin-display]');
      const min = spin.dataset.spinField === 'rpe' ? 5 : 0;
      const max = spin.dataset.spinField === 'rpe' ? 10 : 999;

      const apply = (delta) => {
        let v = parseFloat(spin.dataset.spinValue);
        v = Math.max(min, Math.min(max, +(v + delta).toFixed(decimals)));
        spin.dataset.spinValue = v;
        display.textContent = v.toFixed(decimals);
        SHREDDED.Haptic.tick();
      };

      const dec = spin.querySelector('[data-spin-act="dec"]');
      const inc = spin.querySelector('[data-spin-act="inc"]');
      attachHold(dec, () => apply(-step));
      attachHold(inc, () => apply(+step));
    });
  }

  function wireSelector(state, view) {
    view.querySelectorAll('[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dayId = btn.dataset.day;
        const today = SHREDDED.DateUtil.todayYMD();
        state.mutate((d) => {
          if (!d.workouts[today]) {
            d.workouts[today] = { dayId, startedAt: Date.now(), exercises: {} };
          } else if (d.workouts[today].dayId !== dayId) {
            // Switching day — preserve any prior dayId data under a parked key
            const prior = d.workouts[today].dayId;
            if (prior && Object.keys(d.workouts[today].exercises || {}).length) {
              d.workouts[today]._parked = d.workouts[today]._parked || {};
              d.workouts[today]._parked[prior] = d.workouts[today].exercises;
            }
            d.workouts[today].dayId = dayId;
            d.workouts[today].exercises = (d.workouts[today]._parked?.[dayId]) || {};
            d.workouts[today].startedAt = Date.now();
          }
        }, { path: `workouts` });
        SHREDDED.Haptic.bump();
      });
    });
  }

  // Recompute the PR record for an exercise from scratch by scanning all logged sets.
  // Called after a set deletion that might have invalidated an existing PR.
  function recomputePRForExercise(state, exId) {
    const workouts = state.get('workouts') || {};
    let bestWeight = -Infinity;
    let bestReps = 0;
    let bestDate = null;
    for (const date of Object.keys(workouts).sort()) {
      const sets = workouts[date]?.exercises?.[exId];
      if (!sets) continue;
      for (const s of sets) {
        if (s.weight > bestWeight ||
            (s.weight === bestWeight && s.reps > bestReps)) {
          bestWeight = s.weight;
          bestReps = s.reps;
          bestDate = date;
        }
      }
    }
    state.mutate((d) => {
      d.prs = d.prs || {};
      if (bestDate == null) {
        delete d.prs[exId];
      } else {
        d.prs[exId] = {
          weight: bestWeight,
          reps: bestReps,
          e1rm: Math.round(brzycki(bestWeight, bestReps)),
          achievedOn: bestDate
        };
      }
    }, { path: `prs.${exId}` });
  }

  function openDeleteSetModal(state, exId, setIdx) {
    const Modal = SHREDDED.Modal;
    if (!Modal) return;
    const ex = EXERCISES[exId];
    const today = SHREDDED.DateUtil.todayYMD();
    const sets = state.get(`workouts.${today}.exercises.${exId}`) || [];
    const set = sets[setIdx];
    if (!set || !ex) return;

    const html = `
      <div class="confirm">
        <p class="card__eyebrow">Delete set</p>
        <h2 class="confirm__title">Remove Set ${setIdx + 1}?</h2>
        <p class="confirm__desc">
          ${ex.name} · <strong class="tnum">${set.weight}</strong> lbs × <strong class="tnum">${set.reps}</strong> reps @ RPE <strong class="tnum">${set.rpe}</strong>.
          <br/><span class="muted">Cannot be undone. PRs will recompute if needed.</span>
        </p>
        <div class="confirm__actions">
          <button class="btn confirm__cancel" data-confirm-cancel>Cancel</button>
          <button class="btn btn--danger" data-confirm-ok>Delete</button>
        </div>
      </div>
    `;
    Modal.open(html);
    const root = Modal.root;
    root.querySelector('[data-confirm-cancel]').addEventListener('click', () => Modal.close());
    root.querySelector('[data-confirm-ok]').addEventListener('click', () => {
      // Snapshot the deleted set's stats to decide if PR recompute is needed
      const pr = state.get(`prs.${exId}`);
      const wasPRSet = pr && pr.weight === set.weight && pr.reps === set.reps && pr.achievedOn === today;
      state.mutate((d) => {
        const arr = d.workouts?.[today]?.exercises?.[exId];
        if (!arr) return;
        arr.splice(setIdx, 1);
        // Drop the empty array key so todaysSets returns clean
        if (arr.length === 0) delete d.workouts[today].exercises[exId];
      }, { path: `workouts.${today}.exercises.${exId}` });
      if (wasPRSet) recomputePRForExercise(state, exId);
      SHREDDED.Haptic.bump();
      SHREDDED.Toast.show(wasPRSet ? 'Set deleted · PR recomputed' : 'Set deleted', { tone: 'accent' });
      Modal.close();
    });
  }

  function attachHoldGeneric(btn, fn) {
    let timeout, interval;
    const start = (e) => {
      e.preventDefault();
      fn();
      timeout = setTimeout(() => { interval = setInterval(fn, 80); }, 400);
    };
    const end = () => { clearTimeout(timeout); clearInterval(interval); };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function openManualTimerModal() {
    const Modal = SHREDDED.Modal;
    if (!Modal) return;
    const html = `
      <div class="bio-modal rest-modal">
        <p class="card__eyebrow">Rest Timer</p>
        <h2 class="bio-modal__title">Pick a duration</h2>
        <p class="muted" style="font-size:12.5px; margin:0 0 14px; line-height:1.45;">
          Longer rest preserves volume load on later sets — the strongest driver of hypertrophy.
        </p>

        <div class="rest-modal__quick">
          ${QUICK_REST.map((q) => `
            <button class="rest-modal__pill" data-rest-quick="${q.s}" type="button">
              <span class="rest-modal__pill-time tnum">${q.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="rest-modal__custom">
          <label class="rest-modal__custom-label">Custom</label>
          <div class="spin" data-spin-field="rest" data-spin-step="15" data-spin-decimals="0" data-spin-min="15" data-spin-max="600" data-spin-value="120">
            <button class="spin__btn" data-spin-act="dec" aria-label="-15s">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>
            </button>
            <div class="spin__value">
              <span class="spin__num tnum" data-spin-display>2:00</span>
              <span class="spin__unit">min:sec</span>
            </div>
            <button class="spin__btn" data-spin-act="inc" aria-label="+15s">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>

        <button class="btn btn--primary" data-rest-start style="width:100%; margin-top:14px;">Start</button>

        <details class="rest-modal__science">
          <summary>Why these numbers?</summary>
          <div class="rest-modal__science-body">
            <p>Schoenfeld (2016) found 3-min rest produced significantly more hypertrophy than 1-min rest in trained lifters — despite identical volume and intensity prescriptions — because long rest preserves rep counts on later sets.</p>
            <p>Practical defaults this app uses:</p>
            <ul>
              <li><strong>Compound, RPE 8+:</strong> 4–5 min</li>
              <li><strong>Compound, RPE 6–7:</strong> 2.5–3 min</li>
              <li><strong>Isolation, RPE 8+:</strong> 90s–2 min</li>
              <li><strong>Isolation, RPE 6–7:</strong> 60–75s</li>
            </ul>
          </div>
        </details>
      </div>
    `;
    Modal.open(html);
    const root = Modal.root;

    // Wire spinner with min:sec rendering
    const spin = root.querySelector('.spin');
    const display = spin.querySelector('[data-spin-display]');
    const fmtMS = (s) => {
      const m = Math.floor(s / 60);
      const ss = String(s % 60).padStart(2, '0');
      return `${m}:${ss}`;
    };
    const apply = (delta) => {
      let v = parseFloat(spin.dataset.spinValue) + delta;
      v = Math.max(15, Math.min(600, v));
      spin.dataset.spinValue = v;
      display.textContent = fmtMS(v);
      SHREDDED.Haptic.tick();
    };
    attachHoldGeneric(spin.querySelector('[data-spin-act="dec"]'), () => apply(-15));
    attachHoldGeneric(spin.querySelector('[data-spin-act="inc"]'), () => apply(+15));

    // Quick pick — fires immediately
    root.querySelectorAll('[data-rest-quick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = parseInt(btn.dataset.restQuick, 10);
        SHREDDED.RestTimer.start(s, 'Manual rest');
        Modal.close();
      });
    });

    // Custom start
    root.querySelector('[data-rest-start]').addEventListener('click', () => {
      const s = parseInt(spin.dataset.spinValue, 10);
      SHREDDED.RestTimer.start(s, 'Custom rest');
      Modal.close();
    });
  }

  function wireSession(state, view) {
    view.querySelector('[data-back-to-selector]')?.addEventListener('click', () => {
      const today = SHREDDED.DateUtil.todayYMD();
      const wk = state.get(`workouts.${today}`);
      const hasLogged = Object.values(wk?.exercises || {}).some((arr) => arr.length);
      if (hasLogged) {
        // Don't delete the session — just show selector by parking dayId
        state.mutate((d) => {
          // Keep dayId as null so selector shows; data is preserved via _parked logic
          if (d.workouts[today]) {
            d.workouts[today]._parked = d.workouts[today]._parked || {};
            d.workouts[today]._parked[d.workouts[today].dayId] = d.workouts[today].exercises;
            d.workouts[today].dayId = null;
            d.workouts[today].exercises = {};
          }
        }, { path: `workouts` });
      } else {
        state.mutate((d) => { delete d.workouts[today]; }, { path: 'workouts' });
      }
      SHREDDED.Haptic.tick();
    });

    // History buttons
    view.querySelectorAll('[data-ex-history]').forEach((btn) => {
      btn.addEventListener('click', () => openHistory(state, btn.dataset.exHistory));
    });

    // Manual rest timer launcher
    view.querySelector('[data-manual-timer]')?.addEventListener('click', () => {
      openManualTimerModal();
    });

    // Long-press a done set chip to delete it
    view.querySelectorAll('[data-set-press]').forEach((chip) => {
      const card = chip.closest('.ex');
      const exId = card?.dataset.ex;
      const setIdx = parseInt(chip.dataset.setPress, 10);
      if (!exId || Number.isNaN(setIdx)) return;

      let pressTimer = null;
      let startX = 0, startY = 0;
      const LONG_MS = 500;
      const MOVE_THRESHOLD = 8;
      const startPress = (e) => {
        const t = e.touches?.[0] || e;
        startX = t.clientX; startY = t.clientY;
        chip.classList.add('is-pressing');
        pressTimer = setTimeout(() => {
          pressTimer = null;
          chip.classList.remove('is-pressing');
          SHREDDED.Haptic.bump();
          openDeleteSetModal(state, exId, setIdx);
        }, LONG_MS);
      };
      const cancelPress = () => {
        chip.classList.remove('is-pressing');
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      };
      const movePress = (e) => {
        if (!pressTimer) return;
        const t = e.touches?.[0] || e;
        if (Math.abs(t.clientX - startX) > MOVE_THRESHOLD ||
            Math.abs(t.clientY - startY) > MOVE_THRESHOLD) {
          cancelPress();
        }
      };
      chip.addEventListener('pointerdown', startPress);
      chip.addEventListener('pointermove', movePress);
      chip.addEventListener('pointerup', cancelPress);
      chip.addEventListener('pointerleave', cancelPress);
      chip.addEventListener('pointercancel', cancelPress);
      chip.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    // Spinners
    wireSpinners(view);

    // Log set buttons
    view.querySelectorAll('[data-log-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.ex');
        const exId = card.dataset.ex;
        const ex = EXERCISES[exId];
        const wEl   = card.querySelector('.spin[data-spin-field="w"]');
        const rEl   = card.querySelector('.spin[data-spin-field="r"]');
        const rpeEl = card.querySelector('.spin[data-spin-field="rpe"]');
        const weight = parseFloat(wEl.dataset.spinValue);
        const reps   = parseFloat(rEl.dataset.spinValue);
        const rpe    = parseFloat(rpeEl.dataset.spinValue);

        if (!(weight > 0) || !(reps >= 1)) {
          SHREDDED.Toast.show('Set weight and reps before logging', { tone: 'bad' });
          return;
        }

        const today = SHREDDED.DateUtil.todayYMD();
        state.mutate((d) => {
          const wk = d.workouts[today];
          if (!wk) return;
          if (!wk.exercises[exId]) wk.exercises[exId] = [];
          wk.exercises[exId].push({ weight, reps, rpe, ts: Date.now() });
        }, { path: `workouts.${today}.exercises.${exId}` });

        // PR detection
        const wasPR = checkPR(state, exId, weight, reps);
        if (wasPR) {
          SHREDDED.Toast.show(`PR · ${ex.name} · ${weight} lbs`, { tone: 'accent', duration: 2800 });
          SHREDDED.Haptic.success();
        } else {
          SHREDDED.Haptic.bump();
        }

        // Kick off rest timer
        const dur = getRestDuration(ex, rpe);
        RestTimer.start(dur, `${ex.name} · rest`);
      });
    });
  }

  /* ---------------------------------------------------------- */
  /* TOP-LEVEL RENDER                                            */
  /* ---------------------------------------------------------- */
  function render(state, view) {
    const today = SHREDDED.DateUtil.todayYMD();
    const todayWk = state.get(`workouts.${today}`);
    const hasActiveDay = todayWk && todayWk.dayId;
    if (hasActiveDay) {
      view.innerHTML = tplSession(state);
      wireSession(state, view);
    } else {
      view.innerHTML = tplSelector(state);
      wireSelector(state, view);
    }
  }

  /* ---------------------------------------------------------- */
  /* MOUNT                                                       */
  /* ---------------------------------------------------------- */
  App.register('lift', {
    mount(state) {
      const view = document.querySelector('[data-view="lift"] .view__body');
      if (!view) { console.error('[lift] view body missing'); return; }

      // Migration: a prior bug routed every exercise's logged sets to the
      // 'undefined' bucket because EXERCISES[id] objects didn't carry an id field.
      // Strip those orphan buckets so the UI doesn't render phantom sets after the fix.
      let needsCleanup = false;
      const workouts = state.get('workouts') || {};
      for (const date of Object.keys(workouts)) {
        if (workouts[date]?.exercises?.undefined) { needsCleanup = true; break; }
        const parked = workouts[date]?._parked;
        if (parked) {
          for (const dayId of Object.keys(parked)) {
            if (parked[dayId]?.undefined) { needsCleanup = true; break; }
          }
        }
        if (needsCleanup) break;
      }
      if (state.get('prs.undefined') !== undefined) needsCleanup = true;
      if (needsCleanup) {
        state.mutate((d) => {
          for (const date of Object.keys(d.workouts || {})) {
            if (d.workouts[date]?.exercises) delete d.workouts[date].exercises.undefined;
            const parked = d.workouts[date]?._parked;
            if (parked) {
              for (const dayId of Object.keys(parked)) {
                if (parked[dayId]) delete parked[dayId].undefined;
              }
            }
          }
          if (d.prs) delete d.prs.undefined;
        }, { path: 'workouts' });
        SHREDDED.Toast.show('Cleaned up old data · log sets again to verify', { tone: 'accent', duration: 3000 });
      }

      render(state, view);

      state.subscribe(({ path }) => {
        if (!path) return;
        const all = path === '*';
        if (all || path.startsWith('workouts') || path.startsWith('program') || path.startsWith('prs')) {
          render(state, view);
        }
      });
    }
  });

  // Public for cross-module reuse
  window.SHREDDED = window.SHREDDED || {};
  window.SHREDDED.Modal = Modal;
  window.SHREDDED.RestTimer = RestTimer;

})();
