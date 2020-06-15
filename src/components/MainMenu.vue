<template>
  <div class="menu">
    <Ripple
      v-for="{ route, active } of routes"
      :key="route"
      color="var(--hover-background-ripple)"
      :class="['menu_item', { active }]"
      @click.stop="openPage(`/${route}`)"
    >
      <Icon
        :name="`menu/${route}`"
        :color="active ? 'var(--icon-blue)' : 'var(--icon-gray)'"
        width="26"
        height="26"
      />
      <div class="menu_item_counter" :title="counters[route]">
        {{ convertCount(counters[route]) || '' }}
      </div>
    </Ripple>

    <Ripple
      color="var(--hover-background-ripple)"
      class="menu_item"
      @click.stop="openModal('settings')"
    >
      <Icon name="menu/settings" color="var(--icon-gray)" width="26" height="26" />
    </Ripple>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { convertCount } from 'js/utils';
import { openModal } from 'js/modals';
import store from 'js/store';
import router from 'js/router';

import Ripple from './UI/Ripple.vue';
import Icon from './UI/Icon.vue';

export default {
  components: {
    Ripple,
    Icon
  },

  setup() {
    const state = reactive({
      menuRef: null,

      counters: computed(() => store.state.menuCounters),
      user: computed(() => store.getters['users/user']),

      routes: computed(() => (
        ['messages'].map((route) => ({
          route,
          active: isActiveRoute(`/${route}`)
        }))
      ))
    });

    function isActiveRoute(route) {
      return new RegExp(`${route}($|/)`).test(router.currentRoute.value.path);
    }

    function openPage(route) {
      if (!isActiveRoute(route)) {
        router.replace(route);
      }
    }

    return {
      ...toRefs(state),

      convertCount,
      openPage,
      openModal
    };
  }
};
</script>

<style>
.menu {
  display: none;
}
</style>
