# 使用element-plus

> 分类：Web / 第11章：vite
> 原文：https://www.cuiliangblog.cn/detail/section/32071781
> 来源：崔亮的博客

---

## 安装element-plus
`npm install element-plus --save` 

## 安装lodash
`npm install lodash --save` 

## 全局引入element-plus(不推荐)
```javascript
import {createApp} from 'vue'
import App from './App.vue'
import '/style/index.scss'
import {router} from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css'
const app = createApp(App)
app.use(router)
app.use(store)
app.use(ElementPlus)
app.mount('#app')
```

## 手动按需引入element-plus（推荐）
### 创建配置文件plugins/ElementPlus.js
```javascript
import {ElButton} from 'element-plus'
import 'element-plus/lib/theme-chalk/el-button.css'

export default function (app) {
  app.use(ElButton)
}
```

### main.js引入
```javascript
import {createApp} from 'vue'
import App from './App.vue'
import '/style/index.scss'
import {router} from './router'
import store from './store'
import ElementPlus from './plugins/ElementPlus'
const app = createApp(App)
app.use(router)
app.use(store)
app.use(ElementPlus)
app.mount('#app')
```

## 自动按需引入element-plus（强烈推荐）
### 安装 [vite-plugin-style-import](https://github.com/anncwb/vite-plugin-style-import):
`npm install vite-plugin-style-import -D` 

### 修改vite.config.js
```javascript
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import styleImport from 'vite-plugin-style-import'
// https://vitejs.dev/config/
export default defineConfig({
	alias: {
		'@': path.resolve(__dirname, 'src')
	},
	plugins: [
		vue(),
		styleImport({
			libs: [{
				libraryName: 'element-plus',
				esModule: true,
				ensureStyleFile: true,
				resolveStyle: (name) => {
					name = name.slice(3)
					return `element-plus/packages/theme-chalk/src/${name}.scss`;
				},
				resolveComponent: (name) => {
					return `element-plus/lib/${name}`;
				},
			}]
		})
	],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "@/assets/style/variable.scss";`
			}
		}
	}
})
```

### 创建配置文件plugins/ElementPlus.js
```javascript
import {ElButton} from 'element-plus'

export default function (app) {
  app.use(ElButton)
}
```

### main.js引入
```javascript
import {createApp} from 'vue'
import App from './App.vue'
import '/style/index.scss'
import {router} from './router'
import store from './store'
import ElementPlus from './plugins/ElementPlus'
const app = createApp(App)
app.use(router)
app.use(store)
app.use(ElementPlus)
app.mount('#app')
```

### src/views/Home.vue使用
```vue
<template>
  <h1>这是首页</h1>
  <button @click="valueAdd">{{ value }}</button>
  <el-button type="primary">主要按钮</el-button>
</template>

<script setup>
import store from '@/store/index'
import {computed} from "vue";

const value = computed(() => store.state.count)
const valueAdd = () => {
  store.commit('add')
}
</script>

<style scoped lang="scss">

h1 {
  color: $color-primary;
}
</style>

```


