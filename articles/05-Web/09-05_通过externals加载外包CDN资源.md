# 通过externals加载外包CDN资源

> 分类：Web / 第9章：vue项目上线优化
> 原文：https://www.cuiliangblog.cn/detail/section/31385196
> 来源：崔亮的博客

---

> 默认情况下，通过import导入的第三方依赖包，最终会被打包到同一个文件中，导致打包后文件体积过大的，可以配置打包策略，不对第三方组件进行打包，而是通过CDN方式引入第三方资源
>

> 通过webpack的externals节点，配置并加载外部的CDN资源，凡是声明在externals中的第三方依赖包，都不会被打包，这样会显著降低打包后js文件的大小
>

1. 修改vue.config.js文件，添加打包时排除项,格式为包名:导入的名称

```javascript
module.exports={
  // 如果打包文件资源路径没有dist
  publicPath: '',
  chainWebpack:config =>{
    // 生产环境
    config.when(process.env.NODE_ENV === 'production', config => {
      config.entry('app').clear().add('./src/main-prod.js')
      // 打包时排除以下第三方依赖包
      config.set('externals', {
        vue: 'Vue',
        'vue-router': 'VueRouter',
        axios: 'axios',
        lodash: '_',
        echarts: 'echarts',
        nprogress: 'NProgress',
        'mavon-editor': 'MavonEditor',
      })
    })
    // 开发环境
    config.when(process.env.NODE_ENV === 'development', config => {
      config.entry('app').clear().add('./src/main-dev.js')
    })
  }
}
```



2. 注释所有main-prod.js的所有css引入文件
3. 编辑public下的index.html文件，将css资源和js资源通过cdn引入



```javascript
<!--icon图标样式-->
<link rel="stylesheet" href="https://cdn.staticfile.org/font-awesome/5.15.2/css/all.min.css" />
<!--nprogress样式-->
<link rel="stylesheet" href="https://cdn.staticfile.org/nprogress/0.2.0/nprogress.min.css" />
<!--vue.js-->
<script src="https://cdn.staticfile.org/vue/2.6.11/vue.min.js"></script>
……
```



4. cdn加速网站
+ [https://www.bootcdn.cn/](https://www.bootcdn.cn/)
+ [https://www.jsdelivr.com/](https://www.jsdelivr.com/)
+ [http://www.staticfile.org/](http://www.staticfile.org/)


