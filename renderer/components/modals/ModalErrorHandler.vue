<template>
  <div class="modal">
    <modal-header>{{ l('error_report') }}</modal-header>
    <div class="modal_content">
      <div class="error"></div>
      В компоненте {{ data.tag }} произошла ошибка.
      Чтобы быстрее ее исправить, отправьте ее разработчику с помощью кнопки ниже.
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
            'content-type': 'application/json',
            'user-agent': 'VK Desktop/' + process.package.version
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
