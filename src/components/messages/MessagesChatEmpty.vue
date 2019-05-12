<template>
  <div class="chat_container">
    <div class="header"></div>
    <div class="choose_chat">
      <img src="~assets/im_choose_chat.png">
      <span>{{ l('im_choose_chat_1') }} <a @click="createChat">{{ l('im_choose_chat_2') }}</a></span>
    </div>
  </div>
</template>

<script>
  export default {
    methods: {
      createChat() {
        // Когда-нибудь сделаем....
        // Вывести тост, что нельзя пока
      }
    }
  }
</script>

<style scoped>
  .choose_chat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    margin-top: -65px;
    color: #38383a;
    font-family: Roboto;
  }

  .choose_chat span {
    user-select: none;
  }

  .choose_chat img {
    margin-bottom: 15px;
    width: 128px;
    height: 128px;
  }
</style>
