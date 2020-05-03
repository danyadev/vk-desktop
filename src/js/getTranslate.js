import store from './store';

// Возвращает индекс массива, который соответствует склонению падежа числительных
// Пример массива: ['рубль', 'рубля', 'рублей']
// Пример ответов: fn(1) = 0; fn(2) = 1; fn(5) = 2;
function caseOfNumber(count) {
  const lastDigits = Math.abs(count) % 100;
  const lastDigit = lastDigits % 10;

  if (lastDigits > 10 && lastDigits < 20) return 2;
  if (lastDigit > 1 && lastDigit < 5) return 1;
  if (lastDigit === 1) return 0;

  return 2;
}

// name<string>: название перевода
// key?<string|number|boolean>: ключ перевода
// replaces?<array>: массив данных, которые вставляются в тексте вместо {index}
// number?<number>: число, передающееся в caseOfNumber, результатом которого является ключ перевода
//
// Список переводов:
// text: 'текст'
// dynamicText: 'текст {0} и {1}'
// array: ['текст 1', 'текст 2']
// dynamicArray: ['текст {0}', 'число {0}']
// caseOfNumber: ['яблоко', '{0} яблока', '{0} яблок']
// object: { a: 'а {0}', b: 'б {0}' }
// objectAndArray: { apple: ['яблоко', '{0} яблока', '{0} яблок'] }
//
// Примеры:
// 1) fn('text'): 'текст'
// 2) fn('dynamicText', [12, 34]): 'текст 12 и 34'
// 3) fn('array', 1): 'текст 2'
// 4) fn('dynamicArray', 0, [1]): 'текст 1'
// 5) fn('array', false): 'текст 1'
// 6) fn('array', true): 'текст 2'
// 7) fn('caseOfNumber', [1], 1): 'яблоко'
// 8) fn('caseOfNumber', [2], 2): '2 яблока'
// 9) fn('caseOfNumber', [5], 5): '5 яблок'
// 10) fn('object', 'b', ['тест']): 'б тест'
// 11) fn('objectAndArray', 'apple', [3], 3): '3 яблока'
export default function(name, key, replaces, number) {
  if (Array.isArray(key)) {
    number = replaces;
    replaces = key;
    key = null;
  }

  let data = store.getters['settings/lang'][name];

  if (typeof key === 'boolean') key = key ? 1 : 0;
  if (key != null) data = data[key];
  if (number != null && data) data = data[caseOfNumber(number)];
  if (!data) return data;

  if (Array.isArray(replaces)) {
    for (let i = 0; i < replaces.length; i++) {
      data = data.replace(new RegExp(`\\{${i}\\}`, 'g'), replaces[i]);
    }
  }

  return data;
}
