<template>
  <div class="act_menu_wrap">
    <div class="act_menu_btn_wrap" @click="openMenu">
      <img src="~assets/actions_icon.svg" class="act_menu_btn">
    </div>

    <div :class="['act_menu', { active }]"><slot></slot></div>
  </div>
</template>

<script>
  export default {
    data: () => ({
      active: false,
      timeout: null
    }),
    methods: {
      openMenu() {
        clearTimeout(this.timeout);

        if(this.active) {
          document.body.removeEventListener('mousemove', this.onMouseMove);
          this.active = false;
        } else {
          document.body.addEventListener('mousemove', this.onMouseMove);
          this.active = true;
        }
      },
      onMouseMove(event) {
        const close = !event.path.find((el) => {
          return el.classList && el.classList.contains('act_menu_wrap');
        });

        clearTimeout(this.timeout);

        if(close) {
          this.timeout = setTimeout(() => {
            document.body.removeEventListener('mousemove', this.onMouseMove);
            this.active = false;
          }, 600);
        } else {
          this.active = true;
        }
      }
    }
  }
</script>

<style>
  .act_menu_wrap {
    position: relative;
  }

  .act_menu_btn_wrap {
    height: 40px;
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
    right: 0;
    padding: 4px 0;
    margin: 6px;
    margin-top: -6px;
    opacity: 0;
    pointer-events: none;
    z-index: 5;
    background-color: #fff;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, .12);
    box-shadow: 0 4px 36px -6px rgba(0, 0, 0, .4);
    transition: all .3s;
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
    user-select: none;
    transition: background-color .3s;
  }

  .act_menu_item:hover {
    background-color: #f1f1f3;
  }

  .act_menu_separator {
    height: 1px;
    margin: 4px 0;
    background-color: #e0e0e0;
  }

  .act_menu_icon {
    margin-right: 12px;
  }
</style>
