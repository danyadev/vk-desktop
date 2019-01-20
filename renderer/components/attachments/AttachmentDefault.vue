<template>
  <div class="message_attach attach_default">
    <img class="message_attach_img" src="images/im_attachment.png">
    <div class="message_attach_content">
      <div class="message_attach_title">{{ l('attach') }}</div>
      <div class="message_attach_desc">{{ data }}</div>
    </div>
  </div>
</template>

<script>
  module.exports = {
    props: ['data']
  }
</script>
