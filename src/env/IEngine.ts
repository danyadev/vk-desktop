export type Response =
  | { ts: number, pts: number, updates: Update[] }
  // ts слишком маленький (отстал на 256+ событий) или слишком большой
  | { failed: 1, ts: number }
  // Протух key, нужно получить новый через messages.getLongPollServer
  | { failed: 2, error: string }
  // Указана неверная версия движка
  | { failed: 4, min_version: number, max_version: number }

type Update = unknown