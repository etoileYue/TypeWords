import { toRomaji } from 'wanakana'
import type { Word } from '../types'

export type JapanesePracticeInputMode = 'kanji' | 'romaji'

const hasKana = /[ぁ-んァ-ヶー]/

export function getJapanesePracticeTarget(word: Word, mode: JapanesePracticeInputMode, isJapaneseWord: boolean) {
  if (!isJapaneseWord || mode !== 'romaji') {
    return word.word
  }
  const reading = word.reading?.split(/\s*\/\s*/).find(Boolean)
  // 当 reading 不含假名时（如外来语的英文原词 "Johnson"），用假名本体转罗马音
  if (reading && hasKana.test(reading)) {
    return toRomaji(reading)
  }
  return toRomaji(word.word)
}
