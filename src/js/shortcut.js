const pressedKeys = new Set();
// Предполагается, что одно и тоже сочетание клавиш будет обрабатываться один раз
const callbacks = new Map();

function getKeyName({ key, code }) {
  if(/^Key/.test(code)) return code.slice(3);
  else return key;
}

window.addEventListener('keydown', () => {
  pressedKeys.add(getKeyName(event));

  for(const [accelerator, callback] of callbacks) {
    if(accelerator.split('+').every((key) => pressedKeys.has(key))) {
      callback();
    }
  }
});

window.addEventListener('keyup', () => {
  pressedKeys.delete(getKeyName(event));
});

export default function(accelerators, callback) {
  for(const accelerator of accelerators) {
    callbacks.set(accelerator, callback);
  }

  return function() {
    for(const accelerator of accelerators) {
      callbacks.delete(accelerator);
    }
  };
}
