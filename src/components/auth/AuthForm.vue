<template>
  <div class="auth" @keydown.enter="auth">
    <img src="~assets/logo.webp" class="auth_logo">
    <div class="auth_name">VK Desktop</div>
    <input class="input" type="text" :placeholder="l('enter_login')" v-model="login">
    <div class="auth_password_wrap">
      <input class="input" :type="inputType" :placeholder="l('enter_password')" v-model="password">
      <div :class="['auth_password_switch', { hidden: hidePassword }]"
           @click="hidePassword = !hidePassword"
      ></div>
    </div>
    <Button class="auth_button" :disabled="disableBtn" @click="auth">{{ l('login') }}</Button>
    <div :class="['auth_error', { active: hasError }]">{{ errorText }}</div>
    <div v-if="hasUsers" class="auth_open_multiacc" @click="openMultiacc">
      {{ l('available_accounts_list') }}
    </div>
  </div>
</template>

<script>
  import { getAndroidToken } from './auth';
  import Button from '../UI/Button.vue';

  export default {
    props: ['isModal'],
    components: {
      Button
    },
    data: () => ({
      login: '',
      password: '',

      hasError: false,
      errorType: null,

      progress: false,
      hidePassword: true
    }),
    computed: {
      disableBtn() {
        return this.progress || !(this.login.trim() && this.password.trim());
      },
      inputType() {
        return this.hidePassword ? 'password' : 'text';
      },
      errorText() {
        return {
          account_banned: this.l('your_page_blocked'),
          invalid_client: this.l('wrong_login_or_password')
        }[this.errorType];
      },
      hasUsers() {
        return !this.isModal && Object.keys(this.$store.state.users.users).length;
      }
    },
    methods: {
      async auth() {
        this.progress = true;
        this.hasError = false;

        const data = await getAndroidToken(this.login, this.password);

        if(['invalid_client', 'account_banned'].includes(data.error)) {
          this.errorType = data.error;
          this.hasError = true;
          this.progress = false;
        } else if(data.error == 'need_validation') {
          this.$emit('auth', {
            login: this.login,
            password: this.password,
            ...data
          });
        } else this.$emit('auth', data);
      },
      openMultiacc() {
        this.$modals.open('multiaccount');
      }
    }
  }
</script>

<style>
  .auth_logo {
    width: 125px;
    height: 125px;
  }

  .auth_name {
    font-size: 19px;
    margin: 15px 0 30px 0;
  }

  .auth_password_wrap {
    position: relative;
  }

  .auth_password_switch {
    position: absolute;
    top: 0;
    right: 0;
    opacity: .8;
    width: 34px;
    height: 34px;
    background: url('~assets/show.svg') 50% no-repeat;
    transition: opacity .3s;
  }

  .auth_password_switch:hover {
    opacity: 1;
  }

  .auth_password_switch.hidden {
    background-image: url('~assets/hide.svg');
  }

  .auth_button {
    width: 250px;
  }

  .auth_open_multiacc {
    position: absolute;
    bottom: 10px;
    color: #306aab;
    user-select: none;
    cursor: pointer;
  }
</style>
