# 项目打包后移除console.log

> 分类：Web / 第9章：vue项目上线优化
> 原文：https://www.cuiliangblog.cn/detail/section/31384398
> 来源：崔亮的博客

---

> 在开发过程中需要使用consol.log控制台打印大量的调试信息，但在产品上线后，应该去除所有的打印信息。使用babel插件即可完成操作
>



1. 参考地址：

[https://babeljs.io/docs/en/babel-plugin-transform-remove-console/](https://babeljs.io/docs/en/babel-plugin-transform-remove-console/)

2. 安装

`npm install babel-plugin-transform-remove-console --save-dev`

3. 修改babel.config.js配置



```javascript
// 项目发布节点用到的babel插件
const prodPlugins = []
// 如果处于发布模式，开启transform-remove-console
if(process.env.NODE_ENV === 'production'){
  prodPlugins.push('transform-remove-console')
}
module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {'modules': false}]
  ],
  plugins: [
    [
      "component",
      {
        "libraryName": "element-ui",
        "styleLibraryName": "theme-chalk"
      }
    ],
    ...prodPlugins
  ]
}
```


