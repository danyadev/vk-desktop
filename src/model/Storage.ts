import path from 'path'
import fs from 'fs'
import * as electron from '@electron/remote'

export class MainStorage<T extends Record<string, unknown>> {
  path: string
  data: T

  constructor(defaults: T) {
    this.path = path.join(electron.app.getPath('appData'), 'vk-desktop', 'store.json')

    let storageData: Partial<T> = {}
    try {
      storageData = JSON.parse(fs.readFileSync(this.path, 'utf-8')) as T
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
    fs.writeFileSync(this.path, JSON.stringify(this.data))
  }
}

export class RendererStorage<T extends Record<string, unknown>> {
  name: string
  data: T

  constructor(name: string, defaults: T | (() => T)) {
    const defaultValue = typeof defaults === 'function' ? defaults() : defaults
    const storageData = JSON.parse(localStorage.getItem(name) || '{}') as Partial<T>

    this.name = name
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

  save() {
    localStorage.setItem(this.name, JSON.stringify(this.data))
  }
}
