import React from 'react';
import { render } from 'react-dom';
import './style.css'

// 高阶组件
// const lazy = fn => class extends React.Component {
//     state = {
//         Component: () => null // 先显示个loading，后面加载以后显示真组件
//     }
//     async componentDidMount() {
//         const { default: Component } = await fn();
//         this.setState({ Component })
//     }
//     render() {
//         const Component = this.state.Component
//         return <Component {...this.props} />
//     }
// }
// babel 6 以前用 polyfill，Symbol，Promise，Set，Map可能浏览器不支持
/**
 * if(typeof Proxy === 'undefined'){
 *  window.Proxy = xxx
 * }
 */
// babel6 以后可以不用了
// 注释的作用会在打包时告诉webpack单独处理的组件名字就是Async
// const Async = lazy(() => import(/* webpackChunkName:"Async" */'./Async'))

// 热更新：开发模式的包在内存中，不输出文件 memory-fs
const App = () => <div>
    122二位无1App
    {/* <Async /> */}
</div>;

render(<App />, document.querySelector('#app'));

// 热更新回调，页面就不会刷新了，只显示页面变化的部分
if (module.hot) {
    module.hot.accept(App, () => {
        render(<App />, document.querySelector("#app"))
    })
}

// getComponent(){
//     require.ensure(_,callback,err,'Home')
// }