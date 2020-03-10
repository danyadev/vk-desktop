<template>
  <div>
    <div class="settings_line clickable" @click="click('devShowPeerId')">
      {{ l('settings_show_peer_id') }}
      <Checkbox :active="settings.devShowPeerId" />
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';

  import Checkbox from '../../UI/Checkbox.vue';

  export default {
    components: {
      Checkbox
    },

    computed: {
      ...mapGetters('settings', ['settings'])
    },

    methods: {
      click(name) {
        this.$store.commit('settings/updateUserSettings', {
          [name]: !this.settings[name]
        });
      }
    }
  }
</script>

<style>
</style>
