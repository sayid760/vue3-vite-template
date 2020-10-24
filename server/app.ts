const Koa = require('Koa')
const bodyparser = require('koa-bodyparser')
const cors = require('koa2-cors')
const app = new Koa()
const index = require('./index')

app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
)

// app.use(static(path.join(__dirname)))
app.use(require('koa-static')(__dirname + '/'))

app.use(async (ctx, next) => {
  // 允许来自所有域名请求
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Headers', '*')
  // 设置所允许的HTTP请求方法
  // ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE')
  // 字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段.
  // ctx.set('Access-Control-Allow-Headers', 'x-requested-with, accept, origin, content-type')

  await next()
})

// routes
app.use(index.routes())

app.use(cors())

app.listen(3001, () => {
  console.log('port start on 3001')
})
