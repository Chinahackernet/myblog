# 数据流(data stream)

> 分类：ELK Stack / 第2章：ES数据建模
> 原文：https://www.cuiliangblog.cn/detail/section/84285233
> 来源：崔亮的博客

---

## 简介
### 什么是data stream
存储时序数据的多个索引的抽象集合，简称为：数据流（data stream）。

数据流可以跨多个后备索引存储仅追加（append-only，下文有详细解释）的时间序列数据，同时对外提供一个同一访问入口。

和别名不同的是：别名关联多个索引，写入的时候需要指定 “is_write_index"，而 data stream 相对黑盒，这些细节用户无需关注。

所以，它是索引、模板、rollover、ilm 基于时序性数据的综合产物。

### data stream特点
+ 关联后备支撑索引（backing indices）

![](assets/01-ELK-Stack/e9ce65ca88034dcb948a.png)

由backing indices，后备索引负责工作，对外暴露data stream数据流这个抽象概念

+ @timestamp 字段不可缺

每个写入到 dataSteam 的文档必须包含 @timestamp 字段，必须是：date 类型（若不指定，默认：date 类型）或者 date_nanos 类型。

+ 后备索引规范

创建后备索引时，索引使用以下约定命名：.ds-<data-stream>-<yyyy.MM.dd>-<generation> 

举例索引真实名称：data-stream-2021.07.25-000001。	 	

    - .ds：前缀开头不可少。 	
    - data-stream： 自定义的数据流的名称。 	
    - yyyy.MM.dd：日期格式 	
    - generation：rollover 累积值：—— 默认从：000001 开始。 	
+ Append-only 仅追加

仅追加：指只支持 **op_type=create** 的索引请求，仅支持向后追加（区别于对历史数据的删除、更新操作）。

数据流只支持：update_by_query 和 delete_by_query 实现批量操作，单条文档的更新和删除操作只能通过指定后备索引的方式实现。

对于频繁更新或者删除文档的业务场景，用 data stream 不合适，而相反的，使用：模板+别名+ILM更为合适。

### data stream用途
data stream 支持直接的写入、查询请求。 	

data stream 会自动将客户端请求路由至关联索引，以用来存储流式数据。 	

可以使用索引生命周期管理 ILM 自动管理这些关联索引。 	

### 适用场景
日志（logs）、事件（events）、指标（metrics）和其他持续生成的数据。

两大核心特点：

+ 时序性数据。 	
+ 数据极少更新（或者没有更新）。

### 与索引差异
数据流相对实体索引，有点“抽象层“的概念，其核心数据还是存储在 .ds 前缀的后备索引中。

以下操作，只适用于数据流。

+ 数据流对应映射必须包含日期类型的 @timestamp 字段。 	
+ 数据流删除和更新只支持 “_update_by_query” 和 “_delete_by_query”操作。 	
+ 不能基于.ds 前缀的后备索引创建文档只能基于数据流写入，可以基于：以.ds前缀的后备索引更新和删除文档。 

### 和模板的关系
相同的索引模板可以用来支撑多个 data streams。可以类比为：1：N 关系。

不能通过 删除 data Stream 的方式删除索引模板。

### 和ilm的关系
ILM 在 data stream 中起到索引生命周期管理的作用。

data stream 操作时序数据优势体现在：不再需要为 ilm 配置 index.lifecycle.rollover_alias。

## data stream操作
### 新增
+ 创建索引生命周期

```json
PUT _ilm/policy/my-lifecycle-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "set_priority": {
            "priority": 100
          },
          "rollover": {
            "max_age": "3d",
            "max_docs": 1000,
            "max_size": "5gb"
          }
        }
      },
      "warm": {
        "min_age": "3d",
        "actions": {
          "allocate": {
            "require": {
              "box_type": "warm"
            }
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "7d",
        "actions": {
          "allocate": {
            "require": {
              "box_type": "cold"
            }
          },
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

+ 创建数据流组件模板

模板组成包括：index_patterns、指定数据流 data stream、settings、mappings。

```json
# 创建数据流mapping
PUT _component_template/my-mappings
{
  "template": {
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date",
          "format": "date_optional_time||epoch_millis"
        },
        "message": {
          "type": "wildcard"
        }
      }
    }
  }
}
# 创建数据流setting，关联ILM
PUT _component_template/my-settings
{
  "template": {
    "settings": {
      "index.lifecycle.name": "my-lifecycle-policy"
    }
  }
}
```

+ 创建索引模板

```json
# 创建索引模板，关联数据流、setting、mapping
PUT _index_template/my-index-template
{
  "index_patterns": [
    "my-data-stream*"
  ],
  "data_stream": {},
  "composed_of": [
    "my-mappings",
    "my-settings"
  ],
  "priority": 500
}
```

+ 创建data stream
    - 方式一：直接创建数据流 my-data-stream。 	

```json
PUT _data_stream/my-data-stream 
```

    - 方式二：直接批量或者逐个导入数据（会间接生成 data stream 的创建）。 	

![](assets/01-ELK-Stack/00b2f2ca83d1d9b74aec.png)

```json
# 批量插入
PUT my-data-stream/_bulk
{"create":{}}
{"@timestamp":"2099-05-06T16:21:15.000Z","message":"192.0.2.42 - - [06/May/2099:16:21:15 +0000] \"GET /images/bg.jpg HTTP/1.0\" 200 24736"}
{"create":{}}
{"@timestamp":"2099-05-06T16:25:42.000Z","message":"192.0.2.255 - - [06/May/2099:16:25:42 +0000] \"GET /favicon.ico HTTP/1.0\" 200 3638"}
# 单条插入
POST my-data-stream/_doc
{
  "@timestamp": "2099-05-06T16:21:15.000Z",
  "message": "192.0.2.42 - - [06/May/2099:16:21:15 +0000] \"GET /images/bg.jpg HTTP/1.0\" 200 24736"
}
```

两个注意的地方：

+ 第一：批量 bulk 操作，必须使用：create 指令，而非 index（使用 index 不会报错， 会把流当做索引处理了）。 	
+ 第二：文档必须包含：@timestamp  时间戳字段。 

### 查询
![](assets/01-ELK-Stack/b7648a12608c98629bb6.png)

```json
# 查询data stream详情
GET _data_stream/my-data-stream 
# 响应
{
  "data_streams" : [
    {
      "name" : "my-data-stream",
      "timestamp_field" : {
        "name" : "@timestamp"
      },
      "indices" : [
        {
          "index_name" : ".ds-my-data-stream-2022.07.23-000001",
          "index_uuid" : "OpJNrWGvRJOGFD9Lj2yGuw"
        }
      ],
      "generation" : 1,
      "status" : "YELLOW",
      "template" : "my-index-template",
      "ilm_policy" : "my-lifecycle-policy",
      "hidden" : false,
      "system" : false
    }
  ]
}
# 后备索引数据
GET .ds-my-data-stream-2022.07.23-000001/_search
{
  "query": {
    "match_all": {}
  }
}
```

### 修改
+ 单条数据更新

```json
# 插入一条数据
POST my-data-stream/_bulk
{"create":{"_id":1}}
{"@timestamp":"2099-05-06T16:21:15.000Z","message":"192.0.2.42 - - [06/May/2099:16:21:15 +0000] \"GET /images/bg.jpg HTTP/1.0\" 200 24736"}

# 获取数据流关联索引
GET _data_stream/my-data-stream

# 更新数据
PUT .ds-my-data-stream-2022.07.23-000001/_doc/1?if_seq_no=1&if_primary_term=1
{
  "@timestamp": "2099-03-08T11:06:07.000Z",
  "user": {
    "id": "8a4f500d"
  },
  "message": "Login successful"
}

# 查看验证是否已经更新（已经验证，可以更新）
GET .ds-my-data-stream-2022.07.23-000001/_doc/1
```

+ 批量更新

```json
POST /my-data-stream/_update_by_query
{
  "query": {
    "match": {
      "user.id": "l7gk7f82"
    }
  },
  "script": {
    "source": "ctx._source.user.id = params.new_id",
    "params": {
      "new_id": "XgdX0NoX"
    }
  }
}
```

### 删除
+ 删除 data stream 和 删除索引、删除模板语法基本一致。

```plain
DELETE _data_stream/my-data-stream
```

执行删除操作之后，该 data stream 以及 关联索引都会被一并删除。

+ 单条删除文档

```plain
DELETE data-stream-2021.07.25-000001/_doc/1 
```

+ 批量删除文档

批量删除数据的方式如下：

```json
POST /my-data-stream/_delete_by_query
{
  "query": {
    "match": {
      "user.id": "vlb44hny"
    }
  }
}
```

## 其他操作
### reindex 操作
```json
POST /_reindex
{
  "source": {
    "index": "archive"
  },
  "dest": {
    "index": "my-data-stream",
    "op_type": "create"
  }
}
```

### 滚动操作
```json
POST my-data-stream/_rollover 
```

![](assets/01-ELK-Stack/cdfc3f4b38002f0cbbae.png)

## 参考文档
es数据流[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/data-streams.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/data-streams.html)


