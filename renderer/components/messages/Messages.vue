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
                      :conversation="data.conversation"
                      :last_message="data.last_message"
                      :profiles="profiles"></conversation>
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
      profiles: {},
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
          this.profiles[profile.id] = profile;
        });

        for(let item of items) {
          let { conversation, last_message } = item;
          conversations.push({
            conversation, last_message
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
      onScroll: endScroll((vm) => {
        if(!vm.conversations.load && !vm.conversations.loaded) {
          vm.loadConversations();
          vm.conversations.load = true;
        }
      }, 100)
    },
    mounted() {
      require('./../../js/longpoll').load((longpoll) => {
        this.longpoll = longpoll;
        this.loadConversations();
      });
    }
  }
</script>
