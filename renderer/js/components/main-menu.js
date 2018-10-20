'use strict';

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
      activeTab: -1
    }
  },
  methods: {
    openPage(id) {
      this.activeTab = id;
    }
  }
}
