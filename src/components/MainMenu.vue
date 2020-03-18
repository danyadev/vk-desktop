<template>
  <div ref="menuRef" :class="['menu_wrap', { active: isMenuOpened }]" @click="toggleMenu">
    <div class="menu">
      <div class="menu_account_block">
        <img class="menu_account_background" :src="user.photo_100">
        <Ripple
          color="rgba(0, 0, 0, .2)"
          class="ripple_fast menu_account_multiaccount"
          @click.stop="openModalFromMenu('multiaccount')"
        >
          <img src="assets/menu/groups.svg">
        </Ripple>
        <img class="menu_account_photo" :src="user.photo_100">
        <div class="menu_account_name text-overflow">
          {{ user.first_name }} {{ user.last_name }}
        </div>
        <div class="menu_account_status text-overflow">
          {{ user.status }}
        </div>
      </div>

      <div class="menu_items">
        <Ripple
          v-for="{ route, active } of routes"
          :key="route"
          color="#e1e7ed"
          :class="['menu_item', { active }]"
          @click.stop="openPage(`/${route}`)"
        >
          <Icon
            :name="`menu/${route}`"
            :color="active ? '#648fc1' : '#a6a6a6'"
            width="26"
            height="26"
          />
          <div class="menu_item_name">{{ l('menu', route) }}</div>
          <div class="menu_item_counter" :title="counters[route]">
            {{ convertCount(counters[route]) }}
          </div>
        </Ripple>

        <Ripple
          color="#e1e7ed"
          class="menu_item"
          @click.stop="openModalFromMenu('settings')"
        >
          <Icon name="menu/settings" color="#a6a6a6" width="26" height="26" />
          <div class="menu_item_name">{{ l('menu', 'settings') }}</div>
        </Ripple>

        <Ripple
          color="#e1e7ed"
          class="menu_item logout"
          @click.stop="openModalFromMenu('logout')"
        >
          <div class="menu_item_name">{{ l('logout') }}</div>
        </Ripple>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import router from 'js/router';
import store from 'js/store';
import { onTransitionEnd, convertCount } from 'js/utils';
import { openModal } from 'js/modals';

import Ripple from './UI/Ripple.vue';
import Icon from './UI/Icon.vue';

export default {
  components: {
    Ripple,
    Icon
  },

  setup() {
    const isMenuOpened = computed(() => store.state.isMenuOpened);
    const counters = computed(() => store.state.menuCounters);
    const user = computed(() => store.getters['users/user']);
    const menuRef = ref(null);

    function isActiveRoute(route) {
      return new RegExp(`${route}($|/)`).test(router.currentRoute.value.path);
    }

    const routes = computed(() => (
      ['messages'].map((route) => ({
        route,
        active: isActiveRoute(`/${route}`)
      }))
    ));

    function toggleMenu(arg) {
      const state = typeof arg === 'boolean'
        ? arg
        : arg.target.closest('.menu');

      store.commit('setMenuState', state);
    }

    function openPage(route) {
      toggleMenu(false);

      if (!isActiveRoute(route)) {
        router.replace(route);
      }
    }

    async function openModalFromMenu(name) {
      toggleMenu(false);
      await onTransitionEnd(menuRef.value);
      openModal(name);
    }

    return {
      isMenuOpened,
      counters,
      user,
      menuRef,
      routes,

      convertCount,
      toggleMenu,
      openPage,
      openModalFromMenu
    };
  }
};
</script>

<style>
.menu_wrap {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 4;
  background: #fff0;
  visibility: hidden;
  transition: background-color .15s, visibility .15s;
}

.menu_wrap.active .menu {
  transform: translateZ(0);
}

.menu_wrap.active {
  background: rgba(0, 0, 0, .5);
  visibility: visible;
}

.menu {
  position: absolute;
  transform: translate(-100%);
  width: 250px;
  height: 100%;
  overflow: hidden;
  background: #fff;
  box-shadow: 4px 0 6px rgba(0, 0, 0, .2);
  transition: transform .35s;
}

/* панелька профиля */

.menu_account_block {
  position: relative;
  overflow: hidden;
  height: 125px;
  padding: 8px 10px 10px 12px;
  background: rgba(38, 37, 37, .5);
}

.menu_account_background {
  width: 260px;
  height: 135px;
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: -1;
  object-fit: cover;
  filter: blur(3px);
}

.menu_account_multiaccount {
  position: absolute;
  right: 10px;
  padding: 3px 0 0 3px;
  width: 33px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

.menu_account_multiaccount img {
  width: 26px;
  height: 26px;
}

.menu_account_photo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-size: 100%;
  box-shadow: 0 2px 3px 0 rgba(0, 0, 0, .2);
}

.menu_account_name, .menu_account_status {
  text-shadow: 1px 1px 1px rgba(0, 0, 0, .3);
}

.menu_account_name {
  margin: 12px 0 2px 0;
  color: #fff;
}

.menu_account_status {
  font-size: 13px;
  color: #d9d9d9;
}

/* остальные кнопки меню */

.menu_items {
  padding: 8px 0;
  overflow-y: auto;
  height: calc(100% - 125px);
}

.menu_items .menu_item:not(:last-child) {
  margin-bottom: 10px;
}

.menu_item {
  height: 44px;
  display: flex;
  align-items: center;
  padding-left: 20px;
  cursor: pointer;
  color: #808080;
}

.menu_item, .menu_item_name {
  transition: background-color .3s, color .3s;
}

.menu_item:hover, .menu_item.active {
  background: #eff4f9;
}

.menu_item.active .menu_item_name {
  color: #3e70a9;
}

.menu_item_name {
  flex-grow: 1;
  margin-left: 10px;
}

.menu_item_counter:not(:empty) {
  background: #5181b8;
  color: #fff;
  line-height: 18px;
  padding: 1px 6px 0 6px;
  border-radius: 10px;
  margin-right: 8px;
  font-size: 14px;
  font-size: 12px;
}

/* Выход из аккаунта */

.menu_item.logout {
  margin-top: 10px;
}

.menu_item.logout .menu_item_name {
  font-size: 17px;
  color: #de3f3f;
}
</style>
