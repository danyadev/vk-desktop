<template>
  <div ref="root" class="act_menu_wrap">
    <Ripple
      class="ripple_fast act_menu_btn_wrap"
      color="rgba(255, 255, 255, .2)"
      @click="toggleMenu"
    >
      <img src="~assets/actions_icon.svg" class="act_menu_btn icon-hover">
    </Ripple>

    <div :class="['act_menu', { active }]"><slot v-if="!hideList" /></div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue';

import Ripple from '../UI/Ripple.vue';

export default {
  props: ['hideList'],

  components: {
    Ripple
  },

  setup() {
    const state = reactive({
      root: null,
      active: false,
      timeout: null
    });

    function toggleMenu() {
      if (state.active) {
        window.removeEventListener('mousemove', onMouseMove);
      } else {
        window.addEventListener('mousemove', onMouseMove);
      }

      clearTimeout(state.timeout);
      state.timeout = null;
      state.active = !state.active;
    }

    function onMouseMove(event) {
      const isActive = event.path.find((el) => el === state.root);

      if (isActive) {
        if (state.timeout) {
          clearTimeout(state.timeout);
          state.timeout = null;
          state.active = true;
        }
      } else if (!state.timeout) {
        state.timeout = setTimeout(toggleMenu, 500);
      }
    }

    return {
      ...toRefs(state),
      toggleMenu
    };
  }
};
</script>

<style>
.act_menu_wrap {
  position: relative;
  z-index: 3;
}

.act_menu_btn_wrap {
  height: 40px;
  border-radius: 50%;
  margin-right: 5px;
}

.act_menu_btn {
  width: 24px;
  height: 24px;
  margin: 8px;
}

.act_menu {
  position: absolute;
  width: 250px;
  min-height: 50px;
  right: 0;
  padding: 6px 0;
  margin: -6px 6px 6px 6px;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0, 0, 0, .2),
              0 4px 36px -6px rgba(0, 0, 0, .4);
  transition: opacity .3s, margin-top .3s;
}

.act_menu.active {
  margin-top: 6px;
  opacity: 1;
  pointer-events: all;
}

.act_menu_separator {
  height: 1px;
  margin: 4px 0;
  background: #e0e0e0;
}
</style>
