import test from 'node:test';
import assert from 'node:assert/strict';
import { practicePhrases, emptyProgress, selectPhrase, presentPhrase, recordAssessment,
  loadProgress, saveProgress } from '../src/features/pronunciation/practice.ts';

const DAY = 86400000;
const phrase = practicePhrases[0];
const clean = { reference_inferred: false, errors: [], feedback: '', observed_phonemes: ['θ'], phoneme_error_rate: 0 };
const mistake = { ...clean, errors: [{ word: 'think', position: 1, expected: 'θ', observed: 's' }] };

function storage() {
  let json = null;
  return { getItem: () => json, setItem: (_, value) => { json = value; } };
}

test('selection varies and excludes recent sentences across reloads', () => {
  let progress = emptyProgress();
  assert.notEqual(selectPhrase(progress, 0, () => 0).id, selectPhrase(progress, 0, () => 0.99).id);
  for (let i = 0; i < 100; i++) {
    const next = selectPhrase(progress, 0, () => 0);
    assert(!progress.recent.includes(next.id));
    progress = presentPhrase(progress, next);
  }
  const store = storage();
  assert(saveProgress(store, progress));
  assert.deepEqual(loadProgress(store), progress);
  assert(!progress.recent.includes(selectPhrase(loadProgress(store), 0, () => 0).id));
});

test('clear attempts get spaced reviews, retries do not accelerate mastery, mistakes reset it', () => {
  let progress = presentPhrase(emptyProgress(), phrase);
  for (const days of [1, 2, 4, 8, 16, 30, 30]) {
    progress = recordAssessment(progress, phrase, clean, 1000);
    assert.equal(progress.phrases[phrase.id].due, 1000 + days * DAY);
    const streak = progress.phrases[phrase.id].streak;
    progress = recordAssessment(progress, phrase, clean, 1000);
    assert.equal(progress.phrases[phrase.id].streak, streak);
    progress = presentPhrase(progress, phrase);
  }
  progress = recordAssessment(progress, phrase, mistake, 1000);
  assert.equal(progress.phrases[phrase.id].streak, 0);
  assert.equal(progress.phrases[phrase.id].due, 601000);
  progress = recordAssessment(progress, phrase, clean, 1000);
  assert.equal(progress.phrases[phrase.id].due, 1000 + DAY);
});

test('missing recognition, inferred references and uncertain results do not create mastery', () => {
  const progress = presentPhrase(emptyProgress(), phrase);
  for (const result of [{ ...clean, observed_phonemes: [] }, { ...clean, reference_inferred: true },
    { ...clean, phoneme_error_rate: null }, { ...clean, phoneme_error_rate: 0.4 }]) {
    assert.deepEqual(recordAssessment(progress, phrase, result, 0), progress);
  }
});

test('mastered sentences stay out of selection while unseen or due practice exists', () => {
  let progress = presentPhrase(emptyProgress(), phrase);
  progress = recordAssessment(progress, phrase, clean, 0);
  progress = { ...progress, recent: [] };
  assert.notEqual(selectPhrase(progress, 0, () => 0).id, phrase.id);
  assert.equal(selectPhrase(progress, DAY, () => 0).id, phrase.id);
});

test('mistakes favour other sentences in the difficult sound group', () => {
  const first = presentPhrase(emptyProgress(), phrase);
  const struggling = recordAssessment(first, phrase, mistake, 0);
  const counts = progress => {
    let count = 0;
    for (let i = 0; i < 1000; i++) {
      if (selectPhrase(progress, 0, () => (i + 0.5) / 1000).group === phrase.group) count++;
    }
    return count;
  };
  assert(counts(struggling) > counts(first));
});

test('all mastered sentences still allow practice with the earliest upcoming review', () => {
  let progress = emptyProgress();
  for (const [index, item] of practicePhrases.entries()) {
    progress = presentPhrase(progress, item);
    progress = recordAssessment(progress, item, clean, index);
  }
  assert.equal(selectPhrase(progress, 0, () => 0).id, phrase.id);
});

test('invalid JSON and invalid entries recover safely; disabled storage keeps practice usable', () => {
  for (const value of ['bad json', 'null', '{"version":2}',
    '{"version":1,"presentation":-1,"recent":[],"phrases":{}}']) {
    assert.deepEqual(loadProgress({ getItem: () => value }), emptyProgress());
  }
  const progress = presentPhrase(emptyProgress(), phrase);
  progress.phrases[phrase.id] = { attempts: 1, mistakes: 2, streak: 0, due: 10, lastSuccessPresentation: 0 };
  const store = storage();
  saveProgress(store, progress);
  assert.deepEqual(loadProgress(store).phrases, {});
  const disabled = { getItem() { throw new Error('Disabled'); }, setItem() { throw new Error('Full'); } };
  assert.deepEqual(loadProgress(disabled), emptyProgress());
  assert.equal(saveProgress(disabled, progress), false);
  assert(selectPhrase(progress));
});
