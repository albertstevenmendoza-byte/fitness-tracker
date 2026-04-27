/* ═══════════════════════════════════════════════════════════════
   SHREDDED — Fitness Tracker · Frontend App
   All phase data is derived from the science-based plan discussed.
═══════════════════════════════════════════════════════════════ */

// ── Phase Data ──────────────────────────────────────────────────
const PHASES = {
  1: {
    name: "Metabolic Reset & Reactivation",
    shortName: "Metabolic Reset",
    weeks: "Weeks 1–3",
    targets: { cal: 1500, protein: 150, carbs: 147, fat: 16 },
    training: "3× / week · Full Body",
    rpe: "RPE 6–7",
    desc: "Gradual reactivation after your break. Hit 150g protein daily. Connective tissue and motor patterns first — strength will come.",
    meals: [
      {
        time: "5:00 AM", name: "Protein Oats — Small", label: null,
        cal: 341, protein: 32, carbs: 44, fat: 5,
        items: [
          { name: "Rolled oats, ⅓ cup dry", macro: "7P · 36C · 3F · 200cal" },
          { name: "Whey protein, 1 scoop", macro: "25P · 3C · 2F · 120cal" },
          { name: "Blueberries, ¼ cup", macro: "0P · 5C · 0F · 21cal" },
        ],
      },
      {
        time: "9:00 AM", name: "Tuna + Rice — Lean", label: null,
        cal: 260, protein: 39, carbs: 23, fat: 1,
        items: [
          { name: "Canned tuna (5 oz)", macro: "36P · 0C · 1F · 150cal" },
          { name: "White rice, ½ cup cooked", macro: "2P · 22C · 0F · 103cal" },
          { name: "Spinach, 1 cup raw", macro: "1P · 1C · 0F · 7cal" },
        ],
      },
      {
        time: "1:00 PM", name: "Chicken + Sweet Potato", label: "pre",
        cal: 288, protein: 39, carbs: 22, fat: 3,
        items: [
          { name: "Chicken breast, 4 oz cooked", macro: "35P · 0C · 3F · 187cal" },
          { name: "Sweet potato, 1 small", macro: "1P · 16C · 0F · 70cal" },
          { name: "Broccoli, 1 cup", macro: "3P · 6C · 0F · 31cal" },
        ],
      },
      {
        time: "6:00 PM", name: "Turkey + Rice (Post-Workout)", label: "post",
        cal: 470, protein: 40, carbs: 58, fat: 7,
        items: [
          { name: "93/7 Ground turkey, 5 oz", macro: "35P · 0C · 7F · 218cal" },
          { name: "White rice, ¾ cup cooked", macro: "3P · 34C · 0F · 155cal" },
          { name: "Banana, 1 small", macro: "1P · 23C · 0F · 90cal" },
          { name: "Spinach sautéed, 1 cup", macro: "1P · 1C · 0F · 7cal" },
        ],
      },
    ],
    workouts: [
      {
        key: "A", day: "MON / FRI", name: "Full Body A",
        focus: "Compound / Tension-first", rpe: "RPE 6–7",
        exercises: [
          { name: "Barbell Back Squat",   prescribed: "3 × 6–8",  rpe: "RPE 7" },
          { name: "Flat Barbell Bench",   prescribed: "3 × 6–8",  rpe: "RPE 7" },
          { name: "Barbell Row",          prescribed: "3 × 8–10", rpe: "RPE 7" },
          { name: "Romanian Deadlift",    prescribed: "3 × 10",   rpe: "RPE 6" },
          { name: "DB Overhead Press",    prescribed: "3 × 10–12",rpe: "RPE 6" },
          { name: "Cable Face Pull",      prescribed: "3 × 15",   rpe: "RPE 6" },
        ],
      },
      {
        key: "B", day: "WEDNESDAY", name: "Full Body B",
        focus: "Hinge-dominant / Variation", rpe: "RPE 6–7",
        exercises: [
          { name: "Conventional Deadlift",  prescribed: "3 × 4–6",  rpe: "RPE 7" },
          { name: "Incline DB Press",        prescribed: "3 × 10",   rpe: "RPE 7" },
          { name: "Lat Pulldown",            prescribed: "3 × 10–12",rpe: "RPE 7" },
          { name: "Goblet Squat",            prescribed: "3 × 15",   rpe: "RPE 6" },
          { name: "EZ Bar Curl",             prescribed: "3 × 12",   rpe: "RPE 7" },
          { name: "Tricep Overhead Ext.",    prescribed: "3 × 12",   rpe: "RPE 7" },
        ],
      },
    ],
  },

  2: {
    name: "Caloric Bridge to Maintenance",
    shortName: "Caloric Bridge",
    weeks: "Weeks 4–6",
    targets: { cal: 1750, protein: 178, carbs: 219, fat: 19 },
    training: "4× / week · Upper / Lower",
    rpe: "RPE 7–8",
    desc: "Calorie ramp ~100/week to ~1,750. Add a 4th training day. Progressive overload begins in earnest. Your body composition is visibly shifting.",
    meals: [
      {
        time: "5:00 AM", name: "Protein Oats — Full", label: null,
        cal: 527, protein: 46, carbs: 73, fat: 7,
        items: [
          { name: "Rolled oats, ½ cup dry",    macro: "10P · 54C · 5F · 300cal" },
          { name: "Whey protein, 1 scoop",     macro: "25P · 3C · 2F · 120cal" },
          { name: "Non-fat Greek yogurt, ½ cup",macro:"11P · 5C · 0F · 65cal" },
          { name: "Blueberries, ½ cup",        macro: "0P · 11C · 0F · 42cal" },
        ],
      },
      {
        time: "9:00 AM", name: "Chicken Rice Bowl", label: null,
        cal: 418, protein: 50, carbs: 40, fat: 4,
        items: [
          { name: "Chicken breast, 5 oz cooked", macro: "44P · 0C · 4F · 232cal" },
          { name: "White rice, ¾ cup cooked",    macro: "3P · 34C · 0F · 155cal" },
          { name: "Broccoli, 1 cup",             macro: "3P · 6C · 0F · 31cal" },
        ],
      },
      {
        time: "1:00 PM", name: "Tuna + Rice + Sweet Potato", label: "pre",
        cal: 330, protein: 40, carbs: 39, fat: 1,
        items: [
          { name: "Canned tuna (5 oz)", macro: "36P · 0C · 1F · 150cal" },
          { name: "White rice, ½ cup cooked", macro: "2P · 22C · 0F · 103cal" },
          { name: "Sweet potato, 1 small", macro: "1P · 16C · 0F · 70cal" },
          { name: "Spinach, 1 cup raw", macro: "1P · 1C · 0F · 7cal" },
        ],
      },
      {
        time: "6:00 PM", name: "Turkey + Rice + Banana", label: "post",
        cal: 509, protein: 42, carbs: 67, fat: 7,
        items: [
          { name: "93/7 Ground turkey, 5 oz", macro: "35P · 0C · 7F · 218cal" },
          { name: "White rice, ¾ cup cooked", macro: "3P · 34C · 0F · 155cal" },
          { name: "Banana, 1 medium", macro: "1P · 27C · 0F · 105cal" },
          { name: "Broccoli, 1 cup", macro: "3P · 6C · 0F · 31cal" },
        ],
      },
    ],
    workouts: [
      {
        key: "UA", day: "MONDAY", name: "Upper A",
        focus: "Strength / Tension", rpe: "RPE 8",
        exercises: [
          { name: "Bench Press",           prescribed: "4 × 4–6",  rpe: "RPE 8" },
          { name: "Pendlay Row",           prescribed: "4 × 4–6",  rpe: "RPE 8" },
          { name: "Overhead Press",        prescribed: "3 × 6–8",  rpe: "RPE 7" },
          { name: "Cable Row (close)",     prescribed: "3 × 10",   rpe: "RPE 7" },
          { name: "Incline DB Press",      prescribed: "3 × 10–12",rpe: "RPE 8" },
          { name: "Face Pull",             prescribed: "3 × 15",   rpe: "RPE 6" },
        ],
      },
      {
        key: "LA", day: "TUESDAY", name: "Lower A",
        focus: "Strength / Compound", rpe: "RPE 8",
        exercises: [
          { name: "Back Squat",        prescribed: "4 × 4–6",  rpe: "RPE 8" },
          { name: "Romanian Deadlift", prescribed: "3 × 8–10", rpe: "RPE 7" },
          { name: "Leg Press",         prescribed: "3 × 10–12",rpe: "RPE 7" },
          { name: "Seated Leg Curl",   prescribed: "3 × 12",   rpe: "RPE 8" },
          { name: "Calf Raise",        prescribed: "4 × 10",   rpe: "RPE 8" },
        ],
      },
      {
        key: "UB", day: "THURSDAY", name: "Upper B",
        focus: "Hypertrophy / Volume", rpe: "RPE 8",
        exercises: [
          { name: "Incline DB Press",       prescribed: "4 × 8–12", rpe: "RPE 8" },
          { name: "Chest-Supported Row",    prescribed: "4 × 10–12",rpe: "RPE 8" },
          { name: "DB Lateral Raise",       prescribed: "4 × 15–20",rpe: "RPE 8" },
          { name: "Lat Pulldown (wide)",    prescribed: "3 × 12",   rpe: "RPE 8" },
          { name: "Pec Deck / Cable Fly",   prescribed: "3 × 15",   rpe: "RPE 9" },
          { name: "Curl + Pushdown SS",     prescribed: "3 × 12",   rpe: "RPE 8" },
        ],
      },
      {
        key: "LB", day: "FRIDAY", name: "Lower B",
        focus: "Hypertrophy / Unilateral", rpe: "RPE 8–9",
        exercises: [
          { name: "Deadlift",                prescribed: "3 × 3–5",  rpe: "RPE 8" },
          { name: "Bulgarian Split Squat",   prescribed: "3 × 10/leg",rpe: "RPE 8" },
          { name: "Leg Extension",           prescribed: "3 × 15–20",rpe: "RPE 9" },
          { name: "Lying Leg Curl",          prescribed: "3 × 12",   rpe: "RPE 9" },
          { name: "Hip Thrust",              prescribed: "3 × 10–12",rpe: "RPE 8" },
          { name: "Calf Raise (slow ecc.)",  prescribed: "4 × 15",   rpe: "RPE 8" },
        ],
      },
    ],
  },

  3: {
    name: "Lean Recomp — Full Build Mode",
    shortName: "Lean Recomp",
    weeks: "Week 7+",
    targets: { cal: 2050, protein: 189, carbs: 255, fat: 28 },
    training: "4–5× / week · RPE 8–9",
    rpe: "RPE 8–9",
    desc: "Full recomposition calories. Building muscle while burning fat simultaneously. Push close to failure on isolations. Reassess every 4 weeks.",
    meals: [
      {
        time: "5:00 AM", name: "Protein Oats / Bagel", label: null,
        cal: 527, protein: 46, carbs: 73, fat: 7,
        items: [
          { name: "Option A: Protein Oats (full)", macro: "46P · 73C · 7F · 527cal" },
          { name: "Option B: Sprouts Bagel + Nancy's Cream Cheese", macro: "~33P · ~62C · ~12F · 510cal" },
          { name: "  ↳ Add whey shake with option B", macro: "+25P · 120cal" },
        ],
      },
      {
        time: "9:00 AM", name: "Chicken Rice Bowl — Full", label: null,
        cal: 492, protein: 51, carbs: 42, fat: 11,
        items: [
          { name: "Chicken breast, 5 oz cooked", macro: "44P · 0C · 4F · 232cal" },
          { name: "White rice, ¾ cup cooked",    macro: "3P · 34C · 0F · 155cal" },
          { name: "Broccoli, 1.5 cups",          macro: "4P · 8C · 0F · 45cal" },
          { name: "Olive oil, ½ tbsp",           macro: "0P · 0C · 7F · 60cal" },
        ],
      },
      {
        time: "1:00 PM", name: "Tuna + Rice (Pre-Workout)", label: "pre",
        cal: 433, protein: 42, carbs: 62, fat: 1,
        items: [
          { name: "Canned tuna (5 oz)",     macro: "36P · 0C · 1F · 150cal" },
          { name: "White rice, 1 cup cooked",macro:"4P · 45C · 0F · 206cal" },
          { name: "Sweet potato, 1 small",  macro: "1P · 16C · 0F · 70cal" },
          { name: "Spinach, 1 cup raw",     macro: "1P · 1C · 0F · 7cal" },
        ],
      },
      {
        time: "6:00 PM", name: "Turkey + Rice + Banana (Post)", label: "post",
        cal: 602, protein: 50, carbs: 78, fat: 9,
        items: [
          { name: "93/7 Ground turkey, 6 oz", macro: "42P · 0C · 9F · 260cal" },
          { name: "White rice, 1 cup cooked", macro: "4P · 45C · 0F · 206cal" },
          { name: "Banana, 1 medium",         macro: "1P · 27C · 0F · 105cal" },
          { name: "Broccoli, 1 cup",          macro: "3P · 6C · 0F · 31cal" },
        ],
      },
    ],
    workouts: [
      {
        key: "UA", day: "MONDAY", name: "Upper A",
        focus: "Strength / Max Tension", rpe: "RPE 8–9",
        exercises: [
          { name: "Bench Press",         prescribed: "4 × 4–6",  rpe: "RPE 8" },
          { name: "Pendlay Row",         prescribed: "4 × 4–6",  rpe: "RPE 8" },
          { name: "Overhead Press",      prescribed: "3 × 6–8",  rpe: "RPE 8" },
          { name: "Cable Row (close)",   prescribed: "3 × 10",   rpe: "RPE 8" },
          { name: "Incline DB Press",    prescribed: "3 × 10–12",rpe: "RPE 8" },
          { name: "Face Pull",           prescribed: "3 × 15",   rpe: "RPE 7" },
        ],
      },
      {
        key: "LA", day: "TUESDAY", name: "Lower A",
        focus: "Strength / Heavy", rpe: "RPE 8–9",
        exercises: [
          { name: "Back Squat",        prescribed: "4 × 4–6",  rpe: "RPE 8" },
          { name: "Romanian Deadlift", prescribed: "3 × 8–10", rpe: "RPE 8" },
          { name: "Leg Press",         prescribed: "3 × 10–12",rpe: "RPE 8" },
          { name: "Seated Leg Curl",   prescribed: "3 × 12",   rpe: "RPE 8" },
          { name: "Calf Raise",        prescribed: "4 × 10",   rpe: "RPE 8" },
        ],
      },
      {
        key: "UB", day: "THURSDAY", name: "Upper B",
        focus: "Hypertrophy / Near Failure", rpe: "RPE 9",
        exercises: [
          { name: "Incline DB Press",      prescribed: "4 × 8–12", rpe: "RPE 8" },
          { name: "Chest-Supported Row",   prescribed: "4 × 10–12",rpe: "RPE 8" },
          { name: "DB Lateral Raise",      prescribed: "4 × 15–20",rpe: "RPE 9" },
          { name: "Lat Pulldown (wide)",   prescribed: "3 × 12",   rpe: "RPE 9" },
          { name: "Pec Deck / Cable Fly",  prescribed: "3 × 15",   rpe: "RPE 9" },
          { name: "Curl + Pushdown SS",    prescribed: "3 × 12",   rpe: "RPE 9" },
        ],
      },
      {
        key: "LB", day: "FRIDAY", name: "Lower B",
        focus: "Hypertrophy / Volume", rpe: "RPE 9",
        exercises: [
          { name: "Deadlift",               prescribed: "3 × 3–5",  rpe: "RPE 8" },
          { name: "Bulgarian Split Squat",  prescribed: "3 × 10/leg",rpe: "RPE 9" },
          { name: "Leg Extension",          prescribed: "3 × 15–20",rpe: "RPE 9" },
          { name: "Lying Leg Curl",         prescribed: "3 × 12",   rpe: "RPE 9" },
          { name: "Hip Thrust",             prescribed: "3 × 10–12",rpe: "RPE 9" },
          { name: "Calf Raise (slow ecc.)", prescribed: "4 × 15",   rpe: "RPE 8" },
        ],
      },
      {
        key: "OPT", day: "SATURDAY (OPTIONAL)", name: "Accessory / LISS",
        focus: "Active recovery or isolation work", rpe: "RPE 6–7",
        exercises: [
          { name: "Stationary Bike LISS",  prescribed: "25–30 min", rpe: "60–65% HR" },
          { name: "DB Curl (slow)",        prescribed: "3 × 15",    rpe: "RPE 7" },
          { name: "Tricep Pushdown",       prescribed: "3 × 15",    rpe: "RPE 7" },
          { name: "Lateral Raise",         prescribed: "3 × 20",    rpe: "RPE 7" },
          { name: "Calf Raise",            prescribed: "3 × 20",    rpe: "RPE 6" },
        ],
      },
    ],
  },
};

// ── Grocery Data ────────────────────────────────────────────────
const GROCERY = [
  {
    section: "🥩 HIGH-LEUCINE PROTEINS",
    items: [
      { key: "g_chicken",   name: "Chicken Breast (boneless/skinless)",  qty: "4 lbs" },
      { key: "g_turkey",    name: "93/7 Ground Turkey",                  qty: "2 lbs" },
      { key: "g_tuna",      name: "Canned Tuna in Water",                qty: "8 cans" },
      { key: "g_shrimp",    name: "Shrimp (frozen, peeled/deveined)",    qty: "1.5 lbs" },
      { key: "g_salmon",    name: "Salmon (fresh or frozen)",             qty: "1.5 lbs" },
      { key: "g_tilapia",   name: "Tilapia / Cod (frozen)",              qty: "2 lbs" },
      { key: "g_whey",      name: "Whey Protein Isolate",                qty: "2 lb bag" },
    ],
  },
  {
    section: "🥛 DAIRY PROTEINS",
    items: [
      { key: "g_yogurt",    name: "Non-fat Greek Yogurt",      qty: "32 oz × 2" },
      { key: "g_cottage",   name: "1% Cottage Cheese",         qty: "24 oz × 2" },
      { key: "g_eggwhite",  name: "Liquid Egg Whites",         qty: "32 oz carton" },
      { key: "g_eggs",      name: "Whole Eggs",                qty: "18-count" },
    ],
  },
  {
    section: "🍚 PERFORMANCE CARBS",
    items: [
      { key: "g_rice",      name: "White Rice",                qty: "5 lb bag" },
      { key: "g_oats",      name: "Rolled Oats",               qty: "42 oz canister" },
      { key: "g_sweetpot",  name: "Sweet Potatoes",            qty: "4 lbs" },
      { key: "g_potato",    name: "White / Russet Potatoes",   qty: "3 lbs" },
      { key: "g_banana",    name: "Bananas",                   qty: "1 bunch" },
      { key: "g_blueberry", name: "Blueberries (fresh/frozen)",qty: "1 pint" },
      { key: "g_bagels",    name: "Sprouts New York Bagels",   qty: "1 pack" },
    ],
  },
  {
    section: "🧀 DAIRY + SPREADS",
    items: [
      { key: "g_creamcheese",name:"Nancy's Probiotic Cream Cheese", qty: "8 oz" },
    ],
  },
  {
    section: "🥦 VEGETABLES",
    items: [
      { key: "g_broccoli",  name: "Broccoli (fresh or frozen)", qty: "2 lbs" },
      { key: "g_spinach",   name: "Baby Spinach",               qty: "5 oz × 2" },
      { key: "g_pepper",    name: "Bell Peppers",               qty: "4–5" },
      { key: "g_zucchini",  name: "Zucchini",                  qty: "3" },
      { key: "g_garlic",    name: "Garlic",                     qty: "1 head" },
    ],
  },
  {
    section: "🫒 FATS + PANTRY",
    items: [
      { key: "g_olive",     name: "Extra Virgin Olive Oil",     qty: "16 oz" },
      { key: "g_avocado",   name: "Avocados",                  qty: "4" },
      { key: "g_almonds",   name: "Raw Almonds",               qty: "8 oz bag" },
      { key: "g_soy",       name: "Low-sodium Soy Sauce",      qty: "1 bottle" },
      { key: "g_hotsauce",  name: "Hot Sauce / Salsa",         qty: "1 bottle" },
    ],
  },
  {
    section: "💊 SUPPLEMENTS",
    items: [
      { key: "g_creatine",  name: "Creatine Monohydrate (micronized)", qty: "500g" },
      { key: "g_omega3",    name: "Omega-3 Fish Oil (EPA+DHA)",        qty: "90-count" },
      { key: "g_vitd",      name: "Vitamin D3 (2,000–5,000 IU)",      qty: "90-count" },
    ],
  },
];

// ── App State ───────────────────────────────────────────────────
const State = {
  phase: 1,
  mealLogs: {},
  groceryChecks: {},
  todayWorkout: null,
  sessionSets: {},    // { exerciseName: [ {id, weight, reps, rpe} ] }
  photos: [],
  exerciseHistory: {},// { exerciseName: [ {date, sets:[]} ] }  — loaded lazily
  prs: {},            // { exerciseName: { weight, date } }
  historyModalEx: null,// which exercise the history modal is showing
};

// ── API Helpers ─────────────────────────────────────────────────
const API = {
  async get(path) {
    try {
      const r = await fetch(path);
      return await r.json();
    } catch { return null; }
  },
  async post(path, body) {
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return await r.json();
    } catch { return null; }
  },
  async del(path) {
    try {
      const r = await fetch(path, { method: "DELETE" });
      return await r.json();
    } catch { return null; }
  },
};

// ── Utilities ───────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pct(val, max) {
  return Math.min(100, Math.round((val / max) * 100));
}

function toast(msg, duration = 2000) {
  let el = document.getElementById("globalToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "globalToast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), duration);
}

// ── Progression Engine ──────────────────────────────────────────

const LOWER_KEYWORDS = [
  "squat","deadlift","leg press","leg curl","leg extension",
  "hip thrust","calf","split squat","goblet","rdl","romanian",
];

function isLowerBody(exerciseName) {
  const name = exerciseName.toLowerCase();
  return LOWER_KEYWORDS.some((k) => name.includes(k));
}

function parsePrescribed(prescribed) {
  // "3 × 6–8"  "4 × 4–6"  "3 × 10"  "3 × 10/leg"  "25–30 min"
  const m = prescribed.match(/(\d+)\s*[×x]\s*(\d+)(?:[–\-](\d+))?/);
  if (!m) return { sets: null, minReps: null, maxReps: null };
  return {
    sets:    parseInt(m[1]),
    minReps: parseInt(m[2]),
    maxReps: m[3] ? parseInt(m[3]) : parseInt(m[2]),
  };
}

/**
 * Returns a progression recommendation object for an exercise.
 * @param {string} exerciseName
 * @param {string} prescribed  e.g. "3 × 6–8"
 * @returns {{ suggestedWeight: number|null, message: string, type: 'increase'|'repeat'|'new' }}
 */
function getProgression(exerciseName, prescribed) {
  const history = State.exerciseHistory[exerciseName];
  const increment = isLowerBody(exerciseName) ? 10 : 5;
  const { sets, maxReps } = parsePrescribed(prescribed);

  if (!history || history.length === 0) {
    return {
      suggestedWeight: null,
      message: "No history yet — start light, find your working weight, and log your first session.",
      type: "new",
      increment,
    };
  }

  const lastSession = history[0]; // most recent
  const lastSets = lastSession.sets;
  const lastWeights = lastSets.map((s) => s.weight).filter(Boolean);
  const lastWeight = lastWeights.length ? Math.max(...lastWeights) : null;

  if (!lastWeight) {
    return {
      suggestedWeight: null,
      message: `Last session logged — but no weight recorded. Log weight to enable auto-progression.`,
      type: "repeat",
      increment,
      lastSession,
    };
  }

  // Did every logged set hit max reps (or above)?
  const allMaxed = sets && maxReps
    ? lastSets.filter((s) => s.reps != null).length >= sets &&
      lastSets.every((s) => s.reps == null || s.reps >= maxReps)
    : false;

  if (allMaxed) {
    return {
      suggestedWeight: lastWeight + increment,
      message: `All sets hit ${maxReps} reps at ${lastWeight} lbs — time to add ${increment} lbs! 🔥`,
      type: "increase",
      increment,
      lastSession,
    };
  } else {
    const completedSets = lastSets.filter((s) => s.reps != null && s.reps >= maxReps).length;
    const totalLogged   = lastSets.filter((s) => s.reps != null).length;
    return {
      suggestedWeight: lastWeight,
      message: `Hit ${completedSets}/${totalLogged || sets} sets at ${maxReps} reps. Repeat ${lastWeight} lbs — add ${increment} lbs when all sets are maxed.`,
      type: "repeat",
      increment,
      lastSession,
    };
  }
}


// ── App ─────────────────────────────────────────────────────────
const App = {
  currentTab: "dashboard",

  async init() {
    // Set date in header
    const now = new Date();
    document.getElementById("topDate").textContent =
      now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();

    // Load settings from server
    const settings = await API.get("/api/settings");
    if (settings?.current_phase) {
      State.phase = parseInt(settings.current_phase);
    }

    // Load meal logs for today
    const mealLogs = await API.get(`/api/meals?date=${today()}`);
    if (mealLogs) State.mealLogs = mealLogs;

    // Load grocery checks
    const grocery = await API.get("/api/grocery");
    if (grocery) State.groceryChecks = grocery;

    // Load workout sets for today
    const sets = await API.get(`/api/workouts?date=${today()}`);
    if (sets) {
      sets.forEach((s) => {
        if (!State.sessionSets[s.exercise_name]) State.sessionSets[s.exercise_name] = [];
        State.sessionSets[s.exercise_name].push(s);
      });
      if (sets.length > 0) State.todayWorkout = sets[0].workout_key;
    }

    // Load progress photos
    const photos = await API.get("/api/progress");
    if (photos) State.photos = photos;

    // Load personal records
    const prs = await API.get("/api/workouts/prs");
    if (prs) State.prs = prs;

    this.updateHeader();
    this.renderDashboard();
    this.renderMeals();
    this.renderWorkout();
    this.renderProgress();
    this.renderGrocery();
  },

  updateHeader() {
    const p = PHASES[State.phase];
    document.getElementById("topPhaseLabel").textContent = `PHASE ${State.phase}`;
  },

  switchTab(tab, btn) {
    document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");
    btn.classList.add("active");
    this.currentTab = tab;
    document.getElementById("topTitle").textContent =
      { dashboard: "SHREDDED", meals: "MEALS", workout: "LIFT", progress: "PROGRESS", grocery: "GROCERY" }[tab];
  },

  // ── Dashboard ─────────────────────────────────────────────────
  renderDashboard() {
    const p = PHASES[State.phase];

    // Hero
    document.getElementById("phaseHero").innerHTML = `
      <div class="phase-hero__label">PHASE ${State.phase} · ${p.weeks}</div>
      <div class="phase-hero__name">${p.shortName}</div>
      <div class="phase-hero__desc">${p.desc}</div>
    `;

    // Stats grid
    const t = p.targets;
    document.getElementById("dashGrid").innerHTML = `
      <div class="stat-card stat-card--red">
        <div class="stat-card__label">CALORIES</div>
        <div class="stat-card__val">${t.cal}<span class="stat-card__unit">cal</span></div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-card__label">PROTEIN</div>
        <div class="stat-card__val">${t.protein}<span class="stat-card__unit">g</span></div>
      </div>
      <div class="stat-card stat-card--blue">
        <div class="stat-card__label">TRAINING</div>
        <div class="stat-card__val" style="font-size:16px;margin-top:4px;">${p.training}</div>
      </div>
      <div class="stat-card stat-card--gold">
        <div class="stat-card__label">INTENSITY</div>
        <div class="stat-card__val" style="font-size:18px;margin-top:4px;">${p.rpe}</div>
      </div>
    `;

    // Phase selector
    const sel = document.getElementById("phaseSelector");
    sel.innerHTML = [1, 2, 3].map((n) => {
      const ph = PHASES[n];
      return `
        <button class="phase-btn ${State.phase === n ? "selected" : ""}"
                onclick="App.setPhase(${n})">
          <div class="phase-btn__num">${n}</div>
          <div class="phase-btn__info">
            <div class="phase-btn__name">${ph.shortName}</div>
            <div class="phase-btn__meta">${ph.weeks} · ${ph.targets.cal} cal/day</div>
          </div>
          <div class="phase-btn__check">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </button>`;
    }).join("");

    // Glance cards
    const mealsCompleted = Object.values(State.mealLogs).filter(Boolean).length;
    const totalMeals = p.meals.length;
    const setsToday = Object.values(State.sessionSets).reduce((a, s) => a + s.length, 0);

    document.getElementById("glanceCards").innerHTML = `
      <div class="glance-item">
        <div class="glance-icon">
          <svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
        </div>
        <div class="glance-text">
          <div class="glance-label">MEALS TODAY</div>
          <div class="glance-val">${mealsCompleted} of ${totalMeals} completed</div>
        </div>
        ${mealsCompleted === totalMeals ? '<div class="glance-check">✓</div>' : ""}
      </div>
      <div class="glance-item">
        <div class="glance-icon">
          <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h3"/><path d="M3 14.5h3"/><path d="M18 9.5h3"/><path d="M18 14.5h3"/></svg>
        </div>
        <div class="glance-text">
          <div class="glance-label">SETS LOGGED</div>
          <div class="glance-val">${setsToday} sets today${State.todayWorkout ? ` · ${State.todayWorkout}` : ""}</div>
        </div>
        ${setsToday > 0 ? '<div class="glance-check">✓</div>' : ""}
      </div>
      <div class="glance-item">
        <div class="glance-icon">
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div class="glance-text">
          <div class="glance-label">SCHEDULE</div>
          <div class="glance-val">Train at 3:30pm · Post-workout meal at 6:00pm</div>
        </div>
      </div>
    `;
  },

  async setPhase(n) {
    State.phase = n;
    State.mealLogs = {};
    await API.post("/api/settings", { current_phase: n });
    this.updateHeader();
    this.renderDashboard();
    this.renderMeals();
    this.renderWorkout();
    toast(`Switched to Phase ${n}`);
  },

  // ── Meals ─────────────────────────────────────────────────────
  renderMeals() {
    const p = PHASES[State.phase];
    const t = p.targets;
    const meals = p.meals;

    // Calculate consumed macros
    let totCal = 0, totP = 0, totC = 0, totF = 0;
    meals.forEach((m, i) => {
      if (State.mealLogs[i]) {
        totCal += m.cal; totP += m.protein; totC += m.carbs; totF += m.fat;
      }
    });

    // Ring (calories)
    const calPct = pct(totCal, t.cal);
    const r = 34; const circ = 2 * Math.PI * r;
    const offset = circ - (calPct / 100) * circ;

    document.getElementById("macroRingWrap").innerHTML = `
      <div class="macro-ring">
        <svg viewBox="0 0 88 88">
          <circle class="macro-ring__track" cx="44" cy="44" r="${r}"/>
          <circle class="macro-ring__fill" cx="44" cy="44" r="${r}"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="macro-ring__center">
          <div class="macro-ring__cal">${totCal}</div>
          <div class="macro-ring__label">/ ${t.cal}</div>
        </div>
      </div>
      <div class="macro-stats">
        ${this._macroBar("PROTEIN", totP, t.protein, "#27ae60")}
        ${this._macroBar("CARBS",   totC, t.carbs,   "#2980b9")}
        ${this._macroBar("FAT",     totF, t.fat,     "#d4a017")}
      </div>
    `;

    document.getElementById("macroBars").innerHTML = `
      <div class="macro-pill macro-pill--p">
        <div class="macro-pill__val">${totP}g</div>
        <div class="macro-pill__name">PROTEIN</div>
      </div>
      <div class="macro-pill macro-pill--c">
        <div class="macro-pill__val">${totC}g</div>
        <div class="macro-pill__name">CARBS</div>
      </div>
      <div class="macro-pill macro-pill--f">
        <div class="macro-pill__val">${totF}g</div>
        <div class="macro-pill__name">FAT</div>
      </div>
    `;

    document.getElementById("mealList").innerHTML = meals.map((m, i) => {
      const done = !!State.mealLogs[i];
      const labelHtml = m.label === "post" ? '<span class="label-tag">POST-WORKOUT</span>'
                      : m.label === "pre"  ? '<span class="label-tag pre">PRE-WORKOUT</span>' : "";
      return `
        <div class="meal-card ${done ? "done" : ""}" id="mc${i}">
          <div class="meal-card__header" onclick="App.expandMeal(${i})">
            <div class="meal-card__checkbox" onclick="App.toggleMeal(event, ${i})">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="meal-card__info">
              <div class="meal-card__time">${m.time}</div>
              <div class="meal-card__name">${m.name}</div>
              <div class="meal-card__cal">${m.cal} cal</div>
            </div>
            ${labelHtml}
            <div class="meal-card__expand">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="meal-card__body">
            ${m.items.map((item) => `
              <div class="meal-item-row">
                <span class="meal-item-name">${item.name}</span>
                <span class="meal-item-macro">${item.macro}</span>
              </div>
            `).join("")}
            <div class="meal-card__macros mt8">
              <span class="mmacro mmacro--p">${m.protein}g P</span>
              <span class="mmacro mmacro--c">${m.carbs}g C</span>
              <span class="mmacro mmacro--f">${m.fat}g F</span>
              <span class="mmacro mmacro--cal">${m.cal} kcal</span>
            </div>
          </div>
        </div>`;
    }).join("");
  },

  _macroBar(name, val, max, color) {
    return `
      <div class="macro-stat">
        <div class="macro-stat__dot" style="background:${color}"></div>
        <div class="macro-stat__name">${name}</div>
        <div class="macro-stat__bar"><div class="macro-stat__fill" style="width:${pct(val,max)}%;background:${color}"></div></div>
        <div class="macro-stat__nums">${val}/${max}g</div>
      </div>`;
  },

  expandMeal(i) {
    const card = document.getElementById(`mc${i}`);
    card.classList.toggle("open");
  },

  async toggleMeal(e, i) {
    e.stopPropagation();
    const done = !State.mealLogs[i];
    State.mealLogs[i] = done;
    await API.post("/api/meals", { meal_index: i, completed: done ? 1 : 0 });
    this.renderMeals();
    this.renderDashboard();
    if (done) toast("Meal logged ✓");
  },

  // ── Workout ───────────────────────────────────────────────────
  renderWorkout() {
    const p = PHASES[State.phase];
    const sel = document.getElementById("workoutSelector");
    const sess = document.getElementById("workoutSession");

    if (State.todayWorkout) {
      sel.style.display = "none";
      sess.style.display = "block";
      this._renderSession();
    } else {
      sess.style.display = "none";
      sel.style.display = "block";
      sel.innerHTML = `
        <div class="prog-rules-card">
          <div class="prog-rules-title">
            <span>📈</span> PROGRESSIVE OVERLOAD RULES
          </div>
          <div class="prog-rules-grid">
            <div class="prog-rule-item">
              <div class="prog-rule-label">UPPER BODY</div>
              <div class="prog-rule-val">+5 lbs</div>
              <div class="prog-rule-desc">bench, press, row, pull</div>
            </div>
            <div class="prog-rule-item">
              <div class="prog-rule-label">LOWER BODY</div>
              <div class="prog-rule-val">+10 lbs</div>
              <div class="prog-rule-desc">squat, deadlift, leg work</div>
            </div>
          </div>
          <div class="prog-rules-when">
            <strong>When to add weight:</strong> Hit ALL prescribed sets at the TOP of the rep range in the same session → add weight next session. If you miss reps → repeat the same weight.
          </div>
          <div class="prog-rules-stall">
            <strong>Stalled 3+ sessions?</strong> Drop weight 10–15%, rebuild. Or add a deload week (50% volume, 70% weight).
          </div>
        </div>
        <div class="workout-selector__heading" style="margin-top:16px;">SELECT TODAY'S WORKOUT — PHASE ${State.phase} · ${p.rpe}</div>
        <div class="workout-day-grid">
          ${p.workouts.map((w) => `
            <button class="workout-day-btn" onclick="App.startWorkout('${w.key}')">
              <div class="workout-day-btn__day">${w.day}</div>
              <div class="workout-day-btn__name">${w.name}</div>
              <div class="workout-day-btn__rpe">${w.rpe} · ${w.focus}</div>
            </button>
          `).join("")}
        </div>
        <p class="text-muted" style="text-align:center;margin-top:8px;font-size:12px;">
          RPE = Rate of Perceived Exertion · RPE 8 = 2 reps left in the tank
        </p>
      `;
    }
  },

  async startWorkout(key) {
    State.todayWorkout = key;
    const p = PHASES[State.phase];
    const w = p.workouts.find((x) => x.key === key);

    // Load history for all exercises in this workout in parallel
    await Promise.all(
      w.exercises.map(async (ex) => {
        if (!State.exerciseHistory[ex.name]) {
          const h = await API.get(
            `/api/workouts/history?exercise=${encodeURIComponent(ex.name)}`
          );
          if (h) State.exerciseHistory[ex.name] = h;
        }
      })
    );

    document.getElementById("workoutSelector").style.display = "none";
    document.getElementById("workoutSession").style.display = "block";
    this._renderSession();
  },

  _renderSession() {
    const p = PHASES[State.phase];
    const w = p.workouts.find((x) => x.key === State.todayWorkout);
    if (!w) return;

    const sess = document.getElementById("workoutSession");
    sess.innerHTML = `
      <div class="session-header">
        <button class="session-back" onclick="App.endWorkout()">
          <svg viewBox="0 0 24 24" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="session-title">${w.name}</div>
        <span class="tag tag-red">${w.rpe}</span>
      </div>
      ${w.exercises.map((ex, ei) => this._exerciseCard(ex, ei)).join("")}
    `;
  },

  _exerciseCard(ex, ei) {
    const sets = State.sessionSets[ex.name] || [];
    const pr = State.prs[ex.name];
    const prog = getProgression(ex.name, ex.prescribed);
    const isNew = !State.exerciseHistory[ex.name]?.length;
    const increment = isLowerBody(ex.name) ? 10 : 5;

    // Last session summary
    let lastSessionHtml = "";
    if (prog.lastSession) {
      const ls = prog.lastSession;
      const setsText = ls.sets
        .map((s) => `<span class="ls-set">${s.weight ?? "–"}×${s.reps ?? "–"}</span>`)
        .join("");
      lastSessionHtml = `
        <div class="last-session">
          <div class="last-session__header">
            <span class="last-session__label">LAST SESSION</span>
            <span class="last-session__date">${formatDate(ls.date)}</span>
            <button class="hist-btn" onclick="App.showHistory('${ex.name.replace(/'/g,"\\'")}')">History</button>
          </div>
          <div class="last-session__sets">${setsText}</div>
        </div>`;
    } else if (!isNew) {
      lastSessionHtml = `<div class="last-session">
        <div class="last-session__header">
          <span class="last-session__label">LAST SESSION</span>
          <button class="hist-btn" onclick="App.showHistory('${ex.name.replace(/'/g,"\\'")}')">History</button>
        </div>
        <div class="last-session__sets" style="color:var(--text3)">No weight logged last session</div>
      </div>`;
    }

    // Recommendation card
    const recColor = prog.type === "increase" ? "var(--green)"
                   : prog.type === "new"      ? "var(--gold)"
                   :                            "var(--blue)";
    const recIcon  = prog.type === "increase" ? "↑" : prog.type === "new" ? "★" : "→";

    const recHtml = `
      <div class="rec-card" style="border-left-color:${recColor}">
        <div class="rec-card__top">
          <span class="rec-icon" style="color:${recColor}">${recIcon}</span>
          <span class="rec-card__msg">${prog.message}</span>
        </div>
        <div class="rec-card__detail">
          <span class="rec-detail-item"><span style="color:var(--text3)">INCREMENT</span> <strong>${increment} lbs</strong></span>
          ${pr ? `<span class="rec-detail-item"><span style="color:var(--text3)">YOUR PR</span> <strong style="color:var(--gold)">${pr.weight} lbs</strong></span>` : ""}
          <span class="rec-detail-item"><span style="color:var(--text3)">TARGET</span> <strong>${ex.prescribed}</strong></span>
        </div>
      </div>`;

    const open = sets.length > 0;
    return `
      <div class="exercise-card ${open ? "open" : ""}" id="exc${ei}">
        <div class="exercise-header" onclick="App.toggleExercise(${ei})">
          <div class="exercise-num">${ei + 1}</div>
          <div class="exercise-info">
            <div class="exercise-name">${ex.name}${pr && sets.some(s => s.weight >= pr.weight) ? ' <span class="pr-badge">PR 🏆</span>' : ""}</div>
            <div class="exercise-prescribed">${ex.prescribed} · ${ex.rpe}</div>
          </div>
          <div class="exercise-sets-done">${sets.length > 0 ? sets.length + " sets" : ""}</div>
        </div>
        <div class="exercise-body">
          ${lastSessionHtml}
          ${recHtml}
          ${sets.length > 0 ? `
            <div class="set-log-header">
              <div>#</div><div>Weight</div><div>Reps</div><div>RPE</div><div></div>
            </div>
            ${sets.map((s, si) => `
              <div class="set-row">
                <div class="set-num">${si + 1}</div>
                <div>${s.weight ?? "–"} lbs</div>
                <div>${s.reps ?? "–"}</div>
                <div>${s.rpe ?? "–"}</div>
                <div class="set-del" onclick="App.deleteSet(${s.id}, '${ex.name.replace(/'/g,"\\'")}', ${ei})">×</div>
              </div>
            `).join("")}
          ` : ""}
          <div class="set-input-row">
            <div class="set-input-group">
              <label>WEIGHT (lbs)</label>
              <div class="set-input-wrap">
                <button class="set-spinner" onclick="App.spin('w${ei}',-${increment})">−</button>
                <input type="number" id="w${ei}" class="set-input-field"
                       value="${prog.suggestedWeight ?? ""}"
                       placeholder="${prog.suggestedWeight ?? "lbs"}" inputmode="decimal">
                <button class="set-spinner" onclick="App.spin('w${ei}',${increment})">+</button>
              </div>
            </div>
            <div class="set-input-group">
              <label>REPS</label>
              <div class="set-input-wrap">
                <button class="set-spinner" onclick="App.spin('r${ei}',-1)">−</button>
                <input type="number" id="r${ei}" class="set-input-field" placeholder="8" inputmode="numeric">
                <button class="set-spinner" onclick="App.spin('r${ei}',1)">+</button>
              </div>
            </div>
            <div class="set-input-group">
              <label>RPE</label>
              <div class="set-input-wrap">
                <button class="set-spinner" onclick="App.spinHalf('rpe${ei}',-0.5)">−</button>
                <input type="number" id="rpe${ei}" class="set-input-field" placeholder="7" inputmode="decimal" step="0.5">
                <button class="set-spinner" onclick="App.spinHalf('rpe${ei}',0.5)">+</button>
              </div>
            </div>
          </div>
          <button class="log-set-btn" onclick="App.logSet('${ex.name.replace(/'/g,"\\'")}', ${ei})">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            LOG SET ${sets.length + 1}
          </button>
        </div>
      </div>`;
  },

  toggleExercise(ei) {
    document.getElementById(`exc${ei}`).classList.toggle("open");
  },

  spin(id, delta) {
    const el = document.getElementById(id);
    const val = parseFloat(el.value) || 0;
    el.value = Math.max(0, val + delta);
  },

  spinHalf(id, delta) {
    const el = document.getElementById(id);
    const val = parseFloat(el.value) || 0;
    el.value = Math.max(0, Math.min(10, +(val + delta).toFixed(1)));
  },

  async logSet(exerciseName, ei) {
    const weight = parseFloat(document.getElementById(`w${ei}`).value) || null;
    const reps   = parseInt(document.getElementById(`r${ei}`).value)   || null;
    const rpe    = parseFloat(document.getElementById(`rpe${ei}`).value) || null;

    const body = {
      phase: State.phase,
      workout_key: State.todayWorkout,
      exercise_name: exerciseName,
      set_number: (State.sessionSets[exerciseName] || []).length + 1,
      weight, reps, rpe,
    };

    const res = await API.post("/api/workouts", body);
    if (res?.ok) {
      if (!State.sessionSets[exerciseName]) State.sessionSets[exerciseName] = [];
      State.sessionSets[exerciseName].push({ ...body, id: res.id });

      // Update PR if new record
      if (weight && (!State.prs[exerciseName] || weight > State.prs[exerciseName].weight)) {
        State.prs[exerciseName] = { weight, date: today() };
        toast(`🏆 New PR! ${weight} lbs on ${exerciseName}`);
      } else {
        toast(`Set ${body.set_number} logged ✓`);
      }
      this._renderSession();
      this.renderDashboard();
    }
  },

  async deleteSet(id, exerciseName, ei) {
    await API.del(`/api/workouts/${id}`);
    State.sessionSets[exerciseName] = (State.sessionSets[exerciseName] || []).filter((s) => s.id !== id);
    this._renderSession();
    toast("Set removed");
  },

  endWorkout() {
    if (Object.values(State.sessionSets).some((s) => s.length > 0)) {
      if (!confirm("End this workout session? Logged sets are saved.")) return;
    }
    State.todayWorkout = null;
    State.sessionSets = {};
    this.renderWorkout();
    this.renderDashboard();
  },

  // ── History Modal ──────────────────────────────────────────────
  async showHistory(exerciseName) {
    // Ensure history loaded
    if (!State.exerciseHistory[exerciseName]) {
      const h = await API.get(`/api/workouts/history?exercise=${encodeURIComponent(exerciseName)}`);
      if (h) State.exerciseHistory[exerciseName] = h;
    }

    const history = State.exerciseHistory[exerciseName] || [];
    const pr = State.prs[exerciseName];

    // Build modal HTML
    let rowsHtml = "";
    if (history.length === 0) {
      rowsHtml = `<div style="text-align:center;color:var(--text3);padding:32px 0;">No history yet for this exercise.</div>`;
    } else {
      rowsHtml = history.map((session) => {
        const maxW = Math.max(...session.sets.map((s) => s.weight || 0));
        const isPR = pr && maxW >= pr.weight;
        return `
          <div class="hist-session">
            <div class="hist-session__header">
              <span class="hist-session__date">${formatDate(session.date)}</span>
              ${isPR ? '<span class="pr-badge">PR 🏆</span>' : ""}
            </div>
            <div class="hist-session__sets">
              ${session.sets.map((s, i) => `
                <div class="hist-set-row">
                  <span class="hist-set-num">Set ${i + 1}</span>
                  <span class="hist-set-weight">${s.weight ?? "–"} lbs</span>
                  <span class="hist-set-reps">${s.reps ?? "–"} reps</span>
                  <span class="hist-set-rpe">${s.rpe ? "RPE " + s.rpe : ""}</span>
                </div>
              `).join("")}
            </div>
          </div>`;
      }).join("");
    }

    let modal = document.getElementById("histModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "histModal";
      modal.className = "hist-modal-overlay";
      modal.innerHTML = `
        <div class="hist-modal">
          <div class="hist-modal__header">
            <div class="hist-modal__title" id="histModalTitle"></div>
            <button class="hist-modal__close" onclick="App.closeHistory()">×</button>
          </div>
          <div class="hist-modal__pr" id="histModalPR"></div>
          <div class="hist-modal__body" id="histModalBody"></div>
        </div>`;
      document.body.appendChild(modal);
    }

    document.getElementById("histModalTitle").textContent = exerciseName;
    document.getElementById("histModalPR").innerHTML = pr
      ? `<div class="pr-banner">🏆 Personal Record: <strong>${pr.weight} lbs</strong> on ${formatDate(pr.date)}</div>`
      : `<div class="pr-banner pr-banner--empty">No PR yet — start logging to track progress.</div>`;
    document.getElementById("histModalBody").innerHTML = rowsHtml;
    modal.classList.add("open");
  },

  closeHistory() {
    document.getElementById("histModal")?.classList.remove("open");
  },



  // ── Progress ──────────────────────────────────────────────────
  renderProgress() {
    const lastPhoto = State.photos[0];
    const daysSince = lastPhoto
      ? Math.floor((Date.now() - new Date(lastPhoto.log_date + "T00:00:00").getTime()) / 86400000)
      : null;
    const prompt = daysSince === null || daysSince >= 14;

    document.getElementById("progressUpload").innerHTML = `
      <div class="progress-upload__icon">${prompt ? "📸" : "✅"}</div>
      <div class="progress-upload__title">${prompt ? "Time for a Progress Photo!" : "Photo Logged"}</div>
      <div class="progress-upload__sub">
        ${prompt ? "Bi-weekly photos track your recomposition. Same lighting, same pose." : `Last photo: ${daysSince} days ago`}
      </div>
      <div class="progress-meta">
        <input type="number" id="photoWeight" placeholder="Current weight (lbs)" inputmode="decimal" step="0.1">
        <input type="text" id="photoNotes" placeholder="Notes (optional)">
      </div>
      <label class="upload-btn-label" for="photoInput">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        UPLOAD PHOTO
      </label>
      <input type="file" id="photoInput" accept="image/*" capture="environment" onchange="App.uploadPhoto(this)">
    `;

    // Photo grid
    const grid = document.getElementById("photoGrid");
    if (State.photos.length === 0) {
      grid.innerHTML = '<div class="no-photos">No photos yet. Upload your first progress photo above.</div>';
    } else {
      grid.innerHTML = State.photos.map((ph) => `
        <div class="photo-card">
          <img src="/static/uploads/${ph.filename}" alt="Progress ${ph.log_date}" loading="lazy">
          <div class="photo-card__info">
            <div class="photo-card__date">${formatDate(ph.log_date)} · Phase ${ph.phase}</div>
            ${ph.weight ? `<div class="photo-card__weight">${ph.weight} lbs</div>` : ""}
          </div>
          <div class="photo-card__del" onclick="App.deletePhoto(${ph.id})">×</div>
        </div>
      `).join("");
    }
  },

  async uploadPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const weight = document.getElementById("photoWeight").value;
    const notes  = document.getElementById("photoNotes").value;

    const form = new FormData();
    form.append("photo", file);
    form.append("phase", State.phase);
    form.append("weight", weight);
    form.append("notes", notes);

    toast("Uploading…");
    const r = await fetch("/api/progress", { method: "POST", body: form });
    const res = await r.json();
    if (res.ok) {
      const photos = await API.get("/api/progress");
      if (photos) State.photos = photos;
      this.renderProgress();
      toast("Photo saved ✓");
    } else {
      toast("Upload failed");
    }
    input.value = "";
  },

  async deletePhoto(id) {
    if (!confirm("Delete this photo?")) return;
    await API.del(`/api/progress/${id}`);
    State.photos = State.photos.filter((p) => p.id !== id);
    this.renderProgress();
    toast("Photo deleted");
  },

  // ── Grocery ───────────────────────────────────────────────────
  renderGrocery() {
    const p = PHASES[State.phase];
    const totalItems = GROCERY.reduce((a, s) => a + s.items.length, 0);
    const checked = Object.values(State.groceryChecks).filter(Boolean).length;

    document.getElementById("groceryHeader").innerHTML = `
      <div class="grocery-header__left">
        <div class="grocery-header__label">PHASE ${State.phase} · ${p.weeks}</div>
        <div class="grocery-header__title">${checked}/${totalItems} Items</div>
      </div>
      <button class="grocery-reset" onclick="App.resetGrocery()">RESET</button>
    `;

    document.getElementById("groceryBody").innerHTML = GROCERY.map((sec) => `
      <div class="grocery-section">
        <div class="grocery-section__title">${sec.section}</div>
        <div class="grocery-items">
          ${sec.items.map((item) => `
            <div class="grocery-item ${State.groceryChecks[item.key] ? "checked" : ""}"
                 onclick="App.toggleGrocery('${item.key}')">
              <div class="g-check"></div>
              <div class="g-name">${item.name}</div>
              <div class="g-qty">${item.qty}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  },

  async toggleGrocery(key) {
    const val = !State.groceryChecks[key];
    State.groceryChecks[key] = val;
    await API.post("/api/grocery", { item_key: key, checked: val ? 1 : 0 });
    this.renderGrocery();
  },

  async resetGrocery() {
    if (!confirm("Uncheck all grocery items?")) return;
    const keys = GROCERY.flatMap((s) => s.items.map((i) => i.key));
    State.groceryChecks = {};
    await Promise.all(keys.map((k) => API.post("/api/grocery", { item_key: k, checked: 0 })));
    this.renderGrocery();
    toast("Grocery list reset");
  },
};

// ── Boot ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());