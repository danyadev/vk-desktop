import { defineComponent } from 'vue'
import { AppearanceTheme, useMainSettingsStore } from 'store/mainSettings'
import { useEnv, useGlobalModal, useModal } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { Checkbox } from 'ui/ui/Checkbox/Checkbox'
import { Select } from 'ui/ui/Select/Select'
import './SettingsModal.css'

export const SettingsModal = defineComponent(() => {
  const { lang } = useEnv()
  const mainSettings = useMainSettingsStore()
  const { settingsModal } = useGlobalModal()
  const changeWindowSettingModal = useModal()

  const THEME_OPTIONS: Array<{ label: string, value: AppearanceTheme }> = [
    { label: lang.use('settings_theme_system'), value: 'system' },
    { label: lang.use('settings_theme_light'), value: 'light' },
    { label: lang.use('settings_theme_dark'), value: 'dark' }
  ]

  return () => (
    <Modal
      opened={settingsModal.opened}
      onClose={settingsModal.close}
      onVisibilityChange={settingsModal.onVisibilityChange}
      title={lang.use('settings_title')}
      class="SettingsModal"
    >
      <div class="SettingsModal__selectWrapper">
        {lang.use('settings_theme_description')}
        <Select
          class="SettingsModal__select"
          selected={mainSettings.appearance.theme}
          onSelect={(theme) => (mainSettings.appearance.theme = theme)}
          options={THEME_OPTIONS}
        />
      </div>

      <Checkbox
        label={lang.use('settings_alwaysOnTop_description')}
        checked={mainSettings.alwaysOnTop}
        onChange={(checked) => {
          mainSettings.alwaysOnTop = checked
          changeWindowSettingModal.open()
        }}
      />

      <Checkbox
        label={lang.use('settings_useCustomTitlebar_description')}
        checked={mainSettings.useCustomTitlebar}
        onChange={(checked) => {
          mainSettings.useCustomTitlebar = checked
          changeWindowSettingModal.open()
        }}
      />

      <Modal
        opened={changeWindowSettingModal.opened}
        onClose={changeWindowSettingModal.close}
        title={lang.use('settings_changeWindowSetting_title')}
        buttons={
          <Button onClick={changeWindowSettingModal.close}>
            {lang.use('modal_close_label')}
          </Button>
        }
      >
        {lang.use('settings_changeWindowSetting_description')}
      </Modal>
    </Modal>
  )
})
