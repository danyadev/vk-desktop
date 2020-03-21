<template>
  <div :class="['titlebar', { maximized }]">
    <div ref="drag" class="titlebar_drag">VK Desktop</div>
    <div class="titlebar_buttons">
      <div
        v-for="button of buttons"
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
import { ref, onMounted } from 'vue';
import electron from 'electron';

export default {
  setup() {
    const win = electron.remote.getCurrentWindow();
    const maximized = ref(win.isMaximized());
    const drag = ref(null);

    onMounted(() => {
      if (process.platform === 'darwin') {
        drag.value.addEventListener('dblclick', () => {
          if (!win.isFullScreen()) {
            win.emit(maximized.value ? 'unmaximize' : 'maximize');
          }
        });
      }

      const onMaximize = () => (maximized.value = true);
      const onUnmaximize = () => (maximized.value = false);

      win.on('maximize', onMaximize);
      win.on('unmaximize', onUnmaximize);

      window.addEventListener('beforeunload', () => {
        win.removeListener('maximize', onMaximize);
        win.removeListener('unmaximize', onUnmaximize);
      });
    });

    return {
      maximized,
      drag,
      buttons: ['minimize', 'maximize', 'restore', 'close'],
      click(button) {
        win[button]();
      }
    };
  }
};
</script>

<style>
.titlebar {
  display: flex;
  position: relative;
  height: var(--titlebar-height);
  z-index: 5;
  background: var(--blue-background);
}

.titlebar_drag {
  -webkit-app-region: drag;
  flex-grow: 1;
  margin: 4px 0 0 4px;
  padding-left: 4px;
  color: var(--blue-background-text);
  line-height: 24px;
  overflow: hidden;
  white-space: nowrap;
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

.titlebar_button:hover {
  background: rgba(0, 0, 0, .2);
}

.titlebar_button.close:hover {
  background: var(--red);
}

.titlebar.maximized .titlebar_button.maximize,
.titlebar:not(.maximized) .titlebar_button.restore,
.mac .titlebar .titlebar_buttons {
  display: none;
}

.mac .titlebar .titlebar_drag {
  text-align: center;
  line-height: 14px;
}
</style>
