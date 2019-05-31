import { promises as dns } from 'dns';
import https from 'https';
import fs from 'fs';

function request(params, post = '') {
  return new Promise((resolve, reject) => {
    const req = https.request(params, (res) => {
      const chunks = [];

      if(params.pipe) res.pipe(params.pipe);

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        let data = String(Buffer.concat(chunks));

        try { data = JSON.parse(data) }
        catch(e) {}

        resolve({ data, headers: res.headers });
      });
    });

    if(params.method == 'POST' && params.multipart) {
      const data = params.multipart;
      const names = Object.keys(data);
      const boundary = Math.random().toString(16);
      const body = renderMultipartBody(names, data, boundary);
      let length = 0;

      body.forEach((part) => length += Buffer.byteLength(part));

      names.forEach((name) => {
        if(data[name].value != undefined) {
          length += fs.statSync(data[name].value.path).size;
        }
      });

      req.setHeader('Content-Type', `multipart/form-data; boundary="${boundary}"`);
      req.setHeader('Content-Length', length + (16 * (names.length - 1)) + 8 + Buffer.byteLength(boundary));
      sendMultipartParts(boundary, body, data, names, req, 0);
    } else req.end(post);

    req.on('error', reject);
  });
}

function renderMultipartBody(names, data, boundary) {
  let body = [];

  names.forEach((name, i) => {
    if(data[name].value) {
      body[i] = `--${boundary}\r\n` +
                `Content-Type: ${data[name].contentType}\r\n` +
                `Content-Disposition: form-data; name="${name}"; filename="${data[name].filename}"\r\n` +
                'Content-Transfer-Encoding: binary\r\n\r\n'
    } else {
      body[i] = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${data[name]}`;
    }
  });

  return body;
}

function sendMultipartParts(boundary, body, data, names, req, i) {
  req.write(`\r\n${body[i]}`);

  function write() {
    if(names.length-2 >= i) {
      req.write(`\r\n--${boundary}`);
      sendMultipartParts(boundary, body, data, names, req, i+1);
    } else req.end(`\r\n--${boundary}--`);
  }

  if(data[names[i]].value) {
    data[names[i]].value.on('end', write).pipe(req, { end: false });
  } else write();
}

async function isConnected() {
  try { return !!(await dns.lookup('https://google.com')) }
  catch(e) { return false }
}

export default function(...data) {
  return new Promise(async (resolve, reject) => {
    let done = false;

    while(!done) {
      try {
        resolve(await request(...data));
        done = true;
      } catch(err) {
        if(!await isConnected()) {
          await new Promise((r) => setTimeout(r, 1500)); // Ждем 1.5 сек
        } else {
          reject(err);
          done = true;
        }
      }
    }
  });
}
