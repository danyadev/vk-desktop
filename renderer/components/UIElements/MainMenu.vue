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
        <div class="menu_acc_status" v-emoji="user.status"></div>
      </div>
      <div class="menu_items">
        <div class="menu_item"
             v-for="page of list"
             @click="openPage(page)"
             :class="{ active: $root.section == page }">
          <div class="menu_item_icon" :class="page"></div>
          <div class="menu_item_name">{{ l('menu', page) }}</div>
          <div class="menu_item_counter">{{ counters[page] || '' }}</div>
        </div>
        <div class="menu_divider"></div>
        <div class="menu_item" @click.stop="changeLang">
          <div class="menu_item_name">{{ l('change_lang') }}</div>
        </div>
        <div class="menu_item logout" @click.stop="logout">
          <div class="menu_item_name">{{ l('logout') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const { mapState } = Vuex;

  module.exports = {
    data: () => ({
      list: ['messages']
    }),
    computed: {
      ...mapState('settings', ['counters']),
      user() {
        return this.$root.user;
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
      openPage(page) {
        this.toggleMenu(false);
        if(this.$root.section != page) this.$root.section = page;
      },
      toggleMenu(event) {
        let state;

        if(typeof event == 'boolean') state = event;
        else state = qs('.menu_wrap') != event.target;

        this.$store.commit('setMenuState', state);
      },
      changeLang() {
        this.toggleMenu(false);
        this.$modals.open('changeLanguage');
      },
      logout() {
        this.toggleMenu(false);
        this.$modals.open('logout');
      }
    },
    async mounted() {
      let { lp, user, counters } = await vkapi('execute.init', {
        lp_version: longpoll.version,
        fields: `${other.fields},status`
      });

      for(let counter in counters) {
        this.$store.commit('settings/updateCounter', {
          type: counter,
          count: counters[counter]
        });
      }

      this.$store.commit('updateUser', Object.assign(user, { activeTime: Date.now() }));
      longpoll.start(lp);
    }
  }
</script>
