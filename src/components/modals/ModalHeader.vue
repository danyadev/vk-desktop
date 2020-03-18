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
      closable: 'closable' in props ? props.closable : true
    };
  }
};
</script>

<style>
.modal_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #5281b9;
  height: 48px;
  padding: 0 10px 0 25px;
}

.modal_header_title {
  font-size: 15px;
  color: #f3f3f3;
  line-height: 18px;
}

.modal_header_buttons {
  display: flex;
  align-items: center;
}
</style>
