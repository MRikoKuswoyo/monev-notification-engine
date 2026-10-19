import test from "node:test";
import assert from "node:assert/strict";
import { shouldSend, buttonsFor } from "../lib/policy.js";

const T = 1_000_000_000_000, MIN = 60_000;
test("kategori kosong -> tidak kirim", () => assert.equal(shouldSend({ category: null, nowMs: T }), false));
test("pertama kali -> kirim", () => assert.equal(shouldSend({ category: "attendance_in", nowMs: T }), true));
test("diulang tiap 10 menit untuk absen/logbook", () => {
  assert.equal(shouldSend({ category: "logbook", lastSentMs: T, nowMs: T + 9 * MIN }), false);
  assert.equal(shouldSend({ category: "logbook", lastSentMs: T, nowMs: T + 10 * MIN }), true);
});
test("gamifikasi hanya sekali", () =>
  assert.equal(shouldSend({ category: "gamification", lastSentMs: T, nowMs: T + 60 * MIN }), false));
test("snooze menahan pengingat", () => {
  assert.equal(shouldSend({ category: "urgent", lastSentMs: T, snoozeUntilMs: T + 30 * MIN, nowMs: T + 20 * MIN }), false);
  assert.equal(shouldSend({ category: "urgent", lastSentMs: T, snoozeUntilMs: T + 30 * MIN, nowMs: T + 31 * MIN }), true);
});
test("tombol sesuai kategori", () => {
  assert.equal(buttonsFor("attendance_in")[0][0].callback_data, "done:in");
  assert.equal(buttonsFor("urgent")[0][0].callback_data, "done:log");
  assert.equal(buttonsFor("gamification"), null);
});
