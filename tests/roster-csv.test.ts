import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rosterCsv, teamRosterCsv } from '../src/modules/portal/roster-csv';
test('Arabic roster CSV has BOM, escapes quotes and blocks spreadsheet formulas', () => {
  const csv = teamRosterCsv([
    { team: 'الفريق الأول', name: '=SUM(1)', studentCode: '123' },
    { team: 'ب', name: 'اسم "طالب"', studentCode: null },
  ]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.includes('"\'=SUM(1)"'));
  assert.ok(csv.includes('اسم ""طالب""'));
  assert.equal(csv.split('\r\n').length, 3);
  assert.ok(rosterCsv(['الاسم'], [['+cmd']]).includes("'+cmd"));
});
