# 使用Recoding Rules优化性能

> 分类：Prometheus / 第4章：prometheus告警处理
> 原文：https://www.cuiliangblog.cn/detail/section/23397091
> 来源：崔亮的博客

---

# 一、简介
1. 某些PromQL较为复杂且计算量较大时，直接使用PromQL可能会导致Prometheus响应超时的情况。这时需要一种能够类似于后台批处理的机制能够在后台完成这些复杂运算的计算，对于使用者而言只需要查询这些运算结果即可。
2. Prometheus通过Recoding Rule规则支持这种后台计算的方式，可以实现对复杂查询的性能优化，提高查询效率。

# 二、定义Recoding rules
1. 在Prometheus配置文件中，通过rule_files定义recoding rule规则文件的访问路径。

rule_files:

  [ - <filepath_glob> ... ]

2. 每一个规则文件通过以下格式进行定义：

groups:

  [ - <rule_group> ]

3. 一个简单的规则文件可能是这个样子的：

```yaml
groups:
  - name: example
    rules:
    - record: job:http_inprogress_requests:sum
      expr: sum(http_inprogress_requests) by (job)
```



 


