import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import * as electron from '@electron/remote'
import { deserializeJson, serializeJson } from 'misc/jsonSerializer'

export class MainStorage<T extends Record<string, unknown>> {
  path: string
  data: T
  version = 1

  constructor(defaults: T) {
    this.path = path.join(
      electron.app.getPath('appData'),
      'vk-desktop',
      `storage-v${this.version}.json`
    )

    let storageData: Partial<T> = {}
    try {
      storageData = deserializeJson<Partial<T>>(fs.readFileSync(this.path, 'utf-8'))
    } catch {
      // Файл криво записался и перезапишется при следующем сохранении
      // или при запуске приложения в main процессе
    }

    this.data = {
      ...defaults,
      ...storageData
    }
  }

  update(data: T) {
    this.data = data
    this.save()
  }

  save() {
    return fsPromises.writeFile(this.path, serializeJson(this.data))
  }
}

export class RendererStorage<T extends Record<string, unknown>> {
  name: string
  data: T
  version = 1

  constructor(name: string, defaults: T | (() => T)) {
    this.name = `${name}-v${this.version}`

    const defaultValue = typeof defaults === 'function' ? defaults() : defaults
    const storageData = deserializeJson<Partial<T>>(localStorage.getItem(this.name) ?? '{}')

    this.data = {
      ...defaultValue,
      ...storageData
    }

    this.save()
  }

  update(data: T) {
    this.data = data
    this.save()
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    this.data[key] = value
    this.save()
  }

  save() {
    localStorage.setItem(this.name, serializeJson(this.data))
  }
}
