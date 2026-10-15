import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { deserializeJson, serializeJson } from 'misc/jsonSerializer'

export interface StorageBackend {
  read(): string | null
  write(value: string): void
}

export class JsonStorage<T extends object> {
  private state: T

  constructor(private readonly backend: StorageBackend, defaults: () => T) {
    const json = backend.read()
    let saved: Partial<T> = {}
    if (json !== null) {
      try {
        saved = deserializeJson<Partial<T>>(json)
      } catch {
        // Invalid JSON: use defaults instead
      }
    }

    this.state = {
      ...defaults(),
      ...saved
    }

    this.save()
  }

  getState() {
    return this.state
  }

  setState(data: T) {
    this.state = data
    this.save()
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    this.state[key] = value
    this.save()
  }

  save() {
    this.backend.write(serializeJson(this.state))
  }
}

export class LocalStorageBackend implements StorageBackend {
  constructor(private readonly name: string) {}

  read() {
    return localStorage.getItem(this.name)
  }

  write(value: string) {
    localStorage.setItem(this.name, value)
  }
}

export class FileSystemStorageBackend implements StorageBackend {
  private pendingWrite = Promise.resolve()

  constructor(private readonly filePath: string) {}

  read() {
    try {
      return fs.readFileSync(this.filePath, 'utf-8')
    } catch (error) {
      console.error('[Storage] FS read error', error)
      return null
    }
  }

  write(value: string) {
    this.pendingWrite = this.pendingWrite
      .then(async () => {
        await fsPromises.mkdir(path.dirname(this.filePath), { recursive: true })
        await fsPromises.writeFile(this.filePath, value)
      })
      .catch((error: unknown) => console.error('[Storage] FS write error', error))
  }
}
