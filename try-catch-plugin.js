const fs = require('fs')
const path = require('path')
const parse = require('@babel/parser').parse;//安装babel带了就不用单独再装了
const traverse = require('@babel/traverse').default; //遍历
const generator = require('@babel/generator').default; // 生成代码
const template = require('@babel/template').default;
const t = require('@babel/types');

const pluginName = 'AutoTryCatch'


// 给方法加try catch
class AutoTryCatch {
    constructor(options) {
        // 默认转义src下的js文件
        this.options = options || { dir: ['src'], pattern: ['.js'] } 
        this.pattern = this.options.pattern;
    }

    // apply 方法
    apply(compiler) {
        // 同步编译完成之后做这个操作
        compiler.hooks.done.tap(pluginName, () => {
            // 遍历src目录下的js文件，读文件
            this.options.dir.forEach(item => {
                // 读文件要拼接绝对路径
                const path1 = path.resolve(item)
                // 读取目录
                fs.readdir(path1, (err, files) => {
                    // 如果没报错继续
                    if (!err) {
                        // 如果文件是目录需要递归处理，这里简单处理认为files下没有目录，都是文件
                        files.forEach(filename => {
                            // 通过文件名获取文件绝对路径
                            const absPath = path.resolve(item, filename)
                             // 取后缀
                            const extname = path.extname(filename)
                            // 判断是不是js文件
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

    // 读文件
    getAst(filename) {
        // 读取文件内容，同步读取，阻塞线程
        const content = fs.readFileSync(filename, 'utf-8')

        try {
            // 得到字符串来解析，parser是babel提供的
            return parse(content, {
                sourceType: 'module'
            })

        } catch (error) {
            // 解析失败报错
            console.error(error)
            return null
        }
    }

    // 遍历
    handleTraverse(ast, filePath) {
        // 判断函数是异步还是同步函数，对异步函数做处理，做标记
        let isChanged = false


        // 遍历ast命中改的东西进行修改
        const shouldHandleAst = path => {
            // path包含函数的很多信息

            // map这里是收集type
            const types = path.node.body.body.map(({ type }) => type)
            
            // 命中异步函数改为true
            // length>1表示有多条语句
            isChanged = path.node.body.body.length > 1 && types.includes('TryStatement') || path.node.body.body.length && !types.includes('TryStatement')
        }

        // 就是babel提供遍历抽象语法树的方法，ast读出来就是一个json对象
        traverse(ast, {
            FunctionDeclaration: shouldHandleAst, // 函数声明
            FunctionExpression: shouldHandleAst, // 函数表达式
            ArrowFunctionExpression: shouldHandleAst // 箭头函数表达式
        })

        // 命中，处理函数
        if (isChanged) {
            // 修改ast
            this.handleAst(ast, filePath)
        }
    }

    // 把ast进行修改
    handleAst(ast, filePath) {
        const _this = this;
        // 遍历ast
        traverse(ast, {
            BlockStatement(path) { // 找到块语句
                if (
                    // 3种之一，当前节点的type不是try语句，函数类型是异步
                    ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(path.parentPath.type) && path.node.body[0].type !== 'TryStatement' && path.parentPath.node.async) {
                    // 生成try语句
                    const tryStatement = _this.generateTryStatement(path.node)
                    // try里再包一个block
                    const blockStatement = t.blockStatement([tryStatement])
                    // 替换
                    path.replaceWith(blockStatement)
                }
            },
            Program: {
                exit() {
                    // 退出，写入文件
                    // handleAst 有副作用，传入ast现在传出ast，此时ast已经被修改了
                    _this.writeFileSync(ast, filePath)
                }
            }
        })
    }

    // 生成try语句，基于现有的节点
    generateTryStatement({ body = [] }) {
        // 上面创建过大括号了，下面try就不用了
        const nodeBody = t.blockStatement(body)

        // 用模板方法
        return template.ast(`try
        ${generator(nodeBody).code}
        catch(err){
            console.log(err);
        }
        `)
    }

    // 输出
    writeFileSync(ast, filePath) {
        // 基于ast转成源码
        const output = generator(ast, {
            retainLines: false, // 行数不同
            quotes: 'single', // 单引号
            concise: false,
            compact: false
        })

        // 写出的路径和内容，这里把源文件修改
        fs.writeFileSync(filePath, output.code)
    }
}

module.exports = AutoTryCatch