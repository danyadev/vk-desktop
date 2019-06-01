<template>
  <div :class="['titlebar', { maximized, mac }]">
    <div class="titlebar_drag" ref="drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div v-for="button of buttons"
           :key="button"
           :class="['titlebar_button', button]"
           @click="click(button)"
      >
        <img :src="`assets/titlebar/${button}.svg`">
      </div>
    </div>
  </div>
</template>

<script>
  import { remote as electron } from 'electron';
  const win = electron.getCurrentWindow();

  export default {
    data: () => ({
      mac: process.platform == 'darwin',
      maximized: win.isMaximized(),
      buttons: ['minimize', 'maximize', 'restore', 'close']
    }),
    methods: {
      click: (button) => win[button]()
    },
    mounted() {
      if(this.mac) {
        this.$refs.drag.addEventListener('dblclick', () => {
          if(win.isFullScreen()) return;
          else if(win.isMaximized()) win.emit('unmaximize');
          else win.emit('maximize');
        });
      }

      win.on('maximize', () => this.maximized = true);
      win.on('unmaximize', () => this.maximized = false);
    }
  }
</script>

<style>
  .titlebar {
    display: flex;
    position: relative;
    height: 32px;
    z-index: 7;
    background-color: var(--titlebar_background);
  }

  .titlebar_drag {
    -webkit-app-region: drag;
    user-select: none;
    flex-grow: 1;
    margin: 4px 0 0 4px;
    padding-left: 4px;
    color: #fff;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
    line-height: 24px;
    overflow: hidden;
    white-space: nowrap;
  }

  .titlebar.maximized .titlebar_drag {
    padding: 4px 0 0 8px;
    margin: 0;
  }

  .titlebar_buttons { display: flex }

  .titlebar_button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    cursor: pointer;
    transition: .2s background-color;
  }

  .titlebar_button:hover { background-color: rgba(0, 0, 0, .2) }
  .titlebar_button:active { background-color: rgba(0, 0, 0, .3) }

  .titlebar_button.close:hover { background-color: #eb0716 }
  .titlebar_button.close:active { background-color: #de000f }

  .titlebar.maximized .titlebar_button.maximize { display: none }
  .titlebar:not(.maximized) .titlebar_button.restore { display: none }

  .titlebar.mac { height: 22px }
  .titlebar.mac + .app { height: calc(100vh - 22px) }
  .titlebar.mac .titlebar_buttons { display: none }

  .titlebar.mac .titlebar_drag {
    text-align: center;
    line-height: 14px;
  }
</style>
