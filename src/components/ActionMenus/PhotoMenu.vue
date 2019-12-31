<template>
  <ActionsMenu ref="actionsMenu">
    <div v-if="!isYoutube" class="act_menu_item" @click="act(0)">
      <img class="act_menu_icon" src="~assets/download.svg">
      <div class="act_menu_data">Сохранить на устройстве</div>
    </div>
    <div v-if="isPhoto" class="act_menu_item" @click="act(1)">
      <img class="act_menu_icon" src="~assets/plus.svg">
      <div class="act_menu_data">Сохранить в альбом</div>
    </div>
    <div class="act_menu_item" @click="act(2)">
      <img class="act_menu_icon" src="~assets/copy.svg">
      <div class="act_menu_data">Скопировать ссылку</div>
    </div>
  </ActionsMenu>
</template>

<script>
  import electron from 'electron';
  import fs from 'fs';
  import path from 'path';
  import request from 'js/request';

  import ActionsMenu from './ActionsMenu.vue';

  const { dialog, clipboard } = electron.remote;

  export default {
    props: ['src', 'attach', 'isPhoto', 'isYoutube'],
    components: {
      ActionsMenu
    },
    methods: {
      act(id) {
        this.$refs.actionsMenu.toggleMenu();

        switch(id) {
          case 0:
            const files = dialog.showOpenDialogSync({
              properties: ['openDirectory']
            });

            if(files) {
              const [name] = (new URL(this.src)).pathname.split('/').reverse();

              request(this.src, {
                pipe: fs.createWriteStream(path.join(files[0], name))
              });
            }

            break;

          case 1:
            const { owner_id, id: photo_id, access_key } = this.attach;

            vkapi('photos.copy', {
              owner_id,
              photo_id,
              access_key
            });

            break;

          case 2:
            clipboard.writeText(this.src);

            break;
        }
      }
    }
  }
</script>
