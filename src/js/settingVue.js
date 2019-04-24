import Vue from 'vue';
import emoji from './emoji';
import { regexp, EventBus } from './utils';
import getTranslate from './getTranslate';

Vue.config.productionTip = false;

Vue.directive('emoji', (el, { value = '', modifiers }) => {
  if(!modifiers.br) value = value.replace(/<br>/g, ' ');
  if(modifiers.push) value = value.replace(regexp.push, '$3');
  if(el.innerHTML != value) el.innerHTML = emoji(value);
});

Vue.prototype.l = getTranslate;

Vue.prototype.$modal = {
  open(name, params) {
    EventBus.emit('modal:open', name, params);
  },
  close(name) {
    EventBus.emit('modal:close', name);
  }
}
