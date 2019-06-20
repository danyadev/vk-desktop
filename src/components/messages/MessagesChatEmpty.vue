<template>
  <div class="im_chat_container">
    <div class="header"></div>
    <div class="im_chat_empty">
      <img src="~assets/im_choose_chat.png">
      <span>{{ l('im_choose_chat_1') }} <a @click="createChat">{{ l('im_choose_chat_2') }}</a></span>
    </div>
  </div>
</template>

<script>
  export default {
    methods: {
      createChat() {

      }
    }
  }
</script>

<style>
  .im_chat_empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    margin-top: -65px;
    color: #38383a;
  }

  .im_chat_empty span {
    user-select: none;
  }

  .im_chat_empty img {
    margin-bottom: 15px;
    width: 128px;
    height: 128px;
  }
</style>
