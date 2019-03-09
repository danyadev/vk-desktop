<template>
  <div class="modal">
    <modal-header>{{ l('invitation_to_chat') }}</modal-header>
    <div class="modal_content modal_chat_preview">
      <div class="loading" v-if="load"></div>
      <template v-else-if="error">
        <div class="error">{{ l('chat_preview_error') }}</div>
      </template>
      <template v-else>
        <img class="chat_photo" :src="photo"/>
        <span class="chat_name">{{ res.preview.title }}</span>
        <div class="user_photos">
          <img v-for="user of users" :src="user.photo" :title="user.name"/>
        </div>
        <div class="user_names">{{ names }}</div>
        <button class="button" :disabled="disabled" @click="go">{{ l('chat_preview_go') }}</button>
      </template>
    </div>
  </div>
</template>

<script>
  const { concatProfiles } = require('./../messages/methods');

  module.exports = {
    props: ['data'],
    data: () => ({
      load: true,
      error: false,
      disabled: false,
      res: null
    }),
    computed: {
      users() {
        return this.res.users.map((user) => ({
          id: user.id,
          name: user.name || user.first_name,
          photo: devicePixelRatio >= 2 ? user.photo_100 : user.photo_50
        }));
      },
      photo() {
        const { photo } = this.res.preview;

        if(!photo) return 'images/im_chat_photo.png';
        else return devicePixelRatio >= 2 ? photo.photo_200 : photo.photo_100;
      },
      names() {
        let { length } = this.res.preview.members,
            names = this.users.map((user) => user.name),
            text = '';

        if(length == 1) return this.l('chat_preview_names', 0, [names[0]]);
        else if(length < 5) {
          let list = names.slice(0, length - 1).join(', ');
          return this.l('chat_preview_names', 1, [list, names[length-1]]);
        } else {
          let list = names.slice(0, 4).join(', '),
              count = length - 4;

          return this.l('chat_preview_names_more', [list, count], count);
        }
      }
    },
    methods: {
      async go() {
        this.disabled = true;

        try {
          let id;

          if(this.res.preview.local_id) id = this.res.preview.local_id;
          else {
            let { chat_id } = await vkapi('messages.joinChatByInviteLink', { link: this.data });
            id = chat_id;
          }

          this.$modals.close(this.$attrs['data-key']);
          this.$store.commit('messages/setChat', 2e9 + +id);
        } catch(e) {
          // Когда на момент нажатия ссылка уже была аннулирована
          this.error = true;
        } finally {
          this.disabled = false;
        }
      }
    },
    async mounted() {
      try {
        let { preview, profiles, groups } = await vkapi('messages.getChatPreview', {
          link: this.data,
          fields: 'photo_50,photo_100'
        });

        this.res = {
          preview,
          users: concatProfiles(profiles, groups)
        };
      } catch(e) {
        // В случае, когда ссылка была аннулирована или неверна
        this.error = true;
      } finally {
        this.load = false;
      }
    }
  }
</script>
