<template>
  <div :class="['context_menu_wrap', { active: menu }]" @mousedown="closeMenu" @click="closeMenu">
    <component :is="menu.name" v-if="menu" v-bind="menu.data" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { capitalize } from 'js/utils';

const getComponentName = (name) => capitalize(name) + 'ContextMenu';

export default {
  components: [
    'peer',
    'message'
  ].reduce((components, rawName) => {
    const name = getComponentName(rawName);
    components[name] = require(`./${name}.vue`).default;
    return components;
  }, {}),

  setup() {
    const menu = ref(null);

    function closeMenu({ type, target }) {
      if (
        type === 'click' && target.closest('.act_menu_item') ||
        type === 'mousedown' && !target.closest('.context_menu')
      ) {
        menu.value = null;
      }
    }

    onMounted(() => {
      window.addEventListener('contextmenu', (event) => {
        const element = event.path.find((el) => el.dataset && el.dataset.contextMenu);

        if (element) {
          menu.value = {
            name: getComponentName(element.dataset.contextMenu),
            data: {
              ...element.dataset,
              event
            }
          };
        }
      });

      window.addEventListener('resize', () => {
        menu.value = null;
      });
    });

    return {
      menu,
      closeMenu
    };
  }
};
</script>

<style>
.context_menu_wrap {
  position: absolute;
  top: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  visibility: hidden;
}

.context_menu_wrap.active {
  visibility: visible;
}
</style>
