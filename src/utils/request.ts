export interface Config {
  baseUrl?: string
  url?: string
  method?: string
  headers?: any
  data?: any
  onProgress?: any
  setXhr?: any
  requestList?: any
}
// xhr
export const request = (conf: Config): Promise<any> => {
  const config: Config = {
    method: 'post',
    baseUrl: 'http://localhost:3001',
    headers: {},
    data: {},
    ...conf
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = config.onProgress
    xhr.open(config.method, `${config.baseUrl}${config.url}`)
    Object.keys(config.headers).forEach((key) => xhr.setRequestHeader(key, config.headers[key]))
    xhr.send(config.data)
    xhr.onload = (e) => {
      // 将请求成功的 xhr 从列表中删除
      if (config.requestList) {
        const xhrIndex = config.requestList.findIndex((item) => item === xhr)
        config.requestList.splice(xhrIndex, 1)
      }
      console.log((e.target as any).response)
      resolve(JSON.parse((e.target as any).response))
    }
    // 暴露当前 xhr 给外部
    config.requestList && config.requestList.push(xhr)
  })
}
