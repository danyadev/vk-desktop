<template>
  <div class="modals_container">
    <component v-for="modal in modals" :is="modal.name" :data="modal.data"></component>
  </div>
</template>

<script>
  const { Bus } = require('./../js/lib/ModalCreator.js');

  module.exports = {
    data: () => ({
      modals: []
    }),
    created() {
      Bus.on('open', (name, data = {}) => {
        this.modals.push({
          name: `modal-${name}`,
          data: data
        });

        qs('.modals_container').classList.add('modal_opened');
      });

      Bus.on('close', () => {
        this.modals.pop();

        if(!this.modals.length) {
          qs('.modals_container').classList.remove('modal_opened');
        }
      });
    }
  }
</script>
