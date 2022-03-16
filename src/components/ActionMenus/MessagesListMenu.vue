<template>
  <ActionsMenu class="messagesList_act_menu">
    <div class="act_menu_item" @click="toggleSetting('typing')">
      <Checkbox :active="settings.typing" />
      <div class="act_menu_data">{{ l('im_send_typing') }}</div>
    </div>

    <div class="act_menu_item" @click="toggleSetting('notRead')">
      <Checkbox :active="settings.notRead" />
      <div class="act_menu_data">{{ l('im_not_read_messages') }}</div>
    </div>

    <div class="act_menu_item" @click="openModal('settings')">
      <Icon name="menu/settings" color="var(--icon-gray)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('app_settings') }}</div>
    </div>
  </ActionsMenu>
</template>

<script>
import { computed } from 'vue';
import store from 'js/store';
import { openModal } from 'js/modals';

import ActionsMenu from './ActionsMenu.vue';
import Checkbox from '../UI/Checkbox.vue';
import Icon from '../UI/Icon.vue';

export default {
  components: {
    ActionsMenu,
    Checkbox,
    Icon
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);

    function toggleSetting(name) {
      store.commit('settings/updateUserSettings', {
        [name]: !settings.value[name]
      });
    }

    return {
      settings,
      toggleSetting,
      openModal
    };
  }
};
</script>

<style>
.messagesList_act_menu .checkbox {
  margin: 0 2px;
}
</style>
