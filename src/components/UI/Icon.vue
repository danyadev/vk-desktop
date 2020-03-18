<script>
import { h } from 'vue';

export default function(props) {
  const { name, ...iconProps } = props;
  const icon = require(`!vue-svg-loader!assets/${name}.svg`).default;

  return h(icon, iconProps);
}
</script>
