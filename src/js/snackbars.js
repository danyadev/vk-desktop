import { reactive } from 'vue';
import { timer } from './utils';

const snackbars = [];
let id = 0;

export const snackbarsState = reactive({
  snackbar: null
});

let inWork = false;

async function execute() {
  const data = snackbars.shift();

  snackbarsState.snackbar = data;
  await timer(data.timeout || 2000);

  if (snackbars.length) {
    execute();
  } else {
    inWork = false;
    snackbarsState.snackbar = null;
  }
}

/*
interface Data {
  text: string
  icon?: string // название svg иконки
  color?: string // цвет иконки (по умолчанию 'var(--icon-blue)')
  timeout?: number // время отображения снекбара в мс (по умолчанию 2000)
}
*/
export function addSnackbar(data) {
  snackbars.push({
    id: id++,
    ...data
  });

  if (!inWork) {
    inWork = true;
    execute();
  }
}
