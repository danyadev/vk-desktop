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
import { computed } from 'vue';
import store from 'js/store';

import ActionsMenu from './ActionsMenu.vue';
import Checkbox from '../UI/Checkbox.vue';

export default {
  components: {
    ActionsMenu,
    Checkbox
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);

    function click(name) {
      store.commit('settings/updateUserSettings', {
        [name]: !settings.value[name]
      });
    }

    return {
      settings,
      click
    };
  }
};
</script>
