<template>
  <div class="modals_container">
    <div class="modal_wrap" :class="{ active: modal.active }"
         v-for="(modal, id) in modals" @click.stop="closeModal">
      <component :is="`modal-${modal.name}`"
                 :data="modal.data"
                 :key="id" :data-key="id"
                 :name="modal.name"></component>
    </div>
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
      closeModal(event) {
        let hasClose = !event.path.find((el) => el.classList && el.classList.contains('modal')),
            key = event.target.children[0] && event.target.children[0].dataset.key;

        if(key == undefined) return;

        if(hasClose) {
          let modal = this.modals[key],
              header = qs(`.modal[data-key="${key}"] .modal_header`),
              closable = modal.closable || !header || header.dataset.closable;

          if(closable) Bus.emit('close', key);
        }
      },
      updateModal(key, data) {
        let modal = this.modals[key];

        if(modal) Vue.set(this.modals, key, Object.assign({}, modal, data));
      }
    },
    created() {
      Bus.on('open', (name, data = {}) => {
        Vue.set(this.modals, this.id++, { name, data });

        setTimeout(() => this.updateModal(this.id-1, { active: true }), 0);
      });

      Bus.on('close', (key) => {
        this.updateModal(key, { active: false });

        setTimeout(() => Vue.delete(this.modals, key), 100);
      });
    }
  }
</script>
