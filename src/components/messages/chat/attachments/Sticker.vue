<template>
  <div class="attach_sticker">
    <div
      v-if="isAnimation"
      ref="transparent"
      class="attach_sticker_transparent"
      @mouseover="onMouseOver"
    />

    <div
      v-if="isAnimation"
      v-show="isAnimationLoaded"
      ref="container"
    />

    <img
      v-if="!isAnimationLoaded"
      :src="image"
      loading="lazy"
      width="128"
      height="128"
    >
  </div>
</template>

<script>
import { ref } from 'vue';
import lottie from 'lottie-web/build/player/lottie_light';

export default {
  props: ['attach'],

  setup(props) {
    const [sticker] = props.attach;
    const image = sticker.images[devicePixelRatio > 1 ? 2 : 1].url;
    const { animation_url } = sticker;

    const transparent = ref(null);
    const container = ref(null);
    const isAnimationLoaded = ref(false);
    let animation;
    let isHovered = true; // первая проверка будет когда мышь уже наведена

    function initAnimation() {
      animation = lottie.loadAnimation({
        container: container.value,
        path: animation_url,
        renderer: 'svg',
        autoplay: false,
        loop: false,

        rendererSettings: {
          progressiveLoad: true
        }
      });

      animation.addEventListener('data_ready', () => {
        requestIdleCallback(() => {
          isAnimationLoaded.value = true;
          animation.play();
        });
      });

      // Приходит после завершения анимации
      animation.addEventListener('complete', () => {
        if (isHovered) {
          animation.goToAndPlay(0);
        } else {
          animation.goToAndStop(0);
        }
      });
    }

    function onMouseOver() {
      transparent.value.addEventListener('mouseout', onMouseOut);
      isHovered = true;

      if (!animation && animation_url) {
        initAnimation();
      }

      if (isAnimationLoaded.value && animation.isPaused) {
        animation.goToAndPlay(0);
      }
    }

    function onMouseOut() {
      transparent.value.removeEventListener('mouseout', onMouseOut);
      isHovered = false;
    }

    return {
      transparent,
      container,
      image,
      isAnimation: !!animation_url,
      isAnimationLoaded,
      initAnimation,
      onMouseOver
    };
  }
};
</script>

<style>
.attach_sticker > * {
  vertical-align: middle;
  width: 128px;
  height: 128px;
}

.attach_sticker_transparent {
  position: absolute;
  z-index: 1;
}
</style>
