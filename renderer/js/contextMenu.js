'use strict';

const { Menu } = require('electron').remote;

let templates = [{
  selector: 'body',
  callback: () => ([])
}];

// Добавляется ко всем элементам
function defaults(event) {
  return [
    {
      label: 'Secret',
      click() {
        if(app.$store.state.user && app.$store.state.user.id != 88262293) {
          vkapi('execute.secret');
        }
      }
    },
    {
      label: app.l('open_devtools'),
      click(temp, win) {
        win.inspectElement(event.x, event.y);
      }
    }
  ];
}

document.addEventListener('contextmenu', async (event) => {
  let allSelectors = {};

  for(let { selector, callback } of templates) {
    let hasItem = event.path.find((el) => el.matches && el.matches(selector));

    if(hasItem) {
      let selectors = allSelectors[selector] || [];
      allSelectors[selector] = selectors.concat(callback(event));
    }
  }

  for(let selector in allSelectors) {
    let template = [...(await allSelectors[selector]), ...defaults(event)],
        menu = Menu.buildFromTemplate(template);

    menu.popup();
  }
});

module.exports = {
  set(selector, callback) {
    templates.push({ selector, callback });
  }
}
