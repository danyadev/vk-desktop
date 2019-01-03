<template>
  <div class="modals_container">
    <div class="modal_wrap" v-for="modal in modals" :class="{ active: modal.active }" @click="closeModal">
      <component :is="`modal-${modal.name}`" :data="modal.data" :name="modal.name"></component>
    </div>
  </div>
</template>

<script>
  const { Bus } = require('./../js/lib/ModalCreator.js');

  module.exports = {
    data: () => ({
      modals: []
    }),
    methods: {
      closeModal(event) {
        let hasClose = !event.path.find((el) => el.classList && el.classList.contains('modal'));
        if(hasClose) Bus.emit('close', this.modals[this.modals.length - 1]);
      },
      updateModal(name, data) {
        let modal = this.modals.find((modal) => modal.name == name);
        Vue.set(this.modals, this.modals.length - 1, Object.assign({}, modal, data));
      }
    },
    created() {
      Bus.on('open', async (name, data = {}) => {
        this.modals.push({ name, data });
        setTimeout(() => this.updateModal(name, { active: true }), 200);
      });

      Bus.on('close', (name) => {
        this.updateModal(name, { active: false });

        setTimeout(() => {
          let modals = this.modals.reverse(),
              index = modals.findIndex((modal) => modal.name == name);

          modals.splice(index, 1);
          this.modals = modals;
        }, 200);
      });
    }
  }
</script>
