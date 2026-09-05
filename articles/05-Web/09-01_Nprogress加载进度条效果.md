# Nprogress加载进度条效果

> 分类：Web / 第9章：vue项目上线优化
> 原文：https://www.cuiliangblog.cn/detail/section/31383760
> 来源：崔亮的博客

---

## 1. 简介
+ 功能：当页面切换时，可以添加顶部加载效果，提升用户体验
+ 仓库地址: [https://github.com/rstacruz/nprogress](https://github.com/rstacruz/nprogress)

## 2. 安装与使用
+ 安装

`npm install --save nprogress`

+ 基本用法

NProgress.start() — 显示进度条

NProgress.set(0.4) —设置百分比

NProgress.inc() — 增加一点点

NProgress.done() — 完成进度条

## 3. Vue中使用
+ 编辑router/index.js配置，通过添加拦截器，在发起请求时调用开始进度条方法，在获取响应后调用完成进度条方法



```javascript
//导入
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

router.beforeEach((to, from, next) => {
  NProgress.start()//加载开始
  next()
})

router.afterEach(() => {
  NProgress.done() //加载完成
})

```

+ 修改进度条默认样式(修改global.less全局样式文件)

```less
#nprogress .bar {
  background: #2ecc71 !important;
  height: 5px !important;
  border-radius: 5px;
}
```




