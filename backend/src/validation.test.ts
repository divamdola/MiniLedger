import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidAmount, isValidDueDate, isValidFriendName, isValidOtp, isValidPhone } from './validation';

test('validates international phone numbers and six-digit OTPs', () => {
  assert.equal(isValidPhone('+14155552671'), true);
  assert.equal(isValidPhone('+1 (415) 555-2671'), true);
  assert.equal(isValidPhone('123'), false);
  assert.equal(isValidOtp('039182'), true);
  assert.equal(isValidOtp('39182'), false);
});

test('validates loan names, positive finite amounts, and real ISO dates', () => {
  assert.equal(isValidFriendName('Sam Lee'), true);
  assert.equal(isValidFriendName(' '), false);
  assert.equal(isValidAmount(25.5), true);
  assert.equal(isValidAmount(Number.NaN), false);
  assert.equal(isValidAmount(0), false);
  assert.equal(isValidDueDate('2027-02-28'), true);
  assert.equal(isValidDueDate('2027-02-30'), false);
});