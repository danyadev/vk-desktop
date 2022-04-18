<template>
  <div class="settings_line clickable" @click="toggle('showUnreadCountBadge'), updateBadgeCount()">
    {{ l('ml_settings_options', 'show_unread_count_badge') }}
    <Checkbox :active="settings.showUnreadCountBadge" />
  </div>

  <div
    :class="['settings_line clickable nested', { disabled: !settings.showUnreadCountBadge }]"
    @click="toggle('countOnlyUnmutedChats'), updateBadgeCount()"
  >
    {{ l('ml_settings_options', 'count_only_unmuted_chats') }}
    <Checkbox :active="settings.countOnlyUnmutedChats" />
  </div>
</template>

<script>
import { computed } from 'vue';
import store from 'js/store';

import Checkbox from '@/UI/Checkbox.vue';

export default {
  components: {
    Checkbox
  },

  setup() {
    const settings = computed(() => store.getters['settings/settings']);

    function toggle(name) {
      store.commit('settings/updateCommonSettings', {
        [name]: !settings.value[name]
      });
    }

    function updateBadgeCount() {
      store.dispatch('setBadgeCount');
    }

    return {
      settings,
      toggle,
      updateBadgeCount
    };
  }
};
</script>
