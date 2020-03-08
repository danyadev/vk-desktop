<template>
  <div :class="['titlebar', { maximized }]">
    <div class="titlebar_drag text-overflow" ref="drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div v-for="button of buttons" :key="button"
           :class="['titlebar_button', button]"
           @click="click(button)"
      ><img :src="`assets/titlebar/${button}.svg`"></div>
    </div>
  </div>
</template>

<script>
  import electron from 'electron';
  const win = electron.remote.getCurrentWindow();

  export default {
    data: () => ({
      maximized: win.isMaximized(),
      buttons: ['minimize', 'maximize', 'restore', 'close']
    }),

    methods: {
      click(button) {
        win[button]();
      }
    },

    mounted() {
      if(process.platform == 'darwin') {
        this.$refs.drag.addEventListener('dblclick', () => {
          if(win.isFullScreen()) return;
          else if(win.isMaximized()) win.emit('unmaximize');
          else win.emit('maximize');
        });
      }

      const onMaximize = () => this.maximized = true;
      const onUnmaximize = () => this.maximized = false;

      win.on('maximize', onMaximize);
      win.on('unmaximize', onUnmaximize);

      // Фикс сообщения об ошибке в консоли Electron
      // "Attempting to call a function in a renderer window that has been closed or released."
      // Возникает при перезагрузке страницы и вызове эвентов maximize или unmaximize,
      // которые находятся выше.
      // Ошибка возникает из-за того, что win - это элемент из main процесса,
      // и при перезагрузке страницы все его листенеры не сбрасываются,
      // но при этом все колбэки из renderer процесса он теряет.
      window.addEventListener('beforeunload', () => {
        win.removeListener('maximize', onMaximize);
        win.removeListener('unmaximize', onUnmaximize);
      });
    }
  }
</script>

<style>
  .titlebar {
    display: flex;
    position: relative;
    height: var(--titlebar-height);
    z-index: 5;
    background: #5281b9;
  }

  .titlebar_drag {
    -webkit-app-region: drag;
    flex-grow: 1;
    margin: 4px 0 0 4px;
    padding-left: 4px;
    color: #fff;
    line-height: 24px;
  }

  .titlebar.maximized .titlebar_drag {
    padding: 4px 0 0 8px;
    margin: 0;
  }

  .titlebar_buttons {
    display: flex;
  }

  .titlebar_button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    cursor: pointer;
    transition: .2s background-color;
  }

  .titlebar_button:hover { background: rgba(0, 0, 0, .2) }
  .titlebar_button.close:hover { background: #eb0716 }

  .titlebar.maximized .titlebar_button.maximize { display: none }
  .titlebar:not(.maximized) .titlebar_button.restore { display: none }

  .mac .titlebar .titlebar_buttons { display: none }
  .mac .titlebar .titlebar_drag {
    text-align: center;
    line-height: 14px;
  }
</style>
