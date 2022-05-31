import vkapi from './vkapi';
import store from './store';
import router from './router';
import request from './request';
import longpoll from './longpoll';
import { messageFlagsMap, conversationFlagsMap, hasFlag, getAllFlags } from './longpollEvents';
import * as dateUtils from './date/utils';
import * as auth from '@/auth';
import * as emoji from './emoji';
import * as modals from './modals';
import { addSnackbar } from './snackbars';

window.vkapi = vkapi;
window.store = store;
window.router = router;
window.request = request;
window.longpoll = longpoll;
window.dateUtils = dateUtils;
window.auth = auth;
window.emoji = emoji;
window.modals = modals;
window.addSnackbar = addSnackbar;

window.messageFlagsMap = messageFlagsMap;
window.conversationFlagsMap = conversationFlagsMap;
window.hasFlag = hasFlag;
window.getAllFlags = getAllFlags;
