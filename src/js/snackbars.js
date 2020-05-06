import { reactive } from 'vue';

let id = 0;

export const snackbarsState = reactive({
  snackbars: []
});

export function addSnackbar(data) {
  const item = {
    id: id++,
    ...data
  };

  snackbarsState.snackbars.push(item);

  setTimeout(() => {
    snackbarsState.snackbars.splice(
      snackbarsState.snackbars.indexOf(item),
      1
    );
  }, 2000);
}
