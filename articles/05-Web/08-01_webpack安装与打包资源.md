# webpack安装与打包资源

> 分类：Web / 第8章：webpack
> 原文：https://www.cuiliangblog.cn/detail/section/30123878
> 来源：崔亮的博客

---

+ 参考文档：[https://webpack.docschina.org/concepts/](https://webpack.docschina.org/concepts/)

# 一、安装webpack
1. 初始化项目

```bash
# npm init
package name:                      你的项目名字叫啥
version:                          版本号
description:                       对项目的描述
entry point:                      项目的入口文件（一般你要用那个js文件作为node服务，就填写那个文件）
test command:                     项目启动的时候要用什么命令来执行脚本文件（默认为node app.js）
git repository:                    如果你要将项目上传到git中的话，那么就需要填写git的仓库地址（这里就不写地址了）
keywirds：                       项目关键字（我也不知道有啥用，所以我就不写了）
author:                         作者的名字（也就是你叫啥名字）
license:                        发行项目需要的证书（这里也就自己玩玩，就不写了）
# 可以一路回车，或者直接npm init -y即可
```

+ 执行完成后会在项目根路径下生成package.json文件
2. 全局安装webpack和webpack-cli

`npm install webpack webpack-cli -g` 

3. 本地项目安装webpack和webpack-cli的开发依赖

`npm install webpack webpack-cli -D` 

+ 执行完成后会在项目根路径下创建node_modules文件夹和package-lock.json文件

# 二、编写测试代码，打包资源
## 1. 目录结构
![](assets/05-Web/466273b7035589fe9794.png)

## 2. 编写测试内容
```html
# index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入打包后资源 -->
    <script src="../dist/main.js"></script>
</head>
<body>
<h1 id="title">hello world</h1>
</body>
</html>
```

```css
# index.less
body, html {
  margin: 0;
  padding: 0;
}

#title {
  color: red;
}
```

```javascript
# index.js
// 这是项目的js入口文件
import $ from 'jquery'
$(function(){
    $("#title").css("background-color","yellow");
});
```

## 3. 命令行打包js资源
`webpack bundle --mode=development` 

+ 开发环境：webpack  --mode=development

webpack会以 ./src/index.js 为入口文件开始打包，打包后输出到 ./dist/main.js

+ 生产环境：webpack --mode=production

webpack会以 ./src/index.js 为入口文件开始打包，打包后输出到 ./dist/main.js

+ 结论：

webpack能处理js/json资源，不能处理css/img等其他资源

生产环境比开发环境多压缩一个js文件

## 4. 创建配置文件打包资源
+ 在项目根目录下创建webpack.config.js配置文件

```javascript
const {resolve} = require('path'); //node内置核心模块，用来设置路径。
module.exports = {
    entry: './src/index.js',   // 入口文件
    output: {                     // 输出配置
        filename: './js/bundle.js',      // 输出文件名
        path: resolve(__dirname, 'dist')   //输出文件路径配置
    },
    plugins: [
        // 插件配置
    ],
    mode: 'development'   //开发环境(二选一)
    // mode: 'production'   //生产环境(二选一)
};
```

+ 运行命令打包资源到指定路径下

`webpack` 

+ 此时会在dist下创建js文件，生成bundle.js，index.html引用js文件改为bundle.js

## 5. 打包css、less文件
> loader使用步骤：下载——配置module的style-loader、css-loader、less-loader
>

+ index.js文件中引入样式资源

```javascript
import './index.less'
```

+ 修改webpack.config.js文件，新增module

```javascript
const {resolve} = require('path');
 
module.exports = {
    // 入口
    entry:'./src/index.js',
    // 输出
    output:{
        // 输出文件名
        filename:'./js/bundle.js',
        //输出路径
        path:resolve(__dirname,'dist')
    },
    // loader的配置
    module:{
        rules:[
            {
                //匹配哪些文件
                test:/\.less/,
                //使用哪些loader进行处理
                use:[
                    'style-loader',
                    //创建style标签，将js中的样式插入到head中
                    'css-loader',
                    //将css文件变成commonjs模块加载到js中，里面的内容是字符串
                ]
            },
            {
                //匹配哪些文件
                test:/\.css/,
                //使用哪些loader进行处理
                use:[
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            },
        ]
    },
    // 模式
    mode:'development'
}
```

+ 安装所需的loader

`npm i style-loader css-loader less-loader -D` 

+ 访问验证

## 6. 打包html资源
> plugins使用步骤：下载——引入——配置html-webpack-plugin
>

+ 修改webpack.config.js文件，新增plugins配置

```javascript
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
    // 入口
    entry: './src/index.js',
    // 输出
    output: {
        // 输出文件名
        filename: './js/bundle.js',
        //输出路径
        path: resolve(__dirname, 'dist')
    },
    // loader的配置
    module: {
        rules: [
            {
                //匹配哪些文件
                test: /\.less/,
                //使用哪些loader进行处理
                use: [
                    'style-loader',
                    //创建style标签，将js中的样式插入到head中
                    'css-loader',
                    //将css文件变成commonjs模块加载到js中，里面的内容是字符串
                ]
            },
            {
                //匹配哪些文件
                test: /\.css/,
                //使用哪些loader进行处理
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            },
        ]
    },
    // 插件配置
    plugins: [
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template: './src/index.html'
        })
    ],
    // 模式
    mode: 'development'
}
```

+ 安装所需的plugins

`npm i html-webpack-plugin -D`  

+ 会在dist目录下生成index.html，并自动引入built.js文件

## 7. 打包图片资源
+ 修改webpack.config.js文件，新增module配置url-loader内容

```javascript
const {
    resolve
} = require('path'); // 使用resolve()处理绝路径
// html-webpack-plugin版本4 和 webpack5有兼容性问题，报错查看：https://blog.csdn.net/Kindergarten_Sir/article/details/110083041
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 打包html文件
module.exports = {
    // 入口文件
    entry: "/src/index.js",
    output: {
        // 输出文件名
        filename: "bundle.js",
        // 输出路径，__dirname是当前文件的绝对路径，输出到绝对路径下的dist文件夹下
        path: resolve(__dirname, 'dist'),
        // 给打包后资源引入的路径前缀，静态资源最终访问路径 = output.publicPath + 资源loader或插件等配置路径
        publicPath: "./"
    },
    module: {
        rules: [
            // loader配置
            {
                // 匹配以样式结尾的文件
                test: /\.less$/,
                // use中的多个loader是自底向上或自右向左运行的
                use: [
                    // 在index.html文件的head中创建style标签，并将js中的样式字符串插入
                    'style-loader',
                    // 将css文件变成common.js的字符串加入到输出的js中
                    'css-loader',
                    // less-loader将less译成css
                    // 需要安装less和less-loader
                    'less-loader'
                ]
            },
            {
                // 对样式中引入的图片文件进行转译，不处理img标签
                test: /\.(jpg|png|gif)$/,
                // 下载：url-loader file-loader
                loader: 'url-loader',
                options: {
                    // 图片小于10kB，会将图片传换成base64编码处理，
                    // 目的是为了将小图转为编码减少请求数量减轻服务器压力，
                    // 会导致图片体积增大，即base64编码比原图体积大（建议对小于12kB的图做编码处理，大图不处理）
                    limit: 10 * 1024,
                    // 关闭es6模块化处理，避免与html-loader的common.js规范冲突，发生冲突会导致路径变成“[object Module]”
                    // 新版本已经没有这个问题了 可以不关闭。
                    esModule: false,
                    // 默认图片命名为chunk的hash值，太长了
                    // [hash:10]为hash值前十位，[ext]表示文件原有扩展名
                    name: '[hash:10].[ext]'
                }
            },
            {
                // 对img标签路径进行处理
                test: /\.html$/,
                // html-loader使用common.js规范对img标签路径进行处理
                loader: 'html-loader'
            }
        ]
    },
    // 插件配置
    plugins: [
        // HtmlwebpackPlugin默认功能为创建空的html（body为空）并引入打包输出的js文件
        // template配置是将指定的html文件的body内容加入到创建的html文件中
        // html-webpack-plugin版本4 和 webpack5有兼容性问题，报错查看：https://blog.csdn.net/Kindergarten_Sir/article/details/110083041
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ],
    mode: "development", // 开发环境
    // mode: "production", // 生产环境
}
```

+ 安装所需的module

`npm i url-loader file-loader html-loader -D` 

## 8. 打包其他资源（字体）
+ 修改webpack.config.js文件，新增module配置file-loader内容

```javascript
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
    // 入口
    entry:'./src/index.js',
    // 输出
    output:{
        // 输出文件名
        filename:'built.js',
        //输出路径
        path:resolve(__dirname,'dist')
    },
    // loader的配置
    module:{
        rules:[
 
            {
                //匹配哪些文件
                test:/\.less/,
                //使用哪些loader进行处理
                use:[
                    'style-loader',
                    'css-loader',
                ]
            },
            {
                //匹配哪些文件
                test:/\.css/,
                //使用哪些loader进行处理
                use:[
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            },
            {
                // 处理图片资源,但是处理不了html中img的路径问题
                test: /\.(jpg|png|gif)$/,
                loader:'url-loader',
                options:{
                    limit: 8* 1024,
                    // 关闭es6
                    esModule:false,
                    name:'[hash:10].[ext]' //不重复名字
                },
            },
            {
                // 处理html中的img
                test: /\.html$/,
                loader:'html-loader'
            },
            {
                // 打包其他资源
                exclude: /\.(css|js|html)$/,
                loader: 'file-loader'
            }
        ]
 
 
    },
    plugins:[
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template:'./src/index.html'
        })
    ],
    // 模式
    mode:'development'
}

```




