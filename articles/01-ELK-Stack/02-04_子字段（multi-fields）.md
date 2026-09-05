# 子字段（multi-fields）

> 分类：ELK Stack / 第2章：ES数据建模
> 原文：https://www.cuiliangblog.cn/detail/section/68601261
> 来源：崔亮的博客

---

ES 支持多字段特性： multi-fields，允许对同一个字段采用不同的配置

## 字段多类型
我们希望 city 字段既能用于聚合搜索（keyword 类型），又能用于模糊查询（text 类型）

+ 新建mapping

```json
PUT my-index-1
{
  "mappings": {
    "properties": {
      "city": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
```

+ 插入数据

```json
PUT my-index-1/_doc/1
{
  "city": "bei jing"
}

PUT my-index-1/_doc/2
{
  "city": "nan jing"
}
```

+ <font style="color:rgb(33, 37, 41);">全文搜索city</font>

```json
GET my-index-1/_search
{
  "query": {
    "match":{
      "city": "jing"
    }
  }
}
# 响应
{
  "took" : 9,
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
    "max_score" : 0.13353139,
    "hits" : [
      {
        "_index" : "my-index-1",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.13353139,
        "_source" : {
          "city" : "nan jing"
        }
      },
      {
        "_index" : "my-index-1",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.13353139,
        "_source" : {
          "city" : "bei jing"
        }
      }
    ]
  }
}

```

+ 对city.keyword聚合排序

```json
GET my-index-1/_search
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [
      {
        "_index" : "my-index-1",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : null,
        "_source" : {
          "city" : "bei jing"
        },
        "sort" : [
          "bei jing"
        ]
      },
      {
        "_index" : "my-index-1",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : null,
        "_source" : {
          "city" : "nan jing"
        },
        "sort" : [
          "nan jing"
        ]
      }
    ]
  },
  "aggregations" : {
    "Cities" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "bei jing",
          "doc_count" : 1
        },
        {
          "key" : "nan jing",
          "doc_count" : 1
        }
      ]
    }
  }
}
{
  "sort":{
    "city.keyword":"asc"
  },
  "aggs": {
    "Cities": {
      "terms": {
        "field": "city.keyword"
      }
    }
  }
}
```

## 多分词器
text字段使用标准分词器将文本分解为单个字，并使用ik分词器将句子拆解

+ 创建mapping

```json
PUT my-index-2
{
  "mappings": {
    "properties": {
      "text": {
        "type": "text",
        "fields": {
          "pinyin": {
            "type": "text",
            "analyzer": "ik_max_word"
          }
        }
      }
    }
  }
}
```

+ 插入数据

```json
PUT my-index-2/_doc/1
{
  "text": "我爱吃饭"
}

PUT my-index-2/_doc/2
{
  "text": "我爱睡觉"
}
```

+ 全文搜索text字段包含“我”

```json
GET my-index-2/_search
{
  "query": {
    "match":{
      "text": "我"
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
    "max_score" : 0.18232156,
    "hits" : [
      {
        "_index" : "my-index-2",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.18232156,
        "_source" : {
          "text" : "我爱吃饭"
        }
      },
      {
        "_index" : "my-index-2",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.18232156,
        "_source" : {
          "text" : "我爱睡觉"
        }
      }
    ]
  }
}

```

+ 查询text和text.pinyin中包含我爱睡觉的记录

```json
GET my-index-2/_search
{
  "query": {
    "multi_match": {
      "query": "我爱睡觉",
      "fields": [
        "text",
        "text.pinyin"
      ],
      "type": "most_fields"
    }
  }
}
# 响应
{
  "took" : 14,
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
    "max_score" : 3.3195531,
    "hits" : [
      {
        "_index" : "my-index-2",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 3.3195531,
        "_source" : {
          "text" : "我爱睡觉"
        }
      },
      {
        "_index" : "my-index-2",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.5469647,
        "_source" : {
          "text" : "我爱吃饭"
        }
      }
    ]
  }
}

```

## 参考文档
es子字段：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/multi-fields.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/multi-fields.html)


