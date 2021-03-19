<template>
  <div ref="root" class="act_menu_wrap" @mouseover="onMouseOver" @mouseout="onMouseOut">
    <div class="act_menu_btn_wrap">
      <Icon name="actions_icon" color="var(--icon-blue)" class="act_menu_btn" />
    </div>

    <div :class="['act_menu', { active }]"><slot v-if="!hideList" /></div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue';
import { mouseOverWrapper, mouseOutWrapper } from 'js/utils';

import Icon from '../UI/Icon.vue';

export default {
  props: ['hideList'],

  components: {
    Icon
  },

  setup() {
    const state = reactive({
      root: null,
      active: false,
      showTimeout: null,
      hideTimeout: null
    });

    function setActive(value) {
      state.active = value;
      clearTimeout(state.hideTimeout);
      state.hideTimeout = null;
    }

    const onMouseOver = mouseOverWrapper(() => {
      if (state.active) {
        return setActive(true);
      }

      state.showTimeout = setTimeout(() => {
        state.showTimeout = null;
        setActive(true);
      }, 150);
    });

    const onMouseOut = mouseOutWrapper(() => {
      if (state.showTimeout) {
        clearTimeout(state.showTimeout);
        state.showTimeout = null;
      } else {
        state.hideTimeout = setTimeout(() => {
          setActive(false);
        }, 250);
      }
    });

    return {
      ...toRefs(state),
      onMouseOver,
      onMouseOut,
      // Используется в других компонентах
      // eslint-disable-next-line vue/no-unused-properties
      setActive
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
  padding-right: 5px;
  cursor: pointer;
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
  padding: 5px 0;
  margin: -6px 6px 6px 6px;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  background: var(--background);
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
</style>
