<template>
  <Scrolly>
    <div class="albums_list">
      <div v-for="album of albums" class="album">
        <img :src="getPhotoFromSizes(album.sizes, 'q').src"
             loading="lazy" width="250" height="170"
             @click="$emit('open', album)"
        >
        <div class="album_name">{{ album.title }}</div>
        <div class="album_count">{{ album.size }}</div>
      </div>
    </div>
  </Scrolly>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { getPhotoFromSizes } from 'js/utils';

  import Scrolly from '../UI/Scrolly.vue';

  export default {
    components: {
      Scrolly
    },
    data: () => ({
      albums: []
    }),
    methods: {
      getPhotoFromSizes
    },
    async mounted() {
      const { items } = await vkapi('photos.getAlbums', {
        need_system: 1,
        need_covers: 1,
        photo_sizes: 1
      });

      this.albums = items;
    }
  }
</script>

<style scoped>
  .albums_list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 20px 25px 0 25px;
  }

  .album {
    position: relative;
    margin: 0 10px 50px 10px;
  }

  .album {
    width: 250px;
    height: 170px;
  }

  .album img {
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, .28);
    cursor: pointer;
  }

  .album_name {
    width: 250px;
    padding: 3px 8px 0 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .album_count {
    position: absolute;
    top: 5px;
    right: 5px;
    background: #00000087;
    padding: 2px 6px 1px 6px;
    border-radius: 10px;
    color: #fff;
    pointer-events: none;
  }
</style>
