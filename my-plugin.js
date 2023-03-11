const plugin = "TemplatedPathPlugin"


const replacePathVariables= (path, data, assetInfo)=>{
    path = path + '123'
    return path
}

class TemplatedPathPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(plugin, complation => {
            complation.hooks.assetPath.tap(plugin, replacePathVariables)
        })
    }
}

// 打包前端环境都是基于node进行的，所以用 module.exports导出
module.exports = TemplatedPathPlugin