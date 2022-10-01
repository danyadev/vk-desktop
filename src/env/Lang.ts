import ru from 'lang/ru'
import { Settings } from 'store/settings'

const langMap = {
  ru
}

type Dictionary = typeof langMap[Settings['lang']]

export class Lang {
  dictionary: Dictionary

  constructor(lang: Settings['lang']) {
    this.dictionary = langMap[lang]
  }

  use<K extends keyof Dictionary>(key: K): Dictionary[K] {
    return this.dictionary[key]
  }
}

