import os
import sqlite3
from datetime import date, datetime
from flask import Flask, jsonify, render_template, request, send_from_directory


app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = os.path.join("static", "uploads")
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXT = {"png", "jpg", "jpeg", "heic", "heif", "webp"}
DB_PATH = os.path.join("data", "tracker.db")


# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs("data", exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS meal_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            log_date    TEXT NOT NULL,
            meal_index  INTEGER NOT NULL,
            completed   INTEGER DEFAULT 0,
            UNIQUE(log_date, meal_index)
        );

        CREATE TABLE IF NOT EXISTS workout_sets (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            log_date      TEXT NOT NULL,
            phase         INTEGER NOT NULL,
            workout_key   TEXT NOT NULL,
            exercise_name TEXT NOT NULL,
            set_number    INTEGER NOT NULL,
            weight        REAL,
            reps          INTEGER,
            rpe           REAL,
            created_at    TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS progress_photos (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            log_date TEXT NOT NULL,
            filename TEXT NOT NULL,
            phase    INTEGER,
            weight   REAL,
            notes    TEXT
        );

        CREATE TABLE IF NOT EXISTS grocery_checks (
            item_key TEXT PRIMARY KEY,
            checked  INTEGER DEFAULT 0
        );
    """)

    c.execute("INSERT OR IGNORE INTO settings VALUES ('current_phase', '1')")
    c.execute(
        "INSERT OR IGNORE INTO settings VALUES ('start_date', ?)",
        (date.today().isoformat(),),
    )
    conn.commit()
    conn.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/static/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# Settings
@app.route("/api/settings", methods=["GET", "POST"])
def settings():
    conn = get_db()
    c = conn.cursor()
    if request.method == "POST":
        for k, v in request.json.items():
            c.execute("INSERT OR REPLACE INTO settings VALUES (?, ?)", (k, str(v)))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    c.execute("SELECT key, value FROM settings")
    rows = c.fetchall()
    conn.close()
    return jsonify({r["key"]: r["value"] for r in rows})


# Meal logs
@app.route("/api/meals", methods=["GET", "POST"])
def meals():
    conn = get_db()
    c = conn.cursor()
    today = date.today().isoformat()
    if request.method == "POST":
        d = request.json
        c.execute(
            "INSERT OR REPLACE INTO meal_logs (log_date, meal_index, completed) VALUES (?,?,?)",
            (d.get("date", today), d["meal_index"], d.get("completed", 0)),
        )
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    log_date = request.args.get("date", today)
    c.execute("SELECT meal_index, completed FROM meal_logs WHERE log_date=?", (log_date,))
    rows = c.fetchall()
    conn.close()
    return jsonify({r["meal_index"]: r["completed"] for r in rows})


# Workout sets
@app.route("/api/workouts", methods=["GET", "POST"])
def workouts():
    conn = get_db()
    c = conn.cursor()
    today = date.today().isoformat()
    if request.method == "POST":
        d = request.json
        c.execute(
            """INSERT INTO workout_sets
               (log_date, phase, workout_key, exercise_name, set_number, weight, reps, rpe)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                d.get("date", today),
                d["phase"],
                d["workout_key"],
                d["exercise_name"],
                d["set_number"],
                d.get("weight"),
                d.get("reps"),
                d.get("rpe"),
            ),
        )
        conn.commit()
        row_id = c.lastrowid
        conn.close()
        return jsonify({"ok": True, "id": row_id})
    log_date = request.args.get("date", today)
    c.execute(
        "SELECT * FROM workout_sets WHERE log_date=? ORDER BY id",
        (log_date,),
    )
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/workouts/<int:row_id>", methods=["DELETE"])
def delete_set(row_id):
    conn = get_db()
    conn.execute("DELETE FROM workout_sets WHERE id=?", (row_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/workouts/history")
def workout_history():
    exercise = request.args.get("exercise", "")
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """SELECT log_date, weight, reps, rpe, set_number FROM workout_sets
           WHERE exercise_name=? ORDER BY log_date DESC, set_number ASC LIMIT 60""",
        (exercise,),
    )
    rows = c.fetchall()
    conn.close()
    # Group by date
    grouped = {}
    order = []
    for r in rows:
        d = r["log_date"]
        if d not in grouped:
            grouped[d] = []
            order.append(d)
        grouped[d].append(dict(r))
    return jsonify([{"date": d, "sets": grouped[d]} for d in order])


@app.route("/api/workouts/prs")
def personal_records():
    """Return the heaviest weight logged per exercise."""
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """SELECT exercise_name,
                  MAX(weight) AS best_weight,
                  log_date    AS pr_date
           FROM workout_sets
           WHERE weight IS NOT NULL
           GROUP BY exercise_name"""
    )
    rows = c.fetchall()
    conn.close()
    return jsonify({r["exercise_name"]: {"weight": r["best_weight"], "date": r["pr_date"]} for r in rows})


# Progress photos
@app.route("/api/progress", methods=["GET", "POST"])
def progress():
    conn = get_db()
    c = conn.cursor()
    if request.method == "POST":
        if "photo" not in request.files:
            return jsonify({"error": "no file"}), 400
        f = request.files["photo"]
        if not f or not allowed(f.filename):
            return jsonify({"error": "invalid type"}), 400
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = f.filename.rsplit(".", 1)[1].lower()
        fname = f"progress_{ts}.{ext}"
        f.save(os.path.join(app.config["UPLOAD_FOLDER"], fname))
        c.execute(
            "INSERT INTO progress_photos (log_date,filename,phase,weight,notes) VALUES (?,?,?,?,?)",
            (
                date.today().isoformat(),
                fname,
                request.form.get("phase", 1),
                request.form.get("weight") or None,
                request.form.get("notes", ""),
            ),
        )
        conn.commit()
        pid = c.lastrowid
        conn.close()
        return jsonify({"ok": True, "id": pid, "filename": fname})
    c.execute("SELECT * FROM progress_photos ORDER BY log_date DESC")
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/progress/<int:pid>", methods=["DELETE"])
def delete_photo(pid):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT filename FROM progress_photos WHERE id=?", (pid,))
    row = c.fetchone()
    if row:
        fp = os.path.join(app.config["UPLOAD_FOLDER"], row["filename"])
        if os.path.exists(fp):
            os.remove(fp)
        c.execute("DELETE FROM progress_photos WHERE id=?", (pid,))
        conn.commit()
    conn.close()
    return jsonify({"ok": True})


# Grocery
@app.route("/api/grocery", methods=["GET", "POST"])
def grocery():
    conn = get_db()
    c = conn.cursor()
    if request.method == "POST":
        d = request.json
        c.execute(
            "INSERT OR REPLACE INTO grocery_checks VALUES (?,?)",
            (d["item_key"], d.get("checked", 0)),
        )
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    c.execute("SELECT item_key, checked FROM grocery_checks")
    rows = c.fetchall()
    conn.close()
    return jsonify({r["item_key"]: bool(r["checked"]) for r in rows})


# ── Entry ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)