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
    'Auth',
    'ClearHistory',
    'UpdateAvailable'
  ];

  for(const name of modalNames) {
    modalComponents[`Modal${name}`] = require(`./modals/${name}.vue`).default;
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
        const name = modal.getAttribute('name');
        const closable = modal.querySelector('.modal_header').getAttribute('closable');

        if(closable) eventBus.emit('modal:close', name);
      },
      onEscape() {
        const keys = Object.keys(this.modals);

        if(keys.length) eventBus.emit('modal:close', keys[keys.length-1]);
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
    top: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: calc(100% - 32px);
    background: rgba(0, 0, 0, .4);
    z-index: 1;
  }

  .modal {
    position: absolute;
    max-width: 92vw;
    max-height: 92vh;
    border-radius: 7px;
    background: #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, .26);
  }

  .modal_content {
    /* <modal-max-height> - <titlebar> - <modal-header> - <modal-footer> */
    max-height: calc(92vh - 32px - 48px - 56px);
  }

  .modal_footer {
    height: 56px;
    border-top: 1px solid #e7e8ec;
    background: #f7f8fa;
    border-radius: 0 0 5px 5px;
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

  .modal_footer .button.light {
    background: #e4e9ef;
  }

  .modal_footer .button.right {
    float: right;
  }

  .modal_footer .button.right:first-child {
    margin-right: 10px;
  }
</style>
