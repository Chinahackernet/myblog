# pipeline+reindex

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061477
> 来源：崔亮的博客

---

# 注意点
常见pipeline处理器：

append：追加字段

remove：删除字段

Enrich：跨索引关联字段

script：通过自定义脚本更改字段名或值

# enrich+reindex
## 题目
在集群cluster1上有两个索引index_a和index_b，index_a中有字段field_a,没有field_a_desc;index_b中有field_a,field_a_desc,

b中共有10条数据，reindex一个索引index_c，要求包含a中的所有数据，且增加字段field_a_desc，关联b索引中field_a相同的字段。

```json
DELETE index_a
PUT index_a
{
  "mappings": {
    "properties": {
      "field_a":{
        "type":"keyword"
      },
      "field_a-01":{
        "type": "keyword"
      }
    }
  }
}

POST index_a/_bulk
{"index":{"_id":1}}
{"field_a":"a001","field_a_01":"usera01"}
{"index":{"_id":2}}
{"field_a":"a002","field_a_01":"usera02"}
{"index":{"_id":3}}
{"field_a":"a003","field_a_01":"usera03"}
{"index":{"_id":4}}
{"field_a":"a001","field_a_01":"usera011"}
{"index":{"_id":5}}
{"field_a":"a002","field_a_01":"usera012"}
{"index":{"_id":6}}
{"field_a":"a003","field_a_01":"usera013"}
{"index":{"_id":7}}
{"field_a":"a007","field_a_01":"usera021"}
{"index":{"_id":8}}
{"field_a":"a008","field_a_01":"usera022"}
{"index":{"_id":9}}
{"field_a":"a009","field_a_01":"usera023"}
{"index":{"_id":10}}
{"field_a":"a010","field_a_01":"usera031"}
{"index":{"_id":11}}
{"field_a":"a008","field_a_01":"usera032"}
{"index":{"_id":12}}
{"field_a":"a009","field_a_01":"usera033"}

DELETE index_b
PUT index_b
{
  "mappings": {
    "properties": {
      "field_a":{
        "type": "keyword"
      },
      "field_a_desc":{
        "type": "keyword"
      }
    }
  }
}

POST index_b/_bulk
{"index":{"_id":1}}
{"field_a":"a001","field_a_desc":"money_01"}
{"index":{"_id":2}}
{"field_a":"a002","field_a_desc":"money_02"}
{"index":{"_id":3}}
{"field_a":"a003","field_a_desc":"money_03"}
{"index":{"_id":4}}
{"field_a":"a004","field_a_desc":"money_04"}
{"index":{"_id":5}}
{"field_a":"a005","field_a_desc":"money_05"}
{"index":{"_id":6}}
{"field_a":"a006","field_a_desc":"money_06"}
{"index":{"_id":7}}
{"field_a":"a007","field_a_desc":"money_07"}
{"index":{"_id":8}}
{"field_a":"a008","field_a_desc":"money_08"}
{"index":{"_id":9}}
{"field_a":"a009","field_a_desc":"money_09"}
{"index":{"_id":10}}
{"field_a":"a010","field_a_desc":"money_10"}
```

## 答案
```json
PUT /_enrich/policy/data-lookup
{
  "match": {
    "indices": "index_b",
    "match_field": "field_a",
    "enrich_fields": ["field_a_desc"]
  }
}

POST /_enrich/policy/data-lookup/_execute

PUT /_ingest/pipeline/data-lookup
{
  "processors": [
    {
      "enrich": {
        "policy_name": "data-lookup",
        "field": "field_a",
        "target_field": "target_field",
        "max_matches": "1"
      },
      "append": {
        "field": "field_a_desc",
        "value": [
          "{{{target_field.field_a_desc}}}"
        ]
      },
      "remove": {
        "field": "target_field"
      }
    }
  ]
}

POST _reindex
{
  "source": {
    "index": "index_a"
  },
  "dest": {
    "index": "index_c",
    "pipeline": "data-lookup"
  }
}
GET index_c/_search
{
  "query": {
    "match_all": {}
  }
}
```

# script+reindex
## 题目
有一个索引task3，其中有fielda,fieldb,fieldc,fielde,现要求对task3重建索引，重建后的索引新增

一个字段fieldg其值是fiedla,fieldb,fieldc,fielde的值拼接而成

```json
PUT task3
{
  "mappings": {
    "properties": {
      "fielda":{
        "type": "keyword"
      },
      "fieldb":{
        "type": "keyword"
      },
      "fieldc":{
        "type": "keyword"
      },
      "fielde":{
        "type": "keyword"
      }
    }
  }
}

POST task3/_doc/1
{
  "fielda":"aa",
  "fieldb":"bb",
  "fieldc":"cc",
  "fielde":"dd"
}
```

## 答案
```json
# 查原始mapping
GET task3/_mapping
# 建目标index的mapping
PUT exam8-task3
{
  "mappings": {
    "properties": {
      "fielda": {
        "type": "keyword"
      },
      "fieldb": {
        "type": "keyword"
      },
      "fieldc": {
        "type": "keyword"
      },
      "fielde": {
        "type": "keyword"
      },
      "fieldg":{
        "type": "keyword"
      }
    }
  }
}
# 创建pipeline
PUT _ingest/pipeline/my_exam8_pipe
{
  "processors": [
    {
      "script": {
        "source": """
            ctx['fieldg'] = ctx['fielda'] + ctx['fieldb'] + ctx['fieldc']+ctx['fielde']
          """
      }
    }
  ]
}
# 执行reindex，指定pipeline
POST _reindex
{
  "source": {
    "index": "task3"
  },
  "dest": {
    "index": "exam8-task3",
    "pipeline": "my_exam8_pipe"
  }
}
GET exam8-task3/_search
{
  "query": {
    "match_all": {}
  }
}
```


