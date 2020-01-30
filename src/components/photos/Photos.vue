<template>
  <div class="photos_container">
    <div class="header">
      <HeaderButton :back="album" @back="album = null" />
      <div class="header_name">{{ title }}</div>
    </div>
    <div class="photos_wrapper">
      <KeepAlive>
        <Albums v-if="!album" @open="openAlbum" />
        <AlbumPhotos v-else :key="album.id" :id="album.id" />
      </KeepAlive>
    </div>
  </div>
</template>

<script>
  import HeaderButton from '../HeaderButton.vue';
  import Albums from './Albums.vue';
  import AlbumPhotos from './AlbumPhotos.vue';

  export default {
    components: {
      HeaderButton,
      Albums,
      AlbumPhotos
    },

    data: () => ({
      album: null
    }),

    computed: {
      title() {
        return this.album ? this.album.title : this.l('photos_albums');
      }
    },

    methods: {
      openAlbum(album) {
        this.album = album;
      }
    }
  }
</script>

<style>
  .photos_container, .photos_wrapper > * {
    height: 100%;
  }

  .photos_wrapper { height: calc(100% - 45px) }
</style>
