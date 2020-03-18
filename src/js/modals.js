import { reactive, computed } from 'vue';

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

export function closeModal(name) {
  delete modalsState.modals[name];
}
