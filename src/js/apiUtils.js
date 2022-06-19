import vkapi from './vkapi';
import store from './store';
import { fields } from './utils';

export async function resolveScreenName(screen_name) {
  const profileInfo = await vkapi('utils.resolveScreenName', { screen_name });

  // В случае, когда домен неверный, приходит []
  if (!Array.isArray(profileInfo)) {
    if (profileInfo.type === 'group') {
      return -profileInfo.object_id;
    }

    return +profileInfo.object_id;
  }
}

const loadingProfiles = [];
let isLoadingProfiles = false;

export async function loadProfile(profileId) {
  if (loadingProfiles.includes(profileId)) {
    return;
  }

  if (profileId) {
    if (Number.isNaN(+profileId)) {
      profileId = await resolveScreenName(profileId);
      if (!profileId) return;
    }

    loadingProfiles.push(profileId);
  }

  if (isLoadingProfiles) {
    return;
  }

  isLoadingProfiles = true;

  const profiles = loadingProfiles.slice();
  const newProfiles = await vkapi('execute.getProfiles', {
    profile_ids: profiles.join(','),
    func_v: 2,
    fields
  });

  store.commit('addProfiles', newProfiles);

  loadingProfiles.splice(0, profiles.length);
  isLoadingProfiles = false;

  if (loadingProfiles.length) {
    loadProfile();
  }
}

export function getAppName(app_id) {
  switch (app_id) {
    case 2274003:
      return 'Android';
    case 3140623:
    case 3087106:
      return 'iPhone';
    case 3682744:
      return 'iPad';
    case 6146827:
    case 6482950:
    case 6481715:
      return 'VK Me';
    case 3502561:
    case 3502557:
      return 'Windows Phone';
    case 5027722:
      return 'VK Messenger';
    case 6121396:
      return 'VK Admin';
    case 2685278:
      return 'Kate Mobile';
    case 6717234:
      return 'VK Desktop';
    case 6614620:
      return 'Laney';
    case 5632485:
      return 'SpaceVK';
    case 6328039:
    case 6328868:
    case 6820516:
      return 'VK mp3 mod';
  }
}
