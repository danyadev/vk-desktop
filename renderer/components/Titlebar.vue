<template>
  <div class="titlebar" :class="{ maximized, mac }">
    <div class="titlebar_drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div v-for="button of buttons"
           class="titlebar_button" :class="button"
           @click="click(button)">
        <img :src="`images/window_${button}.svg`">
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      mac: process.platform == 'darwin',
      maximized: getCurrentWindow().isMaximized(),
      buttons: ['minimize', 'maximize', 'restore', 'close']
    }),
    methods: {
      click(button) {
        getCurrentWindow()[button]();
      }
    },
    mounted() {
      if (this.mac) {
        qs('.titlebar_drag').addEventListener('dblclick', () => {
          if (getCurrentWindow().isFullScreen()) return;

          let type = getCurrentWindow().isMaximized() ? 'unmaximize' : 'maximize';
          getCurrentWindow()[type]();
        });
        getCurrentWindow().on('enter-full-screen', () => this.maximized = true);
        getCurrentWindow().on('leave-full-screen', () => this.maximized = false);
      } else {
        getCurrentWindow().on('maximize', () => this.maximized = true);
        getCurrentWindow().on('unmaximize', () => this.maximized = false);
      }
    }
  }
</script>
