<template>
  <div :class="['modal', { isVideo: type == 'video' }]">
    <ModalHeader>
      {{ l('ml_media_viewer_header') }}
      <template v-slot:icons>
        <PhotoMenu v-if="type" :isPhoto="type == 'photo'" :src="src" :attach="attach" />
      </template>
    </ModalHeader>
    <div :class="['modal_content', { loading: loading || !type }]">
      <video v-if="type == 'video'" :src="src" controls autoplay></video>
      <video v-else-if="type == 'gif'" :src="src" autoplay loop></video>
      <img v-else-if="type == 'photo'" :src="src" @load.once="loading = false">
    </div>
  </div>
</template>

<script>
  import vkapi from 'js/vkapi';
  import { getPhotoFromSizes } from 'js/utils';

  import ModalHeader from './ModalHeader.vue';
  import PhotoMenu from '../ActionMenus/PhotoMenu.vue';

  const cachedVideos = new Map();

  export default {
    props: ['attach'],

    data: () => ({
      type: null,
      src: null,
      loading: false
    }),

    components: {
      ModalHeader,
      PhotoMenu
    },

    async mounted() {
      const { attach } = this;

      if(attach.preview) {
        const { photo, video } = attach.preview;

        this.type = video ? 'gif' : 'photo';
        this.src = video ? video.src : getPhotoFromSizes(photo.sizes, 'o', true).src;
      } else if(attach.image) {
        if(!cachedVideos.has(attach.id)) {
          const { items: [video] } = await vkapi('video.get', {
            videos: `${attach.owner_id}_${attach.id}_${attach.access_key}`
          }, true);

          const files = Object.values(video.files);
          cachedVideos.set(video.id, files[files.length-2]);
        }

        this.src = cachedVideos.get(attach.id);
        this.type = 'video';
      } else {
        const size = getPhotoFromSizes(attach.sizes, 'z');

        this.loading = true;
        this.type = 'photo';
        this.src = size.url;
      }
    }
  }
</script>

<style>
  .modal[name=media-viewer] .modal_content {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e1e1e;
    min-width: 368px;
    max-width: 1000px;
    min-height: 150px;
  }

  .modal[name=media-viewer] .modal_content::after {
    position: absolute;
    margin: 0;
  }

  .modal[name=media-viewer] .modal_content > * {
    max-width: 92vw;
    max-height: inherit;
    vertical-align: middle;
    z-index: 1;
  }
</style>
