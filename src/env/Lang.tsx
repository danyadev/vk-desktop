import * as Peer from 'model/Peer'
import type { Settings } from 'store/settings'
import { ru } from 'lang/ru'
import { VariablesTypings } from 'lang/VariablesTypings'
import { JSXElement, splitter } from 'misc/utils'

const langMap = {
  ru
}

export type Dictionary = typeof langMap[Settings['lang']]

type DictionaryWithStringValues = {
  [Key in keyof Dictionary as Dictionary[Key] extends string ? Key : never]: Dictionary[Key]
}

type DictionaryWithArrayValues = {
  [Key in keyof Dictionary as Dictionary[Key] extends ReadonlyArray<string> ? Key : never]:
    Dictionary[Key]
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
  use<Key extends Exclude<keyof DictionaryWithStringValues, keyof VariablesTypings>>(
    key: Key
  ): string
  use<Key extends keyof DictionaryWithStringValues>(
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
  ): string
  useJSX<Key extends Exclude<keyof DictionaryWithStringValues, keyof VariablesTypings>>(
    key: Key
  ): string
  useJSX<Key extends keyof DictionaryWithStringValues>(
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

  usePlural<Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings>(
    key: Key,
    number: number,
    variables: VariablesTypings[Key]
  ): string
  usePlural<Key extends Exclude<keyof DictionaryWithArrayValues, keyof VariablesTypings>>(
    key: Key,
    number: number
  ): string
  usePlural<Key extends keyof DictionaryWithArrayValues>(
    key: Key,
    number: number,
    variables?: Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings
      ? VariablesTypings[Key]
      : never
  ): string {
    const values = this.dictionary[key]

    return this.transform(
      values[this.pluralIndex(number)] ?? values[0],
      variables ?? { 0: String(number) },
      (chunks) => chunks.join('')
    )
  }

  usePluralJSX<Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings>(
    key: Key,
    number: number,
    variables: VariablesTypings<JSXElement>[Key]
  ): string
  usePluralJSX<Key extends Exclude<keyof DictionaryWithArrayValues, keyof VariablesTypings>>(
    key: Key,
    number: number
  ): string
  usePluralJSX<Key extends keyof DictionaryWithArrayValues>(
    key: Key,
    number: number,
    variables?: Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings
      ? VariablesTypings<JSXElement>[Key]
      : never
  ): JSXElement {
    const values = this.dictionary[key]

    return this.transform(
      values[this.pluralIndex(number)] ?? values[0],
      variables ?? { 0: String(number) },
      (chunks) => <>{chunks}</>
    )
  }

  useGender<Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings>(
    key: Key,
    gender: Peer.User['gender'],
    variables: VariablesTypings[Key]
  ): string
  useGender<Key extends Exclude<keyof DictionaryWithArrayValues, keyof VariablesTypings>>(
    key: Key,
    gender: Peer.User['gender']
  ): string
  useGender<Key extends keyof DictionaryWithArrayValues>(
    key: Key,
    gender: Peer.User['gender'],
    variables?: Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings
      ? VariablesTypings[Key]
      : never
  ): string {
    const values = this.dictionary[key]

    return this.transform(
      gender === 'female' ? values[1] : values[0],
      variables,
      (chunks) => chunks.join('')
    )
  }

  useGenderJSX<Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings>(
    key: Key,
    gender: Peer.User['gender'],
    variables: VariablesTypings<JSXElement>[Key]
  ): string
  useGenderJSX<Key extends Exclude<keyof DictionaryWithArrayValues, keyof VariablesTypings>>(
    key: Key,
    gender: Peer.User['gender']
  ): string
  useGenderJSX<Key extends keyof DictionaryWithArrayValues>(
    key: Key,
    gender: Peer.User['gender'],
    variables?: Key extends keyof DictionaryWithArrayValues & keyof VariablesTypings
      ? VariablesTypings<JSXElement>[Key]
      : never
  ): JSXElement {
    const values = this.dictionary[key]

    return this.transform(
      gender === 'female' ? values[1] : values[0],
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

  private pluralIndex(count: number) {
    const pluralRule = this.pluralRules.select(count)

    if (pluralRule === 'one') {
      return 0
    }
    if (pluralRule === 'few') {
      return 1
    }

    return 2
  }

  private dateTimeFormatters = new Map<string, Intl.DateTimeFormat>()

  dateTimeFormatter(options?: Intl.DateTimeFormatOptions) {
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
