<template>
  <div class="modal">
    <modal-header>{{ l('error_report') }}</modal-header>
    <div class="modal_content">
      <div class="error"></div>
      В одном из компонентов приложения ({{ data.tag }}) произошла ошибка.
      Чтобы быстрее исправить эту ошибку, отправьте ее разработчику с помощью кнопки ниже.
    </div>
    <div class="modal_bottom">
      <button type="button" class="button right" @click="send">{{ l('send') }}</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    methods: {
      async send() {
        let data = await request({
          host: 'danyadev.chuvash.pw',
          path: '/handleErrors',
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          }
        }, JSON.stringify({
          vkd: process.package.version,
          vue: Vue.version,
          id: app.user.id,
          ...this.data
        }));

        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
