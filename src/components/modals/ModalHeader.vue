<template>
  <div class="modal_header" :closable="closable">
    <div class="modal_header_title"><slot></slot></div>
    <Ripple v-if="closable"
            color="rgba(255, 255, 255, .2)"
            class="fast modal_header_close"
            @click.stop="close"
    >
      <Icon name="close" color="#fff"/>
    </Ripple>
  </div>
</template>

<script>
  import Ripple from '../UI/Ripple.vue';
  import Icon from '../UI/Icon.vue';

  export default {
    props: {
      closable: {
        type: Boolean,
        default: true
      }
    },
    components: {
      Ripple,
      Icon
    },
    methods: {
      close() {
        this.$modals.close(this.$parent.$attrs.name);
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
    width: 32px;
    height: 32px;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .modal_header_close svg {
    width: 16px;
    height: 16px;
  }

  .modal_header_close:hover { opacity: 1 }
</style>
