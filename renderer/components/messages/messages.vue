<template>
  <div class="messages_container">
    <div class="conversations_container">
      <div class="header">
        <open-menu></open-menu>
        <div class="header_name">Сообщения</div>
        <!-- кнопка поиска и три точки (доп.инструменты) -->
      </div>
      <div class="conversations_wrap" @scroll="onScroll" :class="{ loading: conversations.load }">
        <conversation v-for="data in conversations.list"
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
      async loadConversations() {
        let { profiles = [], groups = [], items } = await vkapi('messages.getConversations', {
              extended: true,
              fields: 'photo_50,verified,sex,first_name_acc,last_name_acc',
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
          let { conversation, last_message } = item,
              isChat = conversation.peer.type == 'chat',
              isChannel = isChat && conversation.chat_settings.is_group_channel,
              chatPhoto, chatTitle;

          if(isChat) {
            let photos = conversation.chat_settings.photo;

            chatPhoto = photos && photos.photo_50;
            chatTitle = conversation.chat_settings.title;
          }

          if(last_message.geo) last_message.attachments.push({ type: 'geo' });

          conversations.push({
            peer: {
              id: conversation.peer.id,
              type: conversation.peer.type,
              channel: isChannel,
              owner: isChannel ? conversation.chat_settings.owner_id : conversation.peer.id,
              muted: !!conversation.push_settings, // TODO обработка disabled_until
              unread: conversation.unread_count || 0,
              photo: chatPhoto,
              title: chatTitle
            },
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

        setTimeout(() => {
          this.onScroll({ target: qs('.conversations_wrap') });
        }, 100);
      },
      updateConversation(peerID, data) {
        let conversation = this.conversations.list.find((item) => item.peer.id == peerID);

        if(!conversation) {
          // TODO сделать это
          console.error('Нет данных беседы', { peer: peerID, data });
          return;
        }

        if(typeof data == 'function') data = data(conversation);

        Object.assign(conversation.peer, data.peer || {});
        Object.assign(conversation.msg, data.msg || {});
      },
      onScroll: endScroll((vm) => {
        if(!vm.conversations.load && !vm.conversations.loaded) {
          vm.loadConversations();
          vm.conversations.load = true;
        }
      }, 100)
    },
    async mounted() {
      this.longpoll = await require('./../../js/longpoll').load();
      this.loadConversations();

      this.longpoll.on('new_message', (data) => {
        this.updateConversation(data.peer.id, (peer) => {
          if(data.msg.out) data.peer.unread = 0;
          else data.peer.unread = peer.peer.unread + 1;

          return {
            msg: data.msg,
            peer: data.peer
          };
        });
      });

      this.longpoll.on('edit_message', (data) => {
        this.updateConversation(data.peer.id, {
          msg: data.msg,
          peer: data.peer
        });
      });

      this.longpoll.on('messages_readed', (data) => {
        this.updateConversation(data.peer_id, {
          msg: { out: data.count != 0 }
        });
      });

      this.longpoll.on('messages_read', (data) => {
        this.updateConversation(data.peer_id, {
          peer: { unread: data.count }
        });
      });

      this.longpoll.on('change_push_settings', (data) => {
        this.updateConversation(data.peer_id, {
          peer: { muted: data.state == 0 }
        });
      });
    }
  }
</script>
