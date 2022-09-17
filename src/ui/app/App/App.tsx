import { defineComponent } from 'vue'
import './App.css'
import { Titlebar } from '../Titlebar/Titlebar'

export const App = defineComponent(() => {
  return () => (
    <div class="App">
      <Titlebar />
    </div>
  )
})
