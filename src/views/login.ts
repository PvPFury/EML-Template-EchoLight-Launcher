import { setUser, setView } from '../state'
import { auth, skin } from '../ipc'
import { Dialog } from './dialog'
import logger from 'electron-log/renderer'

export function initLogin() {
  const microsoftBtn = document.getElementById('btn-login-ms') as HTMLButtonElement | null
  const offlineBtn = document.getElementById('btn-login-offline') as HTMLButtonElement | null
  const offlineForm = document.getElementById('offline-form') as HTMLElement | null
  const usernameInput = document.getElementById('offline-username') as HTMLInputElement | null
  const submitBtn = document.getElementById('btn-submit-offline') as HTMLButtonElement | null
  const cancelBtn = document.getElementById('btn-cancel-offline') as HTMLButtonElement | null

  if (microsoftBtn) {
    microsoftBtn.addEventListener('click', async () => {
      const originalText = microsoftBtn.innerHTML
      microsoftBtn.disabled = true
      microsoftBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting...'

      try {
        const session = await auth.login()

        if (session.success) {
          const [_, skins, capes, avatar] = await Promise.all([
            skin.reload(session.account),
            skin.getSkin(),
            skin.getCape(),
            skin.getAvatar()
          ])

          setUser(session.account, { skins, capes, avatar })
          setView('home')
        } else {
          logger.error(session.error)
          await Dialog.show('Login failed', [{ text: 'OK', type: 'ok' }])
        }
      } catch (err) {
        logger.error(err)
        await Dialog.show('An error occurred during login.', [{ text: 'OK', type: 'ok' }])
      } finally {
        microsoftBtn.disabled = false
        microsoftBtn.innerHTML = originalText
      }
    })
  }

  if (offlineBtn) {
    offlineBtn.addEventListener('click', () => {
      if (offlineForm) offlineForm.style.display = 'flex'
      if (usernameInput) usernameInput.focus()
    })
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const username = usernameInput?.value.trim()

      if (!username) {
        await Dialog.show('Please enter a username', [{ text: 'OK', type: 'ok' }])
        return
      }

      submitBtn.disabled = true
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating...'

      try {
        const session = await auth.createOfflineAccount(username)

        if (session.success) {
          const fakeAccount = session.account
          const [skins, capes, avatar] = await Promise.all([
            Promise.resolve([]),
            Promise.resolve([]),
            Promise.resolve({ url: 'https://minotar.net/avatar/' + username + '/256.png' })
          ])

          setUser(fakeAccount, { skins, capes, avatar })
          setView('home')
        } else {
          logger.error(session.error)
          await Dialog.show('Failed to create account', [{ text: 'OK', type: 'ok' }])
        }
      } catch (err) {
        logger.error(err)
        await Dialog.show('An error occurred.', [{ text: 'OK', type: 'ok' }])
      } finally {
        submitBtn.disabled = false
        submitBtn.innerHTML = 'Create Account'
      }
    })
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (offlineForm) offlineForm.style.display = 'none'
      if (usernameInput) usernameInput.value = ''
    })
  }

  if (usernameInput) {
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitBtn?.click()
      }
    })
  }
}
