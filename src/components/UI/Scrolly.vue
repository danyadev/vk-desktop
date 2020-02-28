<template>
  <div :class="['scrolly', { isActive, isScrolling }]"
       @wheel.passive="onWheel"
       @touchstart="onTouchStart"
       @touchmove.passive="onTouchMove"
       @touchend="hideScrollBars"
       @keydown="onKeyDown"
       tabindex="1"
  >
    <div :class="['scrolly-viewport', vclass]" ref="viewport"><slot /></div>

    <div class="scrolly-bar-wrap axis-x"
         @mouseenter="activateScrollBars({ enter: 1 })"
         @mouseleave="hideScrollBars"
         @mousedown="onMouseDown"
    >
      <div class="scrolly-bar" ref="barX"></div>
    </div>

    <div class="scrolly-bar-wrap axis-y"
         @mouseenter="activateScrollBars({ enter: 1 })"
         @mouseleave="hideScrollBars"
         @mousedown="onMouseDown"
    >
      <div class="scrolly-bar" ref="barY"></div>
    </div>
  </div>
</template>

<script>
  const timers = {};

  function debounce(fn) {
    return function(...args) {
      const id = this._uid;
      clearTimeout(timers[id]);

      timers[id] = setTimeout(() => {
        fn.apply(this, args);
        timers[id] = null;
      }, 500);
    }
  }

  function normalize(num, max) {
    return Math.max(0, Math.min(num, max));
  }

  function toPercent(n) {
    return `${normalize(n, 1) * 100}%`;
  }

  function isNodesEqual(a, b) {
    let i = a.length;

    if(i != b.length) return false;

    while(i--) {
      if(!a[i].isEqualNode(b[i])) return false;
    }

    return true;
  }

  // Использование функции уменьшит итоговое кол-во кода в бандле
  function promisedAnimationFrame() {
    return new Promise(requestAnimationFrame);
  }

  export default {
    props: ['vclass', 'lock', 'horizontalScroll'],

    data: () => ({
      // true во время перетаскивания скроллбара кнопкой мыши
      isScrolling: false,
      // true в случае, когда нужно отображать полоску скроллбара
      isActive: false
    }),

    methods: {
      onWheel({ altKey, deltaX, deltaY }) {
        if(altKey || this.horizontalScroll) {
          deltaX = deltaY > 0 ? 100 : -100;
          deltaY = 0;
        }

        const isEndScroll = this.refreshScrollLayout(deltaX, deltaY) == false;

        if(!this.lock && (isEndScroll && this.horizontalScroll || !isEndScroll)) {
          event.stopPropagation();
          this.activateScrollBars();
        }
      },

      onTouchStart({ touches: [touch] }) {
        this.touchX = touch.pageX;
        this.touchY = touch.pageY;

        this.activateScrollBars({ enter: 1 });
      },

      async onTouchMove({ touches: [touch] }) {
        await promisedAnimationFrame();

        const dx = this.touchX - touch.pageX;
        const dy = this.touchY - touch.pageY;

        this.touchX = touch.pageX;
        this.touchY = touch.pageY;

        this.refreshScrollLayout(dx, dy);
      },

      onKeyDown() {
        const { clientHeight } = this.$el;
        const data = {
          33: [0, 10 - clientHeight], // Page Up
          34: [0, clientHeight - 10], // Page Down
          37: [-20, 0], // Left Arrow
          38: [0, -20], // Up Arrow
          39: [20, 0], // Right Arrow
          40: [0, 20] // Down Arrow
        }[event.which];

        if(data) {
          if(event.which == 33 || event.which == 34) {
            event.preventDefault();
          }

          this.activateScrollBars();
          this.refreshScrollLayout(...data);
        }
      },

      onMouseDown({ target, pageX: initialPageX, pageY: initialPageY }) {
        const { viewport } = this.$refs;
        const bar = target.matches('.scrolly-bar') ? target : target.firstChild;
        const initialBarTop = bar.offsetTop;
        const initialBarLeft = bar.offsetLeft;

        const onMouseMove = async ({ target, pageX, pageY, offsetX, offsetY }, isMouseUp) => {
          if(this.lock) return;

          const isMoveToPoint = isMouseUp && target.matches('.scrolly-bar-wrap');
          const { scrollWidth, offsetWidth, scrollHeight, offsetHeight } = viewport;
          let dx = 0, dy = 0;

          await promisedAnimationFrame();

          if(bar.parentElement.matches('.axis-x')) {
            const maxBarLeft = offsetWidth - bar.offsetWidth;
            const barLeft = normalize(
              isMoveToPoint ? (offsetX - bar.offsetWidth/2) : (initialBarLeft + pageX - initialPageX),
              maxBarLeft
            );
            const scrollLeft = barLeft / maxBarLeft * (scrollWidth - offsetWidth);

            dx = scrollLeft - viewport.scrollLeft;
            viewport.scrollLeft = scrollLeft;
            bar.style.left = toPercent(barLeft / offsetWidth);
          } else {
            const maxBarTop = offsetHeight - bar.offsetHeight;
            const barTop = normalize(
              isMoveToPoint ? (offsetY - bar.offsetHeight/2) : (initialBarTop + pageY - initialPageY),
              maxBarTop
            );
            const scrollTop = barTop / maxBarTop * (scrollHeight - offsetHeight);

            dy = scrollTop - viewport.scrollTop;
            viewport.scrollTop = scrollTop;
            bar.style.top = toPercent(barTop / offsetHeight);
          }

          this.$emit('scroll', Object.assign(viewport, { dx, dy }))
        };

        const onMouseUp = (event) => {
          this.isScrolling = false;

          if(initialPageX == event.pageX && initialPageY == event.pageY) {
            onMouseMove(event, true);
          } else if(event.target != target) {
            this.activateScrollBars({ force: 1 });
          }

          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        this.isScrolling = true;
        this.isActive = true;
        clearTimeout(timers[this._uid]);
        timers[this._uid] = null;

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      },

      activateScrollBars({ enter, force } = {}) {
        if(enter) {
          this.isActive = true;
          clearTimeout(timers[this._uid]);
          timers[this._uid] = null;
        } else if(force || !this.isActive || timers[this._uid]) {
          this.isActive = true;
          this.hideScrollBars();
        }
      },

      hideScrollBars: debounce(function() {
        if(!this.isScrolling) this.isActive = false;
      }),

      refreshScrollLayout(dx = 0, dy = 0) {
        const { viewport, barX, barY } = this.$refs;
        if(!viewport) return;

        if(!this.lock) {
          const {
            scrollLeft: prevScrollLeft,
            scrollTop: prevScrollTop
          } = viewport;

          viewport.scrollLeft += dx;
          viewport.scrollTop += dy;

          const noX = dx && prevScrollLeft == viewport.scrollLeft;
          const noY = dy && prevScrollTop == viewport.scrollTop;

          // Здесь не нужна проверка на !dx && !dy, потому что
          // такой кейс появляется только когда метод вызван вручную
          if(noX && noY || noX && !dy || noY && !dx) return false;
        }

        const {
          scrollLeft, scrollWidth, offsetWidth,
          scrollTop, scrollHeight, offsetHeight
        } = viewport;

        const width = toPercent(offsetWidth / scrollWidth);
        const height = toPercent(offsetHeight / scrollHeight);

        barX.style.width = width;
        barY.style.height = height;

        barX.parentElement.style.display = width == '100%' ? 'none' : 'block';
        barY.parentElement.style.display = height == '100%' ? 'none' : 'block';

        const barLeft = scrollLeft / (scrollWidth - offsetWidth) * (offsetWidth - barX.offsetWidth);
        const barTop = scrollTop / (scrollHeight - offsetHeight) * (offsetHeight - barY.offsetHeight);

        barX.style.left = toPercent(barLeft / offsetWidth);
        barY.style.top = toPercent(barTop / offsetHeight);

        if(dx || dy) this.$emit('scroll', Object.assign(viewport, { dx, dy }));
      }
    },

    mounted() {
      this.observer = new MutationObserver((records) => {
        if(!records.every(({ target, addedNodes: a, removedNodes: r }) => {
          // 1) Если вызов произошел из-за ripple-анимации
          // 2) Если вызов произошел от перерендера элементов
          // Возможно будет исправлено в новых версиях Vue
          return target.matches && target.matches('.ripples') || isNodesEqual(a, r);
        })) this.refreshScrollLayout();
      });

      this.observer.observe(this.$refs.viewport, {
        childList: true,
        characterData: true,
        subtree: true
      });

      this.resizeObserver = new ResizeObserver(() => this.refreshScrollLayout());
      this.resizeObserver.observe(this.$refs.viewport, { box: 'border-box' });
    },

    beforeDestroy() {
      this.observer.disconnect();
      this.resizeObserver.disconnect();
    }
  }
</script>

<style>
  .scrolly {
    position: relative;
  }

  .scrolly.isScrolling {
    -webkit-user-drag: none;
  }

  .scrolly-viewport {
    overflow: hidden;
    height: 100%;
  }

  .scrolly-bar-wrap {
    position: absolute;
    z-index: 1;
  }

  .scrolly-bar-wrap.axis-x {
    bottom: 0;
    left: 0;
    width: 100%;
    height: 15px;
  }

  .scrolly-bar-wrap.axis-y {
    top: 0;
    right: 0;
    width: 15px;
    height: 100%;
  }

  .scrolly-bar {
    box-sizing: content-box;
    position: absolute;
    border: 4px solid transparent;
    cursor: pointer;
    opacity: 0;
    transition: opacity .3s;
  }

  .scrolly.isActive > .scrolly-bar-wrap .scrolly-bar {
    opacity: 1;
  }

  .scrolly-bar::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--scrolly-background-first);
    border-radius: 7px;
    transition: background-color .3s;
  }

  .scrolly-bar:hover::before,
  .scrolly.isScrolling > .scrolly-bar-wrap .scrolly-bar::before {
    background: var(--scrolly-background-second);
  }

  .scrolly-bar-wrap.axis-x .scrolly-bar {
    bottom: 0;
    height: 7px;
    min-width: 20%;
  }

  .scrolly-bar-wrap.axis-y .scrolly-bar {
    right: 0;
    width: 7px;
    min-height: 20%;
  }
</style>
