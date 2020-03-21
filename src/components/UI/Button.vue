<script>
import { h, computed } from 'vue';
import Ripple from './Ripple.vue';

export default function(props, { slots }) {
  const light = computed(() => ('light' in props) && props.light !== false);

  return h(
    Ripple,
    {
      color: light.value ? 'var(--button-light-ripple)' : 'var(--blue-background-ripple)',
      class: ['button', {
        light: light.value,
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
  background: var(--blue-background);
  color: var(--blue-background-text);
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
  background: var(--button-light-background);
  color: var(--button-light-color);
}
</style>
