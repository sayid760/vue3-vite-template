const router = require('koa-router')()
const multiparty = require('multiparty')
const path = require('path')
const fse = require('fs-extra')

const extractExt = (filename) => filename.slice(filename.lastIndexOf('.'), filename.length) // 提取后缀名
const UPLOAD_DIR = path.resolve(__dirname, '.', 'target') // 大文件存储目录

const pipeStream = (path, writeStream) =>
  new Promise((resolve) => {
    const readStream = fse.createReadStream(path)
    readStream.on('end', () => {
      fse.unlinkSync(path)
      resolve()
    })
    readStream.pipe(writeStream)
  })

// 合并切片
const mergeFileChunk = async (filePath, fileHash, size) => {
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash) // D:\proAll\vite-template-master\target\2297fb2e3e75318cd0a07c80a3f406eb
  console.log(fse.readdir(chunkDir))
  const chunkPaths = await fse.readdir(chunkDir)
  console.log(chunkPaths)
  // 根据切片下标进行排序
  // 否则直接读取目录的获得的顺序可能会错乱
  chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1])
  console.log(chunkPaths)
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        // 指定位置创建可写流
        fse.createWriteStream(filePath, {
          start: index * size,
          end: (index + 1) * size
        })
      )
    )
  )
  console.log('sssss')
  if (fse.existsSync(chunkDir)) {
    fse.rmdirSync(chunkDir) // 合并后删除保存切片的目录
  }
}

// 返回已经上传切片名
const createUploadedList = async (fileHash) =>
  fse.existsSync(path.resolve(UPLOAD_DIR, fileHash)) ? await fse.readdir(path.resolve(UPLOAD_DIR, fileHash)) : []

// 合并切片
router.post('/merge', async (ctx, next) => {
  const { fileHash, filename, size } = ctx.request.body
  const ext = extractExt(filename)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  await mergeFileChunk(filePath, fileHash, size)
  ctx.body = {
    code: 200,
    message: 'file merged success'
  }
})

// 处理切片（校验完再上传切片）
router.post('/', async (ctx, next) => {
  const multipart = new multiparty.Form()
  await multipart.parse(ctx.req, async (err, fields, files) => {
    console.log('1111')
    if (err) {
      console.error(err)
      ctx.body = {
        code: 500,
        message: 'process file chunk failed'
      }
      return
    }
    const [chunk] = files.chunk
    const [hash] = fields.hash
    const [fileHash] = fields.fileHash
    const [filename] = fields.filename
    const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(filename)}`)
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash)

    // 文件存在直接返回
    if (fse.existsSync(filePath)) {
      ctx.body = {
        code: 200,
        message: 'file exist'
      }
      return
    }
    console.log('222222')
    // 切片目录不存在，创建切片目录
    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir)
    }
    // fs-extra 专用方法，类似 fs.rename 并且跨平台
    // fs-extra 的 rename 方法 windows 平台会有权限问题
    // https://github.com/meteor/meteor/issues/7852#issuecomment-255767835
    await fse.move(chunk.path, path.resolve(chunkDir, hash))
    console.log('333333')
  })
  ctx.body = {
    code: 200,
    message: 'received file chunk'
  }
})

// 验证是否已上传/已上传切片下标（切片完再过来验证）
router.post('/verify', async (ctx, next) => {
  const { fileHash, filename } = ctx.request.body
  const ext = extractExt(filename)
  // console.log(fileHash)
  // console.log(ext)
  // console.log(`${fileHash}${ext}`)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  // 以同步的方法检测目录是否存在
  if (fse.existsSync(filePath)) {
    ctx.body = {
      shouldUpload: false
    }
  } else {
    ctx.body = {
      shouldUpload: true,
      uploadedList: await createUploadedList(fileHash)
    }
  }
})

router.post('/fileUpload', async (ctx, next) => {
  const form = new multiparty.Form()
  await form.parse(ctx.req, async (err: any, fields, files) => {
    if (err) return next(err)
    const [name] = fields.name
    const [file] = files.file
    console.log(name)
    console.log(file)
    await fse.move(file.path, path.resolve(UPLOAD_DIR, name), { overwrite: true })
  })
  ctx.body = {
    code: 200,
    message: 'file upload success',
    data: true
  }
})

module.exports = router
