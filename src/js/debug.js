import fs from 'fs';
import os from 'os';
import path from 'path';
import electron from 'electron';
import request from './request';
import store from './store';
import getTranslate from './getTranslate';
import { format } from 'js/date/utils';

const { app, dialog } = electron.remote;
const appName = 'vk-desktop';
const logsPath = getLibraryDefaultDir();

if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

const logName = `${format(new Date(), 'dd.MM.yyyy')} ${format(new Date(), 'hh-mm-ss')}.log`;
const logPath = path.join(logsPath, logName);
const fileDescriptor = fs.openSync(logPath, 'a+');

export default function debug(...textChunks) {
  const time = format(new Date(), 'hh:mm:ss');
  fs.appendFileSync(fileDescriptor, `[${time}] ${textChunks.join('\n')}\n`);
}

// =================

export async function showError(error) {
  let type = error.type === 'error' ? 'UncaughtError' : 'UnhandledRejection';
  let message;

  if (error.error) {
    if (error.error.stack) {
      type = error.error.name;
      message = error.error.stack;
    } else {
      message = typeof error.error === 'string'
        ? error.error
        : JSON.stringify(error.error, null, 2);

      if (error.filename) {
        message += `\n\nfrom ${error.filename}:${error.lineno}:${error.colno}`;
      }
    }
  } else if (error.reason) {
    if (error.reason.stack) {
      message = error.reason.stack;
      type = error.reason.name;
    } else {
      message = JSON.stringify(error.reason);
    }
  } else {
    message = error.message;
  }

  debug(`[${type}] ${message}`);

  const { response } = await dialog.showMessageBox({
    type: 'error',
    title: getTranslate('error_dialog_title'),
    message: getTranslate('error_dialog_message'),
    detail: message,
    cancelId: 1,

    buttons: ['Отправить отчет', 'Закрыть']
  });

  if (response === 0) {
    const title = encodeURIComponent(message.split('\n')[0]);
    const encodedMessage = encodeURIComponent(message || 'empty');
    const user_id = store.state.users.activeUserID || -1;

    request({
      host: API_HOST,
      path: `/sendLogs?title=${title}&message=${encodedMessage}&user_id=${user_id}`,
      method: 'POST'
    }, {
      multipart: {
        logs: {
          value: fs.createReadStream(logPath),
          filename: logName,
          contentType: 'text/plain'
        }
      }
    });
  }
}

if (!DEV_MODE) {
  window.addEventListener('error', showError);
  window.addEventListener('unhandledrejection', showError);
}

// =================

function getLibraryDefaultDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Logs', appName);
  }

  return path.join(getUserData(), 'logs');
}

function getUserData() {
  if (app.name !== appName) {
    return path.join(app.getPath('appData'), appName);
  }

  return app.getPath('userData') || path.join(app.getPath('appData'), appName);
}
