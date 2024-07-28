import { MessagesMessageAttachment } from 'model/api-types/objects/MessagesMessageAttachment'
import * as Attach from 'model/Attach'

export function fromApiAttaches(apiAttaches: MessagesMessageAttachment[]): Attach.Attaches {
  const attaches: Attach.Attaches = {}

  for (const apiAttach of apiAttaches) {
    const unknown = {
      kind: 'Unknown' as const,
      type: apiAttach.type,
      raw: apiAttach
    }
    attaches.unknown = [...(attaches.unknown ?? []), unknown]
  }

  return attaches
}
