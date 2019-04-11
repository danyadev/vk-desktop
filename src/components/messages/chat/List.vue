<template>
  <Scrolly class="messages_list" :passiveScroll="true">
    <ScrollyViewport>

    </ScrollyViewport>
    <ScrollyBar/>
  </Scrolly>
</template>

<script>
  import { Scrolly, ScrollyViewport, ScrollyBar } from 'vue-scrolly';

  export default {
    components: {
      Scrolly,
      ScrollyViewport,
      ScrollyBar
    }
  }
</script>

<style scoped>
  .messages_list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
