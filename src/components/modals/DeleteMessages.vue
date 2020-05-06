<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_delete_messages_header') }}</ModalHeader>
    <div class="modal_content">
      {{ l('ml_delete_messages_text', [l('ml_delete_messages_count', [count], count)]) }}

      <div
        v-if="canDeleteForAll"
        class="ml_delete_messages_checkbox"
        @click="toggleDeleteForAll"
      >
        <Checkbox :active="deleteForAll" />
        {{ l('ml_delete_messages_for_all') }}
      </div>
    </div>
    <div class="modal_footer">
      <Button class="right" @click="deleteMsg">{{ l('delete') }}</Button>
      <Button class="right" light @click="close">{{ l('cancel') }}</Button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { closeModal } from 'js/modals';
import store from 'js/store';

import ModalHeader from './ModalHeader.vue';
import Checkbox from '../UI/Checkbox.vue';
import Button from '../UI/Button.vue';

export default {
  props: ['count', 'canDeleteForAll', 'submit'],

  components: {
    ModalHeader,
    Checkbox,
    Button
  },

  setup(props) {
    const deleteForAll = computed(() => store.getters['settings/settings'].deleteForAll);

    function toggleDeleteForAll() {
      if (props.canDeleteForAll) {
        store.commit('settings/updateUserSettings', {
          deleteForAll: !deleteForAll.value
        });
      }
    }

    function deleteMsg() {
      props.submit(props.canDeleteForAll && deleteForAll.value);
      close();
    }

    function close() {
      closeModal('delete-messages');
    }

    return {
      deleteForAll,

      toggleDeleteForAll,
      deleteMsg,
      close
    };
  }
};
</script>

<style>
.modal[data-name=delete-messages] .modal_content {
  padding: 25px;
}

.ml_delete_messages_checkbox {
  display: flex;
  align-items: center;
  margin-top: 15px;
  cursor: pointer;
}

.ml_delete_messages_checkbox .checkbox {
  margin-right: 10px;
}
</style>
