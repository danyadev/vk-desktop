<template>
  <div class="im_chat_container im_chat_forward">
    <div class="header"></div>
    <div class="im_chat_empty">
      <Icon name="reply" color="var(--icon-dark-gray)" width="34" height="34" />
      {{ l('im_choose_chat_to_forward') }}
    </div>
  </div>
</template>

<script>
import Icon from '../UI/Icon.vue';

export default {
  components: {
    Icon
  }
};
</script>

<style>
.im_chat_forward svg {
  margin-bottom: 6px;
}
</style>
