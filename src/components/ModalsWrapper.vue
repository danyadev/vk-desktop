<template>
  <div :class="['modals_container', { active: hasModals }]">
    <transition-group name="modal">
      <div v-for="modal in modals" class="modal_wrap" :key="modal.name" @click.stop="closeModal">
        <component :is="`modal-${modal.name}`" :name="modal.name" :data="modal.data"/>
      </div>
    </transition-group>
  </div>
</template>

<script>
  import { EventBus } from 'js/utils';
  const ModalComponents = {};

  ['Captcha', 'Logout'].forEach((name) => {
    ModalComponents[`Modal${name}`] = require(`./modals/${name}.vue`).default;
  });

  export default {
    components: ModalComponents,
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
        const isModal = !path.find((el) => el.classList && el.classList.contains('modal'));
        const name = isModal && target.children[0] && target.children[0].attributes.name.value;
        const header = document.querySelector(`.modal[name="${name}"] .modal_header`);
        const closable = !header || header.attributes.closable.value;

        if(isModal && closable) EventBus.emit('modal:close', name);
      }
    },
    mounted() {
      EventBus.on('modal:open', (name, data = {}) => {
        this.$set(this.modals, name, { name, data });
      });

      EventBus.on('modal:close', (name) => {
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
