<template>
  <div class="menu_wrap" :class="{ active: menuState }" ref="wrap" @click="toggleMenu">
    <div class="menu">
      <div class="account_block">
        <img class="account_background" :src="user.photo_100">
        <div class="account_multiaccount"></div>
        <img class="account_photo" :src="user.photo_100">
        <div class="account_name">
          {{ user.first_name }} {{ user.last_name }}
          <div v-if="user.verified" class="verified"></div>
        </div>
        <div class="account_status" v-emoji="user.status"></div>
      </div>
      <div class="menu_items">
        <div v-for="route of routes"
             class="menu_item"
             :class="{ active: isActiveRoute(`/${route}`) }"
             @click.stop="openPage(`/${route}`)"
        >
          <div class="menu_item_icon" :class="route"></div>
          <div class="menu_item_name">{{ l('menu', route) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex';

  export default {
    data: () => ({
      routes: ['messages']
    }),
    computed: {
      ...mapState(['menuState']),
      ...mapGetters('users', ['user'])
    },
    methods: {
      toggleMenu(event) {
        let state;

        if(typeof event == 'boolean') state = event;
        else state = this.$refs.wrap != event.target;

        this.$store.commit('setMenuState', state);
      },
      isActiveRoute(route) {
        const regex = new RegExp(`/${route.slice(1)}($|/)`);

        return regex.test(this.$route.path);
      },
      openPage(route) {
        this.toggleMenu(false);

        if(this.isActiveRoute(route)) return;
        else if(event.shiftKey) this.$router.push(route);
        else this.$router.replace(route);
      }
    }
  }
</script>

<style scoped>
  .menu_wrap {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 5;
    background-color: rgba(0, 0, 0, 0);
    visibility: hidden;
  }

  .menu_wrap { transition: background-color .15s, visibility .15s }
  .menu_wrap.active .menu { transform: translateZ(0) }

  .menu_wrap.active {
    background-color: rgba(0, 0, 0, .5);
    visibility: visible;
  }

  .menu {
    position: absolute;
    transform: translate(-100%);
    width: 250px;
    height: 100%;
    z-index: 3;
    overflow: hidden;
    background-color: white;
    box-shadow: 4px 0 6px rgba(0, 0, 0, .2);
  }

  .menu { transition: transform .35s }

  /* панелька профиля */

  .account_block {
    position: relative;
    overflow: hidden;
    height: 125px;
    padding: 8px 10px 10px 12px;
    background-color: rgba(38, 37, 37, .5);
  }

  .account_background {
    width: 260px;
    height: 135px;
    position: absolute;
    top: -5px;
    right: -5px;
    z-index: -1;
    object-fit: cover;
    filter: blur(3px);
  }

  .account_multiaccount {
    width: 26px;
    height: 21px;
    position: absolute;
    right: 10px;
    background-color: white;
    -webkit-mask-size: cover;
    -webkit-mask-image: url('~assets/menu_groups.svg');
    /* cursor: pointer; */
  }

  .account_photo {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-size: 100%;
    /* cursor: pointer; */
    box-shadow: 0 2px 3px 0 rgba(0, 0, 0, .2);
  }

  .account_name, .account_status {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .3);
  }

  .account_name {
    margin-top: 12px;
    color: #fff;
  }

  .account_status {
    font-size: 13px;
    color: #d9d9d9;
  }

  /* остальные кнопки меню */

  .menu_items {
    padding: 8px 0;
    overflow-y: auto;
    height: calc(100% - 125px);
  }

  .menu_item {
    height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .menu_item, .menu_item_icon, .menu_item_name {
    transition: background-color .3s, color .3s;
  }

  .menu_item:hover { background-color: #f7f7f7 }
  .menu_item.active { background-color: #eef1f5 }
  .menu_item.active .menu_item_icon { background-color: #648fc1 }
  .menu_item.active .menu_item_name { color: #3e70a9 }

  .menu_item_name {
    flex-grow: 1;
    user-select: none;
  }

  .menu_item_counter:not(:empty) {
    color: #4d5f75;
    background-color: #cad9e6;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 8px;
    font-size: 14px;
  }

  .menu_item_icon {
    width: 26px;
    height: 26px;
    margin: 0 10px;
    background-color: #a6a6a6;
    -webkit-mask-size: cover;
    transition: background-color .3s;
  }

  .menu_item_icon.messages { -webkit-mask-image: url('~assets/menu_messages.svg') }
  .menu_item_icon.groups { -webkit-mask-image: url('~assets/menu_groups.svg') }

  /* Кнопка выхода из аккаунта */

  .menu_separator {
    width: calc(100% - 20px);
    height: 1px;
    margin: 10px;
    background-color: #e4e4e4;
  }

  .menu_item.logout .menu_item_name {
    margin-left: 15px;
    font-size: 16px;
    color: #de3f3f;
    margin-top: -4px;
  }
</style>
