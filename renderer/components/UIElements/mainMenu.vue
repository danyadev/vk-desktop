<template>
  <div class="menu_wrap" :class="{ active }" @click="toggleMenu">
    <div class="menu">
      <div class="menu_account_item">
        <img class="menu_account_bgc" :src="user.photo_100">
        <div class="menu_multiacc" @click.stop="openMultiacc"></div>
        <img class="acc_icon"
             :src="user.photo_100"
             @click="/*openPage('profile')*/">
        <div class="menu_acc_name">
          {{ user.first_name }} {{ user.last_name }}
          <div class="verified" v-if="user.verified"></div>
        </div>
        <div class="menu_acc_status" v-emoji>{{ user.status }}</div>
      </div>
      <div class="menu_items">
        <div class="menu_item"
             v-for="item of list"
             @click="openPage(type)"
             :class="{ active: $root.section == item.type }">
          <div class="menu_item_icon" :class="item.type"></div>
          <div class="menu_item_name">{{ l('menu', item.type) }}</div>
          <div class="menu_item_counter" v-if="item.counter">
            {{ $store.state.counters[item.type] }}
          </div>
        </div>
        <div class="menu_item logout" @click.stop="logout">
          <div class="menu_item_name">{{ l('logout') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data() {
      return {
        list: [
          // 'news',
          // 'notifications',
          { type: 'messages', counter: true }
          // 'audios',
          // 'friends',
          // 'groups',
          // 'photos',
          // 'videos',
          // 'settings'
        ]
      }
    },
    computed: {
      user() {
        return this.$root.user || {};
      },
      active() {
        return this.$store.state.menuState;
      }
    },
    methods: {
      openMultiacc() {
        this.toggleMenu(false);
        this.$modals.open('multiaccount');
      },
      openPage(type) {
        this.toggleMenu(false);
        if(this.$root.section != type) this.$root.section = type;
      },
      toggleMenu(event) {
        let state;

        if(typeof event == 'boolean') state = event;
        else state = qs('.menu_wrap') != event.target;

        this.$store.commit('setMenuState', state);
      },
      logout() {
        this.toggleMenu(false);
        setTimeout(() => this.$modals.open('logout'), 150);
      }
    },
    async mounted() {
      let [ user ] = await vkapi('execute.getProfiles', { fields: 'status,photo_100' });

      this.$store.commit('updateUser', Object.assign(user, {
        activeTime: Date.now() / 1000
      }));

      vkapi('stats.trackVisitor');
      require('./../../js/longpoll').init();
    }
  }
</script>
