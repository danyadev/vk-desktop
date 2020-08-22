<template>
  <div class="modal_header">
    <div class="modal_header_title"><slot /></div>
    <div class="modal_header_buttons">
      <slot name="icons" />
      <CloseModal :closable="!('unclosable' in $props)" />
    </div>
  </div>
</template>

<script>
import CloseModal from './CloseModal.vue';

export default {
  props: ['unclosable'],

  components: {
    CloseModal
  }
};
</script>

<style>
.modal_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--background-blue);
  height: 48px;
  padding: 0 10px 0 25px;
}

.modal_header_title {
  font-size: 15px;
  color: var(--background-blue-text);
  line-height: 18px;
}

.modal_header_buttons {
  display: flex;
  align-items: center;
}
</style>
