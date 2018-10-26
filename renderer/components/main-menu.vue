<template>
  <div class="menu">
    <div class="menu_item"
         v-for="(item, id) of list"
         @click="openPage(id)"
         @click.once="getComponent(item.type).init()"
         :class="{ active: activeTab == id }">
      <div class="menu_item_icon" :class="item.type"></div>
      <div class="menu_item_name">{{ item.name }}</div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data() {
      return {
        list: [
          { name: 'Моя страница', type: 'profile' },
          { name: 'Новости', type: 'news' },
          { name: 'Уведомления', type: 'notifications' },
          { name: 'Сообщения', type: 'messages' },
          { name: 'Аудиозаписи', type: 'audios' },
          { name: 'Друзья', type: 'friends' },
          { name: 'Группы', type: 'groups' },
          { name: 'Фотографии', type: 'photos' },
          { name: 'Видеозаписи', type: 'videos' }
        ],
        activeTab: 0
      }
    },
    methods: {
      openPage(id) {
        this.activeTab = id;
      }
    }
  }
</script>
