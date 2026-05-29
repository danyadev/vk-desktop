import * as IApi from 'services/contracts/IApi'
import * as Peer from 'model/Peer'

type UploadPhotoToServerResponse = {
  server: number
  photo: string
  hash: string
}

export class Uploader {
  constructor(private api: IApi.Api) {}

  async uploadPhoto(
    file: File,
    peerId: Peer.Id,
    onProgress: (progress: number) => void,
    signal?: AbortSignal
  ) {
    const uploadServer = await this.api.fetch('photos.getMessagesUploadServer', {
      peer_id: peerId
    }, { signal })

    const uploadResponse = await this.uploadWithProgress<UploadPhotoToServerResponse>(
      uploadServer.upload_url,
      file,
      onProgress,
      signal
    )

    const [photo] = await this.api.fetch('photos.saveMessagesPhoto', uploadResponse, { signal })
    if (!photo) {
      throw new Error('photo save failed')
    }
    return photo
  }

  private uploadWithProgress<T>(
    url: string,
    file: File,
    onProgress: (progress: number) => void,
    signal?: AbortSignal
  ) {
    const BOUNDARY = 'chikibamboni'
    const encoder = new TextEncoder()

    const headerChunk = encoder.encode(
      `--${BOUNDARY}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type}\r\n\r\n`
    )
    const footerChunk = encoder.encode(`\r\n--${BOUNDARY}--\r\n`)

    const bodySize = headerChunk.byteLength + file.size + footerChunk.byteLength
    let bytesConsumed = 0

    const multipartTransform = new TransformStream<Uint8Array, Uint8Array>({
      start(controller) {
        controller.enqueue(headerChunk)
        bytesConsumed += headerChunk.byteLength
        onProgress(bytesConsumed / bodySize)
      },
      transform(chunk, controller) {
        controller.enqueue(chunk)
        bytesConsumed += chunk.byteLength
        onProgress(bytesConsumed / bodySize)
      },
      flush(controller) {
        controller.enqueue(footerChunk)
        bytesConsumed += footerChunk.byteLength
        onProgress(bytesConsumed / bodySize)
      }
    })

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${BOUNDARY}` },
      body: file.stream().pipeThrough(multipartTransform, { signal }),
      // @ts-expect-error поле duplex пока не завезли в тс
      duplex: 'half',
      signal
    }).then<T>((res) => res.json())
  }
}
