<template>
  <div class="modals_container" :class="{ active: Object.keys(modals).length }">
    <transition-group name="modal">
      <div class="modal_wrap" v-for="(modal, id) in modals" :key="id" @click.stop="closeModal">
        <component :is="`modal-${modal.name}`" :data-key="id"
                   :name="modal.name" :data="modal.data"
        ></component>
      </div>
    </transition-group>
  </div>
</template>

<script>
  const { Bus } = require('./../js/lib/ModalCreator.js');

  module.exports = {
    data: () => ({
      modals: {},
      id: 0
    }),
    methods: {
      closeModal({ path, target }) {
        let hasClose = !path.find((el) => el.classList && el.classList.contains('modal')),
            key = target.children[0] && target.children[0].dataset.key;

        if(hasClose) {
          let modal = this.modals[key],
              header = qs(`.modal[data-key="${key}"] .modal_header`),
              closable = modal.closable || !header || header.dataset.closable;

          if(closable) Bus.emit('close', key);
        }
      }
    },
    created() {
      Bus.on('open', (name, data = {}) => {
        Vue.set(this.modals, this.id++, { name, data });
      });

      Bus.on('close', (key) => {
        Vue.delete(this.modals, key);
      });
    }
  }
</script>
