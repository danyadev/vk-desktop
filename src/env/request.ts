import https from 'https'
import type { ClientRequest, IncomingMessage } from 'http'
import type { ReadStream } from 'fs'

type Params = https.RequestOptions & {
  url?: string
}

// photo: {
//   value: fs.createReadStream(pathToFile),
//   filename: 'photo.png',
//   contentType: 'image/png'
// }
type FormData = Record<string, {
  value: ReadStream
  filename: string
  contentType: string
}>

type Options = {
  timeout?: number
  body?: string
  formData?: FormData
  progress?: (size: number, downloaded: number, progress: number) => void
  pipe?: NodeJS.WritableStream
}

export function request(params: string | Params, options: Options = {}) {
  return new Promise((resolve, reject) => {
    function handleRequest(response: IncomingMessage) {
      const chunks: Uint8Array[] = []
      const MB = 1 << 20
      const contentLength = +(response.headers['content-length'] || 0)
      let loadedLength = 0

      if (options.pipe) {
        response.pipe(options.pipe)
      }

      response.on('data', (chunk: Uint8Array) => {
        if (!options.pipe) {
          chunks.push(chunk)
        }

        if (options.progress) {
          loadedLength += chunk.length

          options.progress(
            contentLength / MB,
            loadedLength / MB,
            (loadedLength / contentLength) * 100
          )
        }
      })

      response.on('end', () => {
        if (!response.complete) {
          return reject({
            code: 'ENOTCOMPLETED',
            reason: 'request not completed'
          })
        }

        resolve({
          data: String(Buffer.concat(chunks)),
          headers: response.headers,
          statusCode: response.statusCode
        })
      })
    }

    const request = typeof params === 'string' || !params.url
      ? https.request(params, handleRequest)
      : https.request(params.url, params, handleRequest)

    request.on('error', reject)

    request.setTimeout(options.timeout || 10000, () => request.destroy())

    if (options.formData) {
      sendFormData(request, options.formData)
    } else {
      request.end(options.body || '')
    }
  })
}

async function sendFormData(request: ClientRequest, files: FormData) {
  const names = Object.keys(files)
  const boundary = Math.random().toString(16)

  request.setHeader('Content-Type', `multipart/form-data; boundary="${boundary}"`)

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const file = files[name]
    const body = `--${boundary}\n`
      + `Content-Type: ${file.contentType}\n`
      + `Content-Disposition: form-data; name="${name}"; filename="${file.filename}"\n`
      + 'Content-Transfer-Encoding: binary\n\n'

    request.write(`\n${body}`)

    await new Promise<void>((resolve) => {
      file.value
        .pipe(request, { end: false })
        .on('end', () => {
          if (i === names.length - 1) {
            request.end(`\n--${boundary}--`)
          } else {
            request.write(`\n--${boundary}`)
          }

          resolve()
        })
    })
  }
}
