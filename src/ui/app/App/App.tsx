import './App.css'
import { defineComponent } from 'vue'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'

export const App = defineComponent(() => {
  return () => (
    <div class="App" data-scheme="bright_light">
      <Titlebar />
    </div>
  )
})
