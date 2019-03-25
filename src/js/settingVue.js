import Vue from 'vue';
import emoji from './emoji';
import { regexp } from './utils';

Vue.config.productionTip = false;

Vue.directive('emoji', (el, { value = '', modifiers }) => {
  if(!modifiers.br) value = value.replace(/<br>/g, ' ');
  if(modifiers.push) value = value.replace(regexp.push, '$3');
  if(el.innerHTML != value) el.innerHTML = emoji(value);
});

Vue.prototype.l = function(name, key, replaces, number) {
  if(Array.isArray(key)) {
    number = replaces;
    replaces = key;
    key = null;
  }

  if(typeof key == 'boolean') key = key ? 1 : 0;
  if(number != undefined) key = getWordEnding(number);

  let data = this.$store.getters['settings/lang'][name];
  if(![null, undefined].includes(key)) data = data[key];

  if(Array.isArray(replaces)) {
    for(let i in replaces) {
      let regexp = new RegExp(`\\{${i}\\}`, 'g');

      data = String(data).replace(regexp, replaces[i]);
    }
  }

  return data;
}
