<template>
  <div :class="['modals_container', { active: hasModals }]" tabindex="0" @keydown.esc="onEscape">
    <TransitionGroup name="modal">
      <div v-for="modal in modals" :key="modal.name" class="modal_wrap" @click.stop="closeModal">
        <Component :is="modal.name" :name="modal.name" v-bind="modal.data" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
  import { eventBus } from 'js/utils';

  const modalComponents = {};
  const modalNames = [
    'Auth',
    'BlockedAccount',
    'Captcha',
    'ClearHistory',
    'ErrorApi',
    'Logout',
    'MediaViewer',
    'MessagesViewer',
    'Multiaccount',
    'UpdateAvailable'
  ];

  for(const name of modalNames) {
    modalComponents[name] = require(`./modals/${name}.vue`).default;
  }

  export default {
    components: modalComponents,

    data: () => ({
      modals: {}
    }),

    computed: {
      hasModals() {
        return !!Object.keys(this.modals).length;
      }
    },

    methods: {
      closeModal({ path, target }) {
        if(!target.matches('.modal_wrap')) return;

        const [modal] = target.children;
        const header = modal.querySelector('.modal_header');

        if(!header || header.getAttribute('closable')) {
          eventBus.emit('modal:close', modal.getAttribute('name'));
        }
      },

      onEscape() {
        const keys = Object.keys(this.modals);
        const name = keys[keys.length - 1];
        const header = document.querySelector(`.modal[name="${name}"] .modal_header`);

        if(header.getAttribute('closable')) {
          eventBus.emit('modal:close', name);
        }
      }
    },

    watch: {
      hasModals(value) {
        this.$modals.hasModals = value;
      }
    },

    mounted() {
      eventBus.on('modal:open', (name, data) => {
        this.$set(this.modals, name, { name, data });
      });

      eventBus.on('modal:close', (name) => {
        this.$delete(this.modals, name);
      });
    }
  }
</script>

<style>
  .modal-enter-active, .modal-leave-active {
    transition: opacity .3s;
  }

  .modal-enter, .modal-leave-to {
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
    position: absolute;
    overflow: hidden;
    max-width: 92vw;
    max-height: 92vh;
    border-radius: 7px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, .26);
  }

  .modal_content {
    /* <modal-max-height> - <modal-header> - <modal-footer> */
    max-height: calc(92vh - 48px - 56px);
    background: var(--background-content);
  }

  .modal_footer {
    height: 56px;
    border-top: 1px solid var(--input-border);
    background: var(--header-footer);
  }

  .modal_footer .button {
    min-width: 110px;
    margin: 9px 5px;
  }

  .modal_footer .button.left:first-child {
    margin-left: 9px;
  }

  .modal_footer .button.right:last-child {
    margin-right: 9px;
  }

  .modal_footer .button.right {
    float: right;
  }

  .modal_footer .button.right:first-child {
    margin-right: 10px;
  }
</style>
