import { defineComponent, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import * as Peer from 'model/Peer'
import { useViewerStore, ViewerUser } from 'store/viewer'
import { useEnv, useModal } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Icon20TrashOutline } from 'assets/icons'

export const AuthMultiaccount = defineComponent(() => {
  const viewer = useViewerStore()
  const router = useRouter()
  const { lang } = useEnv()

  const isDeleteModeActive = shallowRef(false)
  const confirmDeleteModal = useModal()
  const userToDelete = shallowRef<ViewerUser>()

  function openAccount(userId: Peer.UserId) {
    viewer.setCurrentAccount(userId)
    router.replace('/')
  }

  function confirmDeleteAccount(userId: Peer.UserId) {
    userToDelete.value = viewer.accounts.get(userId)
    confirmDeleteModal.open()
  }

  function deleteAccount() {
    if (!userToDelete.value) {
      return
    }

    viewer.deleteAccount(userToDelete.value.id)
    confirmDeleteModal.close()
  }

  return () => {
    if (!viewer.accounts.size) {
      return null
    }

    return (
      <div class={['Auth__accounts', isDeleteModeActive.value && 'Auth__accounts--deleteMode']}>
        {[...viewer.accounts.values()].map((account) => (
          <div class="Auth__account">
            <div class="Auth__accountContent" onClick={() => openAccount(account.id)}>
              <Avatar peer={account} size={56} />
              <div class="Auth__accountName">
                {account.firstName}
              </div>
            </div>

            <ButtonText
              class="Auth__accountDeleteButton"
              disabled={!isDeleteModeActive.value}
              onClick={() => confirmDeleteAccount(account.id)}
            >
              {lang.use('auth_account_delete')}
            </ButtonText>
          </div>
        ))}

        <ButtonIcon
          class="Auth__accountToggleDeleteModeButton"
          onClick={() => (isDeleteModeActive.value = !isDeleteModeActive.value)}
        >
          <Icon20TrashOutline
            color={
              isDeleteModeActive.value
                ? 'var(--vkui--color_button_icon)'
                : 'var(--vkui--color_icon_negative)'
            }
          />
        </ButtonIcon>

        {userToDelete.value && (
          <Modal
            opened={confirmDeleteModal.opened}
            onClose={confirmDeleteModal.close}
            onVisibilityChange={(isVisible) => !isVisible && (userToDelete.value = undefined)}
            title={lang.use('confirmAccountDelete_title')}
            buttons={[
              <Button mode="destructive" onClick={deleteAccount}>
                {lang.use('modal_delete_label')}
              </Button>,
              <Button onClick={confirmDeleteModal.close}>
                {lang.use('modal_cancel_label')}
              </Button>
            ]}
          >
            {lang.use('confirmAccountDelete_confirm', {
              userName: Peer.name(userToDelete.value)
            })}
          </Modal>
        )}
      </div>
    )
  }
})
