# 加入vue-router

> 分类：Web / 第11章：vite
> 原文：https://www.cuiliangblog.cn/detail/section/32011898
> 来源：崔亮的博客

---

## 安装
`npm install vue-router@4 -S` 

## 创建配置文件
src/router/index.js

```typescript
import {createRouter, createWebHistory} from 'vue-router';

const router = createRouter({
	// history: createWebHashHistory(),  // hash模式，
	history: createWebHistory(),  //h5模式createWebHistory
	routes: [
		{path: '/', component: () => import('@/views/Home.vue')},
		{path: '/test', component: () => import('@/views/Test.vue')}
	]
})
// 路由导航守卫
// router.beforeEach((to, from, next) => {
// 	// to 访问的路径 from 从哪来 next 响应路径
// 	if (to.meta.isAuth === true && JSON.stringify(store.state.userSession) === '{}') {
// 		Toast.fail('还未登录，即将跳转至登录页')
// 		return next('/login_register')
// 	} else {
// 		next()
// 	}
// })
export default router;
```

## 在 main.js 中引入
```javascript
import {createApp} from 'vue'
import App from './App.vue'
import router from '@/router';

const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')
```

## 在App.vue中使用
```vue
<template>
  <!-- 路由匹配到的组件将渲染在这里 -->
  <router-view></router-view>
</template>

<script setup>
</script>

<style>
</style>
```




