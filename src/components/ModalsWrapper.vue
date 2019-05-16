<template>
  <div :class="['modals_container', { active: hasModals }]" tabindex="0" @keydown.esc="onEscape">
    <TransitionGroup name="modal">
      <div v-for="modal in modals" :key="modal.name" class="modal_wrap" @click.stop="closeModal">
        <Component :is="`modal-${modal.name}`" :name="modal.name" :data="modal.data"/>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
  import { eventBus } from 'js/utils';

  const modalComponents = {};
  const modalNames = [
    'Captcha',
    'Logout',
    'BlockedAccount',
    'Multiaccount',
    'Auth'
  ];

  modalNames.forEach((name) => {
    modalComponents[`Modal${name}`] = require(`./modals/${name}.vue`).default;
  });

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
        const name = modal.getAttribute('name');
        const closable = modal.querySelector('.modal_header').getAttribute('closable');

        if(closable) eventBus.emit('modal:close', name);
      },
      onEscape() {
        const keys = Object.keys(this.modals);

        if(keys) eventBus.emit('modal:close', keys[keys.length-1]);
      }
    },
    mounted() {
      eventBus.on('modal:open', (name, data = {}) => {
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
    z-index: 6;
    width: 100%;
    height: 100%;
    visibility: hidden;
    transition: visibility .3s;
  }

  .modals_container.active { visibility: visible }

  .modal_wrap {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .4);
    z-index: 100;
  }

  .modal {
    position: absolute;
    max-width: 95%;
    max-height: 95%;
    border-radius: 7px;
    background-color: #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, .26);
  }

  .modal_footer {
    height: 56px;
    border-top: 1px solid #e7e8ec;
    background-color: #f7f8fa;
    border-radius: 0 0 5px 5px;
  }

  .modal_footer .button,
  .modal_footer .light_button {
    min-width: 110px;
    margin: 9px 5px;
  }

  .modal_footer .light_button {
    background-color: #e4e9ef;
  }

  .modal_footer .button.right:first-child,
  .modal_footer .light_button.right:first-child {
    margin-right: 10px;
  }

  .modal_footer .button.right,
  .modal_footer .light_button.right { float: right }
</style>
