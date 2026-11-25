import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticEvent } from '../src/lib/diagnostics';
test('diagnostics contain only fixed scope, opaque incident id and timestamp', () => {
  const a = diagnosticEvent('institution.save'),
    b = diagnosticEvent('institution.save');
  assert.deepEqual(Object.keys(a).sort(), ['at', 'event', 'incidentId', 'scope']);
  assert.notEqual(a.incidentId, b.incidentId);
  assert.equal(a.scope, 'institution.save');
  assert.equal(a.event, 'operation_failed');
  assert.ok(Number.isFinite(Date.parse(a.at)));
});
