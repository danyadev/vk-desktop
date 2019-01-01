<template>
  <div class="auth">
    <auth-form v-if="!needValidation" @auth="onAuth"></auth-form>
    <auth-code v-else :data="needValidation" @auth="onAuth"></auth-code>
  </div>
</template>

<script>
  module.exports = {
    data: () => ({
      needValidation: null
    }),
    methods: {
      onAuth(data) {
        if(data.type == 'need_validation') {
          this.needValidation = data;
        } else if(data.type == 'cancel_enter_code') {
          this.needValidation = null;
        }
      }
    }
  }
</script>
