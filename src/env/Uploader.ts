import * as IApi from 'env/IApi'
import * as Peer from 'model/Peer'

type UploadPhotoToServerResponse = {
  server: number
  photo: string
  hash: string
}

export class Uploader {
  constructor(private api: IApi.Api) {}

  async uploadPhoto(file: File, peerId: Peer.Id, onProgress: (progress: number) => void) {
    const uploadServer = await this.api.fetch('photos.getMessagesUploadServer', {
      peer_id: peerId
    })

    const uploadResponse = await this.uploadWithProgress<UploadPhotoToServerResponse>(
      uploadServer.upload_url,
      file,
      onProgress
    )

    const [photo] = await this.api.fetch('photos.saveMessagesPhoto', uploadResponse)
    if (!photo) {
      throw new Error('photo save failed')
    }
    return photo
  }

  isPhotoFile(file: File) {
    return ['image/png', 'image/jpeg', 'image/gif'].includes(file.type)
  }

  uploadWithProgress<T>(url: string, file: File, onProgress: (progress: number) => void) {
    const BOUNDARY = 'chikibamboni'
    let bytesUploaded = 0
    let bodySize = file.size
    const encoder = new TextEncoder()

    const multipartStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const headerChunk = encoder.encode(
          `--${BOUNDARY}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
          `Content-Type: ${file.type}\r\n\r\n`
        )
        controller.enqueue(headerChunk)
        bodySize += headerChunk.byteLength

        const reader = file.stream().getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }
          controller.enqueue(value)
        }

        const footerChunk = encoder.encode(`\r\n--${BOUNDARY}--\r\n`)
        controller.enqueue(footerChunk)
        bodySize += footerChunk.byteLength

        controller.close()
      }
    })

    const progressTrackingStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesUploaded += chunk.byteLength
        onProgress(bytesUploaded / bodySize)
        controller.enqueue(chunk)
      }
    })

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${BOUNDARY}` },
      body: multipartStream.pipeThrough(progressTrackingStream),
      // @ts-expect-error поле duplex пока не завезли в тс
      duplex: 'half'
    }).then<T>((res) => res.json())
  }
}
