import { defineComponent, InputEvent, shallowRef } from 'vue'
import * as Attach from 'model/Attach'
import { useEnv } from 'hooks'
import { startOfDay } from 'misc/dateTime'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon32PauseCircle, Icon32PlayCircle } from 'assets/icons'
import './AttachVoice.css'

type Props = {
  voice: Attach.Voice
}

export const AttachVoice = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  const audio = new Audio(props.voice.linkMp3)
  const isPause = shallowRef(false)
  const range = shallowRef(0)
  const isRange = shallowRef(false)
  const requestId = shallowRef(-1)

  const getCurrentTime = () => {
    const durationVoice = lang.dateTimeFormatter({ minute: '2-digit', second: '2-digit' }).format(
      startOfDay(new Date()).setSeconds(props.voice.duration)
    )

    const currentTime = lang.dateTimeFormatter({ minute: '2-digit', second: '2-digit' }).format(
      startOfDay(new Date()).setSeconds(audio.currentTime)
    )

    return audio.currentTime === 0 ? durationVoice : currentTime
  }

  const moveRange = (event: InputEvent<HTMLInputElement>) => {
    const currentNumber = (+event.target.value / 100) * props.voice.duration
    audio.currentTime = currentNumber

    requestId.value = requestAnimationFrame(updateRange)
  }

  const updateRange = () => {
    if (isRange.value) {
      return
    }

    const min = 0

    const diff = props.voice.duration - min
    const currentPosition = audio.currentTime - min
    const percentage = (currentPosition / diff) * 100

    range.value = percentage

    requestId.value = requestAnimationFrame(updateRange)
  }

  const toggleAudio = () => {
    if (!isPause.value) {
      requestId.value = requestAnimationFrame(updateRange)
      isPause.value = true
      audio.play()
      return
    }

    cancelAnimationFrame(requestId.value)
    audio.pause()
    isPause.value = false
  }

  audio.onended = () => {
    cancelAnimationFrame(requestId.value)
    isPause.value = false
    range.value = 0
  }

  return () => {
    return (
      <div class="AttachVoice">
        <div class="AttachVoice__top">
          <ButtonIcon
            onClick={toggleAudio}
            icon={ isPause.value ? <Icon32PauseCircle /> : <Icon32PlayCircle /> }
          />
          <div class="AttachVoice__track">
            <input
              class="AttachVoice__range"
              type="range"
              id="track"
              name="track"
              value={range.value}
              min="0"
              max="100"
              onChange={(event) => moveRange(event)}
              onTouchstart={() => (isRange.value = true)}
              onTouchend={() => (isRange.value = false)}
              onMousedown={() => (isRange.value = true)}
              onMouseup={() => (isRange.value = false)}
            />
            <span class="AttachVoice__time">{getCurrentTime().slice(1)}</span>
          </div>
        </div>
        <div class="AttachVoice__bottom">Тут будет открывашка.</div>
      </div>
    )
  }
}, {
  props: ['voice']
})
