<template>
  <div class="modal">
    <modal-header>{{ l('error_report') }}</modal-header>
    <div class="modal_content">
      <span>
        <div class="error"></div>
        {{ l('error_handler_text', [data.tag, data.type]) }}
      </span>

      <button class="light_button" @click="show = !show">
        {{ l(show ? 'hide_error' : 'show_error') }}
      </button>
      <pre v-if="show">{{ data.stack }}</pre>
      <textarea v-model="text" placeholder="Расскажите, какие шаги нужны для того, чтобы повторить ошибку."></textarea>
    </div>
    <div class="modal_bottom">
      <button class="button right" @click="send">{{ l('send') }}</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data'],
    data: () => ({
      show: false,
      text: ''
    }),
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
          text: this.text,
          ...this.data
        }));

        this.$modals.close(this.$attrs['data-key']);
      }
    }
  }
</script>
