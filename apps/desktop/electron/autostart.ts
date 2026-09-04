import { app } from 'electron';

export function setLoginAutoStart(enable: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe'),
      args: ['--hidden'],
    });
  } catch (err) {
    console.error('Failed to set login item settings:', err);
  }
}

export function isLoginAutoStart(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (err) {
    console.error('Failed to get login item settings:', err);
    return false;
  }
}
