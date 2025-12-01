PRAGMA foreign_keys = ON;

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_number TEXT NOT NULL UNIQUE,
  airline TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_iso TEXT NOT NULL,
  arrival_iso TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  price_real REAL NOT NULL,
  base_price REAL,
  seats_total INTEGER NOT NULL,
  seats_available INTEGER NOT NULL,
  flight_date TEXT NOT NULL
);

-- Use INSERT OR IGNORE so re-running the script won't error on duplicates
INSERT OR IGNORE INTO flights (flight_number, airline, origin, destination, departure_iso, arrival_iso, duration_min, price_real, base_price, seats_total, seats_available, flight_date) VALUES
('AI101','AirIndia','Hyderabad','Bengaluru','2025-12-01T06:30:00','2025-12-01T07:40:00',70,3200.00,3200.00,180,50,'2025-12-01'),
('6E212','IndiGo','Hyderabad','Mumbai','2025-12-01T09:00:00','2025-12-01T10:45:00',105,4200.00,4200.00,180,30,'2025-12-01'),
('SG303','SpiceJet','Bengaluru','Chennai','2025-12-02T14:00:00','2025-12-02T15:10:00',70,2500.00,2500.00,150,75,'2025-12-02'),
('AI404','AirIndia','Mumbai','Kolkata','2025-12-03T05:30:00','2025-12-03T08:00:00',150,5600.00,5600.00,200,120,'2025-12-03'),
('6E505','IndiGo','Kolkata','Hyderabad','2025-12-03T11:00:00','2025-12-03T13:05:00',125,4100.00,4100.00,180,60,'2025-12-03'),
('SG606','SpiceJet','Delhi','Mumbai','2025-12-04T07:00:00','2025-12-04T08:45:00',105,3900.00,3900.00,170,20,'2025-12-04'),
('AI707','AirIndia','Hyderabad','Chennai','2025-12-01T18:00:00','2025-12-01T19:10:00',70,2800.00,2800.00,180,10,'2025-12-01'),
('6E808','IndiGo','Hyderabad','Bengaluru','2025-12-01T21:00:00','2025-12-01T22:10:00',70,3000.00,3000.00,180,90,'2025-12-01');

--
-- MILESTONE 1: EXTRA SUPPORT TABLES
--

-- airports table
CREATE TABLE IF NOT EXISTS airports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    airport_name TEXT,
    country TEXT DEFAULT 'India'
);

CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_code ON airports(code);

-- Seed airports
INSERT OR IGNORE INTO airports (code, city, airport_name) VALUES
('HYD','Hyderabad','Rajiv Gandhi International Airport'),
('BLR','Bengaluru','Kempegowda International Airport'),
('DEL','New Delhi','Indira Gandhi International Airport'),
('BOM','Mumbai','Chhatrapati Shivaji Maharaj International Airport'),
('MAA','Chennai','Chennai International Airport'),
('CCU','Kolkata','Netaji Subhas Chandra Bose International Airport'),
('COK','Kochi','Cochin International Airport'),
('PNQ','Pune','Pune Airport'),
('AMD','Ahmedabad','Sardar Vallabhbhai Patel International Airport'),
('GOI','Goa','Dabolim Airport'),
('TRV','Thiruvananthapuram','Trivandrum International Airport'),
('JAI','Jaipur','Jaipur International Airport'),
('LKO','Lucknow','Chaudhary Charan Singh International Airport'),
('VNS','Varanasi','Lal Bahadur Shastri Airport'),
('SXR','Srinagar','Sheikh ul-Alam International Airport');

-- routes table
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin_code TEXT NOT NULL,
    destination_code TEXT NOT NULL,
    UNIQUE(origin_code, destination_code)
);

CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_code, destination_code);

-- Seed routes
INSERT OR IGNORE INTO routes (origin_code, destination_code) VALUES
('HYD','BLR'),
('HYD','DEL'),
('HYD','MAA'),
('BLR','DEL'),
('BLR','BOM'),
('DEL','BOM'),
('MAA','BLR'),
('BOM','BLR'),
('PNQ','HYD'),
('AMD','DEL'),
('CCU','DEL'),
('COK','BLR'),
('TRV','DEL'),
('JAI','DEL'),
('LKO','DEL');

-- search_logs table
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin_code TEXT,
    destination_code TEXT,
    search_date TEXT,
    searched_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_search_logs_route ON search_logs(origin_code, destination_code);
CREATE INDEX IF NOT EXISTS idx_search_logs_date ON search_logs(search_date);


/*-- BASIC SELECT COMMANDS
SELECT * FROM flights;

SELECT id, flight_number, origin, destination, price_real FROM flights;

SELECT flight_number, price_real FROM flights ORDER BY price_real ASC;

SELECT flight_number, departure_iso FROM flights ORDER BY departure_iso DESC;

SELECT * FROM flights WHERE origin = 'Mumbai';

SELECT flight_number, price_real FROM flights WHERE price_real > 4000;

SELECT flight_number, price_real FROM flights ORDER BY price_real ASC LIMIT 3;

-- UPDATE COMMAND
UPDATE flights SET seats_available = 300 WHERE id = 6;

-- DELETE COMMAND
DELETE FROM flights WHERE id = 3;

-- AGGREGATE FUNCTIONS
SELECT COUNT(*) AS total_flights FROM flights;

SELECT AVG(price_real) AS avg_fare FROM flights WHERE origin = 'Mumbai';

SELECT origin, AVG(price_real) AS avg_fare FROM flights GROUP BY origin;

SELECT origin, AVG(price_real) AS avg_fare FROM flights 
GROUP BY origin 
HAVING AVG(price_real) < 5000;

-- ALTER TABLE
ALTER TABLE flights ADD COLUMN airline_code VARCHAR(5);

-- CREATE BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    trans_id TEXT,
    flight_number TEXT,
    origin TEXT,
    destination TEXT,
    passenger_fullname TEXT NOT NULL,
    passenger_contact TEXT,
    seat_no INTEGER,
    FOREIGN KEY (flight_number) REFERENCES flights(flight_number)
);

-- INSERT SAMPLE BOOKINGS
INSERT INTO bookings (trans_id, flight_number, origin, destination, passenger_fullname, passenger_contact, seat_no) VALUES
('IC145', 'AI101', 'Hyderabad', 'Bengaluru', 'Alice', '1234567890', 12),
('AB123', '6E212', 'Hyderabad', 'Mumbai', 'Bob', '4567408945', 6),
('TC078', 'AI404', 'Mumbai', 'Kolkata', 'Jack', '5469024697', 24);

-- JOINS
-- INNER JOIN
SELECT b.passenger_fullname, f.flight_number, f.origin, f.destination
FROM bookings b
INNER JOIN flights f ON b.flight_number = f.flight_number;

-- LEFT JOIN
SELECT f.flight_number, f.origin, f.destination, b.passenger_fullname
FROM flights f
LEFT JOIN bookings b ON f.flight_number = b.flight_number;

-- RIGHT JOIN equivalent
SELECT f.flight_number, b.passenger_fullname
FROM bookings b
LEFT JOIN flights f ON b.flight_number = f.flight_number;

-- FULL OUTER JOIN equivalent
SELECT f.flight_number, b.passenger_fullname
FROM flights f
LEFT JOIN bookings b ON f.flight_number = b.flight_number
UNION
SELECT f.flight_number, b.passenger_fullname
FROM bookings b
LEFT JOIN flights f ON b.flight_number = f.flight_number;

-- TRANSACTIONS
BEGIN TRANSACTION;
SELECT seats_available FROM flights WHERE flight_number = 'AI101';
UPDATE flights SET seats_available = seats_available - 1 WHERE flight_number = 'AI101';
INSERT INTO bookings (trans_id, flight_number, origin, destination, passenger_fullname, passenger_contact, seat_no)
VALUES ('BK001', 'AI101', 'Hyderabad', 'Bengaluru', 'David', '9876543210', 15);
COMMIT;

-- CONSTRAINTS TABLE
CREATE TABLE IF NOT EXISTS constrained_flights (
    id INTEGER PRIMARY KEY,
    flight_number TEXT UNIQUE NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_iso TEXT NOT NULL,
    arrival_iso TEXT NOT NULL,
    price_real REAL CHECK (price_real >= 500),
    seats_available INTEGER CHECK (seats_available >= 0),
    airline_code TEXT DEFAULT 'AI'
);

-- CONSTRAINT TEST INSERTS
INSERT INTO constrained_flights (flight_number, origin, destination, departure_iso, arrival_iso, price_real, seats_available)
VALUES ('TEST001', 'Mumbai', 'Delhi', '2025-12-01T10:00:00', '2025-12-01T12:00:00', 600, 100);

-- PRACTICE EXERCISES
-- Most expensive flight
SELECT * FROM flights ORDER BY price_real DESC LIMIT 1;

-- Count flights by airline
SELECT airline, COUNT(*) as flight_count FROM flights GROUP BY airline;

-- Available flights from Hyderabad
SELECT * FROM flights WHERE origin = 'Hyderabad' AND seats_available > 0;

-- Update passenger contact
UPDATE bookings SET passenger_contact = '9998887777' WHERE passenger_fullname = 'Alice';

-- Multiple seat booking transaction
BEGIN TRANSACTION;
UPDATE flights SET seats_available = seats_available - 2 WHERE flight_number = '6E212';
INSERT INTO bookings (trans_id, flight_number, origin, destination, passenger_fullname, passenger_contact, seat_no)
VALUES ('BK002', '6E212', 'Hyderabad', 'Mumbai', 'Sarah', '8887776666', 8);
INSERT INTO bookings (trans_id, flight_number, origin, destination, passenger_fullname, passenger_contact, seat_no)
VALUES ('BK003', '6E212', 'Hyderabad', 'Mumbai', 'John', '7776665555', 9);
COMMIT;*/

-- M2: Fare history, demand_scores, bookings (minimal)
CREATE TABLE IF NOT EXISTS fare_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_id INTEGER NOT NULL,
  old_price REAL,
  new_price REAL,
  reason TEXT,
  changed_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fare_history_flight ON fare_history(flight_id);

CREATE TABLE IF NOT EXISTS demand_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_id INTEGER,           -- optional: flight-specific
  origin_code TEXT,
  destination_code TEXT,
  score REAL DEFAULT 0.0,      -- normalized 0..1
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_demand_flight ON demand_scores(flight_id);

-- optional: bookings table (to measure real bookings)
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight_id INTEGER NOT NULL,
  seats_booked INTEGER NOT NULL,
  price_paid REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings(flight_id);
