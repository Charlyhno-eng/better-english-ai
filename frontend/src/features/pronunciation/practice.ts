import type { Pronunciation } from '../shared/feedback.ts';

const groups = [
  { id: 'th', focus: 'Practise the th sounds in think and this.', sentences: [
    'I think three things are worth trying.', 'They thought the weather would be warmer.',
    'My brother thanked them for their help.', 'There are thirty books on that shelf.',
    'Those three paths lead through the woods.', 'Is this the thing you were thinking about?',
  ] },
  { id: 'rl', focus: 'Keep r and l distinct, as in really and love.', sentences: [
    'We really love learning new words.', 'Laura rarely arrives late for lunch.',
    'The little red light is really bright.', 'Please leave the room ready for our guests.',
    'Our library has a lovely reading room.', 'Lily brought a long ruler to class.',
  ] },
  { id: 'vowels', focus: 'Compare the short vowel in ship with the long vowel in sheep.', sentences: [
    'The ship leaves after we finish eating.', 'Sit here and eat a little cheese.',
    'These green beans will fit in this dish.', 'He needs six tickets for this evening.',
    'We live near a busy street.', 'Please fill the tin with sweet biscuits.',
  ] },
  { id: 'clusters', focus: 'Say each sound in consonant groups, as in bring and best.', sentences: [
    'Please bring your best friend to the park.', 'The strong wind swept across the street.',
    'My next train stops at the bridge.', 'She dropped her gloves beside the desk.',
    'We spent spring planting small trees.', 'Take the first left past the sports club.',
  ] },
  { id: 'wv', focus: 'Round your lips for w; touch your lower lip with your teeth for v.', sentences: [
    'We visited a very warm village.', 'William wears a vest in winter.',
    'The view over the valley was wonderful.', 'We waited for the van on Wednesday.',
    'Violet wants to invite everyone.', 'The waves were visible from our window.',
  ] },
  { id: 'h', focus: 'Let air flow gently for h, as in house and hello.', sentences: [
    'Harry has a happy home near the hill.', 'I hope her holiday helps her relax.',
    'He hurried home before half past eight.', 'How heavy is the bag in your hand?',
    'Helen heard him calling from the hall.', 'Have you ever helped at a hospital?',
  ] },
  { id: 'endings', focus: 'Keep final consonants audible, including plural s and past tense endings.', sentences: [
    'She packed her bags and walked to work.', 'He washed the cups and closed the door.',
    'My friends cooked lunch and cleaned the plates.', 'They watched the birds and counted their nests.',
    'We booked two seats and checked the times.', 'The dogs jumped over the fence and barked.',
  ] },
  { id: 'ae', focus: 'Compare the vowels in bed and bad; open your mouth wider for bad.', sentences: [
    'The black cat slept beside the red bed.', 'Jack left his hat on the desk.',
    'Can you get a fresh apple for Dad?', 'Ten guests sat at the back of the cafe.',
    'The man in the red jacket came back.', 'Sam sent a message about the next match.',
  ] },
];

export const practicePhrases = groups.flatMap(group => group.sentences.map((text, index) => ({
  id: `${group.id}-${index}`, group: group.id, text, focus: group.focus,
})));
export type PracticePhrase = typeof practicePhrases[number];
export interface PracticeAssessment extends Pronunciation {
  observed_phonemes: string[];
  phoneme_error_rate: number | null;
}
interface PhraseProgress {
  attempts: number;
  mistakes: number;
  streak: number;
  due: number;
  lastSuccessPresentation: number;
}
export interface PracticeProgress {
  version: 1;
  presentation: number;
  recent: string[];
  phrases: Record<string, PhraseProgress>;
}
const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'better-english.pronunciation.v1';
export const emptyProgress = (): PracticeProgress => ({ version: 1, presentation: 0, recent: [], phrases: {} });

interface Storage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

export function loadProgress(storage: Storage): PracticeProgress {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
    if (!data || data.version !== 1 || !Number.isSafeInteger(data.presentation) || data.presentation < 0
      || !Array.isArray(data.recent) || !data.phrases || typeof data.phrases !== 'object') return emptyProgress();
    const progress = emptyProgress();
    progress.presentation = data.presentation;
    progress.recent = data.recent.filter((id: unknown) => practicePhrases.some(p => p.id === id)).slice(-5);
    for (const phrase of practicePhrases) {
      const value = data.phrases[phrase.id];
      if (value && ['attempts', 'mistakes', 'streak', 'lastSuccessPresentation'].every(key =>
        Number.isSafeInteger(value[key]) && value[key] >= 0)
        && value.mistakes <= value.attempts && value.streak <= value.attempts
        && value.lastSuccessPresentation <= data.presentation
        && Number.isFinite(value.due) && value.due >= 0) progress.phrases[phrase.id] = value;
    }
    return progress;
  } catch { return emptyProgress(); }
}

export function saveProgress(storage: Storage, progress: PracticeProgress): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

/** Due reviews and weak sound groups share priority; unseen sentences keep the practice varied. */
export function selectPhrase(progress: PracticeProgress, now = Date.now(), random = Math.random): PracticePhrase {
  const available = practicePhrases.filter(p => !progress.recent.includes(p.id));
  const due = available.filter(p => !progress.phrases[p.id] || progress.phrases[p.id].due <= now);
  // If everything is mastered, offer a fresh presentation of the earliest upcoming review.
  const pool = due.length ? due : available.filter(p => progress.phrases[p.id].due
    === Math.min(...available.map(item => progress.phrases[item.id].due)));
  const weights = pool.map(phrase => {
    const stats = progress.phrases[phrase.id];
    const related = practicePhrases.filter(p => p.group === phrase.group).map(p => progress.phrases[p.id]);
    const mistakes = related.reduce((total, item) => total + (item?.mistakes ?? 0), 0);
    const attempts = related.reduce((total, item) => total + (item?.attempts ?? 0), 0);
    return (stats ? stats.streak ? 1 : 3 : 2) * (1 + 2 * mistakes / Math.max(1, attempts));
  });
  let choice = random() * weights.reduce((total, value) => total + value, 0);
  return pool.find((_, index) => { choice -= weights[index]; return choice < 0; }) ?? pool[pool.length - 1];
}

export function presentPhrase(progress: PracticeProgress, phrase: PracticePhrase): PracticeProgress {
  return { ...progress, presentation: progress.presentation + 1,
    recent: [...progress.recent, phrase.id].slice(-5) };
}

export function recordAssessment(progress: PracticeProgress, phrase: PracticePhrase,
  result: PracticeAssessment, now = Date.now()): PracticeProgress {
  // Empty or incomplete recognition is not evidence of mastery.
  const clean = !result.reference_inferred && result.errors.length === 0
    && result.observed_phonemes.length > 0 && result.phoneme_error_rate !== null
    && result.phoneme_error_rate <= 0.05;
  if (!clean && result.errors.length === 0) return progress;
  const previous = progress.phrases[phrase.id] ?? {
    attempts: 0, mistakes: 0, streak: 0, due: 0, lastSuccessPresentation: 0,
  };
  // Repeated recordings on the same displayed sentence cannot accelerate spaced reviews.
  const streak = clean ? previous.streak + Number(previous.lastSuccessPresentation !== progress.presentation) : 0;
  const stats = { attempts: previous.attempts + 1, mistakes: previous.mistakes + Number(!clean), streak,
    due: clean ? now + Math.min(30, 2 ** Math.min(streak - 1, 5)) * DAY : now + 10 * 60 * 1000,
    lastSuccessPresentation: clean ? progress.presentation : 0 };
  return { ...progress, phrases: { ...progress.phrases, [phrase.id]: stats } };
}
