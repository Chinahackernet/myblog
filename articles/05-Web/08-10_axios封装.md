# axios封装

> 分类：Web / 第8章：webpack
> 原文：https://www.cuiliangblog.cn/detail/section/32083091
> 来源：崔亮的博客

---

## 安装axios
`npm install axios -S` 

## 创建相关目录文件
![](assets/05-Web/ee969886958785653e91.png)

## request.js配置
```javascript
import axios from 'axios'

export function request(config) {
  // 创建axios的实例
  const instance = axios.create({
    baseURL: 'https://api.shop.eduwork.cn',
    timeout: 10000
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
    console.log(response)
    return response.data
  }, error => {
    switch (error.response.status) {
      case 401:
        console.log("无权访问")
        break
      case 403:
        console.log("token过期啦")
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

## http.js配置
```javascript
import {request} from './request'

const http = {
  get(url, params) {
    const config = {
      method: 'get',
      url: url
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
    if (params) config.params = params
    return request(config)
  },
  delete(url, params) {
    const config = {
      method: 'post',
      url: url
    }
    if (params) config.params = params
    return request(config)
  }
}
export default http
```

## home.js配置
> 按照页面，每个页面创建一个js文件，统一管理api请求方式和地址
>

```javascript
import http from './http'

export function getHomeAllData(){
  return http.get('/api/index')
}
```

## vue组件发起请求
```vue
<template>
  <h1>首页</h1>
</template>

<script>
// @ is an alias to /src
import {onMounted} from 'vue'
import {getHomeAllData} from '@/api/home'

export default {
  name: 'Home',
  components: {},
  setup() {
    // 轮播图数据
    let carouselList = ref([])
    // 获取轮播图数据
    async function carouselData() {
      carouselList.value = await getCarousel()
    }
    onMounted(() => {
      carouselData()
    })
  }
}
</script>
```


