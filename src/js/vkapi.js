import { DesktopUserAgent } from './user-agent';
import querystring from 'querystring';
import request from './request';

export const version = '5.92';

function vkapi(name, params = {}) {
  return new Promise(async (resolve, reject) => {
    console.log('[VKAPI] execute:', name, params);

    params.lang = 'ru';
    params.v = params.v || version;

    let { data } = await request({
      host: 'api.vk.com',
      path: `/method/${name}`,
      method: 'POST',
      headers: {
        'User-Agent': DesktopUserAgent
      }
    }, querystring.stringify(params));

    if(data.response !== undefined) resolve(data.response);
    else reject(data);
  });
}

let methods = [],
    inWork = false;

async function executeMethod() {
  let { data, resolve, reject } = methods[0];
  inWork = true;

  try {
    resolve(await vkapi(...data));
  } catch(err) {
    console.warn('[VKAPI] error', err);
  }

  methods.shift();
  if(methods.length) executeMethod();
  else inWork = false;
}

export default function(...data) {
  return new Promise((resolve, reject) => {
    methods.push({ data, resolve, reject });
    if(methods.length == 1 && !inWork) executeMethod();
  });
}
