<template>
  <div class="modals_container">
    <component v-for="modal in modals" :is="modal"></component>
  </div>
</template>

<script>
  let Bus = ModalCreator.Bus;

  module.exports = {
    data: () => ({
      modals: []
    }),
    created() {
      Bus.on('open', (name) => {
        this.modals.push(`modal-${name}`);
        qs('.root').classList.add('modal_opened');
      });

      Bus.on('close', () => {
        this.modals.pop();

        if(!this.modals.length) {
          qs('.root').classList.remove('modal_opened');
        }
      });
    }
  }
</script>
