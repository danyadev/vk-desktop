import os from 'os';
import vkapi from 'js/vkapi';
import store from 'js/store';
import pkg from '../../../package.json';

// ---- Переменные

export const VKDesktopUserAgent =
  `VKDesktop/${pkg.version} (${os.platform()}; ${os.release()}; ${os.arch()})`;
export const AndroidUserAgent =
  'VKAndroidApp/7.43-14005 (Android 10; SDK 29; arm64-v8a; VK Desktop; ru; 2340x1080)';

export const fields = 'photo_50,photo_100,verified,sex,status,first_name_acc,last_name_acc,online,last_seen,online_info,domain';

// ---- Основные утилиты

export function getPhoto(obj) {
  return obj && (devicePixelRatio > 1 ? obj.photo_100 : obj.photo_50);
}

// Возвращает фотографию нужного размера из объекта фотографий
export function getPhotoFromSizes(sizes, size, isDoc) {
  const find = (type) => sizes.find((photo) => photo.type === type);
  const optionalTypes = isDoc ? ['z', 'y', 'x', 'm', 's'] : ['w', 'z', 'y'];

  function fallback() {
    const sizesObj = sizes.reduce((acc, val) => {
      acc[val.width * val.height] = val;
      return acc;
    }, {});
    const optimalSize = Object.keys(sizesObj).sort((a, b) => b - a)[0];

    return sizesObj[optimalSize];
  }

  if (Array.isArray(size)) {
    for (let i = 0; i < size.length; i++) {
      const photo = find(size[i]);
      if (photo) return photo;
    }

    return fallback();
  }

  const index = optionalTypes.indexOf(size);

  if (index !== -1) {
    for (let i = index; i < optionalTypes.length; i++) {
      const photo = find(optionalTypes[i]);
      if (photo) return photo;
    }

    return fallback();
  }

  return find(size) || fallback();
}

// Собирает массивы профилей и групп в единый массив, где у групп отрицательный id
export function concatProfiles(profiles, groups) {
  profiles = profiles || [];
  groups = groups || [];

  return profiles.concat(
    groups.reduce((list, group) => {
      group.id = -group.id;
      list.push(group);
      return list;
    }, [])
  );
}

export function getAppName(appId) {
  switch (appId) {
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

// ---- Функции, работающие с апи

export async function resolveScreenName(screenName) {
  const profileInfo = await vkapi('utils.resolveScreenName', {
    screen_name: screenName
  });

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
