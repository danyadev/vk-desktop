<template>
  <div class="modal">
    <ModalHeader>{{ l('modal_multiaccount_header') }}</ModalHeader>
    <div class="modal_content">
      <div class="item" v-for="user in users" :key="user.id" @click="setAccount(user.id)">
        <img class="item_photo" :src="user.photo_100">
        <div class="item_data">
          <div class="item_name_wrap">
            <div class="item_name">{{ user.first_name }} {{ user.last_name }}</div>
            <img v-if="user.id != activeUser"
                 class="item_close"
                 src="~assets/close.svg"
                 @click.stop="removeAccount(user.id)"
            >
          </div>
          <div class="item_description">{{ getUserDescription(user) }}</div>
        </div>
      </div>
    </div>
    <div class="modal_footer">
      <button class="button right" @click="openAuthModal">{{ l('modal_multiaccount_add_account') }}</button>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import { resetAppState } from 'js/store/';
  import ModalHeader from './ModalHeader.vue';

  export default {
    components: { ModalHeader },
    computed: {
      ...mapState('users', ['users', 'activeUser'])
    },
    methods: {
      getUserDescription(user) {
        if(this.activeUser != user.id) return '@' + user.domain;
        else return this.l('modal_multiaccount_active_account');
      },
      async setAccount(id) {
        if(this.activeUser == id) return;

        if(this.activeUser) {
          // Получаем корневой роут
          // Например, из роута /messages/100 мы получим /messages
          const [{ path }] = this.$router.currentRoute.matched;

          // 1. Переходим на страницу загрузки
          this.$router.replace('/loading');
          // 2. Ждем, когда эта страница отрендерится
          await this.$nextTick();
          // 3. Обновляем стейт всех модулей приложения
          resetAppState();
          // 4. Возвращаемся на страницу, откуда мы начали
          this.$router.replace(path);
        }

        this.$store.commit('users/setActiveUser', id);
      },
      removeAccount(id) {
        this.$store.commit('users/removeUser', id);
      },
      openAuthModal() {
        this.$modal.open('auth', { isModal: true });
      }
    }
  }
</script>

<style scoped>
  .modal_content { min-width: 300px }

  .item {
    display: flex;
    cursor: pointer;
    user-select: none;
    padding: 0 15px;
  }

  .item_photo {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin: 10px 10px 0 0;
  }

  .item_data {
    flex-grow: 1;
    padding: 10px 0;
  }

  .item:not(:last-child) .item_data {
    border-bottom: 1px solid #e7e8ec;
  }

  .item_name_wrap {
    display: flex;
    margin-top: 4px;
  }

  .item_name { flex-grow: 1 }

  .item_description {
    color: #3e70a9;
    margin-top: 2px;
  }

  .item_close {
    margin: 3px;
    width: 14px;
    height: 14px;
    opacity: .8;
    transition: opacity .3s;
  }

  .item_close:hover { opacity: 1 }
</style>
