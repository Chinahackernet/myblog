# 索引模板（template）

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/75856129
> 来源：崔亮的博客

---

## 索引模板简介
+ 主要用于在新建索引时自动应用预先设定的配置，简化索引创建的操作步骤
+ 可以设定索引的配置和 mapping
+ 可以有多个模板，根据 order 设置，order 大的覆盖小的配置

## 索引模板设置
### 基本格式
```json
PUT _template/test_template # template名称
{
  "index_patterns": ["te*", "bar*"], # 匹配的索引名称
  "order":0, # order优先级
  "settings": { # 索引配置
    "number_of_shards": 1
  },
  "mappings": {
    ......
  }
}
```

### 示例
+ 例1：模板名称test_template，匹配索引名称te* bar* 优先级0，分片数1

```json
# 请求
PUT _template/test_template
{
  "index_patterns": ["te*","bar*"],
  "order": 0,
  "settings": {
    "number_of_shards": 1
  }
}
# 响应
{
  "acknowledged" : true
}
```

+ 例2：模板名称test_template2，匹配的索引名称te* bar* 优先级10，分片数3

```bash
PUT _template/test_template2
{
  "index_patterns": ["te*","bar*"],
  "order": 10,
  "settings": {
    "number_of_shards": 3
  }
}
```

## 索引模板查询
### 查询全部
```bash
# 请求
GET _template
# 响应
{
  "test_template2" : {
    "order" : 10,
    "index_patterns" : [
      "te*",
      "bar*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "3"
      }
    },
    "mappings" : { },
    "aliases" : { }
  },
  "test_template" : {
    "order" : 0,
    "index_patterns" : [
      "te*",
      "bar*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "1"
      }
    },
    "mappings" : { },
    "aliases" : { }
  }
}
```

### 查询指定模板
```bash
# 请求 
GET _template/test_template
# 响应
{
  "test_template" : {
    "order" : 0,
    "index_patterns" : [
      "te*",
      "bar*"
    ],
    "settings" : {
      "index" : {
        "number_of_shards" : "1"
      }
    },
    "mappings" : { },
    "aliases" : { }
  }
}
```

## 索引模板删除
+ 删除指定模板

```bash
# 请求
DELETE _template/test_template
# 响应
{
  "acknowledged" : true
}
```

## 参考文档
es索引模板文档：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-templates.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-templates.html)


