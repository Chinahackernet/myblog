# webpack开发环境配置

> 分类：Web / 第8章：webpack
> 原文：https://www.cuiliangblog.cn/detail/section/30123866
> 来源：崔亮的博客

---

> 每次更改完代码后需要执行webpack重新打包，不利于开发环境调试代码，因此需要配置，显示文件修改后自动打包运行。
>

## 一、devServer
1. 安装dev-server包

`npm i webpack-dev-server -D` 

2. 修改webpack.config.js文件，新增<font style="color:#383A42;background-color:#FAFAFA;">devServer</font>

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
        path:resolve(__dirname,'build')
    },
    // loader的配置
    module:{
        rules:[
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
                // 处理html中的img
                test: /\.html$/,
                loader:'html-loader'
            }
        ]
 
 
    },
    plugins:[
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template:'./src/index.html'
        })
    ],
 
    // 自动打包运行
    // 指令：npx webpack-dev-server
    devServer: {
        contentBase: resolve(__dirname,'build'),
        compress:true,
        port:3000,
        open:true
    },
    // 模式
    mode:'development'
}
```

## 二、提取css成单独文件
> 用到mini-css-extract-plugin插件，<font style="background-color:transparent;">将style-loader 改为 MiniCssExtractPlugin.loader,</font>
>

+ webpack.config.js文件（配置文件）

```javascript
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
    // 入口
    entry:'./src/index.js',
    // 输出
    output:{
        // 输出文件名
        filename:'built.js',
        //输出路径
        path:resolve(__dirname,'build')
    },
    // loader的配置
    module:{
        rules:[
            {
                //匹配哪些文件
                test:/\.css/,
                //使用哪些loader进行处理
                use:[
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ]
            },
            {
                // 处理html中的img
                test: /\.html$/,
                loader:'html-loader'
            }
        ]
 
 
    },
    plugins:[
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template:'./src/index.html'
        }),
        new MiniCssExtractPlugin()
    ],
 
    // 自动打包运行
    // 指令：npx webpack-dev-server
    devServer: {
        contentBase: resolve(__dirname,'build'),
        compress:true,
        port:3000,
        open:true
    },
    // 模式
    mode:'development'
}
```

## 三、css兼容
package.json增加以下内容

```json
"browserslist":{
  "development": [
    "last 1 chrome version",
    "last 1 firefox version",
    "last 1 safari version",
  ],
  "production": [
    ">0.1%",
    "not dead",
    "not op_mini all" 
  ]
}
```

+ webpack.config.js文件（配置文件）

```javascript
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
 
// 设置nodejs环境变量
// process.env.NODE_ENV = "development"
module.exports = {
    // 入口
    entry:'./src/index.js',
    // 输出
    output:{
        // 输出文件名
        filename:'built.js',
        //输出路径
        path:resolve(__dirname,'build')
    },
    // loader的配置
    module:{
        rules:[
            {
                //匹配哪些文件
                test:/\.css/,
                //使用哪些loader进行处理
                use:[
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: "postcss-loader",
                        options:{
                            ident:'postcss',
                            plugins:()=>{
                                require('postcss-preset-env')()
                            }
                        }
                    }
                ]
            },
            {
                // 处理html中的img
                test: /\.html$/,
                loader:'html-loader'
            }
        ]
 
 
    },
    plugins:[
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template:'./src/index.html'
        }),
        new MiniCssExtractPlugin()
    ],
 
    // 自动打包运行
    // 指令：npx webpack-dev-server
    devServer: {
        contentBase: resolve(__dirname,'build'),
        compress:true,
        port:3000,
        open:true
    },
    // 模式
    mode:'development'
}
```

## 四、css压缩
+ webpack.config.js文件（配置文件）

```javascript
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
// 设置nodejs环境变量
// process.env.NODE_ENV = "development"
module.exports = {
    // 入口
    entry:'./src/index.js',
    // 输出
    output:{
        // 输出文件名
        filename:'built.js',
        //输出路径
        path:resolve(__dirname,'build')
    },
    // loader的配置
    module:{
        rules:[
            {
                //匹配哪些文件
                test:/\.css/,
                //使用哪些loader进行处理
                use:[
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: "postcss-loader",
                        options:{
                            ident:'postcss',
                            plugins:()=>{
                                require('postcss-preset-env')()
                            }
                        }
                    }
                ]
            },
            {
                // 处理html中的img
                test: /\.html$/,
                loader:'html-loader'
            }
        ]
 
 
    },
    plugins:[
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template:'./src/index.html'
        }),
        new MiniCssExtractPlugin(),
        new OptimizeCssAssetsWebpackPlugin()
    ],
 
    // 自动打包运行
    // 指令：npx webpack-dev-server
    devServer: {
        contentBase: resolve(__dirname,'build'),
        compress:true,
        port:3000,
        open:true
    },
    // 模式
    mode:'development'
}
```

## 五、eslint 语法检查


+ 安装依赖

`<font style="color:#4D4D4D;">npm i eslint eslint-loader eslint-config-airbnb-base eslint-plugin-import</font>`

+ webpack.config.js文件（配置文件）

```javascript
const {resolve} = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
// 设置nodejs环境变量
// process.env.NODE_ENV = "development"
module.exports = {
    // 入口
    entry:'./src/index.js',
    // 输出
    output:{
        // 输出文件名
        filename:'built.js',
        //输出路径
        path:resolve(__dirname,'build')
    },
    // loader的配置
    module:{
        rules:[
            {
                //匹配哪些文件
                test:/\.css/,
                //使用哪些loader进行处理
                use:[
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: "postcss-loader",
                        options:{
                            ident:'postcss',
                            plugins:()=>{
                                require('postcss-preset-env')()
                            }
                        }
                    }
                ]
            },
            {
                // 处理html中的img
                test: /\.html$/,
                loader:'html-loader'
            },
            // {
            //     test:/\.js$/,
            //     exclude:/node_modules/,
            //     loader:'eslint-loader',
            //     options:{
            //         fix:true
            //     }
            // }
        ]
 
 
    },
    plugins:[
        new HtmlWebpackPlugin({
            // 复制一个html文件，并引入
            template:'./src/index.html'
        }),
        new MiniCssExtractPlugin(),
        new OptimizeCssAssetsWebpackPlugin()
    ],
 
    // 自动打包运行
    // 指令：npx webpack-dev-server
    devServer: {
        contentBase: resolve(__dirname,'build'),
        compress:true,
        port:3000,
        open:true
    },
    // 模式
    mode:'development'
}
```


