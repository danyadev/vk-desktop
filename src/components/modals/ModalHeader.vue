<template>
  <div class="modal_header" :closable="closable">
    <div class="modal_header_title"><slot></slot></div>
    <img v-if="closable" src="~assets/close_white.svg" class="modal_header_close" @click.stop="close">
  </div>
</template>

<script>
  module.exports = {
    props: {
      closable: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      close() {
        this.$modal.close(this.$parent.$attrs.name);
      }
    }
  }
</script>

<style>
  .modal_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #5281b9;
    height: 48px;
    padding: 0 10px 0 25px;
    border-radius: 5px 5px 0 0;
  }

  .modal_header_title {
    font-size: 15px;
    color: #f3f3f3;
  }

  .modal_header_close {
    box-sizing: content-box;
    width: 16px;
    height: 16px;
    padding: 8px;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .modal_header_close:hover { opacity: 1 }
</style>
