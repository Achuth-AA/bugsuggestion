-- Carpooling & Ride Sharing Platform — Aurora PostgreSQL Schema

CREATE TYPE user_role      AS ENUM ('driver', 'rider', 'admin');
CREATE TYPE ride_status    AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled');

-- Shared trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
    user_id           VARCHAR(36)  PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    role              user_role    NOT NULL DEFAULT 'rider',
    cognito_sub       VARCHAR(255) UNIQUE,
    phone             VARCHAR(20),
    profile_photo_url VARCHAR(500),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

CREATE TABLE IF NOT EXISTS rides (
    ride_id         VARCHAR(36)    PRIMARY KEY,
    driver_id       VARCHAR(36)    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source          VARCHAR(255)   NOT NULL,
    destination     VARCHAR(255)   NOT NULL,
    date            DATE           NOT NULL,
    time            TIME           NOT NULL,
    seats_available INT            NOT NULL CHECK (seats_available >= 0),
    seats_total     INT            NOT NULL CHECK (seats_total > 0),
    price           DECIMAL(10,2)  NOT NULL CHECK (price >= 0),
    notes           TEXT,
    status          ride_status    NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_rides_source      ON rides (source);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON rides (destination);
CREATE INDEX IF NOT EXISTS idx_rides_date        ON rides (date);
CREATE INDEX IF NOT EXISTS idx_rides_status      ON rides (status);
CREATE INDEX IF NOT EXISTS idx_rides_driver      ON rides (driver_id);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id   VARCHAR(36)     PRIMARY KEY,
    ride_id      VARCHAR(36)     NOT NULL REFERENCES rides(ride_id)  ON DELETE CASCADE,
    user_id      VARCHAR(36)     NOT NULL REFERENCES users(user_id)  ON DELETE CASCADE,
    seats_booked INT             NOT NULL CHECK (seats_booked > 0),
    status       booking_status  NOT NULL DEFAULT 'confirmed',
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ride_id, user_id)
);
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_bookings_ride   ON bookings (ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user   ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- Seed admin user
INSERT INTO users (user_id, name, email, role)
VALUES (gen_random_uuid()::text, 'Admin', 'admin@carpooling.com', 'admin')
ON CONFLICT (email) DO NOTHING;
