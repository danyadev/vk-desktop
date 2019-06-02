<template>
  <div :class="['scrolly', { isScrolling, isActive }]"
       @mouseenter="refreshScrollLayout()"
       @mousedown="onMouseDown"
       @mouseleave="onMouseLeave"
       @mousemove="activateScrollBars($event, true)"
       @touchstart="onTouchStart"
       @touchmove.passive="onTouchMove"
       @touchend="onTouchEnd"
       @wheel.passive="onWheel"
       @keydown="onKeyDown"
       tabindex="1"
  >
    <div class="scrolly-viewport" ref="viewport" :class="vclass"><slot></slot></div>
    <div class="scrolly-bar-wrap axis-x"><div class="scrolly-bar" ref="barX"></div></div>
    <div class="scrolly-bar-wrap axis-y"><div class="scrolly-bar" ref="barY"></div></div>
  </div>
</template>

<script>
  const timers = {};

  function debounce(fn) {
    return function() {
      const id = this._uid;
      clearTimeout(timers[id]);

      timers[id] = setTimeout(() => {
        fn.apply(this, arguments);
        timers[id] = null;
      }, 500);
    }
  }

  function normalize(num, max) {
    if(num < 0) num = 0;
    if(num > max) num = max;

    return num;
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

  export default {
    props: {
      vclass: {
        default: ''
      }
    },

    data: () => ({
      isScrolling: false,
      isActive: false
    }),

    mounted() {
      this.observer = new MutationObserver((records) => {
        // 1) Если вызов произошел из-за ripple-анимации
        // 2) Если вызов произошел от перерендера элементов
        // Возможно будет исправлено в новых версиях Vue
        if(records.every(({ target, addedNodes: a, removedNodes: r }) => {
          return target.matches && target.matches('.ripples') || isNodesEqual(a, r);
        })) return;

        this.refreshScrollLayout();
      });

      this.observer.observe(this.$refs.viewport, {
        childList: true,
        characterData: true,
        subtree: true
      });
    },

    beforeDestroy() {
      this.observer.disconnect();
    },

    methods: {
      onTouchStart ({ touches: [touch] }) {
        this.touchX = touch.pageX;
        this.touchY = touch.pageY;

        this.activateScrollBars(0, 0, 1);
      },

      onTouchMove({ touches: [touch] }) {
        const dx = -(touch.pageX - this.touchX);
        const dy = -(touch.pageY - this.touchY);

        this.touchX = touch.pageX;
        this.touchY = touch.pageY;

        this.refreshScrollLayout(dx, dy);
      },

      onTouchEnd() {
        this.hideScrollBars();
      },

      onMouseDown({ target, pageX: initialPageX, pageY: initialPageY }) {
        if(!target.closest('.scrolly-bar-wrap')) return;
        this.isScrolling = true;

        const self = this;
        const { viewport } = this.$refs;
        const bar = target.matches('.scrolly-bar') ? target : target.firstChild;
        const initialBarTop = bar.offsetTop;
        const initialBarLeft = bar.offsetLeft;

        function moveScrollBar({ target, pageX, pageY, offsetX, offsetY }, isMouseUp) {
          const isMoveToPoint = isMouseUp && target.matches('.scrolly-bar-wrap');
          const { scrollWidth, scrollHeight, offsetWidth, offsetHeight } = viewport;

          if(bar.parentElement.matches('.axis-x')) {
            const maxBarLeft = offsetWidth - bar.offsetWidth;
            let barLeft;

            if(isMoveToPoint) barLeft = normalize(offsetX - bar.offsetWidth/2, maxBarLeft);
            else barLeft = normalize(initialBarLeft + (pageX - initialPageX), maxBarLeft);

            bar.style.left = toPercent(barLeft / offsetWidth);
            viewport.scrollLeft = barLeft / maxBarLeft * (scrollWidth - offsetWidth);
          } else {
            const maxBarTop = offsetHeight - bar.offsetHeight;
            let barTop;

            if(isMoveToPoint) barTop = normalize(offsetY - bar.offsetHeight/2, maxBarTop);
            else barTop = normalize(initialBarTop + (pageY - initialPageY), maxBarTop);

            bar.style.top = toPercent(barTop / offsetHeight);
            viewport.scrollTop = barTop / maxBarTop * (scrollHeight - offsetHeight);
          }

          self.refreshScrollLayout.apply(self);
          clearTimeout(timers[self._uid]);
          timers[self._uid] = null;
        }

        function onMouseUp(e) {
          self.isScrolling = false;
          self.hideScrollBars();

          removeEventListener('mousemove', moveScrollBar);
          removeEventListener('mouseup', onMouseUp);

          if(initialPageX == e.pageX && initialPageY == e.pageY) moveScrollBar(e, true);
        }

        addEventListener('mousemove', moveScrollBar);
        addEventListener('mouseup', onMouseUp);
      },

      onMouseLeave() {
        if(!timers[this._uid]) this.hideScrollBars();
      },

      onWheel({ altKey, deltaX, deltaY }) {
        if(altKey) { // Возможность скролла по горизонтали при нажатой клавише Alt
          deltaX = deltaY > 0 ? 100 : -100;
          deltaY = 0;
        }

        this.refreshScrollLayout(deltaX, deltaY);
        this.activateScrollBars();
      },

      onKeyDown(e) {
        const { clientHeight } = this.$el;

        const data = {
          33: [0, 10 - clientHeight], // Page Up
          34: [0, clientHeight - 10], // Page Down
          37: [-20, 0], // Left Arrow
          38: [0, -20], // Up Arrow
          39: [20, 0], // Right Arrow
          40: [0, 20] // Down Arrow
        }[e.which];

        if(data) {
          // Отмена page up/down на всем сайте
          e.preventDefault();

          this.activateScrollBars();
          this.refreshScrollLayout(...data);
        }
      },

      activateScrollBars(e, isMouseMove, clear) {
        if(clear || isMouseMove && e.target.closest('.scrolly-bar-wrap')) {
          // При перемещении мыши по полосе скроллбара
          // Либо touchstart
          this.isActive = true;
          clearTimeout(timers[this._uid]);
          timers[this._uid] = null;
        } else if(!timers[this._uid] && this.isActive && !this.isScrolling) {
          // При перемещении мыши по контенту с активным скроллбаром,
          // но в данный момент не происходящим скроллом
          this.hideScrollBars();
        } else if(!isMouseMove) {
          // При скролле колеиском (возможно с зажатым Alt)
          this.isActive = true;
          this.hideScrollBars();
        }
      },

      hideScrollBars: debounce(function() {
        this.isActive = false;
      }),

      refreshScrollLayout(dx = 0, dy = 0) {
        const { viewport, barX, barY } = this.$refs;

        viewport.scrollLeft += dx;
        viewport.scrollTop += dy;

        const {
          scrollLeft, scrollWidth, offsetWidth,
          scrollTop, scrollHeight, offsetHeight
        } = viewport;

        const width = toPercent(offsetWidth / scrollWidth);
        const maxBarLeft = offsetWidth - barX.offsetWidth;
        const barLeft = normalize(scrollLeft / (scrollWidth - offsetWidth) * maxBarLeft, maxBarLeft);

        barX.style.left = toPercent(barLeft / offsetWidth);
        barX.parentElement.style.display = width == '100%' ? 'none' : 'block';
        barX.style.width = width;

        const height = toPercent(offsetHeight / scrollHeight);
        const maxBarTop = offsetHeight - barY.offsetHeight;
        const barTop = normalize(scrollTop / (scrollHeight - offsetHeight) * maxBarTop, maxBarTop);

        barY.style.top = toPercent(barTop / offsetHeight);
        barY.parentElement.style.display = height == '100%' ? 'none' : 'block';
        barY.style.height = height;

        this.$emit('scroll', viewport);
      }
    }
  }
</script>

<style>
  .scrolly {
    position: relative;
  }

  .scrolly.isScrolling {
    -webkit-user-drag: none;
    user-select: none;
  }

  .scrolly-viewport {
    overflow: hidden;
    height: 100%;
  }

  .scrolly-bar-wrap {
    position: absolute;
    z-index: 4;
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
    transition: opacity .3s ease;
  }

  .scrolly.isScrolling .scrolly-bar,
  .scrolly.isActive .scrolly-bar {
    opacity: 1;
  }

  .scrolly-bar:before {
    position: absolute;
    width: 100%;
    height: 100%;
    content: '';
    background: var(--scrolly-background);
    border-radius: 7px;
    transition: background-color .3s ease;
  }

  .scrolly-bar:hover:before,
  .scrolly.isScrolling .scrolly-bar:before {
    background-color: var(--scrolly-highlighted);
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
