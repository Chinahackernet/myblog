# Query DSL

> 分类：ELK Stack / 第4章：ES数据查询
> 原文：https://www.cuiliangblog.cn/detail/section/78837704
> 来源：崔亮的博客

---

## DSL介绍
### <font style="color:rgb(51, 51, 51);">查询DSL</font>
<font style="color:rgb(51, 51, 51);">elasticsearch提供了基于JSON的完整查询DSL来定义查询，DSL拥有一套查询组件，这些组件可以以无限组合的方式进行搭配，构建各种复杂的查询     </font>

### <font style="color:rgb(51, 51, 51);">查询语句构成</font>
1. 查询叶子子句：在指定的字段上更进一步查询指定的值，例如：<font style="color:rgb(64, 64, 64);">match、term or range queries</font>
2. <font style="color:rgb(64, 64, 64);">复合查询子句：通过逻辑方式组合多个叶子、复合查询为一个查询。</font>

### 查询类型
基于 JSON定义的查询语言，主要包含如下两种类型：

1. query DSL

主要关注期望的检索结果与实际返回结果匹配度，查询中使用的bool和match字句，用于计算每个文档的匹配评分，评分越高，排在越前。

2. Filter DSL

主要关注是否存在，它不会去计算评分，也不会排序，查询中使用的term和range字句，会过滤不匹配的文档。

原则上来说，使用查询语句做全文本搜索或其他需要进行相关性评分的时候，剩下的全部用过滤语句。过滤的目的是用特定的筛选条件来缩小结果范围，而查询不仅要缩小结果范围，还会影响文档的得分，在计算文档得分时，需要消耗额外的CPU资源。

### 字段类查询
字段类查询主要包括以下两类：

+ 全文检索

针对 text 类型的字段进行全文检索，会对查询语句先进行分词处理，如 match, match_phrase

等 query 类型

+ 精确匹配

不会对查询语句做分词处理，直接去匹配字段的倒排索引，如 term, terms, range 等 query 类

型

## DSL总结
![画板](assets/01-ELK-Stack/422d80fff671ff956695.jpeg)

## 数据准备
### 设置mapping
```json
PUT query_test
{
  "mappings": {
    "properties": {
      "age": {
        "type": "long"
      },
      "email": {
        "type": "text"
      },
      "hobby": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "id": {
        "type": "long"
      },
      "name": {
        "type": "text"
      },
      "city":{
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "birthday":{
        "type": "date"
      }
    }
  }
}
```

### 插入数据
```json
POST query_test/_bulk
{"index":{"_id":1}}
{"id":"1","name":"alex","age":2,"email":"query_test1@qq.com","hobby":"eat drink play happy","city":"bei jing","birthday":"2020-03-02"}
{"index":{"_id":2}}
{"id":"2","name":"join","age":33,"email":"test2@163.com","hobby":"study sleep eat","city":"bei jing","birthday":"1989-05-03"}
{"index":{"_id":3}}
{"id":"3","name":"tom","age":12,"email":"query_test3@126.com","hobby":"sleep eat","city":"shang hai","birthday":"2010-10-12"}
{"index":{"_id":4}}
{"id":"4","name":"tory","age":41,"email":"query4@qq.com","hobby":"music movie sport","city":"nan jing","birthday":"1981-11-30"}
{"index":{"_id":5}}
{"id":"5","name":"mary","age":22,"email":"query_test5@qq.com","hobby":"football basketball","city":"shang hai","birthday":"2000-12-11"}
{"index":{"_id":6}}
{"id":"6","name":"helen","age":22,"email":"query_test6@qq.com","hobby":"read music movie","city":"shen zhen","birthday":"2000-12-11"}
```

## 参考文档
query dsl：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/query-dsl.html)


