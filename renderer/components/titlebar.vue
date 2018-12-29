<template>
  <div class="titlebar" :class="{ maximized, mac }">
    <div class="titlebar_drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div v-for="name in names"
           class="titlebar_button" :class="name"
           @click="getCurrentWindow()[name]()"></div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      mac: process.platform == 'darwin',
      maximized: getCurrentWindow().isMaximized(),
      names: ['minimize', 'maximize', 'restore', 'close']
    }),
    mounted() {
      if(this.mac) {
        qs('.titlebar_drag').addEventListener('dblclick', () => {
          if(getCurrentWindow().isFullScreen()) return;

          let type = getCurrentWindow().isMaximized() ? 'unmaximize' : 'maximize';
          getCurrentWindow().emit(type);
        });
      }

      getCurrentWindow().on('maximize', () => {
        this.maximized = true;
      });

      getCurrentWindow().on('unmaximize', () => {
        this.maximized = false;
      });
    }
  }
</script>
