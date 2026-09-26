CREATE TABLE IF NOT EXISTS health_records (
  date TEXT PRIMARY KEY,
  weight REAL NOT NULL CHECK(weight > 0 AND weight <= 500),
  bodyFat REAL NOT NULL CHECK(bodyFat >= 0 AND bodyFat <= 100),
  muscle REAL NOT NULL CHECK(muscle > 0 AND muscle <= weight),
  muscleRate REAL CHECK(muscleRate >= 0 AND muscleRate <= 100),
  fatMass REAL CHECK(fatMass >= 0 AND fatMass <= weight),
  visceral INTEGER CHECK(visceral >= 1 AND visceral <= 60),
  heart INTEGER CHECK(heart >= 20 AND heart <= 250),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
