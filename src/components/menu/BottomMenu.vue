<template>
  <div class="menu bottom border-top-shadow">
    <div
      v-for="{ route, active } of routes"
      :key="route"
      class="menu_icon"
      @click.stop="openPage(`/${route}`)"
    >
      <Icon
        :name="`menu/${route}`"
        :color="active ? 'var(--icon-blue)' : 'var(--icon-gray)'"
        width="28"
        height="28"
      />

      <div v-if="counters[route]" class="menu_item_counter" :title="counters[route]">
        {{ convertCount(counters[route]) }}
      </div>
    </div>

    <div class="menu_icon" @click="openModal('multiaccount')">
      <Icon name="menu/profile" color="var(--icon-gray)" width="28" height="28" />
    </div>
  </div>
</template>

<script>
import { toRefs } from 'vue';
import { convertCount } from 'js/utils';
import { openModal } from 'js/modals';
import { state, openPage } from '.';

import Icon from '../UI/Icon.vue';

export default {
  components: {
    Icon
  },

  setup() {
    return {
      ...toRefs(state),

      convertCount,
      openModal,
      openPage
    };
  }
};
</script>

<style>
.menu.bottom {
  position: absolute;
  bottom: 0;
  display: flex;
  justify-content: space-evenly;
  width: 100%;
  height: 50px;
  border-top: 1px solid var(--separator);
  background: var(--background);
}

.menu.bottom .menu_icon {
  margin-bottom: 0;
}

.menu.bottom .menu_item_counter {
  top: 8px;
  left: 16px;
}
</style>
