<template>
  <div class="im_chat_container">
    <div class="header"></div>
    <div class="im_chat_empty">
      <img src="~assets/im_choose_chat.png">
      {{ l('im_choose_chat') }}
    </div>
  </div>
</template>

<style>
.im_chat_empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin-top: -65px;
  color: #313131;
}

.im_chat_empty img {
  margin-bottom: 15px;
  width: 128px;
  height: 128px;
}
</style>
