<template>
  <div class="titlebar" :class="{ maximized: isMaximized, mac: isMac }">
    <div class="titlebar_drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div v-for="name in names"
           :class="name"
           @click="getCurrentWindow()[name]()"
           class="titlebar_button">
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      isMac: process.platform == 'darwin',
      isMaximized: false,
      names: ['minimize', 'maximize', 'restore', 'close']
    }),
    mounted: function() {
      if(this.isMac) {
        qs('.titlebar_drag').addEventListener('dblclick', () => {
          if(getCurrentWindow().isFullScreen()) return;

          getCurrentWindow().emit(getCurrentWindow().isMaximized() ? 'unmaximize' : 'maximize');
        });
      }

      getCurrentWindow().on('maximize', () => this.isMaximized = true);
      getCurrentWindow().on('unmaximize', () => this.isMaximized = false);
      getCurrentWindow().emit(getCurrentWindow().isMaximized() ? 'maximize' : 'unmaximize');
    }
  }
</script>
