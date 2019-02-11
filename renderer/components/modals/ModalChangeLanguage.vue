<template>
  <div class="modal">
    <modal-header>{{ l('change_lang') }}</modal-header>
    <div class="modal_content language_modal">
      <div class="menu_items">
        <div class="menu_item"
            v-for="lang of languages" 
            :class="{ 'active': langName == lang[0] }"
            :key="lang[0]" :data-key="lang[0]" 
            @click="setLang(lang[0])">
          <div class="menu_item_icon"></div>
          <div class="menu_item_name">{{ lang[1] }}</div>
        </div>
      </div>
    </div>
    <div class="modal_bottom">
      <button class="button right" @click="close">{{ l('close') }}</button>
    </div>
  </div>
</template>

<script>
  const { getDate } = require('./../messages/methods');
  const { mapState } = Vuex;

  module.exports = {
    data: () => ({
      languages: [['ru', 'Русский'], ['en', 'English']]
    }),
    computed: {
      ...mapState(['langName'])
    },
    methods: {
      setLang(key) {
        this.$store.commit('setLang', key);
        this.close()
      },
      close() {
        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
