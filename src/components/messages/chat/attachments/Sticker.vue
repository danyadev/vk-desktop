<template>
  <div
    v-if="isAnimation"
    v-show="isAnimationLoaded"
    ref="container"
    class="attach_sticker"
    @mousemove="startAnimation"
  ></div>

  <img
    v-if="!isAnimationLoaded"
    class="attach_sticker"
    :src="image"
    loading="lazy"
    width="128"
    height="128"
    @mousemove.once="isAnimation && startAnimation()"
  >
</template>

<script>
import { ref } from 'vue';
import lottie from 'lottie-web';

export default {
  props: ['attach'],

  setup(props) {
    const [sticker] = props.attach;
    const image = sticker.images[devicePixelRatio > 1 ? 2 : 1].url;
    const { animation_url } = sticker;

    const container = ref(null);
    const isAnimationLoaded = ref(false);
    let firstAnimationStarted = false;
    let animation;

    function startAnimation() {
      if (!firstAnimationStarted) {
        firstAnimationStarted = true;

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

        animation.addEventListener('complete', () => {
          animation.goToAndStop(0);
        });
      } else if (animation.isPaused) {
        animation.goToAndPlay(0);
      }
    }

    return {
      container,
      image,
      isAnimation: !!animation_url,
      isAnimationLoaded,
      startAnimation
    };
  }
};
</script>

<style>
.attach_sticker {
  vertical-align: middle;
  width: 128px;
  height: 128px;
}
</style>
