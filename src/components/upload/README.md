- [小文件上传](##文件上传)
- [大文件分片上传](##大文件分片上传)
- [如何让上传的图片展示在页面](##如何让上传的图片展示在页面)
- [spark-md5 生成 md5](##spark-md5.js)
- [其他技巧](##其他技巧)

## 文件上传

- 小文件上传思路：用 FormData 对象上传二进制文件

```js
const formData = new FormData()
formData.append('file', currentFile.file)
formData.append('name', currentFile.file.name)
request({ url: '/fileUpload', data: formData })
```

## 大文件分片上传

1. 使用 file.slice()把 file 数据切分成几片，然后存放在 chunks 数组里面去上传（把每个 chunk 通过用 FormData 对象上传二进制文件），上传完，就判断是否上传成功，否则传入参数继续上传
2. 上传之前，通过 spark-md5 把分片数组生成 md5，然后调用后端验证是否内存有此文件的 md5 哈希名
3. 上传所有分片文件，判断是否都上传完，上传完调用请求合并接口，合并完删除临时存储切片的文件

```js
// 1）生成切片：把整个文件通过file.slice切割成[0: {file: Blob} 1: {file: Blob}...]
const fileChunkList = []
let cur = 0
while (cur < file.size) {
    fileChunkList.push({ file: file.slice(cur, cur + size) })
    cur += size
}

// 2）发送到worker，通过spark-md5处理成哈希值11bf881aaa24be9cf0b050d90d5c739
const spark = new self.SparkMD5.ArrayBuffer();
// fileChunkList => [0: {file: Blob} 1: {file: Blob}...]
spark.append(fileChunkList);
spark.end() // 计算后的md5


// 3）把文件名和生成好的md5 hash值发送到后端验证（内存中是否已经存在，此时切片还没上传上去）
// 前端提交
request({ url: '/verify', data: JSON.stringify({  filename, fileHash })})

// 后端校验
// filePath => D:\gitPro\vue3-vite-template\target\11bf881aaa24be9cf0b050d90d5c739.mp3   ext是后缀.mp3
const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
if(fse.existsSync(filePath)){}


// 4）上传切片：遍历，每个切片都用FormData对象上传二进制文件，即存放到临时文件夹里，如果上传请求的个数等于切片总数，就请求合并切片
// 前端提交
const formData = new FormData()
formData.append('chunk', chunk)
formData.append('hash', hash)
formData.append('filename', file.name)
formData.append('fileHash', fileHash)
request({ url: '/', data: formData })

// 后端校验
const multipart = new multiparty.Form()
await multipart.parse(ctx.req, async (err, fields, files) => {...})

// 5）合并切片，合并后删除存储切片的临时文件
// 创建一个可读流
var readerStream = fse.createReadStream(chunkDir);
// 创建一个可写流
var writerStream = fse.createWriteStream(filePath);
// 管道读写操作
// 读取chunkDir文件内容，并将内容写入到filePath文件中
readerStream.pipe(writerStream);
// 合并后删除保存切片的目录
fse.rmdirSync(chunkDir)
```

### 如何让上传的图片展示在页面

监听文件上传，通过 FileReader 去读取 file，返回 data:URL 格式的 Base64 字符串，用来展示到页面去

```js
// 1. base64形式的文件内容
var reader = new FileReader()
var file = myFile.files[0]
reader.readAsDataURL(file)
reader.onload = function () {
  // onload读取完成的时候触发
  var dataUrl = reader.result
}

// 2. 展示到页面去
;<img src={dataUrl} alt={file.name} />
```

## spark-md5.js

- 使用 spark-md5 根据文件内容算出文件 hash
- 通过 hash 可以判断服务端是否已经上传该文件，从而直接提示用户上传成功（秒传）
  通过 XMLHttpRequest 的 abort 方法暂停切片的上传
  上传前服务端返回已经上传的切片名，前端跳过这些切片的上传

通过 spark-md5.js 判断文件是否上传过，如果上传过就可以接着上传或者不用上传（无需上传文件就快速获取本地文件 md5）
做文件上传时，在前端先获取要上传的文件 md5，并把文件 md5 传给服务器，服务端对比之前文件的 m5，如果存在相同的 md5，只要把文件名传给服务器关联之前的文件即可，并不需要再次上传相同的文件，节省存储资源和网络宽带

```js
;<script src="//cdn.rawgit.com/satazor/SparkMD5/master/spark-md5.min.js"></script>
document.getElementById('file').addEventListener('change', function () {
  let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
    file = this.files[0],
    chunkSize = 2097152, // read in chunks of 2MB
    chunks = Math.ceil(file.size / chunkSize),
    currentChunk = 0,
    spark = new SparkMD5.ArrayBuffer(),
    frOnload = function (e) {
      spark.append(e.target.result)
      currentChunk++
      if (currentChunk < chunks) loadNext()
      else console.log(`加载结束 :计算后的文件md5:${spark.end()}现在你可以选择另外一个文件!`)
    },
    frOnerror = function () {
      console.log(`糟糕，好像哪里错了`)
    }
  function loadNext() {
    const fileReader = new FileReader()
    fileReader.onload = frOnload
    fileReader.onerror = frOnerror
    let start = currentChunk * chunkSize,
      end = start + chunkSize >= file.size ? file.size : start + chunkSize
    fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
  }
  loadNext()
})
```

## 其他技巧：

- 计算 hash 比较耗时，借助 worker 实现
- 使用 xhr.onprogress 来实现上传进度条
- 使用 xhr.abort 来切片的上传，上传前服务端返回已经上传的切片名，前端跳过这些切片的上传
