<template>
  <div class="menu">
    <div class="menu_account_item">
      <img class="menu_account_bgc" :src="users.get().photo_100">
      <div class="menu_multiacc"></div>
      <img class="acc_icon"
           :src="users.get().photo_100"
           @click="openPage(0)">
      <div class="menu_acc_name">{{ users.get().first_name }} {{ users.get().last_name }}</div>
      <div class="menu_acc_status">{{ users.get().status }}</div>
    </div>
    <div class="menu_items">
      <div class="menu_item"
           v-for="(item, id) of list"
           v-if="!item.disabled"
           @click="openPage(id)"
           :class="{ active: activeTab == id, disabled: item.disabled }">
        <div class="menu_item_icon" :class="item.type"></div>
        <div class="menu_item_name">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data: (vm) => ({
      list: [
        { name: 'Моя страница', type: 'profile',       disabled: true  }, // всегда выключено
        { name: 'Новости',      type: 'news',          disabled: true  },
        { name: 'Уведомления',  type: 'notifications', disabled: true  },
        { name: 'Сообщения',    type: 'messages',      disabled: false },
        { name: 'Аудиозаписи',  type: 'audios',        disabled: true  },
        { name: 'Друзья',       type: 'friends',       disabled: true  },
        { name: 'Группы',       type: 'groups',        disabled: true  },
        { name: 'Фотографии',   type: 'photos',        disabled: true  },
        { name: 'Видеозаписи',  type: 'videos',        disabled: true  },
        { name: 'Настройки',    type: 'settings',      disabled: true  }
      ],
      activeTab: 3,
      tempComp: vm.$root.activeComponent
    }),
    methods: {
      openPage(id) {
        this.activeTab = id;
        this.$root.activeComponent = this.list[id].type;
      }
    }
  }
</script>
