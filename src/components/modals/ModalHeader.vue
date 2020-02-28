<template>
  <div class="modal_header" :closable="closable">
    <div class="modal_header_title"><slot /></div>
    <div class="modal_header_buttons">
      <slot name="icons" />
      <Ripple v-if="closable"
              color="rgba(255, 255, 255, .2)"
              class="ripple_fast modal_header_close"
              @click.stop="close"
      >
        <Icon name="close" color="var(--header-icon)" />
      </Ripple>
    </div>
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
    background: var(--header-background);
    height: 48px;
    padding: 0 10px 0 25px;
  }

  .modal_header_title {
    font-size: 15px;
    color: var(--header-text);
  }

  .modal_header_buttons {
    display: flex;
    align-items: center;
  }

  .modal_header_close {
    width: 40px;
    height: 40px;
    padding: 12px;
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
