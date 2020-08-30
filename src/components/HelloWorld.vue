<template>
  <div>
    {{ stateAsRefs }}
    {{ state.foo }}
    {{ container.file }}
  </div>
</template>

<script lang="ts">
  import { ref, toRefs, reactive } from 'vue'

  export default {
    setup() {
      const count = ref(0)
      const container = reactive({
        file: null,
        hash: '',
        worker: null
      })
      const state = reactive({
        foo: 1,
        bar: 2
      })
      const stateAsRefs = toRefs(state)

      const handleFileChange = (e) => {
        const [file] = e.target.files
        if (!file) return
        this.resetData()
        Object.assign(this.$data, this.$options.data())
        this.container.file = file
      }

      const handleUpload = () => {
        // console.log()
        state.foo++
        container.file++
        // count.value++
      }
      // ...toRefs(container)
      return { count, state, stateAsRefs, container, handleFileChange, handleUpload }
    }
  }
</script>
