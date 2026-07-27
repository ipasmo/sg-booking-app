import dotenv from 'dotenv';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import DEFAULT_SPORTS from '../data/json/sports.json';
import DEFAULT_SPORT_EVENTS from '../data/json/sport-events.json';
import DEFAULT_SPORT_FACILITIES from '../data/json/sport-facilities.json';

dotenv.config();

export type PackageRow = {
  id: string;
  label: string;
  price: number;
  per: string;
};

export type SportRow = {
  id: 'cricket' | 'indoor-cricket' | 'pickleball' | 'soccer' | 'volleyball' | 'badminton' | 'basketball' | 'kabaddi';
  label: string;
  imageKey: 'cricket' | 'indoor-cricket' | 'pickleball' | 'soccer' | 'volleyball' | 'badminton' | 'basketball' | 'kabaddi';
  bannerKey: 'cricket' | 'indoor-cricket' | 'pickleball' | 'soccer' | 'volleyball' | 'badminton' | 'basketball' | 'kabaddi';
  sortOrder: number;
};

export type SportEventRow = {
  id: string;
  titleTemplate: string;
  descriptionTemplate: string;
  imageKey: 'facility' | 'academy' | 'coach' | 'gear';
  icon: 'calendar' | 'academy' | 'coach' | 'shop';
  actionTarget: 'facility-select' | 'schedule';
  sortOrder: number;
};

export type SportFacilityTemplateRow = {
  code: string;
  titleTemplate: string;
  price: string;
  tag: string;
  address: string;
  mapLocationUrl: string;
  imageKey: 'bowling-lane' | 'nets-2' | 'nets-3' | 'nets-4' | 'indoor-court' | 'outdoor-field';
  icon: 'lane' | 'net' | 'court' | 'field' | 'academy' | 'gear';
  actionTarget: 'schedule';
  sortOrder: number;
};

export type SportFacilityRow = {
  id: string;
  sportId: SportRow['id'];
  code: string;
  title: string;
  price: string;
  tag: string;
  address: string;
  mapLocationUrl: string;
  imageKey: 'bowling-lane' | 'nets-2' | 'nets-3' | 'nets-4' | 'indoor-court' | 'outdoor-field';
  icon: 'lane' | 'net' | 'court' | 'field' | 'academy' | 'gear';
  actionTarget: 'schedule';
  sortOrder: number;
};

export type SlotRow = {
  time: string;
  key: string;
  booked: boolean;
};

export type BookingHistoryRow = {
  receiptId: string;
  bookingType: 'court' | 'coaching';
  slotDate: string;
  slotTime: string;
  durationMins: number;
  grandTotal: number;
  status: 'confirmed' | 'cash_pending';
  paymentMethod: 'ONLINE' | 'CASH';
};

type BookingInput = {
  bookingType: string;
  selectedDate: string;
  selectedTime: string;
  durationMins: number;
  packageOption: string | null;
  payMethod: string;
  grandTotal: number;
  receiptId: string;
  customerEmail: string;
  bookingStatus: string;
  paymentMethod: 'ONLINE' | 'CASH';
};

export class SlotAlreadyBookedError extends Error {
  constructor(slotDate: string, slotTime: string) {
    super(`Slot ${slotDate} ${slotTime} is already booked.`);
    this.name = 'SlotAlreadyBookedError';
  }
}

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const DATABASE_SSL = (process.env.DATABASE_SSL ?? 'true').toLowerCase() !== 'false';
const DATABASE_CONNECTION_TIMEOUT_MS = Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? '5000');
const DATABASE_POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? '10');
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL ?? 'contact@ipasmo.com';

const USE_DATABASE = DATABASE_URL.trim().length > 0;

const pool = USE_DATABASE
  ? new Pool({
      connectionString: DATABASE_URL,
      max: Number.isFinite(DATABASE_POOL_MAX) ? DATABASE_POOL_MAX : 10,
      connectionTimeoutMillis: Number.isFinite(DATABASE_CONNECTION_TIMEOUT_MS) ? DATABASE_CONNECTION_TIMEOUT_MS : 5000,
      idleTimeoutMillis: 30000,
      options: '-c timezone=Asia/Singapore',
      ssl: DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
    })
  : null;

const DEFAULT_PACKAGES: PackageRow[] = [
  { id: 'single', label: 'Single Session', price: 120, per: 'SGD 120.00 / session' },
  { id: 'pack3', label: '3-Session Pack', price: 88, per: 'SGD 29.33 / session' },
  { id: 'pack10', label: '10-Session Pack', price: 250, per: 'SGD 25.00 / session' },
  { id: 'pack15', label: '15-Session Pack', price: 350, per: 'SGD 23.33 / session' },
  { id: 'pack20', label: '20-Session Pack', price: 450, per: 'SGD 22.50 / session' },
];

const DEFAULT_SPORT_ROWS = DEFAULT_SPORTS as SportRow[];
const DEFAULT_SPORT_EVENT_ROWS = DEFAULT_SPORT_EVENTS as SportEventRow[];
const DEFAULT_SPORT_FACILITY_TEMPLATE_ROWS = DEFAULT_SPORT_FACILITIES as SportFacilityTemplateRow[];

let bootstrapPromise: Promise<void> | null = null;

function generateDailySlots(dateStr: string): SlotRow[] {
  const slots: SlotRow[] = [];

  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push({
        time,
        key: `${dateStr}_${time}`,
        booked: isPreBooked(dateStr, time),
      });
    }
  }

  return slots;
}

function isPreBooked(dateStr: string, time: string): boolean {
  let hash = 0;
  const source = `${dateStr}_${time}`;

  for (let index = 0; index < source.length; index++) {
    hash = Math.imul(31, hash) + source.charCodeAt(index) | 0;
  }

  return Math.abs(hash) % 4 === 0;
}

function toSgtIsoDate(date: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function assertDatabaseConfigured(): void {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.');
  }
}

async function seedPackages(client: PoolClient): Promise<void> {
  const values: unknown[] = [];
  const placeholders = DEFAULT_PACKAGES.map((pkg, index) => {
    const base = index * 6;
    values.push(pkg.id, pkg.label, pkg.price, pkg.per, index + 1, 'system');
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  });

  await client.query(
    `INSERT INTO packages (id, label, price, per_label, sort_order, created_by)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (id)
     DO UPDATE SET
       label = EXCLUDED.label,
       price = EXCLUDED.price,
       per_label = EXCLUDED.per_label,
       sort_order = EXCLUDED.sort_order,
       updated_at = NOW(),
       updated_by = EXCLUDED.created_by,
       deleted_at = NULL`,
    values
  );
}

async function seedSports(client: PoolClient): Promise<void> {
  const values: unknown[] = [];
  const placeholders = DEFAULT_SPORT_ROWS.map((sport, index) => {
    const base = index * 6;
    values.push(sport.id, sport.label, sport.imageKey, sport.bannerKey, sport.sortOrder, 'system');
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  });

  await client.query(
    `INSERT INTO sports (id, label, image_key, banner_key, sort_order, created_by)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (id)
     DO UPDATE SET
       label = EXCLUDED.label,
       image_key = EXCLUDED.image_key,
       banner_key = EXCLUDED.banner_key,
       sort_order = EXCLUDED.sort_order,
       updated_at = NOW(),
       updated_by = EXCLUDED.created_by,
       deleted_at = NULL`,
    values
  );
}

async function seedSportEvents(client: PoolClient): Promise<void> {
  const values: unknown[] = [];
  const placeholders = DEFAULT_SPORT_EVENT_ROWS.map((event, index) => {
    const base = index * 8;
    values.push(
      event.id,
      event.titleTemplate,
      event.descriptionTemplate,
      event.imageKey,
      event.icon,
      event.actionTarget,
      event.sortOrder,
      'system'
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
  });

  await client.query(
    `INSERT INTO sport_events (id, title_template, description_template, image_key, icon, action_target, sort_order, created_by)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (id)
     DO UPDATE SET
       title_template = EXCLUDED.title_template,
       description_template = EXCLUDED.description_template,
       image_key = EXCLUDED.image_key,
       icon = EXCLUDED.icon,
       action_target = EXCLUDED.action_target,
       sort_order = EXCLUDED.sort_order,
       updated_at = NOW(),
       updated_by = EXCLUDED.created_by,
       deleted_at = NULL`,
    values
  );
}

async function seedSportFacilities(client: PoolClient): Promise<void> {
  const values: unknown[] = [];
  const placeholders: string[] = [];

  let index = 0;
  for (const sport of DEFAULT_SPORT_ROWS) {
    for (const facility of DEFAULT_SPORT_FACILITY_TEMPLATE_ROWS) {
      const base = index * 13;
      const id = `${sport.id}-${facility.code}`;
      values.push(
        id,
        sport.id,
        facility.code,
        facility.titleTemplate
          .replace(/\{sportLower\}/g, sport.label.toLowerCase())
          .replace(/\{sport\}/g, sport.label),
        facility.price,
        facility.tag,
        facility.address,
        facility.mapLocationUrl,
        facility.imageKey,
        facility.icon,
        facility.actionTarget,
        facility.sortOrder,
        'system'
      );

      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`
      );
      index += 1;
    }
  }

  await client.query(
    `INSERT INTO sport_facilities (
       id,
       sport_id,
       facility_code,
       title,
       price_label,
       tag_label,
        address,
        map_location_url,
       image_key,
       icon,
       action_target,
       sort_order,
       created_by
     )
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (id)
     DO UPDATE SET
       sport_id = EXCLUDED.sport_id,
       facility_code = EXCLUDED.facility_code,
       title = EXCLUDED.title,
       price_label = EXCLUDED.price_label,
       tag_label = EXCLUDED.tag_label,
        address = EXCLUDED.address,
        map_location_url = EXCLUDED.map_location_url,
       image_key = EXCLUDED.image_key,
       icon = EXCLUDED.icon,
       action_target = EXCLUDED.action_target,
       sort_order = EXCLUDED.sort_order,
       updated_at = NOW(),
       updated_by = EXCLUDED.created_by,
       deleted_at = NULL`,
    values
  );
}

async function ensureSchema(client: PoolClient): Promise<void> {
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      auth_provider TEXT NOT NULL DEFAULT 'password' CHECK (auth_provider IN ('password', 'google')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system'
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
      per_label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system'
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sports (
      id TEXT PRIMARY KEY CHECK (id IN ('cricket', 'indoor-cricket', 'pickleball', 'soccer', 'volleyball', 'badminton', 'basketball', 'kabaddi')),
      label TEXT NOT NULL,
      image_key TEXT NOT NULL CHECK (image_key IN ('cricket', 'indoor-cricket', 'pickleball', 'soccer', 'volleyball', 'badminton', 'basketball', 'kabaddi')),
      banner_key TEXT NOT NULL CHECK (banner_key IN ('cricket', 'indoor-cricket', 'pickleball', 'soccer', 'volleyball', 'badminton', 'basketball', 'kabaddi')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system'
    )
  `);

  await client.query(`
    ALTER TABLE sports
    ADD COLUMN IF NOT EXISTS banner_key TEXT
  `);

  await client.query(`
    UPDATE sports
    SET banner_key = COALESCE(banner_key, image_key)
    WHERE banner_key IS NULL
  `);

  await client.query(`
    ALTER TABLE sports
    ALTER COLUMN banner_key SET NOT NULL
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sport_events (
      id TEXT PRIMARY KEY,
      title_template TEXT NOT NULL,
      description_template TEXT NOT NULL,
      image_key TEXT NOT NULL CHECK (image_key IN ('facility', 'academy', 'coach', 'gear')),
      icon TEXT NOT NULL CHECK (icon IN ('calendar', 'academy', 'coach', 'shop')),
      action_target TEXT NOT NULL CHECK (action_target IN ('facility-select', 'schedule')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system'
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sport_facilities (
      id TEXT PRIMARY KEY,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      facility_code TEXT NOT NULL,
      title TEXT NOT NULL,
      price_label TEXT NOT NULL,
      tag_label TEXT NOT NULL,
      address TEXT NOT NULL,
      map_location_url TEXT NOT NULL,
      image_key TEXT NOT NULL CHECK (image_key IN ('bowling-lane', 'nets-2', 'nets-3', 'nets-4', 'indoor-court', 'outdoor-field')),
      icon TEXT NOT NULL CHECK (icon IN ('lane', 'net', 'court', 'field', 'academy', 'gear')),
      action_target TEXT NOT NULL CHECK (action_target IN ('schedule')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system',
      UNIQUE (sport_id, facility_code)
    )
  `);

  await client.query(`
    UPDATE sport_facilities
    SET tag_label = 'Book Now'
    WHERE tag_label = 'Per Hour'
  `);

  await client.query('ALTER TABLE sport_facilities ADD COLUMN IF NOT EXISTS address TEXT');
  await client.query('ALTER TABLE sport_facilities ADD COLUMN IF NOT EXISTS map_location_url TEXT');

  await client.query(`
    UPDATE sport_facilities
    SET address = CASE facility_code
      WHEN 'bowling-lane' THEN 'Kallang Sports Hub, 1 Stadium Walk, Singapore 397688'
      WHEN 'net-2' THEN 'Singapore Indoor Stadium, 2 Stadium Walk, Singapore 397691'
      WHEN 'net-3' THEN 'OCBC Square, 1 Stadium Place, Singapore 397628'
      WHEN 'net-4' THEN 'National Stadium, 1 Stadium Drive, Singapore 397629'
      WHEN 'indoor-court' THEN 'Kallang ActiveSG, 5 Stadium Walk, Singapore 397693'
      WHEN 'outdoor-field' THEN 'Bishan ActiveSG, 21 Bishan Street 14, Singapore 579778'
      ELSE address
    END,
    map_location_url = CASE facility_code
      WHEN 'bowling-lane' THEN 'https://www.google.com/maps?q=Kallang%20Sports%20Hub%20Singapore'
      WHEN 'net-2' THEN 'https://www.google.com/maps?q=Singapore%20Indoor%20Stadium'
      WHEN 'net-3' THEN 'https://www.google.com/maps?q=OCBC%20Square%20Singapore'
      WHEN 'net-4' THEN 'https://www.google.com/maps?q=National%20Stadium%20Singapore'
      WHEN 'indoor-court' THEN 'https://www.google.com/maps?q=Kallang%20ActiveSG%20Singapore'
      WHEN 'outdoor-field' THEN 'https://www.google.com/maps?q=Bishan%20ActiveSG%20Singapore'
      ELSE map_location_url
    END
    WHERE address IS NULL OR map_location_url IS NULL
  `);

  await client.query('ALTER TABLE sport_facilities ALTER COLUMN address SET NOT NULL');
  await client.query('ALTER TABLE sport_facilities ALTER COLUMN map_location_url SET NOT NULL');

  await client.query('ALTER TABLE sport_facilities DROP CONSTRAINT IF EXISTS sport_facilities_image_key_check');
  await client.query(`
    UPDATE sport_facilities
    SET image_key = CASE image_key
      WHEN 'gear' THEN 'bowling-lane'
      WHEN 'indoor-card' THEN 'nets-2'
      WHEN 'facility' THEN 'nets-3'
      WHEN 'cricket-card' THEN 'nets-4'
      WHEN 'coach' THEN 'indoor-court'
      WHEN 'academy' THEN 'outdoor-field'
      ELSE image_key
    END
    WHERE image_key IN ('gear', 'indoor-card', 'facility', 'cricket-card', 'coach', 'academy')
  `);
  await client.query(`
    ALTER TABLE sport_facilities
    ADD CONSTRAINT sport_facilities_image_key_check
    CHECK (image_key IN ('bowling-lane', 'nets-2', 'nets-3', 'nets-4', 'indoor-court', 'outdoor-field'))
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_sport_facilities_sport_sort
    ON sport_facilities (sport_id, sort_order, facility_code)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_date DATE NOT NULL,
      slot_time TIME NOT NULL,
      is_booked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system',
      UNIQUE (slot_date, slot_time)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_slots_slot_date_booked
    ON slots (slot_date, is_booked, slot_time)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_type TEXT NOT NULL CHECK (booking_type IN ('court', 'coaching')),
      slot_date DATE NOT NULL,
      slot_time TIME NOT NULL,
      duration_mins INTEGER NOT NULL CHECK (duration_mins > 0),
      package_id TEXT NULL REFERENCES packages(id) ON DELETE SET NULL,
      pay_method TEXT NOT NULL CHECK (pay_method IN ('STRIPE', 'GPAY', 'PAYNOW', 'GRABPAY')),
      grand_total NUMERIC(12,2) NOT NULL CHECK (grand_total >= 0),
      receipt_id TEXT NOT NULL UNIQUE,
      customer_email TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('confirmed', 'cash_pending')),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('ONLINE', 'CASH')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL,
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system'
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_customer_email
    ON bookings (customer_email, created_at DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_slot_lookup
    ON bookings (slot_date, slot_time)
  `);
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!pool) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await ensureSchema(client);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    })();
  }

  await bootstrapPromise;
}

export async function query<T extends QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  assertDatabaseConfigured();
  await ensureDatabaseReady();
  const result = await pool!.query<T>(text, params);
  return result.rows;
}

export async function withDatabaseClient<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  assertDatabaseConfigured();
  await ensureDatabaseReady();

  const client = await pool!.connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

export function isDatabaseConfigured(): boolean {
  return USE_DATABASE;
}

export function getFallbackPackages(): PackageRow[] {
  return DEFAULT_PACKAGES;
}

export function getFallbackSports(): SportRow[] {
  return DEFAULT_SPORT_ROWS;
}

export function getFallbackSportEvents(): SportEventRow[] {
  return DEFAULT_SPORT_EVENT_ROWS;
}

export function getFallbackSportFacilityTemplates(): SportFacilityTemplateRow[] {
  return DEFAULT_SPORT_FACILITY_TEMPLATE_ROWS;
}

export async function listPackages(): Promise<PackageRow[]> {
  if (!pool) {
    return DEFAULT_PACKAGES;
  }

  return query<PackageRow>(
    `SELECT id, label, price::float8 AS price, per_label AS per
     FROM packages
     WHERE deleted_at IS NULL
     ORDER BY sort_order ASC, id ASC`
  );
}

export async function listSports(): Promise<SportRow[]> {
  if (!pool) {
    return DEFAULT_SPORT_ROWS;
  }

  return query<SportRow>(
    `SELECT id,
            label,
            image_key AS "imageKey",
            banner_key AS "bannerKey",
            sort_order AS "sortOrder"
     FROM sports
     WHERE deleted_at IS NULL
     ORDER BY sort_order ASC, id ASC`
  );
}

export async function listSportEvents(): Promise<SportEventRow[]> {
  if (!pool) {
    return DEFAULT_SPORT_EVENT_ROWS;
  }

  return query<SportEventRow>(
    `SELECT id,
            title_template AS "titleTemplate",
            description_template AS "descriptionTemplate",
            image_key AS "imageKey",
            icon,
            action_target AS "actionTarget",
            sort_order AS "sortOrder"
     FROM sport_events
     WHERE deleted_at IS NULL
     ORDER BY sort_order ASC, id ASC`
  );
}

export async function listSportFacilities(sportId: SportRow['id']): Promise<SportFacilityRow[]> {
  if (!pool) {
    const sport = DEFAULT_SPORT_ROWS.find((item) => item.id === sportId);
    if (!sport) {
      return [];
    }

    return DEFAULT_SPORT_FACILITY_TEMPLATE_ROWS
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((facility) => ({
        id: `${sport.id}-${facility.code}`,
        sportId: sport.id,
        code: facility.code,
        title: facility.titleTemplate.replace(/\{sport\}/g, sport.label),
        price: facility.price,
        tag: facility.tag,
        address: facility.address,
        mapLocationUrl: facility.mapLocationUrl,
        imageKey: facility.imageKey,
        icon: facility.icon,
        actionTarget: facility.actionTarget,
        sortOrder: facility.sortOrder,
      }));
  }

  return query<SportFacilityRow>(
    `SELECT id,
            sport_id AS "sportId",
            facility_code AS code,
            title,
            price_label AS price,
            tag_label AS tag,
            address,
            map_location_url AS "mapLocationUrl",
            image_key AS "imageKey",
            icon,
            action_target AS "actionTarget",
            sort_order AS "sortOrder"
     FROM sport_facilities
     WHERE deleted_at IS NULL
       AND sport_id = $1
     ORDER BY sort_order ASC, facility_code ASC`,
    [sportId]
  );
}

export async function ensureSlotsForDate(client: PoolClient, dateStr: string): Promise<void> {
  const generatedSlots = generateDailySlots(dateStr);
  const values: unknown[] = [];
  const placeholders = generatedSlots.map((slot, index) => {
    const base = index * 5;
    values.push(dateStr, slot.time, slot.booked, 'system', 'system');
    return `($${base + 1}, $${base + 2}, $${base + 3}, NOW(), NOW(), $${base + 4}, $${base + 5})`;
  });

  await client.query(
    `INSERT INTO slots (slot_date, slot_time, is_booked, created_at, updated_at, created_by, updated_by)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (slot_date, slot_time) DO NOTHING`,
    values
  );
}

export async function listSlotsForDate(dateStr: string): Promise<SlotRow[]> {
  if (!pool) {
    return generateDailySlots(dateStr);
  }

  return withDatabaseClient(async (client) => {
    await ensureSlotsForDate(client, dateStr);
    const result = await client.query<{ slot_time: string; is_booked: boolean }>(
      `SELECT slot_time::text AS slot_time, is_booked
       FROM slots
       WHERE slot_date = $1 AND deleted_at IS NULL
       ORDER BY slot_time ASC`,
      [dateStr]
    );

    return result.rows.map((row) => ({
      time: row.slot_time.slice(0, 5),
      key: `${dateStr}_${row.slot_time.slice(0, 5)}`,
      booked: row.is_booked,
    }));
  });
}

export async function saveBooking(input: BookingInput): Promise<void> {
  if (!pool) {
    return;
  }

  await withDatabaseClient(async (client) => {
    await client.query('BEGIN');
    try {
      await ensureSlotsForDate(client, input.selectedDate);

      // Atomic lock: only one transaction can flip a slot from free to booked.
      const lockResult = await client.query<{ id: string }>(
        `UPDATE slots
         SET is_booked = TRUE,
             updated_at = NOW(),
             updated_by = $3
         WHERE slot_date = $1
           AND slot_time = $2::time
           AND deleted_at IS NULL
           AND is_booked = FALSE
         RETURNING id`,
        [input.selectedDate, input.selectedTime, input.customerEmail]
      );

      if (lockResult.rowCount === 0) {
        throw new SlotAlreadyBookedError(input.selectedDate, input.selectedTime);
      }

      await client.query(
        `INSERT INTO bookings (
           booking_type,
           slot_date,
           slot_time,
           duration_mins,
           package_id,
           pay_method,
           grand_total,
           receipt_id,
           customer_email,
           status,
           payment_method,
           created_by,
           updated_by
         ) VALUES ($1, $2, $3::time, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          input.bookingType,
          input.selectedDate,
          input.selectedTime,
          input.durationMins,
          input.packageOption,
          input.payMethod,
          input.grandTotal,
          input.receiptId,
          input.customerEmail,
          input.bookingStatus,
          input.paymentMethod,
          input.customerEmail,
          input.customerEmail,
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function listBookingsByCustomer(customerEmail: string): Promise<BookingHistoryRow[]> {
  if (!pool) {
    return [];
  }

  return query<BookingHistoryRow>(
    `SELECT
       receipt_id AS "receiptId",
       booking_type AS "bookingType",
       slot_date::text AS "slotDate",
       slot_time::text AS "slotTime",
       duration_mins AS "durationMins",
       grand_total::float8 AS "grandTotal",
       status,
       payment_method AS "paymentMethod"
     FROM bookings
     WHERE deleted_at IS NULL
       AND customer_email = $1
     ORDER BY slot_date DESC, slot_time DESC`,
    [customerEmail]
  );
}

export async function upsertUserByEmail(email: string, provider: 'password' | 'google'): Promise<void> {
  if (!pool) {
    return;
  }

  await query(
    `INSERT INTO users (email, auth_provider, created_by, updated_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET
       auth_provider = EXCLUDED.auth_provider,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by,
       deleted_at = NULL`,
    [email, provider, email, email]
  );
}

export async function seedDatabase(options?: { days?: number; startDate?: Date }): Promise<void> {
  if (!pool) {
    return;
  }

  const days = options?.days ?? 30;
  const startDate = options?.startDate ?? new Date();

  await withDatabaseClient(async (client) => {
    await client.query('BEGIN');
    try {
      await ensureSchema(client);
      await seedPackages(client);
      await seedSports(client);
      await seedSportEvents(client);
      await seedSportFacilities(client);

      await client.query(
        `INSERT INTO users (email, auth_provider, created_by, updated_by)
         VALUES ($1, $2, 'seed', 'seed')
         ON CONFLICT (email)
         DO UPDATE SET
           updated_at = NOW(),
           updated_by = 'seed',
           deleted_at = NULL`,
        [DEMO_USER_EMAIL, 'password']
      );

      for (let index = 0; index < days; index++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const dateStr = toSgtIsoDate(date);
        await ensureSlotsForDate(client, dateStr);
      }

      // Seed a few realistic bookings so My Bookings / schedule flows have data.
      const demoBookings = [
        { dayOffset: 1, time: '10:00', bookingType: 'court', packageId: null, payMethod: 'STRIPE', total: 31.02, status: 'confirmed', paymentMethod: 'ONLINE' },
        { dayOffset: 2, time: '18:30', bookingType: 'court', packageId: null, payMethod: 'PAYNOW', total: 31.02, status: 'confirmed', paymentMethod: 'ONLINE' },
        { dayOffset: 3, time: '09:30', bookingType: 'coaching', packageId: 'pack3', payMethod: 'GPAY', total: 88, status: 'cash_pending', paymentMethod: 'CASH' },
      ] as const;

      for (const demo of demoBookings) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + demo.dayOffset);
        const dateStr = toSgtIsoDate(date);
        const receiptId = `DEMO-${dateStr.replace(/-/g, '')}-${demo.time.replace(':', '')}`;

        await client.query(
          `UPDATE slots
           SET is_booked = TRUE,
               updated_at = NOW(),
               updated_by = 'seed'
           WHERE slot_date = $1
             AND slot_time = $2::time
             AND deleted_at IS NULL`,
          [dateStr, demo.time]
        );

        await client.query(
          `INSERT INTO bookings (
             booking_type,
             slot_date,
             slot_time,
             duration_mins,
             package_id,
             pay_method,
             grand_total,
             receipt_id,
             customer_email,
             status,
             payment_method,
             created_by,
             updated_by
           ) VALUES ($1, $2, $3::time, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (receipt_id) DO NOTHING`,
          [
            demo.bookingType,
            dateStr,
            demo.time,
            60,
            demo.packageId,
            demo.payMethod,
            demo.total,
            receiptId,
            DEMO_USER_EMAIL,
            demo.status,
            demo.paymentMethod,
            'seed',
            'seed',
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function resetDatabaseAndSeed(options?: { days?: number; startDate?: Date }): Promise<void> {
  if (!pool) {
    return;
  }

  await withDatabaseClient(async (client) => {
    await client.query('BEGIN');
    try {
      await ensureSchema(client);
      await client.query('TRUNCATE TABLE bookings, slots, users, packages, sports, sport_events, sport_facilities RESTART IDENTITY CASCADE');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  await seedDatabase(options);
}
