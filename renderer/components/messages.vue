<template>
  <div class="messages_container">
    <div class="conversations_container">
      <div class="header">
        <open-menu></open-menu>
        <div class="header_name">Сообщения</div>
        <!-- кнопка поиска и три точки (доп.инструменты) -->
      </div>
      <div class="conversations_wrap">

      </div>
      <!-- сам список диалогов -->
    </div>
    <div class="dialogs_container">
      <div class="header">
        <!-- иконка беседы -->
        <!-- название беседы, кол-во людей и онлайн, три точки -->
      </div>
      <!-- сообщения (ps use keep-alive for save messages (если можно)) -->
      <!-- форма для написания сообщения -->
    </div>
  </div>
</template>

<script>
  module.exports = {
    mounted() {
      console.log('Сообщения загружены');
    }
  }
</script>
