import { isObject } from './utils';

function processCopy(value) {
  if (isObject(value)) {
    return copyObject(value);
  } else if (Array.isArray(value)) {
    return copyArray(value);
  }

  return value;
}

function copyArray(arr) {
  const newArr = [];

  for (let i = 0; i < arr.length; i++) {
    newArr.push(processCopy(arr[i]));
  }

  return newArr;
}

export default function copyObject(obj) {
  const newObj = {};

  for (const key in obj) {
    newObj[key] = processCopy(obj[key]);
  }

  return newObj;
}
