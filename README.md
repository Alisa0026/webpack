# webpack简单配置
# 简单plugin实现
给异步function加try-catch

在 webpack.config.js 入口文件改为： `.src/test.js`

plugin 引入 try-catch-plugin

执行：
```
npm run build
```

`test.js` 中的函数会被包裹上 `try catch`

# 简单loader测试
针对【自定义样式表】，先用自定义的loader处理

# HMR 原理
启动项目之后，看到控制台中有webSocket请求，服务端传递的消息有 `hot/liveReload/overlay/hash/ok` 消息

可以在  `webpack-dev-server/lib/Server.js` 中找到 `createWebSocketServer` 方法，创建一个 `this.webSocketServer` 实例，里面还有对应上面消息的处理.

修改内容以后，会再发送 `invalid/hash/ok` 三个消息。

`webpack-dev-server/lib/Server.js` 中找到 `setupHooks` 方法中有对应处理消息。

更新阶段，增加的文件下载与后面的3次消息（invalid, hash, ok）是关联的。而且毫无疑问，客户端必然有针对这些消息进行处理的逻辑。

`/webpack-dev-server/client/socket.js` 中可以看到，handler 对象中，对不同的消息类型都实现了同名的方法。

其中客户端接受新的hash时，对旧的hash有存了一下，在 收到 ok 消息之后，执行 reloadApp方法，里面会对两次hash进行比较。不重合才会更新。

同时如果地址栏有webpack-dev-server-hot=false参数，也是不热更新的。

针对配置时 hot: true | "only" 的区别，下面两个文件分别有对应逻辑：
`/node_modules/webpack/hot/only-dev-server.js`,
`/node_modules/webpack/hot/dev-server.js`

里面会fetch 请求 [hash].update.json文件。然后会在页面创建script标签加入这个文件，就会请求下载该文件，最终script会被删掉。


## 首次启动：
源代码=> 编译（compiler） => bundle.js 产物（这里是默认不分割代码的结果） => 浏览器访问端口 => 服务器返回静态资源（html，css，js等）
浏览器与dev-server建立Socket连接，首次收到hash

## 更新：
源代码修改=> 增量编译（compiler） => HMR（基于新内容生成[hash].update.js(on)）=> 向浏览器推送消息（包括新的hash） => 浏览器创建script标签下载[hash].update.js => 调用页面更新的方法（module.hot.accept）


