/**
 * Pluggable Clock Abstraction for SLA calculations and time-sensitive operations.
 * Allows deterministic unit & integration tests via FakeClock without timeouts/sleeps.
 */

export class Clock {
  now() {
    throw new Error('Clock.now() must be implemented');
  }

  toISOString() {
    return this.now().toISOString();
  }

  getTime() {
    return this.now().getTime();
  }
}

/**
 * Standard production clock returning current system UTC time.
 */
export class SystemClock extends Clock {
  now() {
    return new Date();
  }
}

/**
 * Deterministic clock for unit testing and time-travel assertions.
 */
export class FakeClock extends Clock {
  constructor(initialTime = new Date('2026-10-01T08:00:00.000Z')) {
    super();
    this.currentTime = new Date(initialTime);
  }

  now() {
    return new Date(this.currentTime);
  }

  set(time) {
    this.currentTime = new Date(time);
  }

  advance(ms) {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }

  advanceMinutes(minutes) {
    this.advance(minutes * 60 * 1000);
  }

  advanceHours(hours) {
    this.advance(hours * 60 * 60 * 1000);
  }

  advanceDays(days) {
    this.advance(days * 24 * 60 * 60 * 1000);
  }
}

export const systemClock = new SystemClock();
export default systemClock;
