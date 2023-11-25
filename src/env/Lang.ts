import type { Settings } from 'store/settings'
import { ru } from 'lang/ru'
import type { VariablesTypings } from 'lang/VariablesTypings'
import { isObject } from 'misc/utils'

const langMap = {
  ru
}

export type Dictionary = typeof langMap[Settings['lang']]

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

  formatDate(timestamp: number, mask: string) {
    const date = new Date(timestamp)
    const months = this.useRaw('months_of')
    const addZero = (num: number) => (num < 10 ? `0${num}` : num)

    const tokens = {
      // год (2023; 23)
      yyyy: () => date.getFullYear(),
      yy: () => String(date.getFullYear()).slice(-2),

      // месяц (полное название; короткое название; 01-12; 1-12)
      MMMM: () => months[date.getMonth()] ?? '',
      MMM: () => tokens.MMMM().slice(0, 3),
      MM: () => addZero(tokens.M()),
      M: () => date.getMonth() + 1,

      // день (01-31; 1-31)
      dd: () => addZero(tokens.d()),
      d: () => date.getDate(),

      // час (01-23; 1-23)
      hh: () => addZero(tokens.h()),
      h: () => date.getHours(),

      // минута (01-59; 1-59)
      mm: () => addZero(tokens.m()),
      m: () => date.getMinutes(),

      // секунда (01-59; 1-59)
      ss: () => addZero(tokens.s()),
      s: () => date.getSeconds()
    }

    Object.entries(tokens).forEach(([token, replacer]) => {
      mask = mask.replace(new RegExp(token, 'g'), () => String(replacer()))
    })

    return mask
  }
}
