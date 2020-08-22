import { reactive, computed } from 'vue';
import { lastItem } from './utils';

export const modalsState = reactive({
  modals: {},
  hasModals: computed(() => !!Object.keys(modalsState.modals).length)
});

export function openModal(name, props) {
  modalsState.modals[name] = {
    name,
    props
  };
}

export function closeModal(name = lastItem(Object.keys(modalsState.modals))) {
  delete modalsState.modals[name];
}
