-- Money is stored as whole rupees (INTEGER). Dates are ISO text (YYYY-MM-DD).

CREATE TABLE clients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  phone_clean TEXT NOT NULL,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_clients_name  ON clients(name COLLATE NOCASE);
CREATE INDEX idx_clients_phone ON clients(phone_clean);

CREATE TABLE measurements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  garment_type  TEXT NOT NULL DEFAULT '',
  chest REAL, waist REAL, hip REAL, shoulder REAL,
  sleeve_length REAL, sleeve_round REAL, neck REAL, garment_length REAL, inseam REAL,
  notes         TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_measurements_client ON measurements(client_id, date);

CREATE TABLE bills (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  discount  INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  notes     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_bills_client ON bills(client_id);
CREATE INDEX idx_bills_date   ON bills(date);

CREATE TABLE garments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bill_id       INTEGER REFERENCES bills(id) ON DELETE SET NULL, -- deleting a bill keeps the garments
  description   TEXT NOT NULL,
  date_ordered  TEXT NOT NULL,
  delivery_date TEXT,
  price         INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  status        TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Ready', 'Delivered')),
  notes         TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_garments_client ON garments(client_id, date_ordered);
CREATE INDEX idx_garments_bill   ON garments(bill_id);

CREATE TABLE garment_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  garment_id INTEGER NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  file_name  TEXT NOT NULL, -- file name only; the file lives in the photos folder
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_photos_garment ON garment_photos(garment_id);

CREATE TABLE payments (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  date    TEXT NOT NULL,
  amount  INTEGER NOT NULL CHECK (amount > 0),
  note    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_date ON payments(date);

CREATE TABLE employees (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  phone     TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE work_entries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  amount_earned INTEGER NOT NULL CHECK (amount_earned > 0)
);
CREATE INDEX idx_work_employee ON work_entries(employee_id, date);

CREATE TABLE advances (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  note        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_advances_employee ON advances(employee_id, date);

CREATE TABLE payouts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  note        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_payouts_employee ON payouts(employee_id, date);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL -- JSON
);

-- A bill's total and paid amount are always calculated, never typed in.
CREATE VIEW bill_totals AS
SELECT b.id AS bill_id, b.client_id, b.date, b.discount, b.notes,
       COALESCE(g.total, 0) - b.discount AS total,
       COALESCE(p.paid, 0)               AS paid
FROM bills b
LEFT JOIN (SELECT bill_id, SUM(price)  AS total FROM garments WHERE bill_id IS NOT NULL GROUP BY bill_id) g ON g.bill_id = b.id
LEFT JOIN (SELECT bill_id, SUM(amount) AS paid  FROM payments GROUP BY bill_id) p ON p.bill_id = b.id;
