<template>
  <ActionsMenu>
    <div class="act_menu_item" @click="click('typing')">
      <Checkbox :active="settings.typing" />
      <div class="act_menu_data">{{ l('im_send_typing') }}</div>
    </div>
    
    <div class="act_menu_item" @click="click('notRead')">
      <Checkbox :active="settings.notRead" />
      <div class="act_menu_data">{{ l('im_not_read_messages') }}</div>
    </div>
  </ActionsMenu>
</template>

<script>
  import { mapGetters } from 'vuex';

  import ActionsMenu from './ActionsMenu.vue';
  import Checkbox from '../UI/Checkbox.vue';

  export default {
    components: {
      ActionsMenu,
      Checkbox
    },

    computed: {
      ...mapGetters('settings', ['settings'])
    },

    methods: {
      click(name) {
        this.$store.commit('settings/updateMessagesSettings', {
          key: name,
          value: !this.settings[name]
        });
      }
    }
  }
</script>
