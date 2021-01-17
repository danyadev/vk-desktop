import fs from 'fs';

function genDate() {
  return new Date().toLocaleDateString();
}

function genTime(isFilename) {
  const date = new Date();
  const time = date.toLocaleTimeString();

  return isFilename
    ? time.replace(/:/g, '-')
    : time;
}

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const path = `logs/${genDate()} ${genTime(true)}.log`;
const fileDescriptor = fs.openSync(path, 'a');

export default function(...textChunks) {
  fs.appendFileSync(fileDescriptor, `[${genTime()}] ${textChunks.join('\n')}\n`);
}
