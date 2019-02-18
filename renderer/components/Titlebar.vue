<template>
  <div class="titlebar" :class="{ maximized, mac }">
    <div class="titlebar_drag" ref="drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div v-for="button of buttons"
           class="titlebar_button" :class="button"
           @click="click(button)">
        <img :src="`images/window_${button}.svg`"/>
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
      const win = getCurrentWindow();

      if(this.mac) {
        this.$refs.drag.addEventListener('dblclick', () => {
          if(win.isFullScreen()) return;
          if(win.isMaximized()) win.emit('unmaximize');
          else win.emit('maximize');
        });
      }

      win.on('maximize', () => this.maximized = true);
      win.on('unmaximize', () => this.maximized = false);
    }
  }
</script>
