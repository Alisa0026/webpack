import CountChange from "./es6"
const instance = new CountChange()

function test(content) {
    document.querySelector("#app").innerHTML = content
}
// test('some' + instance.count)

setInterval(() => {
    instance.increment()
    test(instance.count)
}, 1000);

// plugin 和 loader 区别？


// 提升打包速度？
// 1.DllPlugin 动态链接库，提前把一些依赖打好包，真正使用就不用再打包了。(为了预打包)
// 2.支持多核可以用 happy-pack (多线程打包)
// 3.vite 直接把源码跑到服务器中(减少打包的内容，尽量以es6的方式去跑)
// sourcemap 在开发环境方便debug，没有这个也会变快

// 用webpack-chain 来修改webpack配置