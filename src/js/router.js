import Vue from 'vue';
import VueRouter from 'vue-router';

import Auth from './../components/auth/Auth.vue';
import Content from './../components/Content.vue';

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    { path: '/auth', component: Auth },
    { path: '/content', component: Content }
  ]
});
