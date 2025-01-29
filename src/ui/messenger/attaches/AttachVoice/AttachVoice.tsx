import { defineComponent, InputEvent, shallowRef } from 'vue'
import * as Attach from 'model/Attach'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon32PauseCircle, Icon32PlayCircle } from 'assets/icons'
import './AttachVoice.css'

type Props = {
  voice: Attach.Voice
}

export const AttachVoice = defineComponent<Props>((props) => {
  const audio = new Audio(props.voice.linkMp3)
  const isPause = shallowRef(false)
  const range = shallowRef(0)
  const isRange = shallowRef(false)
  const requestId = shallowRef(-1)

  const getCurrentTime = () => {
    const cureentTime = audio.currentTime === 0
      ? props.voice.duration
      : audio.currentTime

    const date = new Date()
    date.setMinutes(0, cureentTime)

    return date.getMinutes() + ':' + String(date.getSeconds()).padStart(2, '0')
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

    range.value = (audio.currentTime / props.voice.duration) * 100
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

  return () => (
    <div class="AttachVoice">
      <div class="AttachVoice__top">
        <ButtonIcon
          onClick={toggleAudio}
          icon={isPause.value ? <Icon32PauseCircle /> : <Icon32PlayCircle />}
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
          <span class="AttachVoice__time">{getCurrentTime()}</span>
        </div>
      </div>
      <div class="AttachVoice__bottom">Тут будет открывашка.</div>
    </div>
  )
}, {
  props: ['voice']
})
