<script>
import { h } from 'vue';
import Ripple from './Ripple.vue';

export default function(props, { slots }) {
  return h(
    Ripple,
    {
      color: props.light ? '#ced7e0' : 'rgba(0, 0, 0, .15)',
      class: ['button', {
        light: props.light,
        disabled: props.disabled
      }]
    },
    slots.default
  );
}
</script>

<style>
.button {
  display: inline-block;
  background: #5789c5;
  color: #f3f3f3;
  padding: 9px;
  border-radius: 5px;
  line-height: 18px;
  text-align: center;
  transition: opacity .3s, background-color .3s;
}

.button:not(.disabled) {
  cursor: pointer;
}

.button.disabled {
  pointer-events: none;
  opacity: .8;
}

.button.light {
  background: #e4eaf0;
  color: #55677d;
}

.button:not(.disabled):hover {
  background: #547fb3;
}

.button.light:not(.disabled):hover {
  background: #dbe3eb;
}
</style>
