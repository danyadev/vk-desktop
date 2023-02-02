import { ru } from 'lang/ru'
import type { VariablesTypings } from 'lang/VariablesTypings'
import type { Settings } from 'store/settings'

const langMap = {
  ru
}

type Dictionary = typeof langMap[Settings['lang']]

type DictionaryWithStringValues = {
  [Key in keyof Dictionary as Dictionary[Key] extends string ? Key : never]: Dictionary[Key]
}

export class Lang {
  dictionary: Dictionary

  constructor(lang: Settings['lang']) {
    this.dictionary = langMap[lang]
  }

  use<Key extends keyof DictionaryWithStringValues>(
    key: Key,
    ...variablesRest: VariablesTypings<DictionaryWithStringValues>[Key]
  ): string {
    const rawTranslation = this.dictionary[key]
    // rest используется только для того, чтобы не делать второй параметр опциональным,
    // а изнутри строго решать, обязателен этот параметр или его нельзя передать
    const [variables] = variablesRest

    if (Array.isArray(variables)) {
      return rawTranslation.replace(
        /{(\d+)}/g,
        (full, number: number) => variables[number] ?? full
      )
    } else if (variables && typeof variables === 'object') {
      return rawTranslation.replace(
        /{(\w+)}/gi,
        (full, name: keyof typeof variables) => variables[name] ?? full
      )
    }

    return rawTranslation
  }

  useRaw<Key extends keyof Dictionary>(key: Key): Dictionary[Key] {
    return this.dictionary[key]
  }
}
