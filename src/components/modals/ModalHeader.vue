<template>
  <div class="modal_header" :closable="closable">
    <div class="modal_header_title"><slot /></div>
    <div class="modal_header_buttons">
      <slot name="icons" />
      <CloseModal :closable="closable" />
    </div>
  </div>
</template>

<script>
import CloseModal from './CloseModal.vue';

export default {
  components: {
    CloseModal
  },

  setup(props) {
    return {
      closable: ('closable' in props) ? props.closable : true
    };
  }
};
</script>

<style>
.modal_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--blue-background);
  height: 48px;
  padding: 0 10px 0 25px;
}

.modal_header_title {
  font-size: 15px;
  color: var(--blue-background-text);
  line-height: 18px;
}

.modal_header_buttons {
  display: flex;
  align-items: center;
}
</style>
