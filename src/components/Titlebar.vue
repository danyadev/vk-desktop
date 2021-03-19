<template>
  <div :class="['titlebar', { maximized }]">
    <div ref="drag" class="titlebar_drag">{{ l('vk_desktop') }}</div>
    <div v-if="!isMac" class="titlebar_buttons">
      <div
        v-for="button of ['minimize', 'maximize', 'restore', 'close']"
        :key="button"
        :class="['titlebar_button', button]"
        @click="click(button)"
      >
        <Icon :name="`titlebar/${button}`" color="var(--text-primary)" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { currentWindow } from 'js/utils';

import Icon from './UI/Icon.vue';

export default {
  components: {
    Icon
  },

  setup() {
    const maximized = ref(currentWindow.isMaximized());
    const drag = ref(null);
    const isMac = process.platform === 'darwin';

    onMounted(() => {
      if (isMac) {
        drag.value.addEventListener('dblclick', () => {
          if (!currentWindow.isFullScreen()) {
            currentWindow.emit(maximized.value ? 'unmaximize' : 'maximize');
          }
        });
      }

      const onMaximize = () => (maximized.value = true);
      const onUnmaximize = () => (maximized.value = false);

      currentWindow.on('maximize', onMaximize);
      currentWindow.on('unmaximize', onUnmaximize);

      window.addEventListener('beforeunload', () => {
        currentWindow.removeListener('maximize', onMaximize);
        currentWindow.removeListener('unmaximize', onUnmaximize);
      });
    });

    return {
      maximized,
      drag,
      isMac,
      click: (button) => currentWindow[button]()
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
  background: var(--background);
  color: var(--text-primary);
}

.mac .titlebar {
  background: var(--titlebar-background);
  color: var(--text-secondary);
  font-size: 13px;
}

.titlebar_drag {
  -webkit-app-region: drag;
  flex-grow: 1;
  margin: 4px 0 0 4px;
  padding-left: 4px;
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
  transition: background-color .2s;
}

.titlebar_button:hover {
  background: rgba(0, 0, 0, .1);
}

.titlebar_button.close:hover {
  background: var(--red);
}

.titlebar_button.close svg {
  transition: color .2s;
}

.titlebar_button.close:hover svg {
  color: #fff;
}

.titlebar.maximized .titlebar_button.maximize,
.titlebar:not(.maximized) .titlebar_button.restore {
  display: none;
}

.mac .titlebar .titlebar_drag {
  text-align: center;
  line-height: 16px;
}
</style>
