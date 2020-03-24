import { promises as dns } from 'dns';
import https from 'https';
import { timer } from './utils';

function request(requestParams, params = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(requestParams, (res) => {
      const chunks = [];
      const MB = 1 << 20;
      const contentLength = +res.headers['content-length'];
      let loadedLength = 0;

      if (params.pipe) {
        res.pipe(params.pipe);
      }

      res.on('data', (chunk) => {
        if (!params.pipe) {
          chunks.push(chunk);
        }

        if (typeof params.progress === 'function') {
          loadedLength += chunk.length;

          params.progress({
            // Размер файла в МБ
            size: contentLength / MB,
            // Сколько МБ уже скачалось
            downloaded: loadedLength / MB,
            // Сколько МБ уже скачалось в процентах
            progress: (loadedLength / contentLength) * 100
          });
        }
      });

      res.on('end', () => {
        let data = String(Buffer.concat(chunks));

        if (!params.raw) {
          data = JSON.parse(data);
        }

        resolve({
          data,
          headers: res.headers,
          statusCode: res.statusCode
        });
      });
    });

    req.on('error', reject);

    if (params.timeout) {
      req.setTimeout(params.timeout, req.abort);
    }

    if (params.multipart) {
      sendMultipart(req, params.multipart);
    } else {
      req.end(params.postData || '');
    }
  });
}

// multipart: {
//   photo: {
//     value: fs.createReadStream(pathToFile),
//     filename: 'photo.png',
//     contentType: 'image/png'
//   }
// }
async function sendMultipart(req, files) {
  const names = Object.keys(files);
  const boundary = Math.random().toString(16);

  req.setHeader('Content-Type', `multipart/form-data; boundary="${boundary}"`);

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const file = files[name];
    const body = `--${boundary}\r\n`
               + `Content-Type: ${file.contentType}\r\n`
               + `Content-Disposition: form-data; name="${name}"; filename="${file.filename}"\r\n`
               + 'Content-Transfer-Encoding: binary\r\n\r\n';

    req.write(`\r\n${body}`);

    await new Promise((resolve) => {
      file.value
        .pipe(req, { end: false })
        .on('end', () => {
          if (i !== names.length - 1) {
            req.write(`\r\n--${boundary}`);
          } else {
            req.end(`\r\n--${boundary}--`);
          }

          resolve();
        });
    });
  }
}

// Промис сохраняется для того, чтобы при дальнейших вызовах request
// не создавался новый промис, а ожидалось завершение созданного ранее
let waitConnectionPromise;

async function waitConnection() {
  while (true) {
    try {
      await dns.lookup('api.vk.com');
      waitConnectionPromise = null;
      break;
    } catch (err) {
      if (!navigator.onLine) {
        await new Promise((resolve) => {
          window.addEventListener('online', resolve, { once: true });
        });
      } else {
        await timer(5000);
      }
    }
  }
}

export default async function(...data) {
  while (true) {
    try {
      return await request(...data);
    } catch (err) {
      if (!waitConnectionPromise) {
        waitConnectionPromise = waitConnection();
      }

      await waitConnectionPromise;
    }
  }
}
