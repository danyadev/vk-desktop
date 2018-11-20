<template>
  <div class="messages_container">
    <div class="conversations_container">
      <div class="header">
        <open-menu></open-menu>
        <div class="header_name">Сообщения</div>
        <!-- кнопка поиска и три точки (доп.инструменты) -->
      </div>
      <div class="conversations_wrap" @scroll="onScroll" :class="{ loading: conversations.load }">
        <conversation v-for="data in conversations.list" :key="data.peer.id"
                      :peer="data.peer" :msg="data.msg"></conversation>
      </div>
    </div>
    <div class="dialogs_container">
      <div class="header">
        <!-- иконка беседы -->
        <!-- название беседы, кол-во людей и онлайн, три точки -->
      </div>
      <!-- сообщения -->
      <!-- форма для написания сообщения -->
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      conversations: {
        list: [],
        load: true,
        loaded: false,
        offset: 0
      }
    }),
    methods: {
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
          title: chatTitle,
          online: isChat ? '' : ''
        }
      },
      async loadConversations() {
        let { profiles = [], groups = [], items } = await vkapi('messages.getConversations', {
              extended: true,
              fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online',
              offset: this.conversations.offset
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

        this.conversations.offset += items.length;
        this.conversations.load = false;
        this.conversations.list = this.conversations.list.concat(conversations);

        if(items.length < 20) this.conversations.loaded = true;

        this.$nextTick();
        this.onScroll({ target: qs('.conversations_wrap') });
      },
      async updateConversation(peerID, data) {
        if(this.conversations.offset == 0) return;

        let conversation = this.conversations.list.find((item) => item.peer.id == peerID);

        if(!conversation) {
          let { items: [peer], profiles: [user] = [], groups: [group] = [] } = await vkapi('messages.getConversationsById', {
            peer_ids: peerID,
            extended: 1,
            fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online'
          });

          if(user) this.$store.commit('addProfile', user);
          if(group) this.$store.commit('addProfile', group);

          if(typeof data == 'function') {
            data = data({
              peer: this.parseConversation(peer),
              force: true
            });
          }

          this.conversations.list.unshift(data);
          this.conversations.offset++;
        } else {
          if(typeof data == 'function') data = data(conversation);

          Object.assign(conversation.peer, data.peer);
          Object.assign(conversation.msg, data.msg);
        }
      },
      moveUpConversation(peerID) {
        let index = this.conversations.list.findIndex((item) => item.peer.id == peerID);

        if(index != -1) this.conversations.list.move(index, 0);
      },
      onScroll: endScroll((vm) => {
        if(!vm.conversations.load && !vm.conversations.loaded) {
          vm.loadConversations();
          vm.conversations.load = true;
        }
      }, 100)
    },
    async mounted() {
      let longpoll = await require('./../../js/longpoll').load();
      this.loadConversations();

      let checkTyping = (data) => {
        let peer = this.$store.state.typing[data.peer.id];

        if(peer && peer[data.msg.from]) {
          this.$store.commit('removeTyping', {
            id: data.msg.from,
            peer: data.peer.id
          });
        }
      }

      longpoll.on('new_message', (data) => {
        this.updateConversation(data.peer.id, (peer) => {
          if(data.msg.out) data.peer.unread = 0;
          else if(peer.force) data.peer.unread = peer.peer.unread;
          else data.peer.unread = peer.peer.unread + 1;

          return data;
        });

        checkTyping(data);
        this.moveUpConversation(data.peer.id);
      });

      longpoll.on('edit_message', (data) => {
        this.updateConversation(data.peer.id, data);
        checkTyping(data);
      });

      longpoll.on('messages_readed', (data) => {
        this.updateConversation(data.peer_id, {
          msg: { out: data.count != 0 }
        });
      });

      longpoll.on('messages_read', (data) => {
        this.updateConversation(data.peer_id, {
          peer: { unread: data.count }
        });
      });

      longpoll.on('change_push_settings', (data) => {
        this.updateConversation(data.peer_id, {
          peer: { muted: data.state == 0 }
        });
      });

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
    }
  }
</script>
