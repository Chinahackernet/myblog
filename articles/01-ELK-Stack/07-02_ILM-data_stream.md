# ILM+data stream

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061287
> 来源：崔亮的博客

---

以日志数据为例，0-7天数据存放hot节点，7-15天数据存放warm节点，15天-30天数据存放clod节点，30天以上数据删除

需要注意min_age是index写入时间，但是如果hot阶段配置了rollover，那么rollover之后索引的age会清0，计算min_age时需要减去rollover的时间

+ 如果在hot没有配置rollover，hot的min_age=0ms，warm的min_age=7d，cold的min_age=15d，delete的min_age=30d
+ 如果在hot阶段配置了rollover参数，设置max_age=7d，warm的min_age=0d，cold的min_age=8d，delete的min_age=23d

因此，在考试的时候要看清楚，题目要不要设置rollover

# 创建指定要求的data stream
## 题目
```json
数据流索引主分片数为1，副本为2

索引pattern是'mymetrics-，按要求在mappings里增加4个字段：hostname, errormessage, timestamp,tags，

而且hostname和tags是keyword only, errormessage是text only,并用standard analyzer

建立根据这个模板创建一个data stream，命名为mymetrics-examprod，题目中给出一条数据，把这条数据插入该数据流。
```

## 答案
```json
PUT _component_template/my-mappings
{
  "template": {
    "mappings": {
      "properties": {
        "hostname": {
          "type": "keyword"
        },
        "errormessage": {
          "type": "text",
          "analyzer": "standard"
        },
        "timestamp": {
          "type": "date"
        },
        "tags": {
          "type": "keyword"
        }
      }
    }
  }
}

# Creates a component template for index settings
PUT _component_template/my-settings
{
  "template": {
    "settings": {
      "number_of_replicas": "0"
    }
  }
}
PUT _index_template/mymetrics-examprod
{
  "index_patterns": ["mymetrics-examprod-*"],
  "data_stream": { },
  "composed_of": [ "my-mappings", "my-settings" ],
  "priority": 500
}
POST mymetrics-examprod/_doc
{
  "hostname": "chenqf",
  "errormessage": "I am mistake",
  "@timestamp": "2021-12-27T09:26:22.000Z",
  "tags": [
    "dream",
    "sing"
  ]
}
```

# ILM配合data-stream
## 题目
backed indices名称满足data-stream_*_*

索引模板名称叫task1

数据索引后3分钟内在hot节点，之后立即翻滚至warm节点，5分钟后转换到cold节点，翻滚后10分钟删除

## 答案
```json
# 定义ILM
# hot 0-3,持续3分钟 min_age3
# warm 3-8，持续5分钟 min_age0
# cold 8-10，持续2分钟 min_age5
# delete 10分钟后 min_age10
PUT _ilm/policy/data-stream
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "3m"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "0m",
        "actions": {
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "5m",
        "actions": {
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "10m",
        "actions": {
          "delete": {
            "delete_searchable_snapshot": true
          }
        }
      }
    }
  }
}
# 创建数据流组件模板
PUT _component_template/my-exam8-mappings
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
PUT _component_template/my-exam8-settings
{
  "template": {
    "settings": {
      "index.lifecycle.name": "my_exam8_policy",
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }
}
# 创建数据流索引模板
PUT _index_template/my-index-template
{
  "index_patterns": ["my-exam8-data-stream*"],
  "data_stream": { },
  "composed_of": [ "my-exam8-mappings", "my-exam8-settings" ],
  "priority": 500
}
# 插入数据测试
PUT my-exam8-data-stream/_bulk
{ "create":{ } }
{ "@timestamp": "2099-05-06T16:21:15.000Z", "message": "192.0.2.42 - - [06/May/2099:16:21:15 +0000] \"GET /images/bg.jpg HTTP/1.0\" 200 24736" }
{ "create":{ } }
{ "@timestamp": "2099-05-06T16:25:42.000Z", "message": "192.0.2.255 - - [06/May/2099:16:25:42 +0000] \"GET /favicon.ico HTTP/1.0\" 200 3638" }

GET _cat/shards?v 
```

## 注意点
考试的集群中进行操作时，如果kibana不能识别节点属性，那就是ilm默认安装_tier_preference起作用的，因此，在配置周期数据移动指定节点时，如下操作

```json
"warm": {
  "min_age": "3d",
  "actions": {
    "allocate": {
      "include": {
        "_tier_preference":"data_warm"
      }
    },
    "set_priority": {
      "priority": 50
    }
  }
}
```

## 

