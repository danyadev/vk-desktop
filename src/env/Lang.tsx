import * as Peer from 'model/Peer'
import type { Settings } from 'store/settings'
import { ru, RuPluralRules } from 'lang/ru'
import { VariablesTypings } from 'lang/VariablesTypings'
import { JSXElement, splitter } from 'misc/utils'

const langMap = {
  ru
}
type PluralKeysMap = {
  ru: RuPluralRules
}

type PluralKeys = PluralKeysMap[Settings['lang']]
type PluralValues = Record<PluralKeys, string> & { single?: string }

type GenderKeys = 'male' | 'female'
type GenderValues = Record<GenderKeys, string>

export type Dictionary = typeof langMap[Settings['lang']]

type DictionaryOfStrings = {
  [Key in keyof Dictionary as Dictionary[Key] extends string ? Key : never]: Dictionary[Key]
}

type DictionaryOfPlurals = {
  [Key in keyof Dictionary as Dictionary[Key] extends PluralValues ? Key : never]: Dictionary[Key]
}

type DictionaryOfGenders = {
  [Key in keyof Dictionary as Dictionary[Key] extends GenderValues ? Key : never]: Dictionary[Key]
}

export class Lang {
  dictionary: Dictionary
  pluralRules: Intl.PluralRules

  constructor(public locale: Settings['lang']) {
    this.dictionary = langMap[locale]
    this.pluralRules = new Intl.PluralRules(locale, { type: 'cardinal' })
  }

  use<Key extends keyof VariablesTypings>(
    key: Key,
    variables: VariablesTypings[Key]
  ): string
  use<Key extends Exclude<keyof DictionaryOfStrings, keyof VariablesTypings>>(
    key: Key
  ): string
  use<Key extends keyof DictionaryOfStrings>(
    key: Key,
    variables?: Key extends keyof VariablesTypings
      ? VariablesTypings[Key]
      : never
  ): string {
    return this.transform(
      this.dictionary[key],
      variables,
      (chunks) => chunks.join('')
    )
  }

  useJSX<Key extends keyof VariablesTypings>(
    key: Key,
    variables: VariablesTypings<JSXElement>[Key]
  ): JSXElement
  useJSX<Key extends Exclude<keyof DictionaryOfStrings, keyof VariablesTypings>>(
    key: Key
  ): JSXElement
  useJSX<Key extends keyof DictionaryOfStrings>(
    key: Key,
    variables?: Key extends keyof VariablesTypings
      ? VariablesTypings<JSXElement>[Key]
      : never
  ): JSXElement {
    return this.transform(
      this.dictionary[key],
      variables,
      (chunks) => <>{chunks}</>
    )
  }

  usePlural<Key extends keyof DictionaryOfPlurals & keyof VariablesTypings>(
    key: Key,
    number: number,
    variables: VariablesTypings[Key]
  ): string
  usePlural<Key extends Exclude<keyof DictionaryOfPlurals, keyof VariablesTypings>>(
    key: Key,
    number: number
  ): string
  usePlural<Key extends keyof DictionaryOfPlurals>(
    key: Key,
    number: number,
    variables?: Key extends keyof VariablesTypings
      ? VariablesTypings[Key]
      : never
  ): string {
    const values = this.dictionary[key] as PluralValues
    const value = number === 1 && values.single
      ? values.single
      : values[this.pluralRules.select(number) as PluralKeys]

    return this.transform(
      value,
      variables ?? { 0: number },
      (chunks) => chunks.join('')
    )
  }

  usePluralJSX<Key extends keyof DictionaryOfPlurals & keyof VariablesTypings>(
    key: Key,
    number: number,
    variables: VariablesTypings<JSXElement>[Key]
  ): JSXElement
  usePluralJSX<Key extends Exclude<keyof DictionaryOfPlurals, keyof VariablesTypings>>(
    key: Key,
    number: number
  ): JSXElement
  usePluralJSX<Key extends keyof DictionaryOfPlurals>(
    key: Key,
    number: number,
    variables?: Key extends keyof VariablesTypings
      ? VariablesTypings<JSXElement>[Key]
      : never
  ): JSXElement {
    const values = this.dictionary[key] as PluralValues
    const value = number === 1 && values.single
      ? values.single
      : values[this.pluralRules.select(number) as PluralKeys]

    return this.transform(
      value,
      variables ?? { 0: number as JSXElement },
      (chunks) => <>{chunks}</>
    )
  }

  useGender<Key extends keyof DictionaryOfGenders & keyof VariablesTypings>(
    key: Key,
    gender: Peer.User['gender'],
    variables: VariablesTypings[Key]
  ): string
  useGender<Key extends Exclude<keyof DictionaryOfGenders, keyof VariablesTypings>>(
    key: Key,
    gender: Peer.User['gender']
  ): string
  useGender<Key extends keyof DictionaryOfGenders>(
    key: Key,
    gender: Peer.User['gender'],
    variables?: Key extends keyof VariablesTypings
      ? VariablesTypings[Key]
      : never
  ): string {
    const values = this.dictionary[key] as GenderValues

    return this.transform(
      gender === 'female' ? values.female : values.male,
      variables,
      (chunks) => chunks.join('')
    )
  }

  useGenderJSX<Key extends keyof DictionaryOfGenders & keyof VariablesTypings>(
    key: Key,
    gender: Peer.User['gender'],
    variables: VariablesTypings<JSXElement>[Key]
  ): JSXElement
  useGenderJSX<Key extends Exclude<keyof DictionaryOfGenders, keyof VariablesTypings>>(
    key: Key,
    gender: Peer.User['gender']
  ): JSXElement
  useGenderJSX<Key extends keyof DictionaryOfGenders>(
    key: Key,
    gender: Peer.User['gender'],
    variables?: Key extends keyof VariablesTypings
      ? VariablesTypings<JSXElement>[Key]
      : never
  ): JSXElement {
    const values = this.dictionary[key] as GenderValues

    return this.transform(
      gender === 'female' ? values.female : values.male,
      variables,
      (chunks) => <>{chunks}</>
    )
  }

  useRaw<Key extends keyof Dictionary>(key: Key): Dictionary[Key] {
    return this.dictionary[key]
  }

  private transform<V, R>(
    translation: string,
    variables: Record<string, V | string> | undefined,
    joiner: (chunks: Array<V | string>) => R
  ): R | string {
    if (!variables) {
      return translation
    }

    return this.applyVariables(translation, variables, joiner)
  }

  private applyVariables<V, R>(
    translation: string,
    variables: Record<string, V | string>,
    joiner: (chunks: Array<V | string>) => R
  ): R {
    const chunks = splitter(translation, /{(\w+)}/).map((chunk) => {
      switch (chunk.kind) {
        case 'separator':
          return variables[chunk.value] ?? chunk.value
        case 'rest':
          return chunk.value
      }
    })

    return joiner(chunks)
  }

  private dateTimeFormatters = new Map<string, Intl.DateTimeFormat>()

  dateTimeFormatter(options: Intl.DateTimeFormatOptions) {
    const cacheKey = JSON.stringify(options)
    const cachedFormatter = this.dateTimeFormatters.get(cacheKey)

    if (cachedFormatter) {
      return cachedFormatter
    }

    const formatter = new Intl.DateTimeFormat(this.locale, options)
    this.dateTimeFormatters.set(cacheKey, formatter)
    return formatter
  }
}
