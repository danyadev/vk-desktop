<template>
  <div class="im_attach_unknown">
    (forwarded)
  </div>
</template>

<script>
  export default {
    props: ['msg']
  }
</script>

<style>
  .im_attachments + .im_attach_unknown {
    margin-top: 5px;
  }
</style>
