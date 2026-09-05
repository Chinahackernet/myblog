# 运行时(Runtime fields)

> 分类：ELK Stack / 第2章：ES数据建模
> 原文：https://www.cuiliangblog.cn/detail/section/84342649
> 来源：崔亮的博客

---

## 产生背景
### 需求背景
例如一个已有的index缺少一个字段is_pass，而字段的值是有score判断得来，以前解决方案大多都需要更改 Mapping、重建索引、reindex 数据等，相对复杂。

### 技术背景
Runtime fields 运行时字段是旧的脚本字段 script field 的 Plus 版本，引入了一个有趣的概念，称为“读取建模”（Schema on read）。

有 Schema on read 自然会想到 Schema on write（写时建模），传统的非 runtime field 类型 都是写时建模的，而 Schema on read 则是另辟蹊径、读时建模。

这样，运行时字段不仅可以在索引前定义映射，还可以在查询时动态定义映射，并且几乎具有常规字段的所有优点。

Runtime fields在索引映射或查询中一旦定义，就可以立即用于搜索请求、聚合、筛选和排序。

## 使用实战
### 准备数据
```json
# 创建基础mapping
PUT student
{
  "mappings": {
    "properties": {
      "score": {
        "type": "integer"
      },
      "name":{
        "type": "text"
      }
    }
  }
}
# 插入数据
POST student/_bulk
{"index":{"_id":1}}
{"score":50,"name":"alex"}
{"index":{"_id":2}}
{"score":66,"name":"tom"}
{"index":{"_id":3}}
{"score":50,"name":"jack"}
{"index":{"_id":4}}
{"score":82,"name":"tony"}
```

### 加入runtime fields
runtime字段名为is_pass，他的值根据score计算得来，当score < 60时，is_pass值为0；否则为1

```json
# 在已有mapping基础上加入runtime fields
PUT student/_mapping
{
  "runtime": {
    "is_pass": {
      "type": "keyword",
      "script": {
        "source": "if (doc['score'].value > 0 && doc['score'].value < 60) emit('0'); if (doc['score'].value >= 60 && doc['score'].value<=100) emit('1')"
      }
    }
  }
}
# 创建mapping时指定runtime fields
PUT student_runtime
{
  "mappings": {
    "runtime": {
      "emotion_flag_new": {
        "type": "keyword",
        "script": {
          "source": "if (doc['score'].value > 0 && doc['score'].value < 60) emit('0'); if (doc['score'].value >= 60 && doc['score'].value<=100) emit('1')"
        }
      }
    },
    "properties": {
      "name":{
        "type": "text"
      },
      "score": {
        "type": "integer"
      }
    }
  }
}
```

### 查询验证
+ 查询所有数据时，没有runtime

```json
GET student/_search
{
  "query": {
    "match_all": {}
  }
}
# 响应
{
  "took" : 1,
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
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "score" : 50,
          "name" : "alex"
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "score" : 66,
          "name" : "tom"
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "score" : 50,
          "name" : "jack"
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "score" : 82,
          "name" : "tony"
        }
      }
    ]
  }
}
```

+ 查询is_pass字段值为1的文档，可以返回符合条件的结果，但仍然没有runtime fields

```json

GET student/_search
{
  "query": {
    "match": {
      "is_pass": "1"
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "score" : 66,
          "name" : "tom"
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "score" : 82,
          "name" : "tony"
        }
      }
    ]
  }
}
```

+ 指定fields为*时，可以返回runtime fields内容

```json
GET student/_search
{
  "fields": [
    "*"
  ], 
  "query": {
    "match": {
      "is_pass": "1"
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "score" : 66,
          "name" : "tom"
        },
        "fields" : {
          "score" : [
            66
          ],
          "name" : [
            "tom"
          ],
          "is_pass" : [
            "1"
          ]
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "score" : 82,
          "name" : "tony"
        },
        "fields" : {
          "score" : [
            82
          ],
          "name" : [
            "tony"
          ],
          "is_pass" : [
            "1"
          ]
        }
      }
    ]
  }
}
```

## Runtime fields 核心语法解读
为什么加了：field:[*] 才可以返回检索匹配结果呢？

因为：Runtime fields 不会显示在：_source 中，但是：fields API 会对所有 fields 起作用。

如果需要指定字段，就写上对应字段名称；否则，写 * 代表全部字段。

## 不添加字段，只在查询时生效
```json
# 创建mapping
PUT student
{
  "mappings": {
    "properties": {
      "score": {
        "type": "integer"
      },
      "name":{
        "type": "text"
      }
    }
  }
}
# 插入数据
POST student/_bulk
{"index":{"_id":1}}
{"score":50,"name":"alex"}
{"index":{"_id":2}}
{"score":66,"name":"tom"}
{"index":{"_id":3}}
{"score":50,"name":"jack"}
{"index":{"_id":4}}
{"score":82,"name":"tony"}
GET student/_mapping
# 在查询时指定runtime
GET student/_search
{
  "runtime_mappings": {
    "is_pass": {
      "type": "keyword",
      "script": {
        "source": "if (doc['score'].value > 0 && doc['score'].value < 60) emit('0'); if (doc['score'].value >= 60 && doc['score'].value<=100) emit('1')"
      }
    }
  },
  "fields": [
    "*"
  ]
}
# 结果
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
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "score" : 50,
          "name" : "alex"
        },
        "fields" : {
          "score" : [
            50
          ],
          "name" : [
            "alex"
          ],
          "is_pass" : [
            "0"
          ]
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "score" : 66,
          "name" : "tom"
        },
        "fields" : {
          "score" : [
            66
          ],
          "name" : [
            "tom"
          ],
          "is_pass" : [
            "1"
          ]
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0,
        "_source" : {
          "score" : 50,
          "name" : "jack"
        },
        "fields" : {
          "score" : [
            50
          ],
          "name" : [
            "jack"
          ],
          "is_pass" : [
            "0"
          ]
        }
      },
      {
        "_index" : "student",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.0,
        "_source" : {
          "score" : 82,
          "name" : "tony"
        },
        "fields" : {
          "score" : [
            82
          ],
          "name" : [
            "tony"
          ],
          "is_pass" : [
            "1"
          ]
        }
      }
    ]
  }
}
```

# 适用场景
比如：日志场景。运行时字段在处理日志数据时很有用，尤其是当不确定数据结构时。

使用了 runtime field，索引大小要小得多，可以更快地处理日志而无需对其进行索引。

# 优缺点
优点 1：灵活性强

运行时字段非常灵活。主要体现在：

需要时，可以将运行时字段添加到我们的映射中。

不需要时，轻松删除它们。

删除操作实战如下：

```plain
PUT news_00001/_mapping
{
 "runtime": {
   "emotion_flag": null
 }
}
```

也就是说将这个字段设置为：null，该字段便不再出现在 Mapping 中。

优点 2：打破传统先定义后使用方式

运行时字段可以在索引时或查询时定义。

由于运行时字段未编入索引，因此添加运行时字段不会增加索引大小，也就是说 Runtime fields 可以降低存储成本。

优点3：能阻止 Mapping 爆炸

Runtime field 不被索引（indexed）和存储（stored），能有效阻止 mapping “爆炸”。

原因在于 Runtime field 不计算在  index.mapping.total_fields 限制里面。

缺点1：对运行时字段查询会降低搜索速度

对运行时字段的查询有时会很耗费性能，也就是说，运行时字段会降低搜索速度。

# 使用建议
权衡利弊：可以通过使用运行时字段来减少索引时间以节省 CPU 使用率，但是这会导致查询时间变慢，因为数据的检索需要额外的处理。

结合使用：建议将运行时字段与索引字段结合使用，以便在写入速度、灵活性和搜索性能之间找到适当的平衡。

## 文档
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/runtime.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/runtime.html)


