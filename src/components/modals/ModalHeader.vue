<template>
  <div class="modal_header" :closable="closable">
    <div class="modal_header_title"><slot></slot></div>
    <div v-if="closable" @click.stop="close" class="modal_header_close"></div>
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
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
    height: 50px;
    padding: 0 25px;
    border-radius: 5px 5px 0 0;
  }

  .modal_header_title {
    font-size: 15px;
    color: #eee;
  }

  .modal_header_close {
    width: 32px;
    height: 32px;
    cursor: pointer;
    opacity: .7;
    margin-right: -15px;
    background-image: url('~assets/modal_close.svg');
    background-size: 16px;
    background-position: center;
    background-repeat: no-repeat;
    transition: opacity .3s;
  }

  .modal_header_close:hover { opacity: 1 }
</style>
