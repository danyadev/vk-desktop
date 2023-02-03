import { ru } from 'lang/ru'
import type { VariablesTypings } from 'lang/VariablesTypings'
import type { Settings } from 'store/settings'
import { isObject } from 'misc/utils'

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

  /**
   * Принимается максимум 2 аргумента.
   * Второй аргумент - массив/объект необходимых для ключа переменных
   */
  use<Key extends keyof DictionaryWithStringValues>(
    key: Key,
    ...variablesRest: VariablesTypings<DictionaryWithStringValues>[Key]
  ): string {
    const rawTranslation = this.dictionary[key]
    /**
     * Для более строгой типизации мы решаем, нужен ли нам второй аргумент, на основе
     * первого переданного элемента.
     * Если сделать второй аргумент опциональным, а не rest'ом, то функция не сможет заставить
     * передать два аргумента, когда это действительно необходимо
     */
    const [variables] = variablesRest

    if (Array.isArray(variables)) {
      return rawTranslation.replace(
        /{(\d+)}/g,
        (full, number: number) => variables[number] ?? full
      )
    }

    if (isObject(variables)) {
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
