<template>
  <Icon
    v-if="closable"
    name="close"
    color="var(--background-blue-text)"
    class="modal_header_close icon-hover"
    @click.stop="closeModal()"
  />
</template>

<script>
import { closeModal } from 'js/modals';

import Icon from '../UI/Icon.vue';

export default {
  props: ['closable'],

  components: {
    Icon
  },

  setup() {
    return { closeModal };
  }
};
</script>

<style>
.modal_header_close {
  width: 40px;
  height: 40px;
  padding: 12px;
  border-radius: 50%;
}
</style>
