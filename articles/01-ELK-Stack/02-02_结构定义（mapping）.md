# 结构定义（mapping）

> 分类：ELK Stack / 第2章：ES数据建模
> 原文：https://www.cuiliangblog.cn/detail/section/68422449
> 来源：崔亮的博客

---

## mapping作用
+ 定义 Index 下的字段名（Field Name）
+ 定义字段的类型，比如数值型、字符串型、布尔型等
+ 定义倒排索引相关的配置，比如是否索引、记录 position 等

## mapping查询
```json
# 请求
GET .kibana_task_manager/_mapping
# 响应
{
  ".kibana_task_manager_7.13.4_001" : {
    "mappings" : {
      "dynamic" : "strict",
      "_meta" : {
        "migrationMappingPropertyHashes" : {
          "migrationVersion" : "4a1746014a75ade3a714e1db5763276f",
          "originId" : "2f4316de49999235636386fe51dc06c1",
          "task" : "235412e52d09e7165fac8a67a43ad6b4",
          "updated_at" : "00da57df13e94e9d98437d13ace4bfe0",
          "references" : "7997cf5a56cc02bdc9c93361bde732b0",
          "namespace" : "2f4316de49999235636386fe51dc06c1",
          "coreMigrationVersion" : "2f4316de49999235636386fe51dc06c1",
          "type" : "2f4316de49999235636386fe51dc06c1",
          "namespaces" : "2f4316de49999235636386fe51dc06c1"
        }
      },
      "properties" : {
        "coreMigrationVersion" : {
          "type" : "keyword"
        },
        "migrationVersion" : {
          "dynamic" : "true",
          "properties" : {
            "task" : {
              "type" : "text",
              "fields" : {
                "keyword" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                }
              }
            }
          }
        },
        "references" : {
          "type" : "nested",
          "properties" : {
            "id" : {
              "type" : "keyword"
            }
          }
        },
        "task" : {
          "properties" : {
            "attempts" : {
              "type" : "integer"
            },
            "ownerId" : {
              "type" : "keyword"
            },
            "params" : {
              "type" : "text"
            },
            "retryAt" : {
              "type" : "date"
            },
            "schedule" : {
              "properties" : {
                "interval" : {
                  "type" : "keyword"
                }
              }
            },
            "scheduledAt" : {
              "type" : "date"
            },
            "scope" : {
              "type" : "keyword"
            },
            "startedAt" : {
              "type" : "date"
            },
            "state" : {
              "type" : "text"
            }
          }
        },
        "type" : {
          "type" : "keyword"
        },
        "updated_at" : {
          "type" : "date"
        }
      }
    }
  }
}
```

## 自定义mapping
### 语法格式
```json
# 请求
PUT myindex
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text"
      },
      "name": {
        "type": "keyword"
      },
      "age": {
        "type": "integer"
      }
    }
  }
}
# 响应
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "myindex"
}
```

### 修改字段类型
+ 注意事项

Mapping 中的字段类型一旦设定后，禁止直接修改，因为Lucene 实现的倒排索引生成后不允许修改

+ 解决方案：

重新建立新的索引，然后做 reindex 操作

+ 操作步骤：

<font style="color:rgb(77, 77, 77);">新建一个索引B</font>  
<font style="color:rgb(77, 77, 77);">把数据A的索引数据迁移到B（如果A数据一直在新增，他只能同步操作时刻总量）</font>  
<font style="color:rgb(77, 77, 77);">删除老索引A</font>  
<font style="color:rgb(77, 77, 77);">把新的索引B设置别名为A</font>

+ 示例
    - 新建mapping

```json
PUT myindex_new
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text"
      },
      "name": {
        "type": "text"
      },
      "age": {
        "type": "text"
      }
    }
  }
}
```

    - <font style="color:rgba(0, 0, 0, 0.75);">同步数据迁移</font>

```json
POST _reindex                   
{
  "source": {
    "index": "myindex"
    
  },
  "dest": {
    "index": "myindex_new"
  }
}
```

    - 删除旧索引

```json
DELETE myindex
```

    - 设置别名

```json
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "myindex_new",
        "alias": "myindex"
      }
    }
  ]
}
```

## 动态映射（<font style="color:rgb(59, 114, 170);">dynamic mapping</font>）
不需要提前创建iindex、定义mapping信息和type类型, 直接向ES中插入文档数据时, ES会根据每个新field可能的数据类型, 自动为其配置type等mapping信息, 这个过程就是动态映射(dynamic mapping)

### 体验动态映射
+ 插入数据

```json
PUT blog/_doc/1
{
    "blog_id": 10001,
    "author_id": 5520,
    "post_date": "2018-01-01",
	  "title": "my first blog",
	  "content": "my first blog in the website"
}

PUT blog/_doc/2
{
    "blog_id": 10002,
    "author_id": 5520,
    "post_date": "2018-01-02",
    "title": "my second blog",
    "content": "my second blog in the website"
}

PUT blog/_doc/3
{
    "blog_id": 10003,
    "author_id": 5520,
    "post_date": "2018-01-03",
    "title": "my third blog",
    "content": "my third blog in the website"
}
```

+ 查看mapping

```json
GET blog/_mapping
{
  "blog" : {
    "mappings" : {
      "properties" : {
        "author_id" : {
          "type" : "long"
        },
        "blog_id" : {
          "type" : "long"
        },
        "content" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "post_date" : {
          "type" : "date"
        },
        "title" : {
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

### 动态映射策略
| 策略 | 说明 |
| --- | --- |
| true | 开启——遇到陌生字段时，进行动态映射 |
| false | 关闭——忽略遇到的陌生字段，文档可以正常写入，但是无法对字段进行查询等操作 |
| strict | 严格模式——遇到默认字段时，报错处理 |


+ 设置约束策略

```json
PUT blog_user
{
  "mappings": {
    "dynamic": "strict", //严格模式
    "properties": {
      "name": {
        "type": "text"
      },
      "address": {
        "type": "object",
        "dynamic": "true" //开启动态映射
      }
    }
  }
}
```

+ 插入错误数据

```json
POST blog_user/1
{
  "name": "zhang san",
  "content": "this is my blog", // 多插入一个字段
  "address": {
    "provice": "bei jing",
    "city": "chao yang"
  }
}
# 响应
{
  "error" : {
    "root_cause" : [
      {
        "type" : "illegal_argument_exception",
        "reason" : "Rejecting mapping update to [blog_user] as the final mapping would have more than 1 type: [_doc, 2]"
      }
    ],
    "type" : "illegal_argument_exception",
    "reason" : "Rejecting mapping update to [blog_user] as the final mapping would have more than 1 type: [_doc, 2]"
  },
  "status" : 400
}
```

+ 插入正常数据

```json
POST blog_user/_doc/1
{
    "name": "shou feng",
    "address": {
        "province": "bei jing",
        "city": "chao yang"
    }
}
# 查看mapping
GET blog_user/_mapping
{
  "blog_user" : {
    "mappings" : {
      "dynamic" : "strict",
      "properties" : {
        "address" : {
          "dynamic" : "true",
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
            "province" : {
              "type" : "text",
              "fields" : {
                "keyword" : {
                  "type" : "keyword",
                  "ignore_above" : 256
                }
              }
            }
          }
        },
        "name" : {
          "type" : "text"
        }
      }
    }
  }
}
```

## 字段复制（copy_to）
<font style="color:rgb(33, 37, 41);">允许将多个字段的值复制到组字段中，然后可以将该字段作为单个字段进行查询。</font>不会出现在 _source 中，只用来搜索

+ 设置mapping

```json
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "first_name": {
        "type": "text",
        "copy_to": "full_name" 
      },
      "last_name": {
        "type": "text",
        "copy_to": "full_name" 
      },
      "full_name": {
        "type": "text"
      }
    }
  }
}
```

+ 插入数据

```json
PUT my-index-000001/_doc/1
{
  "first_name": "John",
  "last_name": "Smith"
}
```

+ 查询

```json
GET my-index-000001/_search
{
  "query": {
    "match": {
      "full_name": { 
        "query": "John Smith",
        "operator": "and"
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
    "max_score" : 0.26706278,
    "hits" : [
      {
        "_index" : "my-index-000001",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.26706278,
        "_source" : {
          "first_name" : "John",
          "last_name" : "Smith"
        }
      }
    ]
  }
}

```

## 是否索引（index）
控制当前字段是否索引，默认为 true，即记录索引，false 不记录，即不可搜索

+ 设置mapping

```json
PUT my_index
{
  "mappings": {
    "properties": {
      "cookie":{
        "type": "text",
        "index":false
      }
    }
  }
}
```

+ 插入数据

```json
PUT my_index/_doc/1
{
  "cookie":"ADSAD=123"
}
```

+ 查询验证

```json
GET my_index/_search
{
  "query": {
    "match": {
      "cookie": "123"
    }
  }
}
# 响应
{
  "error" : {
    "root_cause" : [
      {
        "type" : "query_shard_exception",
        "reason" : "failed to create query: Cannot search on field [cookie] since it is not indexed.",
        "index_uuid" : "tPRh2f7PQI2GnB-7g2Qhww",
        "index" : "my_index"
      }
    ]
    ……
  "status" : 400
}

```

## 索引记录内容（index_options）
index_options 用于控制倒排索引记录的内容，有如下 4 种配置

+ docs 只记录 doc id
+ freqs 记录 doc id 和 term frequencies
+ positions 记录 doc id、term frequencies 和 term position
+ offsets 记录 doc id、term frequencies、term position 和 character offsets

text 类型默认配置为 positions，其他默认为 docs

```json
# 设置mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "text": {
        "type": "text",
        "index_options": "offsets"
      }
    }
  }
}
# 插入数据
PUT my-index-000001/_doc/1
{
  "text": "Quick brown fox"
}
# 查询
GET my-index-000001/_search
{
  "query": {
    "match": {
      "text": "brown fox"
    }
  },
  "highlight": {
    "fields": {
      "text": {} 
    }
  }
}
# 响应
{
  "took" : 82,
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
        "_index" : "my-index-000002",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.5753642,
        "_source" : {
          "text" : "Quick brown fox"
        },
        "highlight" : {
          "text" : [
            "Quick <em>brown</em> <em>fox</em>"
          ]
        }
      }
    ]
  }
}
```

## 空值处理（null_value）
当字段遇到 null 值时的处理策略，默认为 null，即空值，此时 es 会忽略该值。可以通过设定该值设

定字段的默认值

+ 设置mapping

```json
PUT my-index-000003
{
  "mappings": {
    "properties": {
      "status_code": {
        "type":       "keyword",
        "null_value": "NULL" 
      }
    }
  }
}
```

+ 插入数据（插入数据null，替换为NULL）

```json
PUT my-index-000003/_doc/1
{
  "status_code": null
}
```

+ 插入数据（<font style="color:rgb(33, 37, 41);">空数组不是null ，因此不会替换</font>）

```json
PUT my-index-000003/_doc/2
{
  "status_code": [] 
}
```

+ 查询验证（<font style="color:rgb(33, 37, 41);">返回文档 1，但不返回文档 2</font>）

```json
GET my-index-000003/_search
{
  "query": {
    "term": {
      "status_code": "NULL" 
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
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "my-index-000003",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 0.2876821,
        "_source" : {
          "status_code" : null
        }
      }
    ]
  }
}
```

## 参考文档
es显式映射：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/explicit-mapping.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/explicit-mapping.html)

es动态映射：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/dynamic.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/dynamic.html)

es字段复制：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/copy-to.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/copy-to.html)

es倒排索引记录选项：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-options.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/index-options.html)

es空值处理：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/null-value.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/null-value.html)


