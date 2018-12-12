<template>
  <div class="modal">
    <modal-header :closable="false">{{ title }}</modal-header>
    <div class="modal_content blocked_profile">
      <template v-if="data == 0">
        Возможно, вы удалили приложение из списка активных либо завершили все сеансы.<br><br>
        Дальнейшая работа приложения невозможна.
      </template>
      <template v-else-if="data == 1">
        Ваша страница удалена.<br><br>
        После восстановления страницы вы можете снова пользоваться приложением.
      </template>
      <template v-else>
        Ваша страница была заблокирована.<br><br>
        Восстановите аккаунт и вернитесь позже.
      </template>
    </div>
    <div class="modal_bottom">
      <button class="button right" @click="exit">Выйти из аккаунта</button>
      <button class="button right" @click="close" v-if="data == 1">Закрыть приложение</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    computed: {
      title() {
        switch(this.data) {
          case 0: return 'Сессия недействительна';
          case 1: return 'Страница удалена';
          case 2: return 'Страница заблокирована';
        }
      }
    },
    methods: {
      close() {

      },
      exit() {

      }
    }
  }
</script>
