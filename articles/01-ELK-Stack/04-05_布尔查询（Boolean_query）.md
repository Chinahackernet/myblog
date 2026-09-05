# 布尔查询（Boolean query）

> 分类：ELK Stack / 第4章：ES数据查询
> 原文：https://www.cuiliangblog.cn/detail/section/76394775
> 来源：崔亮的博客

---

## 基础语法
### 查询子句
布尔查询由一个或多个布尔子句组成，主要包含如下4个

| filter | 只过滤符合条件的文档，不计算相关性得分 |
| --- | --- |
| must | 文档必须符合 must 中的所有条件，会影响相关性得分 |
| must_not | 文档必须不符合 must_not 中的所有条件，不计算相关性得分 |
| should | 文档可以符合 should 中的条件，会影响相关性得分 |


### 基本结构
```bash
GET query_test/_search
{
  "query": {
    "bool": { # 查询关键词
      "must": [ # 查询子句，支持数组查询
        {}
      ],
      "filter": [
        {}
      ],
      "must_not": [
        {}
      ],
      "should": [
        {}
      ]
    }
  }
}
```

## filter
### 查询特点
Filter 查询只过滤符合条件的文档，不会进行相关性算分

es 针对 filter 会有智能缓存，因此其执行效率很高

做简单匹配查询且不考虑算分时，推荐使用 filter 替代 query

### 查询示例
```bash
# 过滤name为tom的文档
GET query_test/_search
{
  "query": {
    "bool": {
      "filter": {
        "term": {
          "name": "tom"
        }
      }
    }
  }
}
# 响应
{
  "took" : 3,
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
    "max_score" : 0.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.0,
        "_source" : {
          "id" : "3",
          "name" : "tom",
          "age" : 12,
          "email" : "query_test3@126.com",
          "hobby" : "sleep eat",
          "birth" : "2010-06-18"
        }
      }
    ]
  }
}
```

## must
### 查询特点
必须满足所有条件才能匹配到，match query文档最终得分为多个子查询的得分总和。

### 查询示例
```bash
# 全文检索hobby为study sleep eat的文档，并且age范围区间大于等于10小于等于15.
GET query_test/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "hobby": "study sleep eat"
          }
        },
        {
          "range": {
            "age": {
              "gte": 10,
              "lte": 15
            }
          }
        }
      ]
    }
  }
}
# 响应
{
  "took" : 4,
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
    "max_score" : 2.6016738,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 2.6016738,
        "_source" : {
          "id" : "3",
          "name" : "tom",
          "age" : 12,
          "email" : "query_test3@126.com",
          "hobby" : "sleep eat",
          "birth" : "2010-06-18"
        }
      }
    ]
  }
}
```

## must_not
```bash
# 查询hobby为study sleep eat的文档，但age范围区间不是大于等于10小于等于15.
GET query_test/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "hobby": "study sleep eat"
          }
        }
      ],
      "must_not": [
        {
          "range": {
            "age": {
              "gte": 10,
              "lte": 20
            }
          }
        }
      ]
    }
  }
}
# 响应
{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 2.7212427,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 2.7212427,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.45859373,
        "_source" : {
          "id" : "1",
          "name" : "alex1",
          "age" : 2,
          "email" : "query_test1@qq.com",
          "hobby" : "eat drink play happy",
          "birth" : "2020-01-02"
        }
      }
    ]
  }
}
```

## should
### 只包含 should ，不包含 must 查询
只包含 should 时，文档必须满足至少一个条件，可以通过minimum_should_match 可以控制满足条件的个数或者百分比

```bash
# 全文检索hobby为eat football，name为join或者tory，满足其中两个条件的结果
GET query_test/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "hobby": "eat football"
          }
        },
        {
          "term": {
            "name": {
              "value": "join"
            }
          }
        },
        {
          "term": {
            "name": {
              "value": "tory"
            }
          }
        }
      ],
      "minimum_should_match": 2
    }
  }
}
# 响应
{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 2.9560688,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 2.9560688,
        "_source" : {
          "id" : "5",
          "name" : "tory",
          "age" : 42,
          "email" : "query_test5@qq.com",
          "hobby" : "football basketball",
          "birth" : "1980-05-04"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.9099879,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
        }
      }
    ]
  }
}
```

### 同时包含 should 和 must 查询
文档必须满足must条件，但是不必满足 should 中的条件，但是如果满足条件，会增加相关性得分。

```bash
# 全文检索hobby字段必须包含eat drink play，name字段可以为join的文档
GET query_test/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "term": {
            "name": {
              "value": "join"
            }
          }
        }
      ],
      "must": [
        {
          "match": {
            "hobby": "eat drink play"
          }
        }
      ]
    }
  }
}
# 响应
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 2.8175917,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 2.8175917,
        "_source" : {
          "id" : "1",
          "name" : "alex1",
          "age" : 2,
          "email" : "query_test1@qq.com",
          "hobby" : "eat drink play happy",
          "birth" : "2020-01-02"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.9099879,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.6103343,
        "_source" : {
          "id" : "3",
          "name" : "tom",
          "age" : 12,
          "email" : "query_test3@126.com",
          "hobby" : "sleep eat",
          "birth" : "2010-06-18"
        }
      }
    ]
  }
}
```

## 参考文档
es布尔查询：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl-bool-query.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl-bool-query.html)


