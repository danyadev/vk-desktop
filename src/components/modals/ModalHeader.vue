<template>
  <div class="modal_header">
    <div class="modal_header_title"><slot /></div>
    <div class="modal_header_buttons">
      <slot name="icons" />
    </div>
  </div>
</template>

<style>
.modal_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.modal_header_title {
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 500;
  line-height: 20px;
}

.modal_header_buttons {
  display: flex;
  align-items: center;
}
</style>
