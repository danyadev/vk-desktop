import { computed, defineComponent, InputEvent, shallowRef } from 'vue'
import * as Attach from 'model/Attach'
import { useEnv } from 'hooks'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon16Text, Icon20ChevronUp, Icon32PauseCircle, Icon32PlayCircle } from 'assets/icons'
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
  const isHiddenCollapse = shallowRef(true)

  const transcriptNotReady = computed(() => {
    return !props.voice.transcript ||
    props.voice.transcript.trim() === '' ||
    props.voice.transcriptState === 'error' ||
    props.voice.transcriptState === 'in_progress'
  })

  const text = computed(() => {
    if (props.voice.transcript && props.voice.transcript.trim() === '') {
      return lang.use('me_voice_transcription_empty')
    }

    if (props.voice.transcriptState === 'error') {
      return lang.use('me_voice_transcription_empty')
    }

    if (props.voice.transcriptState === 'in_progress') {
      return lang.use('me_voice_transcription_in_progress')
    }

    return props.voice.transcript
  })

  const getCurrentTime = () => {
    const currentTime = audio.currentTime === 0
      ? props.voice.duration
      : audio.currentTime

    const date = new Date()
    date.setMinutes(0, currentTime)

    return date.getMinutes() + ':' + String(date.getSeconds()).padStart(2, '0')
  }

  const moveRange = (event: InputEvent<HTMLInputElement>) => {
    audio.currentTime = (+event.target.value / 100) * props.voice.duration
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
      <div class="AttachVoice__player">
        <ButtonIcon
          onClick={toggleAudio}
          icon={isPause.value ? <Icon32PauseCircle /> : <Icon32PlayCircle />}
        />
        <div class="AttachVoice__track">
          <div class="AttachVoice__trackContent">
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
          <ButtonIcon
            class="AttachVoice__button"
            icon={isHiddenCollapse.value ? <Icon16Text /> : <Icon20ChevronUp />}
            onClick={() => (isHiddenCollapse.value = !isHiddenCollapse.value)}
          />
        </div>
      </div>
      {!isHiddenCollapse.value && (
        <div class="AttachVoice__transcript">
          <div class={['AttachVoice__collapse', {
            'AttachVoice__collapse--open': !isHiddenCollapse.value,
            'AttachVoice__collapse--close': isHiddenCollapse.value,
            'AttachVoice__collapse--faded': transcriptNotReady.value
          }]}
          >
            {text.value}
          </div>
        </div>
      )}
    </div>
  )
}, {
  props: ['voice']
})
