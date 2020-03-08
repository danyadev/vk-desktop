<template>
  <div :class="['context_menu_wrap', { active: menu }]" @mousedown="closeMenu" @click="closeMenu">
    <Transition name="context-menu">
      <Component v-if="menu" :is="menu.name" v-bind="menu.data" />
    </Transition>
  </div>
</template>

<script>
  import { eventBus, capitalize } from 'js/utils';

  const getComponentName = (name) => capitalize(name) + 'ContextMenu';

  export default {
    components: [
      'peer'
    ].reduce((components, name) => {
      const componentName = getComponentName(name);
      components[componentName] = require(`./${componentName}.vue`).default;
      return components;
    }, {}),

    data: () => ({
      menu: null
    }),

    methods: {
      closeMenu({ type, target }) {
        if(
          type == 'click' && target.closest('.act_menu_item') ||
          type == 'mousedown' && !target.closest('.context_menu')
        ) this.menu = null;
      }
    },

    mounted() {
      window.addEventListener('contextmenu', (event) => {
        const element = event.path.find((el) => el.dataset && el.dataset.contextMenu);

        if(element) {
          this.$store.commit('setContextMenuEvent', event);
          this.menu = {
            name: getComponentName(element.dataset.contextMenu),
            data: element.dataset
          };
        }
      });

      window.addEventListener('resize', () => {
        this.menu = null;
      });
    }
  }
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
