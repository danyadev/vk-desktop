<template>
  <div class="conversations_wrap" @scroll="onScroll" :class="{ loading }">
    <conversation v-for="data in list" :key="data.peer.id"
                  :peer="data.peer" :msg="data.msg">
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      list: [],
      loading: true,
      loaded: false,
      offset: 0
    }),
    methods: {
      async load() {
        let { profiles = [], groups = [], items } = await vkapi('messages.getConversations', {
              extended: true,
              fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online',
              offset: this.offset
            }),
            conversations = [];

        profiles.concat(groups.reduce((list, group) => {
          group.id = -group.id;
          list.push(group);
          return list;
        }, [])).forEach((profile) => {
          this.$store.commit('addProfile', profile);
        });

        for(let item of items) {
          let { conversation, last_message } = item;

          if(last_message.geo) last_message.attachments.push({ type: 'geo' });

          conversations.push({
            peer: this.parseConversation(conversation),
            msg: {
              id: last_message.id,
              text: last_message.text,
              out: conversation.out_read != last_message.id && last_message.out,
              from: last_message.from_id,
              date: last_message.date,
              action: last_message.action,
              fwd_count: last_message.fwd_messages.length,
              attachments: last_message.attachments
            }
          });
        }

        this.offset += items.length;
        this.loading = false;
        this.list = this.list.concat(conversations);

        if(items.length < 20) this.loaded = true;

        await this.$nextTick();
        this.onScroll({ target: qs('.conversations_wrap') });
      },
      onScroll: endScroll((vm) => {
        if(!vm.loading && !vm.loaded) {
          vm.load();
          vm.loading = true;
        }
      }, 100),
      parseConversation(conversation) {
        let isChat = conversation.peer.type == 'chat',
            isChannel = isChat && conversation.chat_settings.is_group_channel,
            chatPhoto, chatTitle;

        if(isChat) {
          let photos = conversation.chat_settings.photo;

          chatPhoto = photos && photos.photo_50;
          chatTitle = conversation.chat_settings.title;
        }

        return {
          id: conversation.peer.id,
          type: conversation.peer.type,
          channel: isChannel,
          owner: isChannel ? conversation.chat_settings.owner_id : conversation.peer.id,
          muted: !!conversation.push_settings, // TODO обработка disabled_until
          unread: conversation.unread_count || 0,
          photo: chatPhoto,
          title: chatTitle
        }
      },
      async updateConversation(peerID, data) {
        if(this.offset == 0) return;

        let conversation = this.list.find((item) => item.peer.id == peerID);

        if(!conversation) {
          if(typeof data == 'function') data = data();
          this.offset++;
          this.list.unshift(Object.assign(data));

          let { items: [peer], profiles = [], groups = [] } = await vkapi('messages.getConversationsById', {
            peer_ids: peerID,
            extended: 1,
            fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online'
          });

          profiles.concat(groups.reduce((list, group) => {
            group.id = -group.id;
            list.push(group);
            return list;
          }, [])).forEach((profile) => {
            this.$store.commit('addProfile', profile);
          });

          this.updateConversation(peerID, {
            peer: this.parseConversation(peer),
            msg: data.msg
          });
        } else {
          if(typeof data == 'function') data = data(conversation);

          Vue.set(conversation, 'peer', Object.assign({}, conversation.peer, data.peer));
          Vue.set(conversation, 'msg', Object.assign({}, conversation.msg, data.msg));
        }
      },
      moveUpConversation(peerID) {
        let index = this.list.findIndex((item) => item.peer.id == peerID);

        if(index != -1) this.list.move(index, 0);
      }
    },
    async mounted() {
      let longpoll = await require('./../../js/longpoll').load();
      this.load();

      let checkTyping = (data) => {
        let peer = this.$store.state.typing[data.peer.id];

        if(peer && peer[data.msg.from]) {
          this.$store.commit('removeTyping', {
            id: data.msg.from,
            peer: data.peer.id
          });
        }
      }

      let removeTyping = async (data) => {
        let user = this.$store.state.typing[data.peer_id][data.from_id];

        if(!user) return;
        else if(user.time) {
          this.$store.commit('addTyping', {
            id: data.from_id,
            peer: data.peer_id,
            data: { type: data.type, time: user.time - 1 }
          });

          await other.timer(1000);
          removeTyping(data);
          return;
        }

        this.$store.commit('removeTyping', {
          id: data.from_id,
          peer: data.peer_id
        });
      }

      longpoll.on('new_message', (data) => {
        this.updateConversation(data.peer.id, (peer) => {
          if(data.msg.out) data.peer.unread = 0;
          else if(peer) {
            if(peer.force) data.peer.unread = peer.peer.unread;
            else data.peer.unread = peer.peer.unread + 1;
          }

          if(data.msg.action) {
            if(['chat_create', 'chat_title_update'].includes(data.msg.action.type)) {
              data.peer.title = data.msg.action.text;
            } else if(data.msg.action.type == 'chat_photo_update') {
              vkapi('messages.getConversationsById', {
                peer_ids: data.peer.id
              }).then(({ items: [peer] }) => {
                if(peer.chat_settings.photo) {
                  this.updateConversation(data.peer.id,  {
                    peer: { photo: peer.chat_settings.photo.photo_50 }
                  });
                }
              });
            }
          }

          return data;
        });

        checkTyping(data);
        this.moveUpConversation(data.peer.id);
      });

      longpoll.on('edit_message', (data) => {
        this.updateConversation(data.peer.id, data);
        checkTyping(data);
      });

      longpoll.on('readed_messages', (data) => {
        this.updateConversation(data.peer_id, {
          msg: { out: data.count != 0 }
        });
      });

      longpoll.on('read_messages', (data) => {
        this.updateConversation(data.peer_id, {
          peer: { unread: data.count }
        });
      });

      longpoll.on('change_push_settings', (data) => {
        this.updateConversation(data.peer_id, {
          peer: { muted: data.state }
        });
      });

      longpoll.on('typing', (data) => {
        this.$store.commit('addTyping', {
          id: data.from_id,
          peer: data.peer_id,
          data: { type: data.type, time: 5 }
        });

        removeTyping(data);
      });

      longpoll.on('online_user', (data) => {
        this.$store.commit('updateProfile', {
          id: data.id,
          online: data.type == 'online',
          online_mobile: !!data.mobile
        });
      });

      longpoll.on('delete_peer', (data) => {
        let index = this.list.findIndex((item) => item.peer.id == data.peer_id);

        if(index != -1) Vue.delete(this.list, index);
      });
    }
  }
</script>
