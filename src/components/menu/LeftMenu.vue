<template>
  <div class="menu left">
    <div
      v-for="{ route, active } of routes"
      :key="route"
      class="menu_icon"
      @click="openPage(`/${route}`)"
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

    <div class="menu_grow"></div>

    <div class="menu_icon" @click="openModal('multiaccount')">
      <Icon name="menu/profile" color="var(--icon-gray)" width="28" height="28" />
    </div>
    <div class="menu_icon" @click="openModal('settings')">
      <Icon name="menu/settings" color="var(--icon-gray)" width="28" height="28" />
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
.menu.left {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 65px;
  height: 100%;
  padding-top: 15px;
  border-right: 1px solid var(--separator);
}

.menu_icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 15px;
  cursor: pointer;
}

.menu_item_counter {
  position: absolute;
  top: -3px;
  left: 32px;
  font-size: 12px;
  background: var(--red-light);
  color: var(--background);
  border-radius: 10px;
  padding: 2px 5px 2px 4px;
  min-width: 18px;
  text-align: center;
}

.menu_grow {
  flex-grow: 1;
}
</style>
