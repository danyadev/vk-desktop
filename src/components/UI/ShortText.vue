<template>
  <span class="short_text_wrap">
    <span ref="root" :style="{ lineClamp: short ? shortenLines : 'unset' }">
      <slot />
    </span>

    <div
      v-if="short"
      class="link show_full_text roboto-vk"
      @click="short = false"
    >
      {{ l('show_in_full') }}
    </div>
  </span>
</template>

<script>
import { reactive, onMounted, onUnmounted } from 'vue';

export default {
  props: {
    maxLines: {
      type: Number,
      default: 25
    },

    shortenLines: {
      type: Number,
      default: 10
    }
  },

  setup(props) {
    const state = reactive({
      root: null,
      short: false
    });

    let lineHeight;

    function checkHeight() {
      const lines = state.root.offsetHeight / lineHeight;

      if (lines > props.maxLines) {
        state.short = true;
        window.removeEventListener('resize', checkHeight);
      }
    }

    onMounted(() => {
      const style = getComputedStyle(state.root);
      lineHeight = parseInt(style.lineHeight);

      if (!lineHeight) {
        return console.error('Не был найден line-height');
      }

      window.addEventListener('resize', checkHeight);
      checkHeight();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkHeight);
    });

    return state;
  }
};
</script>

<style>
.short_text_wrap > span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.show_full_text {
  display: block;
  font-size: 13px;
  user-select: none;
}
</style>
