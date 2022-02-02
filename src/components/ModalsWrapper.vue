<template>
  <div
    :class="['modals_container', { active: hasModals }]"
    tabindex="-1"
    @keydown.esc="onEscape"
  >
    <TransitionGroup name="modal">
      <div v-for="modal of modals" :key="modal.name" class="modal_wrap" @click.stop="onClickToBg">
        <component :is="modal.name" :data-name="modal.name" v-bind="modal.props" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { toRefs } from 'vue';
import { modalsState, closeModal } from 'js/modals';

const modalComponents = {};
const modalNames = [
  'BlockedAccount',
  'Captcha',
  'ClearHistory',
  'DeleteAccount',
  'DeleteMessages',
  'ErrorApi',
  'MarkAsSpam',
  'ReloadApp',
  'Settings'
];

for (const name of modalNames) {
  modalComponents[name] = require(`./modals/${name}.vue`).default;
}

export default {
  components: modalComponents,

  setup() {
    function onClickToBg({ target }) {
      if (!target.matches('.modal_wrap')) {
        return;
      }

      const [modal] = target.children;
      const header = modal.querySelector('.modal_header');

      if (!header || header.getAttribute('unclosable') === null) {
        closeModal(modal.dataset.name);
      }
    }

    function onEscape() {
      const keys = Object.keys(modalsState.modals);
      const name = keys[keys.length - 1];
      const header = document.querySelector(`.modal[data-name="${name}"] .modal_header`);

      if (!header || header.getAttribute('unclosable') === null) {
        closeModal(name);
      }
    }

    return {
      ...toRefs(modalsState),

      onClickToBg,
      onEscape
    };
  }
};
</script>

<style>
.modal-enter-active, .modal-leave-active {
  transition: opacity .3s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modals_container {
  position: absolute;
  top: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  visibility: hidden;
  transition: visibility .3s;
}

.modals_container.active {
  visibility: visible;
}

.modal_wrap {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, .4);
  z-index: 1;
}

.modal {
  overflow: hidden;
  max-width: 92vw;
  max-height: 92vh;
  background: var(--background);
  padding: 12px 24px;
  border-radius: 7px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .26);
}

.modal_header, .modal_content {
  user-select: text;
}

.modal_content {
  /* <modal-max-height> - <modal-header> - <modal-footer> */
  max-height: calc(92vh - 48px - 56px);
  padding: 12px 0;
  background: var(--background);
}

.modal_footer {
  padding-top: 8px;
}

.modal_footer .button {
  min-width: 100px;
  margin: 4px 0;
}

.modal_footer .button.right {
  float: right;
}

.modal_footer .button:not(.right):not(:first-child),
.modal_footer .button.right:not(:last-child) {
  margin-left: 8px;
}
</style>
