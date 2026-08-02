import { describe, expect, it } from 'vitest';
import { defaultLanguage, languageCodes, resolveLanguage, translations } from './translations';

const pluralSuffix = /_(zero|one|two|few|many|other)$/;
const semanticKeys = (language: keyof typeof translations) =>
  [...new Set(Object.keys(translations[language]).map((key) => key.replace(pluralSuffix, '')))].sort();

describe('translations', () => {
  it('covers the same interface in every registered language', () => {
    const reference = semanticKeys(defaultLanguage);
    languageCodes.forEach((language) => {
      expect(semanticKeys(language)).toEqual(reference);
      expect(Object.values(translations[language]).every(Boolean)).toBe(true);
    });
  });

  it('resolves every registered language and falls back for unknown values', () => {
    languageCodes.forEach((language) => expect(resolveLanguage(language)).toBe(language));
    expect(resolveLanguage('unknown')).toBe(defaultLanguage);
  });
});
