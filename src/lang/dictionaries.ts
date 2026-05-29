import { ru, RuPluralRules } from 'lang/ru'

export const dictionaries = {
  ru
}

export type Locale = keyof typeof dictionaries

export type PluralRules = {
  ru: RuPluralRules
}
