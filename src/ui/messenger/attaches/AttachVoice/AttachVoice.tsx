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
  const showTranscript = shallowRef(false)

  const transcriptNotReadyStatus = computed(() => {
    if (props.voice.transcriptState === 'error') {
      return lang.use('me_voice_transcription_error')
    }

    if (props.voice.transcriptState === 'in_progress') {
      return lang.use('me_voice_transcription_in_progress')
    }

    if (!props.voice.transcript) {
      return lang.use('me_voice_transcript_empty')
    }
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
          class="AttachVoice__playButton"
          addHoverBackground={false}
          onClick={toggleAudio}
          icon={
            isPause.value
              ? <Icon32PauseCircle withUnlistenedDot={!props.voice.wasListened} />
              : <Icon32PlayCircle withUnlistenedDot={!props.voice.wasListened} />
          }
        />

        <div class="AttachVoice__track">
          <input
            class="AttachVoice__range"
            type="range"
            step="0.1"
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
          class="AttachVoice__toggleTranscription"
          addHoverBackground={false}
          icon={showTranscript.value ? <Icon20ChevronUp /> : <Icon16Text />}
          onClick={() => (showTranscript.value = !showTranscript.value)}
        />
      </div>
      {showTranscript.value && (
        <div
          class={['AttachVoice__transcript', {
            'AttachVoice__transcript--notReady': transcriptNotReadyStatus.value
          }]}
        >
          {transcriptNotReadyStatus.value ?? props.voice.transcript}
        </div>
      )}
    </div>
  )
}, {
  props: ['voice']
})
