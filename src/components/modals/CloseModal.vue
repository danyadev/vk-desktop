<template>
  <Ripple v-if="closable"
          :color="isSettings ? 'rgba(0, 0, 0, .12)' : 'rgba(255, 255, 255, .2)'"
          class="ripple_fast modal_header_close"
          @click.stop="close"
  >
    <Icon name="close" />
  </Ripple>
</template>

<script>
  import Ripple from '../UI/Ripple.vue';
  import Icon from '../UI/Icon.vue';

  export default {
    props: ['closable', 'isSettings'],

    components: {
      Ripple,
      Icon
    },

    methods: {
      close() {
        const parent = this.isSettings ? this.$parent : this.$parent.$parent;

        this.$modals.close(parent.$attrs.name);
      }
    }
  }
</script>

<style>
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
    color: #fff;
    width: 16px;
    height: 16px;
  }

  .modal_header_close:hover { opacity: 1 }
</style>
