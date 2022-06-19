<template>
  <div class="attach_forwarded attach_left_border">
    <ForwardedMessage
      v-for="fwd of messages"
      :key="fwd.id"
      :msg="fwd"
      :peer_id="peer_id"
      :isCustomView="isCustomView"
      :fwdDepth="fwdDepth || 1"
    />

    <slot name="afterContent" />
  </div>
</template>

<script>
// ForwardedMessage зарегистрирован глобально, чтобы предотвратить рекурсию при рендере

export default {
  props: ['peer_id', 'messages', 'isCustomView', 'fwdDepth']
};
</script>

<style>
.attach_forwarded {
  position: relative;
  padding-left: 8px;
}

.message_text + .attach_forwarded,
.im_attachments + .attach_forwarded {
  margin-top: 6px;
}
</style>
