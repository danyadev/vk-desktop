import { reactive } from 'vue';

let id = 0;

export const snackbarsState = reactive({
  snackbars: []
});

/*
interface Data {
  text: string
  icon?: string // название svg иконки
  color?: string // цвет иконки; по умолчанию 'var(--icon-blue)'"
}
*/
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
