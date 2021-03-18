import electron from 'electron';
import vkapi from './vkapi';
import store from './store';
import router from './router';

function openChat(peer_id) {
  router.push(`/messages/${peer_id}`);
  return true;
}

export default async function(link) {
  const url = new URL(link);
  const params = new Map(url.searchParams);
  let result;

  switch (url.host) {
    case 'm.vk.com':
      result = resolveMVKCom(url, params);
      break;

    case 'vk.com':
      result = resolveVKCom(url, params);
      break;

    case 'vk.me':
      result = await resolveVKMe(url);
      break;
  }

  if (!result) {
    electron.shell.openExternal(link);
  }
}

// ========================================================

function resolveMVKCom(url, params) {
  if (params.get('act') === 'show') {
    if (params.has('chat')) {
      return openChat(2e9 + +params.get('chat'));
    }

    if (params.has('peer')) {
      return openChat(params.get('peer'));
    }
  }

  if (url.pathname.startsWith('/write')) {
    return openChat(url.pathname.slice(6));
  }
}

// ========================================================

function resolveVKCom(url, params) {
  if (url.pathname === '/im' && params.has('sel')) {
    const sel = params.get('sel');

    if (sel.startsWith('c')) {
      return openChat(2e9 + +sel.slice(1));
    }

    return openChat(sel);
  }

  if (url.pathname.startsWith('/write')) {
    return openChat(url.pathname.slice(6));
  }
}

// ========================================================

async function resolveVKMe(url) {
  // if (url.pathname.startsWith('/join/') && url.pathname.length > 6) {
  //   TODO chat preview
  //   vkapi messages.getChatPreview link: block.link
  // }

  const domain = url.pathname.slice(1);

  // vk.me/<ник или idxxx> означает лс определенного пользователя
  if (domain.includes('/')) {
    return;
  }

  const profiles = Object.values(store.state.profiles);
  const idMatch = domain.match(/(id|club)(\d+)$/);

  if (idMatch) {
    const profile = profiles.find((user) => user.id === +idMatch[2]);

    if (profile) {
      return openChat(profile.id);
    }

    try {
      const [profile] = await vkapi('execute.getProfiles', {
        profile_ids: idMatch[1] === 'id' ? idMatch[2] : -idMatch[2]
      });

      if (profile.deactivated !== 'deleted' && profile.first_name !== 'DELETED') {
        return openChat(profile.id);
      }
    } catch {
      return;
    }
  }

  const localProfile = profiles.find((profile) => (
    profile.domain === domain || profile.screen_name === domain
  ));

  if (localProfile) {
    return openChat(localProfile.id);
  }

  const profileInfo = await vkapi('utils.resolveScreenName', {
    screen_name: domain
  });

  // В случае, когда домен неверный, приходит []
  if (!Array.isArray(profileInfo)) {
    if (profileInfo.type === 'user') {
      return openChat(+profileInfo.object_id);
    }

    if (profileInfo.type === 'group') {
      return openChat(-profileInfo.object_id);
    }
  }
}
