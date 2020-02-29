<template>
  <div :class="['modal', { isVideo: type == 'video' }]">
    <ModalHeader>
      {{ l('ml_media_viewer_header') }}
      <template v-slot:icons>
        <PhotoMenu v-if="type" :isPhoto="type == 'photo'" :isYoutube="type == 'player'" :src="src" :attach="attach" />
      </template>
    </ModalHeader>
    <div :class="['modal_content', { loading: loading || !type }]">
      <video v-if="type == 'video'" :src="src" controls autoplay></video>
      <video v-else-if="type == 'gif'" :src="src" autoplay loop></video>
      <img v-else-if="type == 'photo'" :src="src" @load.once="loading = false">
      <iframe v-else-if="type == 'player'" :src="src"></iframe>
    </div>
  </div>
</template>

<script>
  import { getPhotoFromSizes } from 'js/utils';
  import vkapi from 'js/vkapi';

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
          const isPlayer = files.length == 1;

          cachedVideos.set(video.id, {
            player: isPlayer,
            src: isPlayer ? video.player : files[files.length-2]
          });
        }

        const video = cachedVideos.get(attach.id);
        this.type = video.player ? 'player' : 'video';
        this.src = video.src;
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
    background: var(--media-background);
    min-width: 368px;
    max-width: 92vw;
    min-height: 150px;
  }

  .modal[name=media-viewer] .modal_content::after {
    position: absolute;
    margin: 0;
  }

  .modal[name=media-viewer] .modal_content > * {
    max-width: inherit;
    max-height: inherit;
    vertical-align: middle;
    z-index: 1;
  }

  .modal[name=media-viewer] .modal_content iframe {
    border: none;
    min-width: 368px;
    width: 92vw;
    max-width: 720px;
    height: calc(92vh - 48px - 56px);
    max-height: 480px;
  }
</style>
