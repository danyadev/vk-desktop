<template>
  <div class="menu_wrap" :class="{ active: menuState }" @click="toggleMenu">
    <div class="menu">
      <div class="menu_account_item">
        <img class="menu_account_bgc" :src="user.photo_100"/>
        <div class="menu_multiacc" @click.stop="openModal('multiaccount')"></div>
        <img class="acc_icon"
             :src="user.photo_100"
             @click="/*openPage('profile')*/"/>
        <div class="menu_acc_name">
          {{ user.first_name }} {{ user.last_name }}
          <div class="verified" v-if="user.verified"></div>
        </div>
        <div class="menu_acc_status" v-emoji="user.status"></div>
      </div>
      <div class="menu_items">
        <div class="menu_item"
             v-for="page of list"
             @click.stop="openPage(page)"
             :class="{ active: $root.section == page }">
          <div class="menu_item_icon" :class="page"></div>
          <div class="menu_item_name">{{ l('menu', page) }}</div>
          <div class="menu_item_counter">{{ counters[page] || '' }}</div>
        </div>
        <div class="menu_item logout" @click.stop="openModal('logout')">
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
      ...mapState(['menuState']),
      user() {
        return this.$root.user;
      }
    },
    methods: {
      toggleMenu(event) {
        let state;

        if(typeof event == 'boolean') state = event;
        else state = qs('.menu_wrap') != event.target;

        this.$store.commit('setMenuState', state);
      },
      openPage(page) {
        this.toggleMenu(false);
        this.$store.commit('settings/setSection', page);
      },
      openModal(name) {
        this.toggleMenu(false);

        // Задержка нужна для того, чтобы меню успело закрыться
        setTimeout(() => this.$modals.open(name), 100);
      }
    },
    async mounted() {
      const { lp, user, counters } = await vkapi('execute.init', {
        lp_version: longpoll.version,
        fields: `${utils.fields},status`
      });

      this.$store.commit('settings/updateCounters', counters);
      this.$store.commit('settings/updateUser', Object.assign({}, user, { activeTime: Date.now() }));
      longpoll.start(lp);

      // Загрузка стикеров. Разделен вызов этих методов с методами выше по причине того,
      // что эти методы выполняются 20+ секунд, и это недопустимо большое время для загрузки.
      let favoriteStickers = await vkapi('store.getFavoriteStickers', { offToken: true }),
          { stickers, recent } = await vkapi('execute.getStickers');
    }
  }
</script>
