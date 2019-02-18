<template>
  <div class="toast_wrap">
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script>
  const { Bus } = require('./../js/lib/ModalCreator.js');

  module.exports = {
    data: () => ({
      toasts: [],
      toast: null
    }),
    methods: {
      async openToast(text) {
        if(text) this.toasts.push(text);
        if(this.toast) return;

        this.toast = this.toasts[0];
        await utils.timer(3000);
        this.toasts.shift();
        this.toast = null;

        setTimeout(this.openToast, 500);
      }
    },
    mounted() {
      Bus.on('toast', this.openToast);
    }
  }
</script>
