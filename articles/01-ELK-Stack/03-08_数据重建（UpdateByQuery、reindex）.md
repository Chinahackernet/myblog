# 数据重建（UpdateByQuery、reindex）

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/76044923
> 来源：崔亮的博客

---

## 简介
### 使用场景
+ mapping 设置变更，比如字段类型变化、分词器字典更新等
+ index 设置变更，比如分片数更改等
+ 迁移数据，比如多个index合并为一个index

### API
+ _update_by_query 在现有索引上重建
+ _reindex 在其他索引上重建

## update by query
### 数据准备
+ 插入数据

```json
POST _bulk
{"index":{"_index":"test_index","_id":1}}
{"user":"张三","message":"今儿天气不错啊，出去转转去","city":"北京"}
{"index":{"_index":"test_index","_id":2}}
{"user":"老刘","message":"出发，下一站云南！","city":"北京"}
{"index":{"_index":"test_index","_id":3}}
{"user":"李四","message":"happy birthday!","city":"北京"}
{"index":{"_index":"test_index","_id":4}}
{"user":"老贾","message":"123,gogogo","city":"北京"}
{"index":{"_index":"test_index","_id":5}}
{"user":"老王","message":"Happy BirthDay My Friend!","city":"北京"}
{"index":{"_index":"test_index","_id":6}}
{"user":"老吴","message":"好友来了都今天我生日，好友来了,什么 birthday happy 就成!","city":"上海"}
```

+ 查看mapping

```json
# GET test_index/_mapping
{
  "test_index" : {
    "mappings" : {
      "properties" : {
        "city" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "message" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "user" : {
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
```

### 修改字段类型后整个index重建
+ 把user变成为一个text类型的字段。修改test_index的mapping

```json
PUT test_index/_mapping
{
  "properties": {
    "city": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "message": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "user": {
      "type": "text"
    }
  }
}
```

+ 执行update by query 如果遇到版本冲突，覆盖并继续执行

```json
# 请求
POST test_index/_update_by_query?conflicts=proceed
# 响应
{
  "took" : 141,
  "timed_out" : false,
  "total" : 6,
  "updated" : 6,
  "deleted" : 0,
  "batches" : 1,
  "version_conflicts" : 0,
  "noops" : 0,
  "retries" : {
    "bulk" : 0,
    "search" : 0
  },
  "throttled_millis" : 0,
  "requests_per_second" : -1.0,
  "throttled_until_millis" : 0,
  "failures" : [ ]
}
```

### 文档新增字段
+ <font style="color:rgb(0, 0, 0);">把所有的文档都添加一个新的字段contact，并赋予它一个</font>同样的值139111111111

```json
# 请求
POST test_index/_update_by_query
{
  "script": {
    "source": "ctx._source['contact'] = \"139111111111\""
  }
}
# 响应
{
  "took" : 509,
  "timed_out" : false,
  "total" : 6,
  "updated" : 6,
  "deleted" : 0,
  "batches" : 1,
  "version_conflicts" : 0,
  "noops" : 0,
  "retries" : {
    "bulk" : 0,
    "search" : 0
  },
  "throttled_millis" : 0,
  "requests_per_second" : -1.0,
  "throttled_until_millis" : 0,
  "failures" : [ ]
}
```

+ 数据查看

```json
# 请求
GET test_index/_search
{
  "query": {
    "match_all": {}
  }
}
# 响应
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 3,
    "successful" : 3,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京",
          "contact" : "139111111111",
          "message" : "Happy BirthDay My Friend!",
          "user" : "老王"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京",
          "contact" : "139111111111",
          "message" : "出发，下一站云南！",
          "user" : "老刘"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京",
          "contact" : "139111111111",
          "message" : "happy birthday!",
          "user" : "李四"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京",
          "contact" : "139111111111",
          "message" : "123,gogogo",
          "user" : "老贾"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京",
          "contact" : "139111111111",
          "message" : "今儿天气不错啊，出去转转去",
          "user" : "张三"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 1.0,
        "_source" : {
          "city" : "上海",
          "contact" : "139111111111",
          "message" : "好友来了都今天我生日，好友来了,什么 birthday happy 就成!",
          "user" : "老吴"
        }
      }
    ]
  }
}
```

### 文档已有字段值修改
+ 把所有city为北京的记录修改为北京市

```json
# 请求
POST test_index/_update_by_query
{
  "query": {
    "match": {
      "city.keyword": "北京"
    }
  },
  "script": {
    "source": "ctx._source['city'] += '市'",
    "params": {
      "one": 1
    }
  }
}
```

+ 数据查询

```json
# 请求
GET test_index/_search
{
  "query": {
    "match_all": {}
  }
}
# 响应
{
  "took" : 225,
  "timed_out" : false,
  "_shards" : {
    "total" : 3,
    "successful" : 3,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "Happy BirthDay My Friend!",
          "user" : "老王"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "出发，下一站云南！",
          "user" : "老刘"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "happy birthday!",
          "user" : "李四"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "123,gogogo",
          "user" : "老贾"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "今儿天气不错啊，出去转转去",
          "user" : "张三"
        }
      },
      {
        "_index" : "test_index",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 1.0,
        "_source" : {
          "city" : "上海",
          "contact" : "139111111111",
          "message" : "好友来了都今天我生日，好友来了,什么 birthday happy 就成!",
          "user" : "老吴"
        }
      }
    ]
  }
}
```

## reindex
### 同步迁移
+ 将test_index中city为北京市的数据迁移到test_index_new中

```json
# 请求
POST _reindex
{
  "conflicts": "proceed",
  "source": {
    "index": "test_index",
    "query": {
      "term": {
        "city.keyword": {
          "value": "北京市"
        }
      }
    }
  },
  "dest": {
    "index": "test_index_new"
  }
}
# 响应
{
  "took" : 471,
  "timed_out" : false,
  "total" : 5,
  "updated" : 0,
  "created" : 5,
  "deleted" : 0,
  "batches" : 1,
  "version_conflicts" : 0,
  "noops" : 0,
  "retries" : {
    "bulk" : 0,
    "search" : 0
  },
  "throttled_millis" : 0,
  "requests_per_second" : -1.0,
  "throttled_until_millis" : 0,
  "failures" : [ ]
}
```

+ 数据验证

```json
# 请求
GET test_index_new/_search
{
  "query": {
    "match_all": {}
  }
}
# 响应
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 3,
    "successful" : 3,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 5,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "test_index_new",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "Happy BirthDay My Friend!",
          "user" : "老王"
        }
      },
      {
        "_index" : "test_index_new",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "出发，下一站云南！",
          "user" : "老刘"
        }
      },
      {
        "_index" : "test_index_new",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "happy birthday!",
          "user" : "李四"
        }
      },
      {
        "_index" : "test_index_new",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "123,gogogo",
          "user" : "老贾"
        }
      },
      {
        "_index" : "test_index_new",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "city" : "北京市",
          "contact" : "139111111111",
          "message" : "今儿天气不错啊，出去转转去",
          "user" : "张三"
        }
      }
    ]
  }
}
```

### 异步迁移
+ 数据重建的时间受源索引文档规模的影响，当规模越大时，所需时间越多，此时需要通过设定 url 参数wait_for_completion 为 false 来异步执行，ES 以 task 来描述此类执行任务
+ ES 提供了 Task API 来查看任务的执行进度和相关数据

### 执行异步任务
```json
# 请求
POST /_reindex?wait_for_completion=false
{
  "source": {
    "index": [
      "test*"
    ]
  },
  "dest": {
    "index": "test-new"
  }
}
# 响应
{
  "task" : "bj9kGQrSTXmp9Ix_B9Z6Ig:6557536"
}
```

### 查询异步任务
+ 查询指定id的异步任务

```json
# 请求
GET _tasks/bj9kGQrSTXmp9Ix_B9Z6Ig:6557536
# 响应
{
  "completed" : true,
  "task" : {
    "node" : "bj9kGQrSTXmp9Ix_B9Z6Ig",
    "id" : 6557536,
    "type" : "transport",
    "action" : "indices:data/write/reindex",
    "status" : {
      "total" : 12,
      "updated" : 6,
      "created" : 6,
      "deleted" : 0,
      "batches" : 1,
      "version_conflicts" : 0,
      "noops" : 0,
      "retries" : {
        "bulk" : 0,
        "search" : 0
      },
      "throttled_millis" : 0,
      "requests_per_second" : -1.0,
      "throttled_until_millis" : 0
    },
    "description" : "reindex from [test*] to [test-new][_doc]",
    "start_time_in_millis" : 1651713570722,
    "running_time_in_nanos" : 1013853217,
    "cancellable" : true,
    "headers" : { }
  },
  "response" : {
    "took" : 1013,
    "timed_out" : false,
    "total" : 12,
    "updated" : 6,
    "created" : 6,
    "deleted" : 0,
    "batches" : 1,
    "version_conflicts" : 0,
    "noops" : 0,
    "retries" : {
      "bulk" : 0,
      "search" : 0
    },
    "throttled" : "0s",
    "throttled_millis" : 0,
    "requests_per_second" : -1.0,
    "throttled_until" : "0s",
    "throttled_until_millis" : 0,
    "failures" : [ ]
  }
}
```

+ 查询所有执行中的reindex异步任务

```json
GET _tasks?detailed=true&actions=*reindex
```

### 取消异步任务
```json
POST _tasks/bj9kGQrSTXmp9Ix_B9Z6Ig:6557536/_cancel
```

## 参考文档
reindex：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-reindex.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-reindex.html)

update by query：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-update-by-query.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/docs-update-by-query.html)

task:[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/tasks.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/tasks.html)


