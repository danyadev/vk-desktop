<template>
  <div class="modal">
    <modal-header>{{ l('auth') }}</modal-header>
    <div class="modal_content auth_modal">
      <auth :isModal="data.isModal"></auth>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data']
  }
</script>
