import { randomUUID } from 'crypto';
import { isDatabaseConfigured, saveBooking, seedDatabase, SlotAlreadyBookedError } from '../lib/database';

function datePlusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.log('[db:smoke:slot-lock] DATABASE_URL is not configured. Skipping smoke check.');
    return;
  }

  await seedDatabase();

  const targetDate = datePlusDays(10);
  const targetTime = '11:00';

  await saveBooking({
    bookingType: 'court',
    selectedDate: targetDate,
    selectedTime: targetTime,
    durationMins: 60,
    packageOption: null,
    payMethod: 'STRIPE',
    grandTotal: 31.02,
    receiptId: `SMOKE-${randomUUID().slice(0, 8).toUpperCase()}-A`,
    customerEmail: 'slot.lock.a@example.com',
    bookingStatus: 'confirmed',
    paymentMethod: 'ONLINE',
  });

  try {
    await saveBooking({
      bookingType: 'court',
      selectedDate: targetDate,
      selectedTime: targetTime,
      durationMins: 60,
      packageOption: null,
      payMethod: 'STRIPE',
      grandTotal: 31.02,
      receiptId: `SMOKE-${randomUUID().slice(0, 8).toUpperCase()}-B`,
      customerEmail: 'slot.lock.b@example.com',
      bookingStatus: 'confirmed',
      paymentMethod: 'ONLINE',
    });

    throw new Error('Slot lock smoke check failed: second booking unexpectedly succeeded.');
  } catch (error) {
    if (error instanceof SlotAlreadyBookedError) {
      console.log('[db:smoke:slot-lock] PASS - second booking was rejected as expected.');
      return;
    }

    throw error;
  }
}

main().catch((error) => {
  console.error('[db:smoke:slot-lock] FAILED:', error);
  process.exitCode = 1;
});
