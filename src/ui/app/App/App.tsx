import { defineComponent, ref } from 'vue';
import './App.css';

export default defineComponent(() => {
  const counter = ref(0);

  return () => (
    <div class="App">
      <button onClick={() => counter.value++}>
        Counter: {counter.value}
      </button>
    </div>
  );
});
