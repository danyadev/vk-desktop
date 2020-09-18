<template>
  <ContextMenu :event="event">
    <div class="act_menu_item" @click="$store.commit('users/removeUser', id)">
      <Icon name="trash" color="var(--icon-dark-gray)" class="act_menu_icon" />
      <div class="act_menu_data">{{ l('delete_account') }}</div>
    </div>
  </ContextMenu>
</template>

<script>
import ContextMenu from './ContextMenu.vue';
import Icon from '../UI/Icon.vue';

export default {
  props: ['event', 'id'],

  components: {
    ContextMenu,
    Icon
  }
};
</script>
