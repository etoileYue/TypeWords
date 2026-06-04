import { toRomaji } from 'wanakana'
import type { Word } from '../types'

export type JapanesePracticeInputMode = 'kanji' | 'romaji'

const hasKana = /[ぁ-んァ-ヶー]/

const TILDE_REGEX = /～/g
function stripTilde(str: string): string {
  return str.replace(TILDE_REGEX, '')
}

const READING_ANNOTATION_REGEX = /^\([^)]+\)\s*/
function stripReadingAnnotation(str: string): string {
  return str.replace(READING_ANNOTATION_REGEX, '')
}

// 长音占位符，用于在 toRomaji 转换过程中保留长音标记
const CHOUON_PLACEHOLDER = 'xCHOUONx'

function toRomajiWithChouon(str: string): string {
  const replaced = str.replace(/ー/g, CHOUON_PLACEHOLDER)
  return toRomaji(replaced).replace(new RegExp(CHOUON_PLACEHOLDER, 'g'), '-')
}

export function getJapanesePracticeTarget(word: Word, mode: JapanesePracticeInputMode, isJapaneseWord: boolean) {
  if (!isJapaneseWord || mode !== 'romaji') {
    return stripTilde(word.word).split(/\s*\/\s*/).find(Boolean) || stripTilde(word.word)
  }
  const reading = stripReadingAnnotation(stripTilde(word.reading ?? '')).split(/\s*\/\s*/).find(Boolean)
  // 当 reading 不含假名时（如外来语的英文原词 "Johnson"），用假名本体转罗马音
  if (reading && hasKana.test(reading)) {
    return toRomajiWithChouon(reading)
  }
  return toRomajiWithChouon(stripTilde(word.word))
}
