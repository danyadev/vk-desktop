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
import {
  reactive,
  toRefs,
  inject,
  onMounted,
  onActivated,
  onBeforeUnmount,
  onDeactivated
} from 'vue';
import lottie from 'lottie-web/build/player/lottie_light';
import { mouseOverWrapper, mouseOutWrapper } from 'js/utils';
import store from 'js/store';

export default {
  props: ['attach', 'msg'],

  setup(props) {
    const intersectionObserver = inject('intersectionObserver');

    // eslint-disable-next-line vue/no-setup-props-destructure
    const [sticker] = props.attach;
    const image = sticker.images[devicePixelRatio > 1 ? 2 : 1].url;
    const { animation_url } = sticker;

    const state = reactive({
      transparent: null,
      container: null,
      isAnimation: !!animation_url,
      isAnimationLoaded: false
    });

    let animation;
    let isHovered = true;
    let isFirstAnimated = !props.msg.fromLongPoll;

    function onObserve(entries) {
      requestIdleCallback(() => {
        for (const entry of entries) {
          if (entry.target === state.transparent) {
            if (
              entry.isIntersecting && !isFirstAnimated &&
              store.getters['settings/settings'].animateStickersOnFirstAppear
            ) {
              if (!animation) {
                isHovered = false;
                initAnimation();
              } else if (state.isAnimationLoaded && animation.isPaused) {
                animation.goToAndPlay(0);
              }

              isFirstAnimated = true;
            }

            if (!entry.isIntersecting) {
              isHovered = false;

              if (state.isAnimationLoaded && !animation.isPaused) {
                animation.goToAndStop(0);
              }
            }
          }
        }
      });
    }

    function onShow() {
      intersectionObserver.addCallback(onObserve);
      intersectionObserver.observer.observe(state.transparent);
    }

    function onHide() {
      intersectionObserver.removeCallback(onObserve);
      intersectionObserver.observer.unobserve(state.transparent);

      if (isHovered) {
        state.transparent.removeEventListener('mouseout', onMouseOut);
        isHovered = false;
      }
    }

    if (state.isAnimation) {
      onMounted(onShow);
      onActivated(onShow);
      onBeforeUnmount(onHide);
      onDeactivated(onHide);
    }

    function initAnimation() {
      animation = lottie.loadAnimation({
        container: state.container,
        path: animation_url,
        renderer: 'svg',
        autoplay: false,
        loop: false,

        rendererSettings: {
          progressiveLoad: true
        }
      });

      const stopDataReady = animation.addEventListener('data_ready', () => {
        stopDataReady();
        requestIdleCallback(() => {
          state.isAnimationLoaded = true;
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

    const onMouseOver = mouseOverWrapper(() => {
      state.transparent.addEventListener('mouseout', onMouseOut);
      isHovered = true;

      if (!animation && animation_url) {
        initAnimation();
      }

      if (state.isAnimationLoaded && animation.isPaused) {
        animation.goToAndPlay(0);
      }
    });

    const onMouseOut = mouseOutWrapper(() => {
      state.transparent.removeEventListener('mouseout', onMouseOut);
      isHovered = false;
    });

    return {
      ...toRefs(state),

      image,
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
