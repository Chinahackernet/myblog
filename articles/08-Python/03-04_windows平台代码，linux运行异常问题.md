# windows平台代码，linux运行异常问题

> 分类：Python / 第3章：Python基本使用
> 原文：https://www.cuiliangblog.cn/detail/section/31616314
> 来源：崔亮的博客

---

sed -i 's/\r$//' hosts-api.py

在windows下写的脚本，Windows下每一行结尾是\n\r，而Linux下则是\n


