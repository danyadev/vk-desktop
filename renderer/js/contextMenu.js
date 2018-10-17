'use strict';

let templates = [];

document.addEventListener('contextmenu', async (event) => {
  for(let template of templates) {
    if(event.path.includes(template.elem)) {
      let temp = template.callback(event),
          menu = Menu.buildFromTemplate(temp instanceof Promise ? await temp : temp);

      menu.popup(menu);
    }
  }
});

module.exports = {
  set: (elem, callback) => {
    templates.push({ elem, callback });
  }
}
