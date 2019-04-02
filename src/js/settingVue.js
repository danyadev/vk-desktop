import Vue from 'vue';
import emoji from './emoji';
import { regexp } from './utils';
import getTranslate from './getTranslate';

Vue.config.productionTip = false;

Vue.directive('emoji', (el, { value = '', modifiers }) => {
  if(!modifiers.br) value = value.replace(/<br>/g, ' ');
  if(modifiers.push) value = value.replace(regexp.push, '$3');
  if(el.innerHTML != value) el.innerHTML = emoji(value);
});

function nWord(count) {
  let num1 = Math.abs(count) % 100,
      num2 = num1 % 10;

  if(num1 > 10 && num1 < 20) return 2;
  if(num2 > 1 && num2 < 5) return 1;
  if(num2 == 1) return 0;

  return 2;
}

Vue.prototype.l = getTranslate;
