'use strict';

const { Menu } = require('electron').remote;

let templates = [{
  selector: 'body',
  callback: () => []
}];

function devTools(e) {
  return {
    label: app.l('open_devtools'),
    click: (temp, win) => win.inspectElement(e.x, e.y)
  }
}

document.addEventListener('contextmenu', async (event) => {
  for(let template of templates) {
    let hasItem = event.path.find((el) => {
      return el.matches && el.matches(template.selector);
    });

    if(hasItem) {
      let temp = [...template.callback(event), devTools(event)],
          menu = Menu.buildFromTemplate(temp instanceof Promise ? await temp : temp);

      menu.popup(menu);
    }
  }
});

module.exports = {
  set: (selector, callback) => {
    templates.push({ selector, callback });
  }
}
