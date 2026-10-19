import test from "node:test";
import assert from "node:assert/strict";
import { buildNotification } from "../src/engine.js";
import { TEMPLATES } from "../src/templates.js";

// Helper: waktu WIB -> Date (WIB = UTC+7)
const wib = (h, m = 0) => new Date(Date.UTC(2026, 9, 19, h - 7, m));
const base = { id: "t", name: "Riko", checkedIn: false, checkedOut: false, logbookDone: false, streak: 0, logbookDeadline: "23:59" };

test("07:45 belum absen -> attendance_in", () => {
  assert.equal(buildNotification(base, wib(7, 45)).category, "attendance_in");
});
test("07:45 sudah absen -> tidak ada notifikasi", () => {
  assert.equal(buildNotification({ ...base, checkedIn: true }, wib(7, 45)), null);
});
test("16:40 sudah masuk, belum pulang -> attendance_out", () => {
  assert.equal(buildNotification({ ...base, checkedIn: true }, wib(16, 40)).category, "attendance_out");
});
test("15:30 logbook kosong -> logbook", () => {
  assert.equal(buildNotification({ ...base, checkedIn: true }, wib(15, 30)).category, "logbook");
});
test("20:10 logbook kosong -> logbook", () => {
  assert.equal(buildNotification(base, wib(20, 10)).category, "logbook");
});
test("23:10 logbook kosong -> urgent", () => {
  assert.equal(buildNotification(base, wib(23, 10)).category, "urgent");
});
test("streak 5 -> gamification", () => {
  const n = buildNotification({ ...base, checkedIn: true, checkedOut: true, logbookDone: true, streak: 5 }, wib(18, 0));
  assert.equal(n.category, "gamification");
  assert.match(n.message, /5/);
});
test("semua pesan <= 160 karakter & ada tombol aksi", () => {
  for (const [cat, list] of Object.entries(TEMPLATES)) {
    for (const t of list) {
      const msg = t.message.replace(/\{\{nama\}\}/g, "Riko").replace(/\{\{streak\}\}/g, "10").replace(/\{\{deadline\}\}/g, "23:59");
      assert.ok(msg.length <= 160, `${cat}: ${msg.length} karakter`);
      assert.ok(t.action_button.length > 0);
    }
  }
});
