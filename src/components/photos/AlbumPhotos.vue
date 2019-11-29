<template>
  <Scrolly :vclass="{ loading }" :lock="lockScroll" @scroll="onScroll">
    <div class="album">
      <div v-for="photo of photos" class="photo">
        <img :src="getPhotoFromSizes(photo.sizes, 'q').url" loading="lazy" width="150" height="150">
      </div>
    </div>
  </Scrolly>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { endScroll, getPhotoFromSizes } from 'js/utils';

  import Scrolly from '../UI/Scrolly.vue';

  export default {
    props: ['id'],
    components: {
      Scrolly
    },
    data: () => ({
      photos: [],
      offset: 0,
      loading: true,
      loaded: false,
      lockScroll: false
    }),
    methods: {
      getPhotoFromSizes,
      onScroll: endScroll(function() {
        if(!this.loading && !this.loaded) {
          this.loading = true;
          this.load();
        }
      }),
      async load() {
        let items;

        if(this.id != -9000) {
          const data = await vkapi('photos.get', {
            album_id: this.id,
            rev: 1,
            offset: this.offset
          });

          items = data.items;
        } else {
          const data = await vkapi('photos.getUserPhotos', {
            count: 50,
            sort: 1,
            offset: this.offset
          });

          items = data.items;
        }

        this.lockScroll = true;

        this.photos = this.photos.concat(items);
        this.offset += 50;

        await this.$nextTick();
        setTimeout(() => this.lockScroll = false, 0);

        this.loading = false;
        if(items.length < 50) this.loaded = true;
      }
    },
    mounted() {
      this.load();
    }
  }
</script>

<style scoped>
  .album {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 20px;
  }

  .photo img {
    object-fit: cover;
    margin: 0 0 0 5px;
  }
</style>
