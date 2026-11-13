// Background job: every so often, expire old reservations and give their stock back.
// The actual "exactly once" safety lives in expireReservation() (inventoryService.js).
// This file only decides WHEN to run and makes sure errors never crash the server.
import cron from 'node-cron';
import { expireDueReservations } from './inventoryService.js';

let task = null;
let isRunning = false; // stops a slow run from overlapping with the next one

// Runs one sweep. Exported so tests can call it directly.
export async function runSweeperOnce() {
  if (isRunning) {
    return { skipped: true };
  }
  isRunning = true;
  try {
    const result = await expireDueReservations();
    if (result.expired > 0 || result.failed > 0) {
      console.log(`[sweeper] found=${result.found} expired=${result.expired} failed=${result.failed}`);
    }
    return result;
  } catch (error) {
    console.error('[sweeper] sweep failed:', error); // logged, not thrown: the server keeps running
    return { error: true };
  } finally {
    isRunning = false;
  }
}

// Interval comes from SWEEPER_CRON (default: every minute). Format: "min hour day month weekday".
export function startReservationSweeper() {
  if (task) return task;

  const schedule = process.env.SWEEPER_CRON || '* * * * *';
  if (!cron.validate(schedule)) {
    throw new Error(`SWEEPER_CRON is not a valid cron expression: "${schedule}"`);
  }

  task = cron.schedule(schedule, runSweeperOnce);
  console.log(`[sweeper] started, schedule "${schedule}"`);
  return task;
}

export function stopReservationSweeper() {
  if (task) {
    task.stop();
    task = null;
  }
}
