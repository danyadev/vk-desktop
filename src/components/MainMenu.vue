<template>
  <div :class="['menu_wrap', { active: menuState }]" @click="toggleMenu">
    <div class="menu">
      <div class="menu_account_block">
        <img class="menu_account_background" :src="user.photo_100">
        <Ripple color="rgba(0, 0, 0, .2)"
                class="ripple_fast menu_account_multiaccount"
                @click.stop="openModal('multiaccount')"
        ><img src="assets/menu/groups.svg"></Ripple>
        <img class="menu_account_photo" :src="user.photo_100">
        <div class="menu_account_name">{{ user.first_name }} {{ user.last_name }}</div>
        <div class="menu_account_status" v-emoji="user.status"></div>
      </div>

      <div class="menu_items">
        <Ripple v-for="{ route, active } of routes" :key="route"
                color="var(--menu-item-ripple)"
                :class="['menu_item', { active }]"
                @click.stop="openPage(`/${route}`)"
        >
          <Icon :name="`menu/${route}`"
                :color="active ? 'var(--menu-icon-active)' : 'var(--menu-icon)'"
                width="26" height="26"
          />
          <div class="menu_item_name">{{ l('menu', route) }}</div>
          <div class="menu_item_counter">{{ menuCounters[route] }}</div>
        </Ripple>

        <Ripple color="var(--menu-item-ripple)"
                class="menu_item"
                @click.stop="openModal('settings')"
        >
          <Icon name="menu/settings" color="var(--menu-icon)" width="26" height="26" />
          <div class="menu_item_name">{{ l('menu', 'settings') }}</div>
        </Ripple>

        <Ripple color="var(--menu-item-ripple)"
                class="menu_item logout"
                @click.stop="openModal('logout')"
        >
          <div class="menu_item_name">{{ l('logout') }}</div>
        </Ripple>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex';
  import { onTransitionEnd } from 'js/utils';

  import Ripple from './UI/Ripple.vue';
  import Icon from './UI/Icon.vue';

  export default {
    components: {
      Ripple,
      Icon
    },

    computed: {
      ...mapState(['menuState', 'menuCounters']),
      ...mapGetters('users', ['user']),
      routes() {
        return ['messages', 'photos'].map((page) => ({
          route: page,
          active: this.isActiveRoute(`/${page}`)
        }));
      }
    },

    methods: {
      toggleMenu(event) {
        let state;

        if(typeof event == 'boolean') state = event;
        else state = this.$el != event.target;

        this.$store.commit('setMenuState', state);
      },

      isActiveRoute(route) {
        return new RegExp(`${route}($|/)`).test(this.$route.path);
      },

      openPage(route) {
        this.toggleMenu(false);

        if(!this.isActiveRoute(route)) this.$router.replace(route);
      },

      async openModal(name) {
        this.toggleMenu(false);
        await onTransitionEnd(this.$el);
        this.$modals.open(name);
      }
    }
  }
</script>

<style>
  .menu_wrap {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 4;
    background: var(--menu-background);
    visibility: hidden;
  }

  .menu_wrap {
    transition: background-color .15s, visibility .15s;
  }

  .menu_wrap.active .menu {
    transform: translateZ(0);
  }

  .menu_wrap.active {
    background: var(--menu-shadow);
    visibility: visible;
  }

  .menu {
    position: absolute;
    transform: translate(-100%);
    width: 250px;
    height: 100%;
    overflow: hidden;
    background: var(--background-content);
    box-shadow: 4px 0 6px rgba(0, 0, 0, .2);
  }

  .menu {
    transition: transform .35s;
  }

  /* панелька профиля */

  .menu_account_block {
    position: relative;
    overflow: hidden;
    height: 125px;
    padding: 8px 10px 10px 12px;
    background: var(--menu-account-background);
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
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .3);
  }

  .menu_account_name {
    margin: 12px 0 2px 0;
    color: var(--menu-account-name);
  }

  .menu_account_status {
    font-size: 13px;
    color: var(--menu-account-status);
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
    color: var(--menu-item-color);
  }

  .menu_item, .menu_item_name {
    transition: background-color .3s, color .3s;
  }

  .menu_item.active {
    background: var(--menu-item-active-background);
  }

  .menu_item:hover {
    background: var(--menu-item-hover);
  }

  .menu_item.active .menu_item_name {
    color: var(--menu-item-active-text);
  }

  .menu_item_name {
    flex-grow: 1;
    margin-left: 10px;
  }

  .menu_item_counter:not(:empty) {
    color: var(--counter-secondary-text);
    background: var(--counter-secondary-background);
    line-height: 18px;
    padding: 1px 5px 0 5px;
    border-radius: 10px;
    margin-right: 8px;
    font-size: 12px;
  }

  /* Выход из аккаунта */

  .menu_item.logout {
    margin-top: 10px;
  }

  .menu_item.logout .menu_item_name {
    font-size: 16px;
    color: var(--menu-logout);
  }
</style>
