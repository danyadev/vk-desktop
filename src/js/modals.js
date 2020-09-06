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
  if (!name) {
    const allNames = Object.keys(modalsState.modals);
    name = allNames[allNames.length - 1];
  }

  delete modalsState.modals[name];
}
