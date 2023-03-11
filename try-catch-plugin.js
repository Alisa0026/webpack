const fs = require('fs')
const path = require('path')
const parse = require('@babel/parser').parse;//安装babel带了就不用单独再装了
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const template = require('@babel/template').default;
const t = require('@babel/types');

const pluginName = 'AutoTryCatch'

class AutoTryCatch {
    constructor(options) {
        // 默认转义src下的js
        this.options = options || { dir: ['src'], pattern: ['.js'] } 
        this.pattern = this.options.pattern;
    }

    apply(compiler) {
        // 同步编译完成之后
        compiler.hooks.done.tap(pluginName, () => {
            // 遍历目录读文件
            this.options.dir.forEach(item => {
                // 要拼接绝对路径
                const path1 = path.resolve(item)
                fs.readdir(path1, (err, files) => {
                    // 如果没报错继续
                    if (!err) {
                        // 如果文件是目录需要递归处理，这里简单处理认为没有目录
                        files.forEach(filename => {
                            const absPath = path.resolve(item, filename)
                             // 取后缀
                            const extname = path.extname(filename)
                            if (this.pattern.includes(extname)) {
                                // 处理文件内容，读取抽象语法树
                                const ast = this.getAst(absPath)
                                this.handleTraverse(ast, absPath)
                            }
                        })
                    }
                })
            })
        })
    }

    getAst(filename) {
        // 读取文件内容
        const content = fs.readFileSync(filename, 'utf-8')

        try {
            // 解析
            return parse(content, {
                sourceType: 'module'
            })

        } catch (error) {
            console.error(error)
            return null
        }
    }

    // 遍历
    handleTraverse(ast, filePath) {
        // 判断函数是异步还是同步函数，对异步函数做处理，做标记
        let isChanged = false


        const shouldHandleAst = path => {
            const types = path.node.body.body.map(({ type }) => type)
            
            // 命中异步函数改为true
            isChanged = path.node.body.body.length > 1 && types.includes('TryStatement') || path.node.body.body.length && !types.includes('TryStatement')
        }

        traverse(ast, {
            FunctionDeclaration: shouldHandleAst,
            FunctionExpression: shouldHandleAst,
            ArrowFunctionExpression: shouldHandleAst
        })

        // 命中，处理函数
        if (isChanged) {
            this.handleAst(ast, filePath)
        }
    }

    handleAst(ast, filePath) {
        const _this = this;
        traverse(ast, {
            BlockStatement(path) { // 找到块语句
                if (
                    ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(path.parentPath.type) && path.node.body[0].type !== 'TryStatement' && path.parentPath.node.async) {
                    // 生成try语句
                    const tryStatement = _this.generateTryStatement(path.node)
                    const blockStatement = t.blockStatement([tryStatement])
                    // 替换
                    path.replaceWith(blockStatement)
                }
            },
            Program: {
                exit() {
                    _this.writeFileSync(ast, filePath)
                }
            }
        })
    }

    generateTryStatement({ body = [] }) {
        // 上面创建过大括号了，下面try就不用了
        const nodeBody = t.blockStatement(body)

        return template.ast(`try
        ${generator(nodeBody).code}
        catch(err){
            console.log(err);
        }
        `)
    }

    writeFileSync(ast, filePath) {
        const output = generator(ast, {
            retainLines: false,
            quotes: 'single',
            concise: false,
            compact: false
        })

        fs.writeFileSync(filePath, output.code)
    }
}

module.exports = AutoTryCatch