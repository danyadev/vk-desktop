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
    @mouseover.once="isStickerHovered = true"
  >
</template>

<script>
import { ref, onMounted } from 'vue';
import lottie from 'lottie-web';

export default {
  props: ['attach'],

  setup(props) {
    const [sticker] = props.attach;
    const image = sticker.images[devicePixelRatio > 1 ? 2 : 1].url;

    let animation;
    const { animation_url } = sticker;
    const container = ref(null);
    const isAnimationLoaded = ref(false);
    const isStickerHovered = ref(false);

    if (animation_url) {
      onMounted(() => {
        animation = lottie.loadAnimation({
          container: container.value,
          path: animation_url,
          renderer: 'svg',
          autoplay: false,
          loop: false
        });

        animation.addEventListener('data_ready', () => {
          isAnimationLoaded.value = true;

          if (isStickerHovered.value) {
            animation.play();
          }
        });
      });
    }

    function startAnimation() {
      if (animation.isPaused) {
        animation.goToAndPlay(0);
      }
    }

    return {
      image,
      isAnimation: !!animation_url,
      isAnimationLoaded,
      isStickerHovered,
      container,
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
