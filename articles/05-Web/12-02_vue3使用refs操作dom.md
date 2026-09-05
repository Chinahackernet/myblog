# vue3使用refs操作dom

> 分类：Web / 第12章：vue3
> 原文：https://www.cuiliangblog.cn/detail/section/45806714
> 来源：崔亮的博客

---

在使用组合式 API 时，[响应式引用](https://vue3js.cn/docs/zh/guide/reactivity-fundamentals.html#creating-standalone-reactive-values-as-refs)和[模板引用](https://vue3js.cn/docs/zh/guide/component-template-refs.html)的概念是统一的。为了获得对模板内元素或组件实例的引用，我们可以像往常一样声明 ref 并从 [setup()](https://vue3js.cn/docs/zh/guide/composition-api-setup.html) 返回：

```vue
<template> 
  <div ref="root">This is a root element</div>
</template>
<script>
  import { ref, onMounted } from 'vue'
  export default {
    setup() {
      const root = ref(null)
      onMounted(() => {
        // DOM元素将在初始渲染后分配给ref
        console.log(root.value) // <div>这是根元素</div>
      })
      return {
        root
      }
    }
  }
</script>
```

[https://vue3js.cn/docs/zh/guide/composition-api-template-refs.html#%E6%A8%A1%E6%9D%BF%E5%BC%95%E7%94%A8](https://vue3js.cn/docs/zh/guide/composition-api-template-refs.html#%E6%A8%A1%E6%9D%BF%E5%BC%95%E7%94%A8)


