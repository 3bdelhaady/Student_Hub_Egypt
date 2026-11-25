import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  teamLetter,
  canProposeTeam,
  teamCreationInput,
  teamApplicationsOpen,
} from '../src/modules/academic-teams/policy';
test('team creation requires active membership and a published same-university course', () => {
  const member = { status: 'active', universityId: 'a' },
    course = { published: true, universityId: 'a' };
  assert.equal(canProposeTeam(member, course), true);
  assert.equal(canProposeTeam(undefined, course), false);
  assert.equal(canProposeTeam(member, undefined), false);
  for (const status of ['pending', 'suspended', 'rejected'])
    assert.equal(canProposeTeam({ ...member, status }, course), false);
  assert.equal(canProposeTeam(member, { ...course, published: false }), false);
  assert.equal(canProposeTeam(member, { ...course, universityId: 'b' }), false);
});
test('team proposals validate real fields without treating the marker as an invitation credential', () => {
  const value = {
    title: 'فريق جديد',
    description: 'مشروع تعاوني موضح للمراجعة',
    courseId: 'course',
    marker: 'أ',
  };
  assert.equal(teamCreationInput.safeParse(value).success, true);
  for (const patch of [{ title: ' ' }, { description: 'قصير' }, { courseId: '' }])
    assert.equal(teamCreationInput.safeParse({ ...value, ...patch }).success, false);
});
test('team application availability follows the real capacity and closing time', () => {
  const now = new Date('2026-11-22T08:00:00Z');
  assert.equal(teamApplicationsOpen({ capacity: null, closesAt: null }, now), true);
  assert.equal(teamApplicationsOpen({ capacity: 0, closesAt: null }, now), false);
  assert.equal(teamApplicationsOpen({ capacity: 2, closesAt: now }, now), false);
  assert.equal(teamApplicationsOpen({ capacity: 2, closesAt: new Date(+now + 1) }, now), true);
});

test('team proposal ignores client supplied marker', () => {
  const p = teamCreationInput.parse({
    title: 'فريق',
    description: 'وصف لفريق طلابي جديد',
    courseId: 'c',
    marker: 'ZZZ',
  });
  assert.equal('marker' in p, false);
});

test('automatic course letters use A through Z then AA without reuse', () => {
  assert.deepEqual([0, 1, 2, 25, 26, 27, 51, 52].map(teamLetter), [
    'A',
    'B',
    'C',
    'Z',
    'AA',
    'AB',
    'AZ',
    'BA',
  ]);
  assert.throws(() => teamLetter(-1));
});
