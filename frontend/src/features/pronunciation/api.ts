import { postJson, audioBase64, isObject } from '../shared/api.ts';
import { parseFeedback } from '../shared/feedback.ts';

export { practicePhrases } from './practice.ts';
import type { PracticeAssessment } from './practice.ts';

export async function analyzePractice(recording: Blob, reference: string, signal: AbortSignal): Promise<PracticeAssessment> {
  const data = await postJson('/api/pronunciation/analyze', {
    audio_base64: await audioBase64(recording), media_type: 'audio/wav', reference_text: reference,
  }, signal);
  const result = parseFeedback({ pronunciation: data }).pronunciation;
  if (!result || !isObject(data)) throw new Error('The backend returned an unexpected pronunciation result. Please try again.');
  return { ...result,
    observed_phonemes: Array.isArray(data.observed_phonemes)
      && data.observed_phonemes.every(phone => typeof phone === 'string' && phone.trim())
      ? data.observed_phonemes : [],
    phoneme_error_rate: typeof data.phoneme_error_rate === 'number'
      && Number.isFinite(data.phoneme_error_rate) && data.phoneme_error_rate >= 0
      ? data.phoneme_error_rate : null,
  };
}
