# URI Search API

> 分类：ELK Stack / 第4章：ES数据查询
> 原文：https://www.cuiliangblog.cn/detail/section/76394517
> 来源：崔亮的博客

---

## search api用法
### 指定索引
```json
# 查询全部索引
GET /_search
# 查询指定的index
GET /my-index/_search
# 查询多个index
GET /my-index-1,my-index-2/_search
# 使用通配符匹配index
GET /my-index-*/_search
```

### 查询形式
使用search api查询主要有两种形式：URI Search和Request Body Search

## URI Search
操作简便，方便通过命令行测试，但是仅包含部分查询语法

### 常用参数
| 参数 | 功能 |
| --- | --- |
| q | 指定查询的语句，语法为 Query String Syntax |
| df | q 中不指定字段时默认查询的字段，如果不指定，es 会查询所有字段 |
| sort | 排序 |
| timeout | 指定超时时间，默认不超时 |
| from,size | 分页查询参数 |


## URI Search查询示例
+ 数据准备

```json
POST _bulk
{"create":{"_index":"query_test","_type":"_doc","_id":"1"}}
{"id":"1","name":"alex1","age":2,"email":"query_test1@qq.com","hobby":"eat drink play happy"}
{"create":{"_index":"query_test","_type":"_doc","_id":"2"}}
{"id":"2","name":"join","age":33,"email":"test2@163.com","hobby":"study sleep eat"}
{"create":{"_index":"query_test","_type":"_doc","_id":"3"}}
{"id":"3","name":"tom","age":12,"email":"query_test3@126.com","hobby":"sleep eat"}
{"create":{"_index":"query_test","_type":"_doc","_id":"4"}}
{"id":"4","name":"toms","age":30,"email":"query4@qq.com","hobby":"music movie sport"}
{"create":{"_index":"query_test","_type":"_doc","_id":"5"}}
{"id":"5","name":"tory","age":42,"email":"query_test5@qq.com","hobby":"football basketball"}
{"create":{"_index":"query_test","_type":"_doc","_id":"6"}}
{"id":"6","name":"alex2","age":22,"email":"query_test6@qq.com","hobby":"read music movie"}
```

### <font style="color:rgb(79, 79, 79);">关键字查询（不指定字段）</font>
查询所有字段中值为2的文档

```json
# 请求
GET /query_test/_search?q=2
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.540445,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.540445,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "id" : "1",
          "name" : "alex1",
          "age" : 2,
          "email" : "query_test1@qq.com",
          "hobby" : "eat drink play happy"
        }
      }
    ]
  }
}
```

### 关键字查询（指定字段）
```json
# 请求
GET /query_test/_search?q=age:2
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
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "id" : "1",
          "name" : "alex1",
          "age" : 2,
          "email" : "query_test1@qq.com",
          "hobby" : "eat drink play happy"
        }
      }
    ]
  }
}
```

### 布尔查询
查询hobby为movie或者football

```json
# 请求
GET /query_test/_search?q=hobby:(movie football)
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
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.7511443,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.7511443,
        "_source" : {
          "id" : "5",
          "name" : "tory",
          "age" : 42,
          "email" : "query_test5@qq.com",
          "hobby" : "football basketball"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0054247,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 1.0054247,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      }
    ]
  }
}
```

### 排序
查询hobby为sleep，并按age排序

```json
# 请求
GET /query_test/_search?q=hobby:"sleep"&sort=age
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : null,
        "_source" : {
          "id" : "3",
          "name" : "tom",
          "age" : 12,
          "email" : "query_test3@126.com",
          "hobby" : "sleep eat"
        },
        "sort" : [
          12
        ]
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : null,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat"
        },
        "sort" : [
          33
        ]
      }
    ]
  }
}
```

### 分页
先按age排序，然后分页，每页3条，查询第二页)

```json
# 请求
GET /query_test/_search?sort=age&from=2&size=3
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
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : null,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        },
        "sort" : [
          22
        ]
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : null,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        },
        "sort" : [
          30
        ]
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : null,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat"
        },
        "sort" : [
          33
        ]
      }
    ]
  }
}
```

### 逻辑AND查询
查询hobby为music并且age为22

```json
# 请求
GET /query_test/_search?q=hobby:"music" AND age:22
# 响应
{
  "took" : 12,
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
    "max_score" : 2.0054247,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 2.0054247,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      }
    ]
  }
}
```

### 逻辑OR查询
查询hobby为football或者年龄为22

```json
# 请求
GET /query_test/_search?q=hobby:"吃饭" OR age:42
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
    "max_score" : 1.7511443,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.7511443,
        "_source" : {
          "id" : "5",
          "name" : "tory",
          "age" : 42,
          "email" : "query_test5@qq.com",
          "hobby" : "football basketball"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 1.0,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      }
    ]
  }
}
```

### 逻辑NOT查询
查询hobby不是sleep

```json
# 请求
GET /query_test/_search?q=NOT hobby:"sleep"
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
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 0.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.0,
        "_source" : {
          "id" : "1",
          "name" : "alex1",
          "age" : 2,
          "email" : "query_test1@qq.com",
          "hobby" : "eat drink play happy"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 0.0,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 0.0,
        "_source" : {
          "id" : "5",
          "name" : "tory",
          "age" : 42,
          "email" : "query_test5@qq.com",
          "hobby" : "football basketball"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 0.0,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      }
    ]
  }
}
```

### 大于、大于等于、小于、小于等于查询
查询年龄大于等于42

```json
# 查询
GET /query_test/_search?q=age:>=42
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
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "id" : "5",
          "name" : "tory",
          "age" : 42,
          "email" : "query_test5@qq.com",
          "hobby" : "football basketball"
        }
      }
    ]
  }
}
```

### 范围查询({}开区间,[]闭区间)
查询年龄大于等于30小于等于40

```json
# 请求
GET /query_test/_search?q=age:[30 TO 40]
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        }
      }
    ]
  }
}
```

### 通配符查询（？代表1个字符，*代表0或多个字符）
查询email为任意开头，qq.com结尾

```json
# 请求
GET /query_test/_search?q=email:*qq.com
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
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "id" : "1",
          "name" : "alex1",
          "age" : 2,
          "email" : "query_test1@qq.com",
          "hobby" : "eat drink play happy"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.0,
        "_source" : {
          "id" : "5",
          "name" : "tory",
          "age" : 42,
          "email" : "query_test5@qq.com",
          "hobby" : "football basketball"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 1.0,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      }
    ]
  }
}
```

### 模糊查询
查询与tom差1个的词，如tom toms

```json
# 请求
GET /query_test/_search?q=name:tom~1
# 响应
{
  "took" : 5,
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
    "max_score" : 1.540445,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.540445,
        "_source" : {
          "id" : "3",
          "name" : "tom",
          "age" : 12,
          "email" : "query_test3@126.com",
          "hobby" : "sleep eat"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0269632,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        }
      }
    ]
  }
}
```

### 近似查询
查询term 为单位进行差异比较,匹配与music movie差1个的词，如music movie sport，read music movie

```json
# 请求
GET /query_test/_search?q=hobby:"music movie"~1
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 2.0108495,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 2.0108495,
        "_source" : {
          "id" : "4",
          "name" : "toms",
          "age" : 30,
          "email" : "query4@qq.com",
          "hobby" : "music movie sport"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "6",
        "_score" : 2.0108495,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      }
    ]
  }
}
```

### 正则查询
查询email值为query_test[0-9]@qq.com的文档（elasticsearch正则不支持\b \d \w等元字符）

```json
# 请求
GET /query_test/_search?q=email.keyword:/query_test[0-9]@qq.com/
# 响应
{
  "took" : 13,
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
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
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
        "_id" : "5",
        "_score" : 1.0,
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
        "_id" : "6",
        "_score" : 1.0,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie",
          "birth" : "2000-03-03"
        }
      }
    ]
  }
}
```

## 参考文档
search api：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-search.html#request-body-search-query](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-search.html#request-body-search-query)


