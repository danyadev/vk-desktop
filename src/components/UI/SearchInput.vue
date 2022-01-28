<template>
  <div class="search_input">
    <Icon name="search_small" color="var(--icon-gray)" />
    <input type="text" :placeholder="l('search')" spellcheck="false">
  </div>
</template>

<script>
import Icon from './Icon.vue';

export default {
  components: {
    Icon
  }
};
</script>

<style>
.search_input {
  display: flex;
  width: 100%;
  height: 30px;
  margin: 10px 16px;
  border-radius: 8px;
  background: var(--field-background);
}

.search_input svg {
  margin: 7px 10px;
  flex: none;
}

.search_input input {
  border: none;
  padding: 0;
  margin-right: 10px;
  font: inherit;
  background: none;
  width: 100%;
  height: 100%;
}

.root[theme="dark"] .search_input input {
  color: var(--text-primary);
}

.search_input input::-webkit-input-placeholder {
  color: var(--text-steel-gray);
}
</style>
