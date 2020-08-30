<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <button @click="handleUpload" :disabled="uploadDisabled">上传</button>
    <div v-if="uploadDisabled">loading</div>
    <img v-if="hasUpload && isImage(type)" :src="dataUrl" :alt="file && file.name" />
  </div>
</template>

<script lang="ts">
import { reactive, toRefs, computed } from 'vue'
import { request } from '../../utils/request'
const Status = {
  wait: 'wait',
  pause: 'pause',
  uploading: 'uploading'
}
export default {
  setup() {
    const currentFile = reactive({
      file: null,
      dataUrl: '',
      type: null
    })
    const state = reactive({
      status: null,
      hasUpload: false,
      isImage: (type: string = ''): boolean => type.includes('image')
    })

    const uploadDisabled = computed(() => state.status == Status.uploading)

    const handleFileChange = (e) => {
      state.hasUpload = false
      const [file] = e.target.files
      if (!file) return
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        currentFile.file = file
        currentFile.dataUrl = reader.result as string
        currentFile.type = file.type
      })
      reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
      state.status = Status.uploading
      const formData = new FormData()
      formData.append('file', currentFile.file)
      formData.append('name', currentFile.file.name)
      const res = await request({
        url: '/fileUpload',
        data: formData
      })
      if (res.code === 200) {
        alert('上传成功')
        state.status = Status.wait
        state.hasUpload = true
      } else {
        alert('上传失败，请重新上传~')
      }
    }

    return {
      ...toRefs(currentFile),
      ...toRefs(state),
      uploadDisabled,
      handleFileChange,
      handleUpload
    }
  }
}
</script>

<style lang="scss" scoped></style>
