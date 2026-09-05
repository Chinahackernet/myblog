# 加入axios

> 分类：Web / 第11章：vite
> 原文：https://www.cuiliangblog.cn/detail/section/49515739
> 来源：崔亮的博客

---

## 安装axios
`npm i axios -D` 

## 封装axios
![](assets/05-Web/517694b8932b70b06ca8.png)

1. src/api/home.js

```javascript
import index from './index'
```

2. src/api/index.js

```javascript
import {request} from './request'

const index = {
	get(url, params) {
		const config = {
			method: 'get',
			url: url
		}
		if (params) {
			for (let key in params) {
				if (params[key].length === 0) {
					delete params[key]
				}
			}
			config.params = params
		}
		return request(config)
	},
	getFile(url, params) {
		const config = {
			method: 'get',
			url: url,
			responseType: 'blob'
		}
		if (params) config.params = params
		return request(config)
	},
	post(url, params) {
		const config = {
			method: 'post',
			url: url
		}
		if (params) config.data = params
		return request(config)
	},
	put(url, params) {
		const config = {
			method: 'put',
			url: url
		}
		if (params) config.data = params
		return request(config)
	},
	delete(url, params) {
		const config = {
			method: 'delete',
			url: url
		}
		if (params) config.params = params
		return request(config)
	}
}
export default index
```

3. src/api/request.js

```javascript
import axios from 'axios'

export function request(config) {
	// 创建axios的实例
	const instance = axios.create({
		baseURL: import.meta.env.VITE_APP_BASE_URL,
		timeout: 20000
	})
	// 请求拦截器配置
	instance.interceptors.request.use(config => {
			// config.headers.Authorization = window.sessionStorage.getItem('token')
			return config
		}, error => {
			console.log(error)
			return Promise.error(error)
		}
	)
	// 响应拦截器配置
	instance.interceptors.response.use(response => {
		return response.data
	}, error => {
		console.log(error)
		switch (error.response.status) {
			case 400:
				return Promise.reject(error.response.data)
			case 401:
				console.log("无权访问")
				break
			case 403:
				console.log("token过期啦")
        //window.location.href="/login"
				break
			case 404:
				console.log("404啦")
				break
			default:
				return Promise.reject(error)
		}
		return Promise.reject(error)
	})
	// 发送真正的网络请求
	return instance(config);
}

export default request
```

## 开发生产环境变量
> <font style="color:#24292E;">项目开发过程中通常会有好几个环境，比如dev.test.development等模式，往往我们也需要在不同的环境下会有些值对应会变化，最常见的就是后台的接口api,开发环境的api和生产环境的api是不一致的，所以我们需要进行配置,在vite中我们需要进行这样的配置。参考文档：</font>[https://cn.vitejs.dev/guide/env-and-mode.html#env-files](https://cn.vitejs.dev/guide/env-and-mode.html#env-files)
>

1. package.json指定mode

```javascript
{
  "name": "myblog_pc",
  "version": "0.0.0",
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "serve": "vite preview"
  },
  …………
}

```

2. 项目根目录创建.env.development文件

```javascript
ENV= 'development'
VITE_APP_TITLE = '测试环境'
VITE_APP_BASE_URL = 'http://127.0.0.1:8000/'
```

3. 项目根目录创建.env.production文件

```javascript
ENV= 'production'
VITE_APP_TITLE = '生产环境'
VITE_APP_BASE_URL = 'https://api.cuiliangblog.cn/'
```

4. src/api/request.js使用环境变量

```javascript
// 创建axios的实例
	const instance = axios.create({
		baseURL: import.meta.env.VITE_APP_BASE_URL,
		timeout: 20000
	})
```




