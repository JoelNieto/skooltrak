import { Injectable } from '@nestjs/common';

/**
 * Translation seam (Phase 4). For now this is a no-op that returns the original
 * text, so the rest of the platform can call it without feature-flagging.
 * DeepL will be plugged in behind this interface later; per-recipient language
 * preference is already stored on RecipientPreference.language.
 */
@Injectable()
export class TranslationService {
  async translate(
    text: string,
    _targetLanguage: string,
    _sourceLanguage?: string,
  ): Promise<{ text: string; translated: boolean }> {
    return { text, translated: false };
  }
}
