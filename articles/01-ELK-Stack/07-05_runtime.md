# runtime

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061476
> 来源：崔亮的博客

---

# 注意点
+ runtime直接计算值`emit(doc['b'].value-doc['c'].value)`
+ runtime根据范围设置值`if (doc['score'].value > 0 && doc['score'].value < 60) emit('0'); if (doc['score'].value >= 60 && doc['score'].value<=100) emit('1')`

# runtime+aggs
## 题目
+ 在cluster1上有一task3索引,请编写一个查询并满足以下要求:
+ 定义一个名为difference的运行时字段，通过difference字段实现以下聚合（difference字段的值等于close_field字段减去open_field字段）
+ reindex到索引task3_new
+ 聚合difference值小于-5的文档
+ 聚合-5到5之间的文档
+ 聚合大于5的文档

```json
PUT task3
{
  "settings": {
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "open_field":{
        "type": "double"
      },
      "close_field":{
        "type": "double"
      }
    }
  }
}

POST task3/_bulk
{"index":{"_id":1}}
{"open_field":2,"close_field":3}
{"index":{"_id":2}}
{"open_field":5,"close_field":1}
{"index":{"_id":3}}
{"open_field":6,"close_field":1}
{"index":{"_id":4}}
{"open_field":1,"close_field":7}
```

## 答案
```json
# 在已有index的mapping上添加runtime
PUT task3/_mapping
{
  "runtime": {
    "difference": {
      "type": "double",
      "script": {
        "source": "emit(doc['close_field'].value-doc['open_field'].value)"
      }
    }
  }
}
# 查看字段验证
GET task3/_search
{
  "fields": [
    "*"
  ]
}
# 创建新索引
GET task3/_mapping
PUT task3_new/
{
  "mappings": {
    "runtime": {
      "difference": {
        "type": "double",
        "script": {
          "source": "emit(doc['close_field'].value-doc['open_field'].value)",
          "lang": "painless"
        }
      }
    },
    "properties": {
      "close_field": {
        "type": "double"
      },
      "open_field": {
        "type": "double"
      }
    }
  }
}
# reindex
POST _reindex
{
  "source": {
    "index": "task3"
  },
  "dest": {
    "index": "task1_new"
  }
}
# 区间分桶聚合查询
GET task3_new/_search
{
  "aggs": {
    "difference_ranges": {
      "range": {
        "field": "difference",
        "ranges": [
          { "to": -5 },
          { "from": -5, "to": 5 },
          { "from": 5 }
        ]
      }
    }
  }
}
```

## 

