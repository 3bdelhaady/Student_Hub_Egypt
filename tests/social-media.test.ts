import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCIAL_MEDIA_LIMIT,
  validSocialMedia,
  socialMediaSignature,
} from '../src/modules/social/media';
test('social media only accepts bounded allowed types with matching category', () => {
  assert.equal(validSocialMedia('image', 'image/png', SOCIAL_MEDIA_LIMIT), true);
  assert.equal(validSocialMedia('image', 'image/svg+xml', 100), false);
  assert.equal(validSocialMedia('video', 'image/png', 100), false);
  assert.equal(validSocialMedia('video', 'video/mp4', SOCIAL_MEDIA_LIMIT + 1), false);
  assert.equal(validSocialMedia('image', 'image/png', 0), false);
  assert.equal(validSocialMedia('text', 'image/png', 100), false);
});
test('social media checks file signatures rather than trusting upload MIME', () => {
  assert.equal(
    socialMediaSignature('image/png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    true,
  );
  assert.equal(socialMediaSignature('image/jpeg', Buffer.from([255, 216, 255, 224])), true);
  assert.equal(socialMediaSignature('image/webp', Buffer.from('RIFF0000WEBP')), true);
  assert.equal(socialMediaSignature('video/mp4', Buffer.from('0000ftypisom0000')), true);
  assert.equal(
    socialMediaSignature('video/webm', Buffer.from([26, 69, 223, 163, 0, 0, 0, 0])),
    true,
  );
  for (const mime of ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm'])
    assert.equal(socialMediaSignature(mime, Buffer.from('<script>alert(1)</script>')), false);
});
