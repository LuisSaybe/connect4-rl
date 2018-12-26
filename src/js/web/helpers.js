import settings from 'js/settings.json';

export const api = (path) => {
  return `${settings.api}${path}`;
}
