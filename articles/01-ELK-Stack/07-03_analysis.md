# analysis

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061479
> 来源：崔亮的博客

---

![](assets/01-ELK-Stack/0b7b609bed9603e2069c.png)

# 注意点
自定义分词器三部分

+ Character Filters在 Tokenizer 之前对原始文本进行处理，比如增加、删除或替换字符等

Mapping character 替换指定字符串

+ Tokenizer（必须有）

standard 按照单词进行分割，例如将-替换为空

+ Token Filters对于 tokenizer 输出的 单词（term） 进行增加、删除、修改等操作

lowercase 将所有 term 转换为小写

stop 删除 stop words，例如of、not、or、and、are、to、is

synonym 同义词

**创建完分词器后，记得在mapping字段指定分词器**

# stop(token filter)+reindex
## 题目
有一个索引task2，有field2字段，用match匹配the能查到很多数据，现要求对task2索引进行重建，重建后的索引叫new_task2，然后match匹配the查不到数据

```json
PUT task2
{
  "mappings": {
    "properties": {
      "field2":{
        "type": "text"
      }
    }
  }
}

PUT /task2/_doc/1
{"field2":"the school"}
```

## 答案
```json
# 定义分词器
PUT my-index-000001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {
          "tokenizer": "standard",
          "filter": [
            "stop"
          ]
        }
      }
    }
  }
}
# 测试验证
POST exam8-task2/_analyze
{
  "analyzer": "my_custom_analyzer",
  "text": "the school"
}
# 删除测试index
DELETE my-index-000001
# 创建index并指定分词器
PUT exam8-task2
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {
          "tokenizer": "standard",
          "filter": [
            "stop"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "field2": {
        "type": "text",
        "analyzer": "my_custom_analyzer"
      }
    }
  }
}
# 执行数据迁移
POST _reindex
{
  "source": {
    "index": "task2"
  },
  "dest": {
    "index": "exam8-task2"
  }
}
# match全文检索
GET exam8-task2/_search
{
  "query": {
    "match": {
      "field2": "the"
    }
  }
}
```

# mapping(char filter)+lowercase(token filter)+reindex
## 题目
在集群cluster1上有一个索引task2，brand字段match搜索"Yoo-Hoo"有3个，match搜索'YooHoo'有10个，请重建它到task2_new索引上，并满足以下要求：

集群一的brand字段包含关键字'Yoo-Hoo'和'YooHoo'，不管搜索'yoohoo'还是'yoo-hoo'，它的结果应该一样，都是3个。  
task2_new和task2的doc和mapping一样，mapping要拷贝，不能直接reindex

```json
DELETE task2
DELETE task2_new
PUT task2
{
  "settings": {
    "number_of_replicas": 0,
    "number_of_shards": 1
  },
  "mappings": {
    "properties": {
      "brand":{
        "type": "text"
      }
    }
  }
}

POST task2/_bulk
{"index":{"_id":1}}
{"brand":"Yoo-Hoo"}
{"index":{"_id":2}}
{"brand":"YooHoo"}
```

## 答案
```json
GET task2/_mapping
PUT task2_new
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {
          "tokenizer": "standard",
          "char_filter": [
            "my_mappings_char_filter"
          ],
          "filter": [
            "lowercase"
          ]
        }
      },
      "char_filter": {
        "my_mappings_char_filter": {
          "type": "mapping",
          "mappings": [
            "-=>"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "brand": {
        "type": "text"
      }
    }
  }
}
GET task2_new/_analyze
{
  "analyzer": "my_custom_analyzer",
  "text": "Yoo-Hoo"
}

POST _reindex
{
  "source": {
    "index": "task2"
  },
  "dest": {
    "index": "task2_new"
  }
}

GET task2_new/_search
{
  "query": {
    "match": {
      "brand": "yoo-hoo"
    }
  }
}
```

# synonym(token filter)+reindex
## 题目
目前有个索引是task3，用oa、OA、Oa、oA phrase查询是3条，使用dingding的phrase查询是2条，通过reindex 索引后能够使得使用oa、OA、Oa、oA、0A、dingding都是6条。

准备task3的索引，导入6条不同的文档数据

reindex task3的索引到task3_new后

```json
PUT task3
{
  "settings": {
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text"
      }
    }
  }
}

POST task3/_bulk
{"index":{}}
{"title":"oa"}
{"index":{}}
{"title":"OA"}
{"index":{}}
{"title":"Oa"}
{"index":{}}
{"title":"oA"}
{"index":{}}
{"title":"0A"}
{"index":{}}
{"title":"dingding"}
```

## 答案
```json
GET task3/_mapping
PUT task3_new
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {
          "tokenizer": "standard",
          "filter": [ "graph_synonyms" ]
        }
      },
      "filter": {
          "graph_synonyms": {
            "type": "synonym_graph",
            "synonyms": [ "oa, OA, 0a, 0A, dingding" ]
          }
        }
    }
  },
  "mappings" : {
      "properties" : {
        "title" : {
          "type" : "text"
        }
      }
    }
}

POST _reindex
{
  "source": {
    "index": "task3"
  },
  "dest": {
    "index": "task3_new"
  }
}

GET task3_new/_search
{
  "query": {
    "match": {
      "title": "oa"
    }
  }
}
```

## 

