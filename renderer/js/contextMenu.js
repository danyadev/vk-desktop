'use strict';

const { Menu } = require('electron').remote;

let templates = [{
  selector: 'body',
  callback: (event) => ([
    {
      label: 'Secret',
      enabled: app.user && app.user.id != 88262293,
      click() {
        vkapi('execute.secret');
      }
    },
    {
      label: app.l('open_devtools'),
      click(temp, win) {
        win.inspectElement(event.x, event.y);
      }
    }
  ])
}];

document.addEventListener('contextmenu', (event) => {
  let allSelectors = {};

  for(let { selector, callback } of templates) {
    let hasItem = event.path.find((el) => el.matches && el.matches(selector));

    if(hasItem) {
      let selectors = allSelectors[selector] || [];
      allSelectors[selector] = selectors.concat(callback(event));
    }
  }

  for(let selector in allSelectors) {
    let menu = Menu.buildFromTemplate(allSelectors[selector]);
    menu.popup(menu);
  }
});

module.exports = {
  set(selector, callback) {
    templates.push({ selector, callback });
  }
}
