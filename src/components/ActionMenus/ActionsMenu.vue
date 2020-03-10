<template>
  <div class="act_menu_wrap">
    <Ripple class="ripple_fast act_menu_btn_wrap"
            color="rgba(255, 255, 255, .2)"
            @click="toggleMenu">
      <img src="~assets/actions_icon.svg" class="act_menu_btn">
    </Ripple>

    <div :class="['act_menu', { active }]"><slot v-if="!hideList" /></div>
  </div>
</template>

<script>
  import Ripple from '../UI/Ripple.vue';

  export default {
    props: ['hideList'],

    components: {
      Ripple
    },

    data: () => ({
      active: false,
      timeout: null
    }),

    methods: {
      toggleMenu() {
        if(this.active) removeEventListener('mousemove', this.onMouseMove);
        else addEventListener('mousemove', this.onMouseMove);

        clearTimeout(this.timeout);
        this.timeout = null;

        this.active = !this.active;
      },

      onMouseMove(event) {
        const close = !event.path.find((el) => el == this.$el);

        if(close) {
          if(!this.timeout) {
            this.timeout = setTimeout(this.toggleMenu, 500);
          }
        } else {
          clearTimeout(this.timeout);
          this.timeout = null;

          this.active = true;
        }
      }
    }
  }
</script>

<style>
  .act_menu_wrap {
    position: relative;
    z-index: 3;
  }

  .act_menu_btn_wrap {
    height: 40px;
    border-radius: 50%;
  }

  .act_menu_btn {
    width: 40px;
    height: 40px;
    padding: 8px;
    cursor: pointer;
    opacity: .7;
    transition: opacity .3s;
  }

  .act_menu_btn:hover {
    opacity: 1;
  }

  .act_menu {
    position: absolute;
    width: 250px;
    min-height: 50px;
    right: 0;
    padding: 6px 0;
    margin: -6px 6px 6px 6px;
    opacity: 0;
    pointer-events: none;
    z-index: 2;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 0 4px rgba(0, 0, 0, .2),
                0 4px 36px -6px rgba(0, 0, 0, .4);
    transition: opacity .3s, margin-top .3s;
  }

  .act_menu.active {
    margin-top: 6px;
    opacity: 1;
    pointer-events: all;
  }

  .act_menu_item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    transition: background-color .3s;
  }

  .act_menu_item:hover {
    background: #ebedf0;
  }

  .act_menu_separator {
    height: 1px;
    margin: 4px 0;
    background: #e0e0e0;
  }

  .act_menu_icon {
    flex: none;
    width: 24px;
    height: 24px;
  }

  .act_menu_data {
    margin-left: 12px;
    line-height: 18px;
  }
</style>
