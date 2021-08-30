import { promises as dns } from 'dns';
import https from 'https';
import { timer, isObject } from './utils';
import debug from './debug';

// Возможные варианты передачи параметров:
// 1. request(paramsOrUrl, options?)
// 2. request(url, params, options)
// 3. request(url, params, {})
// т.е. при наличии params обязательно наличие и options,
// а так же первый аргумент должен быть строкой
function request(paramsOrUrl, paramsOrOptions = {}, options) {
  if (!options) {
    options = paramsOrOptions;
    paramsOrOptions = {};
  }

  return new Promise((resolve, reject) => {
    function handleRequest(res) {
      const chunks = [];
      const MB = 1 << 20;
      const contentLength = +res.headers['content-length'];
      let loadedLength = 0;

      if (options.pipe) {
        res.pipe(options.pipe);
      }

      res.on('data', (chunk) => {
        if (!options.pipe) {
          chunks.push(chunk);
        }

        if (options.progress) {
          loadedLength += chunk.length;

          options.progress({
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
        if (!res.complete) {
          return reject({
            code: 'ETIMEDOUT',
            reason: 'request not completed'
          });
        }

        const raw = String(Buffer.concat(chunks));
        let data = raw;

        if (!options.raw) {
          try {
            data = JSON.parse(raw);
          } catch (err) {
            debug('[request] JSON parse error', raw);
            return reject(err);
          }
        }

        resolve({
          data,
          headers: res.headers,
          statusCode: res.statusCode
        });
      });
    }

    const req = isObject(paramsOrUrl)
      ? https.request(paramsOrUrl, handleRequest)
      : https.request(paramsOrUrl, paramsOrOptions, handleRequest);

    req.on('error', reject);

    req.setTimeout(options.timeout || 6000, req.destroy);

    if (options.multipart) {
      sendMultipart(req, options.multipart);
    } else {
      req.end(options.body || '');
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
        .on('end', () => {
          if (i === names.length - 1) {
            req.end(`\r\n--${boundary}--`);
          } else {
            req.write(`\r\n--${boundary}`);
          }

          resolve();
        })
        .pipe(req, { end: false });
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
    } catch {
      if (navigator.onLine) {
        await timer(5000);
      } else {
        await new Promise((resolve) => {
          window.addEventListener('online', resolve, { once: true });
        });
      }
    }
  }
}

const NETWORK_ERROR_CODES = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'ENETUNREACH',
  'ECONNABORTED',
  'EAI_AGAIN',
  'EHOSTUNREACH'
];

export default async function(...data) {
  while (true) {
    try {
      return await request(...data);
    } catch (err) {
      // Нужно получить только основную информацию о запросе, параметры не нужны
      const debugData = data.length === 3
        ? [data[0], data[2]]
        : [data[0]];

      debug(`[request] error: ${err.code}`, err, JSON.stringify(debugData));

      // Если ошибка не относится к проблемам с сетью, то выкидываем ошибку
      if (!NETWORK_ERROR_CODES.includes(err.code)) {
        throw err;
      }

      // ENOTFOUND сильно флудит запросами за счет
      // - моментального ответа при попытке подключиться к серверу
      // - моментального пинга (waitConnectionPromise)
      // Во время "приступа" за 30 секунд может быть сделано несколько тысяч запросов
      if (err.code === 'ENOTFOUND') {
        await timer(5000);
      }

      if (!waitConnectionPromise) {
        waitConnectionPromise = waitConnection();
      }

      debug('[request] start: waitConnection');
      await waitConnectionPromise;
      debug('[request] end: waitConnection');
    }
  }
}
