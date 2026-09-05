# 嵌套类型（Nested）

> 分类：ELK Stack / 第2章：ES数据建模
> 原文：https://www.cuiliangblog.cn/detail/section/68601343
> 来源：崔亮的博客

---

<font style="color:rgb(33, 37, 41);">Elasticsearch没有内部对象的概念。因此，它将对象层次结构平展为字段名称和值的简单列表。</font>

## <font style="color:rgb(33, 37, 41);">嵌套字段动态映射</font>
+ 插入嵌套字段数据

```json
PUT my-index-3/_doc/1
{
  "group": "elk",
  "user": [
    {
      "first": "John",
      "last": "Smith"
    },
    {
      "first": "Alice",
      "last": "White"
    }
  ]
}
```

+ 查看生成的mapping

```json
GET my-index-3/_mapping
{
  "my-index-3" : {
    "mappings" : {
      "properties" : {
        "group" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "user" : {
          "properties" : {
            "first" : {
              "type" : "text",
              "fields" : {
                "keyword" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                }
              }
            },
            "last" : {
              "type" : "text",
              "fields" : {
                "keyword" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                }
              }
            }
          }
        }
      }
    }
  }
}

```

+ 上面的数据在es中转换为如下文档

```json
{
  "group" :        "elk",
  "user.first" : [ "alice", "john" ],
  "user.last" :  [ "smith", "white" ]
}
```

+ 检索user.first=Alice，user.last=Smith的记录.由于<font style="color:rgb(33, 37, 41);">user字段被</font>拍平(flattened)处理<font style="color:rgb(33, 37, 41);">为多值字段，之前的关联将丢失</font>

```json
GET my-index-3/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "user.first": "Alice" }},
        { "match": { "user.last":  "Smith" }}
      ]
    }
  }
}
# 响应
{
  "took" : 8,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.5753642,
    "hits" : [
      {
        "_index" : "my-index-3",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.5753642,
        "_source" : {
          "group" : "elk",
          "user" : [
            {
              "first" : "John",
              "last" : "Smith"
            },
            {
              "first" : "Alice",
              "last" : "White"
            }
          ]
        }
      }
    ]
  }
}
```

## 嵌套字段指定nested类型
+ 设置mapping，指定user字段类型为nested

```json
PUT my-index-4
{
  "mappings": {
    "properties": {
      "user":{
        "type": "nested"
      }
    }
  }
}
```

+ 插入测试数据

```json
PUT my-index-4/_doc/1
{
  "group": "elk",
  "user": [
    {
      "first": "John",
      "last": "Smith"
    },
    {
      "first": "Alice",
      "last": "White"
    }
  ]
}
```

+ 查询user.first=Alice，user.last=Smith的记录。因为该查询结果的记录不在同一嵌套对象中，查询结果为空

```json
GET my-index-4/_search
{
  "query": {
    "nested": {
      "path": "user",
      "query": {
        "bool": {
          "must": [
            { "match": { "user.first": "Alice" }},
            { "match": { "user.last":  "Smith" }} 
          ]
        }
      }
    }
  }
}
# 响应
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}
```

+ 查询user.first=Alice，user.last=White的记录。

```json
GET my-index-4/_search
{
  "query": {
    "nested": {
      "path": "user",
      "query": {
        "bool": {
          "must": [
            { "match": { "user.first": "Alice" }},
            { "match": { "user.last":  "White" }} 
          ]
        }
      }
    }
  }
}
# 响应
{
  "took" : 7,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.3862942,
    "hits" : [
      {
        "_index" : "my-index-4",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.3862942,
        "_source" : {
          "group" : "elk",
          "user" : [
            {
              "first" : "John",
              "last" : "Smith"
            },
            {
              "first" : "Alice",
              "last" : "White"
            }
          ]
        }
      }
    ]
  }
}
```

## 参考文档 
es嵌套字段类型：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/nested.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/nested.html)

铭毅天下<font style="color:rgb(34, 34, 38);">Elasticsearch Nested类型深入详解：</font>[https://blog.csdn.net/laoyang360/article/details/82950393](https://blog.csdn.net/laoyang360/article/details/82950393)


