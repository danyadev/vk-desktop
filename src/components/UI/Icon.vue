<template>
  <Component :is="require(`!vue-svg-loader!../../assets/${name}.svg`)"/>
</template>

<script>
  export default {
    props: {
      name: {
        type: String,
        default: '#828a99' // серый
      }
    }
  }
</script>
