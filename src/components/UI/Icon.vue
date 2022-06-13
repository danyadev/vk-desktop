<script>
export default function Icon({ name, ...iconProps }) {
  const Icon = require(`!vue-svg-loader!assets/${name}.svg`).default;
  return <Icon {...iconProps} />;
}
</script>
