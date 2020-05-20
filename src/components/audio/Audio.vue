<template>
  <div class="audio_container">
    <div class="header">
      <HeaderButton />
      <div class="header_name">
        {{ l('menu', 'audio') }}
      </div>
    </div>
    <iframe
      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
      frameborder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
  </div>
</template>

<script>
import HeaderButton from '../HeaderButton.vue';

export default {
  components: {
    HeaderButton
  }
};
</script>

<style>
.audio_container {
  height: 100%;
}

.audio_container iframe {
  width: 100%;
  height: calc(100% - 50px);
}
</style>
