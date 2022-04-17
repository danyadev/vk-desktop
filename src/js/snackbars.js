import { reactive } from 'vue';
import { timer, createCallablePromise } from './utils';

const snackbars = [];
let id = 0;

export const snackbarsState = reactive({
  snackbar: null
});

let inWork = false;

async function execute() {
  const snackbar = snackbars.shift();
  const closePromise = createCallablePromise();

  snackbar.close = closePromise.resolve;
  snackbarsState.snackbar = snackbar;

  while (true) {
    const onMouseEnterPromise = createCallablePromise();
    const onMouseLeavePromise = createCallablePromise();

    snackbar.onMouseEnter = onMouseEnterPromise.resolve;
    snackbar.onMouseLeave = onMouseLeavePromise.resolve;

    const fastestResult = await Promise.race([
      onMouseEnterPromise.then(() => 'onMouseEnter'),
      timer(snackbar.duration || 2000),
      closePromise
    ]);

    if (fastestResult === 'onMouseEnter') {
      await onMouseLeavePromise;
    } else {
      break;
    }
  }

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
  duration?: number // время отображения снекбара в мс (по умолчанию 2000)
  closable?: boolean // добавлять ли иконку закрытия снекбара (по умолчанию false)
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
