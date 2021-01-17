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

const path = `logs/${genDate()} ${genTime(true)}.log`;
const fileDescriptor = fs.openSync(path, 'a');

export default function(text) {
  fs.appendFileSync(fileDescriptor, `[${genTime()}] ${text}\n`);
}
