<template>
  <div id="app">
    <div>
      <input type="file" :disabled="status !== Status.wait" @change="handleFileChange" />
      <button @click="handleUpload" :disabled="uploadDisabled">上传</button>
      <button @click="handleResume" v-if="status === Status.pause">恢复</button>
      <button
        v-else
        :disabled="status !== Status.uploading || !container.hash"
        @click="handlePause"
      >暂停</button>
    </div>
    <div>
      {{ uploadDisabled }}
      <div>计算文件 hash</div>
      <p>{{ hashPercentage }}</p>
      <div>总进度</div>
      <p>{{ fakeUploadPercentage }}</p>
    </div>
    <div>
      <ul>
        <li v-for="(item, index) in data" :key="index">
          <p>大小(KB): {{ transformByte(item.size) }}</p>
          <p>进度: {{ item.percentage }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs, watch } from 'vue'
import { request } from '../../utils/request'
const SIZE = 10 * 1024 * 1024 // 切片大小

const Status = {
  wait: 'wait',
  pause: 'pause',
  uploading: 'uploading'
}

export default {
  setup () {
    const state = reactive({
      Status,
      container: {
        file: null,
        hash: '',
        worker: null
      },
      hashPercentage: 0,
      data: [],
      requestList: [],
      status: Status.wait,
      // 当暂停时会取消 xhr 导致进度条后退
      // 为了避免这种情况，需要定义一个假的进度条
      fakeUploadPercentage: 0,
      transformByte: (val) => Number((val / 1024).toFixed(0))
    })

    const uploadDisabled = computed(
      () => !state.container.file || [Status.pause, Status.uploading].includes(state.status)
    )
    const uploadPercentage = computed(() => {
      if (!state.container.file || !state.data.length) return 0
      const loaded = state.data.map((item) => item.size * item.percentage).reduce((acc, cur) => acc + cur)
      return parseInt((loaded / state.container.file.size).toFixed(2))
    })

    watch(uploadPercentage, (now) => {
      if (now > state.fakeUploadPercentage) {
        state.fakeUploadPercentage = now
      }
    })

    // 通知服务端合并切片
    const mergeRequest = async () => {
      await request({
        url: '/merge',
        headers: {
          'content-type': 'application/json'
        },
        data: JSON.stringify({
          size: SIZE,
          fileHash: state.container.hash,
          filename: state.container.file.name
        })
      })
      alert('上传成功')
      state.status = Status.wait
    }

    // 根据 hash 验证文件是否曾经已经被上传过
    // 没有才进行上传
    const verifyUpload = async (filename, fileHash) => {
      const res = await request({
        url: '/verify',
        headers: {
          'content-type': 'application/json'
        },
        data: JSON.stringify({
          filename,
          fileHash
        })
      })
      return res
    }

    // 用闭包保存每个 chunk 的进度数据
    const createProgressHandler = (item) => {
      return (e) => {
        item.percentage = parseInt(String((e.loaded / e.total) * 100))
      }
    }

    const resetData = () => {
      state.requestList.forEach((xhr) => xhr && xhr.abort())
      state.requestList = []
      if (state.container.worker) {
        state.container.worker.onmessage = null
      }
    }

    const handlePause = () => {
      state.status = Status.pause
      resetData()
    }

    const handleResume = async () => {
      state.status = Status.uploading
      const { uploadedList } = await verifyUpload(state.container.file.name, state.container.hash)
      await uploadChunks(uploadedList)
    }

    // 生成文件切片
    const createFileChunk = (file, size = SIZE) => {
      const fileChunkList = []
      let cur = 0
      while (cur < file.size) {
        fileChunkList.push({ file: file.slice(cur, cur + size) })
        cur += size
      }
      return fileChunkList
    }

    // 生成文件 hash（web-worker）
    const calculateHash = (fileChunkList) => {
      return new Promise((resolve) => {
        state.container.worker = new Worker('/hash.js')
        state.container.worker.postMessage({ fileChunkList })
        state.container.worker.onmessage = (e) => {
          const { percentage, hash } = e.data
          state.hashPercentage = percentage
          if (hash) {
            resolve(hash)
          }
        }
      })
    }

    // 上传切片，同时过滤已上传的切片
    const uploadChunks = async (uploadedList = []) => {
      const requestList = state.data
        .filter(({ hash }) => !uploadedList.includes(hash))
        .map(({ chunk, hash, index }) => {
          const formData = new FormData()
          formData.append('chunk', chunk)
          formData.append('hash', hash)
          formData.append('filename', state.container.file.name)
          formData.append('fileHash', state.container.hash)
          return { formData, index }
        })
        .map(async ({ formData, index }) =>
          request({
            url: '/',
            data: formData,
            onProgress: createProgressHandler(state.data[index]),
            requestList: state.requestList
          })
        )
      await Promise.all(requestList)
      // 之前上传的切片数量 + 本次上传的切片数量 = 所有切片数量时
      // 合并切片
      if (uploadedList.length + requestList.length === state.data.length) {
        await mergeRequest()
      }
    }

    const handleFileChange = (e) => {
      const [file] = e.target.files
      if (!file) return
      resetData()
      state.container.file = file
    }

    const handleUpload = async () => {
      if (!state.container.file) return
      state.status = Status.uploading
      // 1）生成切片：把整个文件通过file.slice切割成[0: {file: Blob} 1: {file: Blob}...]
      const fileChunkList = createFileChunk(state.container.file)
      // 2）发送到worker，让spark-md5处理成11bf881aaa24be9cf0b050d90d5c739
      state.container.hash = await calculateHash(fileChunkList)
      // 3）把文件名和hash值发送到后端验证（内存中是否已经存在，此时切片还没上传上去）
      const res = await verifyUpload(state.container.file.name, state.container.hash)
      const { shouldUpload, uploadedList } = res
      if (!shouldUpload) {
        alert('秒传：上传成功')
        state.status = Status.wait
        return
      }
      state.data = fileChunkList.map(({ file }, index) => ({
        fileHash: state.container.hash,
        index,
        hash: state.container.hash + '-' + index,
        chunk: file,
        size: file.size,
        percentage: uploadedList.includes(index) ? 100 : 0
      }))
      /* 4）上传切片：遍历，每个切片都用FormData对象上传二进制文件，即存放到临时文件夹里，
           如果上传请求的个数等于切片总数，就请求合并切片
         */
      await uploadChunks(uploadedList)
    }

    return {
      ...toRefs(state),
      uploadDisabled,
      handleFileChange,
      handleUpload,
      handleResume,
      handlePause
    }
  }
}
</script>
