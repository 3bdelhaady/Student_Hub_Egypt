import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  certificateInput,
  parseCertificateCsv,
  serialInput,
  validIssueDate,
} from '../src/modules/portal/certificates-policy';
test('certificate serial and dates are strict and normalized', () => {
  assert.equal(serialInput.parse(' cert-abcdef123456 '), 'CERT-ABCDEF123456');
  assert.equal(serialInput.safeParse('1234').success, false);
  assert.equal(validIssueDate('2026-02-30'), false);
  assert.equal(validIssueDate('2024-02-29'), true);
  assert.equal(
    certificateInput.safeParse({
      serial: '',
      recipientName: 'طالب',
      certificateTitle: 'شهادة',
      issuedOn: '2026-11-22',
    }).success,
    true,
  );
});
test('certificate CSV uses exact bounded columns, preserves quoted values, and rejects duplicates and private extra data', () => {
  const header = 'serial,recipientName,certificateTitle,issuedOn\n';
  assert.equal(parseCertificateCsv(header + ',"طالب، اختبار",شهادة,2026-11-22')[0].serial, '');
  assert.throws(() =>
    parseCertificateCsv('serial,recipientName,certificateTitle,issuedOn,nationalId\n,,,,1'),
  );
  assert.throws(() =>
    parseCertificateCsv(
      header + 'CERT-ABCDEF123456,طالب,شهادة,2026-11-22\ncert-abcdef123456,طالب,شهادة,2026-11-22',
    ),
  );
  assert.throws(() => parseCertificateCsv(header + ',طالب,شهادة,2026-02-30'));
  assert.throws(() => parseCertificateCsv(header));
});
