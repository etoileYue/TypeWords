import { toRomaji } from 'wanakana'
import type { Word } from '../types'

export type JapanesePracticeInputMode = 'kanji' | 'romaji'

export function getJapanesePracticeTarget(word: Word, mode: JapanesePracticeInputMode, isJapaneseWord: boolean) {
  if (!isJapaneseWord || mode !== 'romaji') {
    return word.word
  }
  const reading = word.reading?.split(/\s*\/\s*/).find(Boolean)
  return toRomaji(reading || word.word)
}
