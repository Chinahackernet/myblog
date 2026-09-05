# 全文检索（Full test queries）

> 分类：ELK Stack / 第4章：ES数据查询
> 原文：https://www.cuiliangblog.cn/detail/section/77370313
> 来源：崔亮的博客

---

## match查询（单个分词检索）
### 查询特点
**<font style="color:rgb(0, 0, 0);">elasticsearch会先根据查询的关键词使用分词器进行分词，然后对每个词</font>****作全文检索****<font style="color:rgb(0, 0, 0);">，匹配结果只包含其中一部分关键词就行。</font>**

### 基本语法
```json
GET query_test/_search # 查询index名称
{
    "query":{
        "match":{ # 查询关键词
            "FIELD": "TEXT" # 查询字段：查询值
        }
    }
}
```

### 查询示例
```json
# 全文检索hobby字段值为sleep eat的文档
GET query_test/_search
{
  "query": {
    "match": {
      "hobby": "sleep eat"
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
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 1.9584035,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.9584035,
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
        "_id" : "2",
        "_score" : 1.6822839,
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
        "_score" : 0.59321976,
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
```

<font style="color:rgb(64, 64, 64);">match查询会先对搜索词关键词进行分词，分词完毕后再逐个对分词结果进行匹配，相对于</font>sleep eat先进行分词，然后依次<font style="color:rgb(64, 64, 64);">对sleep和eat进行term精确搜索，只要文档中包含其任意一个，都会被匹配到。</font>

### operator 参数（匹配关系）
通过 operator 参数可以控制单词间的匹配关系，对于match搜索，可以按照分词后的分词集合的or或者and进行匹配，默认为or，如果我们希望是所有分词都要出现，那只要把匹配模式改成and就行了

+ 查询hobby字段值为movie和music的文档

```json
# 请求
GET query_test/_search
{
  "query": {
    "match": {
      "hobby": {
        "query": "movie music",
        "operator": "and"
      }
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

+ 查询hobby字段值为drink或者football的文档

```json
# 请求
GET query_test/_search
{
  "query": {
    "match": {
      "hobby": {
        "query": "drink football",
        "operator": "or"
      }
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
        "_id" : "1",
        "_score" : 1.3183672,
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

### minimum_should_match参数（匹配单词数）
通过 minimum_should_match 参数可以控制需要匹配的单词数

+ 查询hobby字段值为study sleep eat三个单词中任意1个匹配到的文档

```json
# 请求
GET query_test/_search
{
  "query": {
    "match": {
      "hobby": {
        "query": "study sleep eat",
        "minimum_should_match": 1
      }
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
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 3.1865304,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 3.1865304,
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
        "_id" : "3",
        "_score" : 1.9584035,
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
        "_id" : "1",
        "_score" : 0.59321976,
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

+ 查询hobby字段值为study sleep eat三个单词中任意3个匹配到的文档

```json
# 请求
GET query_test/_search
{
  "query": {
    "match": {
      "hobby": {
        "query": "study sleep eat",
        "minimum_should_match": 3
      }
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
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 3.1865304,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 3.1865304,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat"
        }
      }
    ]
  }
}
```

## match_all（全部查询）
**<font style="color:rgb(0, 0, 0);">查询指定索引下的所有文档</font>**

### 基本语法
```json
GET query_test/_search # 查询index名称
{
  "query": {
    "match_all": {} # 查询全部文档
  }
}
```

### 查询示例
查询index全部文档

```json
# 请求
GET query_test/_search
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
        "_id" : "3",
        "_score" : 1.0,
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

## match_phrase（<font style="color:rgb(64, 64, 64);">短语匹配查询</font>）
### 查询特点
+ match_phrase为按短语搜索，对字段检索有顺序要求，例如搜索job XXX engineer时，并不想搜索只含有job或engineer的文档搜索出来，也不想将一些类似XXX job XXX engineer XXX这样的结果搜索出来，此时，就可以用match_phrase。
+ match_phrase的搜索方式和match类似，先对搜索词建立索引，并要求所有分词必须在文档中出现(相当于operator为and的match查询)，除此之外，还必须满足分词在文档中出现的顺序和搜索词中一致且各搜索词之间必须紧邻，因此match_phrase也叫做紧邻搜索。
+ 紧邻对于匹配度要求较高，为了减小精度增加可操作性，引入了slop参数。该参数可以指定相隔多少个词仍被算作匹配成功。
+ 需要注意的是，当slop的值过大时(超出文档总分词数)，那么分词数据将可以是随意的，即跟operator为and的match查询效果一样。
+ 适用场景：对精准度有高要求，不太关注匹配数量时使用。

### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
    "match_phrase": { # 查询关键字
      "key": { # 查询的字段
        "query": "value", # 查询的内容
        "slop": 1 # 查询内容间相隔多少个词仍然可以被匹配
      }
    }
  }
}
```

### 查询示例
```json
# 查询hobby字段内容为study eat，中间间隔一个词的文档
GET query_test/_search
{
  "query": {
    "match_phrase": {
      "hobby": {
        "query": "study eat",
        "slop": 1
      }
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
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.4016166,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.4016166,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat"
        }
      }
    ]
  }
}
```

## **<font style="color:rgb(51, 51, 51);">match_phrase_prefix（短语前缀匹配查询）</font>**
### 查询特点
<font style="color:rgb(100, 100, 100);">与match_phrase查询类似，但是会</font>**<font style="color:rgb(100, 100, 100);">对最后一个关键词进行通配符搜索。重要参数：模糊匹配数控制：max_expansions 默认值50，最小值为1</font>**

### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
    "match_phrase_prefix": { # 查询关键字
      "key": { # 查询字段
        "query": "value" # 查询值
      }
    }
  }
}
```

### 查询示例
```json
# 匹配email字段前缀为query的文档
GET query_test/_search
{
  "query": {
    "match_phrase_prefix": {
      "email": {
        "query": "query"
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
      "value" : 5,
      "relation" : "eq"
    },
    "max_score" : 1.6360589,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.6360589,
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
        "_score" : 1.6360589,
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
        "_score" : 1.6360589,
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
        "_score" : 1.6360589,
        "_source" : {
          "id" : "6",
          "name" : "alex2",
          "age" : 22,
          "email" : "query_test6@qq.com",
          "hobby" : "read music movie"
        }
      },
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.3792357,
        "_source" : {
          "id" : "3",
          "name" : "tom",
          "age" : 12,
          "email" : "query_test3@126.com",
          "hobby" : "sleep eat"
        }
      }
    ]
  }
}
```

### <font style="color:rgb(77, 77, 77);">max_expansions参数</font>
**<font style="color:rgb(77, 77, 77);">最后一个term做前缀匹配时的最大拓展数，默认是50</font>**

```json
# 匹配
GET query_test/_search
{
  "query": {
    "match_phrase_prefix": {
      "email": {
        "query": "query",
        "max_expansions":1
      }
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
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.6360589,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.6360589,
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

## query string（AND OR NOT查询）
### 查询特点
+ <font style="color:rgb(77, 77, 77);">类似URI query，可以指定一个或多个字段搜索，在query里面可以使用AND OR NOT操作符。</font>

### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
    "query_string": { # 查询关键字
       "query": "this AND that OR thus", # 查询的内容
       "default_field": "FIELD", # 默认查询字段
    }
  }
}
```

### 查询示例
+ 查询name为alex1或者name为join，并且email为query_test1@qq.com或者age为33的文档

```bash
GET query_test/_search
{
  "query": {
    "query_string": {
      "query": "(name:alex1 OR name:join) AND (email:query_test1@qq.com OR age:33)"
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
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 3.4524598,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 3.4524598,
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
        "_id" : "2",
        "_score" : 2.3862944,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
        }
      }
    ]
  }
}
```

+ 查询name和email字段，值为tory或者test2的文档

```bash
GET query_test/_search
{
  "query": {
    "query_string": {
      "fields": [
        "name",
        "email"
      ],
      "query": "tory OR test2"
    }
  }
}
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
    "max_score" : 1.3862942,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.3862942,
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
        "_id" : "2",
        "_score" : 1.2576691,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
        }
      }
    ]
  }
}
```

## simple query string
### 查询特点
+ <font style="color:rgb(180, 180, 180) !important;background-color:rgb(36, 36, 41);"></font><font style="color:rgb(180, 180, 180) !important;background-color:rgb(36, 36, 41) !important;">不支持AND OR NOT ，会当做字符处理</font>
+ <font style="color:rgb(180, 180, 180) !important;background-color:rgb(36, 36, 41) !important;">Term 之间默认的关系是OR，可以指定</font>default_operator
+ <font style="color:rgb(180, 180, 180) !important;background-color:rgb(36, 36, 41) !important;">支持 部分逻辑：+代替AND，|代替OR，-代替NOT</font>

### 基本语法
```bash
GET query_test/_search # 查询的index
{
  "query": {
    "simple_query_string": { # 查询关键字
       "query": "\"fried eggs\" +(eggplant | potato) -frittata", # 查询语句
        "fields": ["title^5", "body"], # 查询字段
       "default_operator": "and", # 查找操作符
    }
  }
}
```

### 查询示例
```bash
# 查询name为alex1或者join的文档
GET query_test/_search
{
  "query": {
    "simple_query_string": {
      "query": "alex1-join",
      "fields": ["name"],
      "default_operator": "OR"
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
    "max_score" : 1.3862942,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.3862942,
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
        "_id" : "2",
        "_score" : 1.3862942,
        "_source" : {
          "id" : "2",
          "name" : "join",
          "age" : 33,
          "email" : "test2@163.com",
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
        }
      }
    ]
  }
}
```

## Multi-match query(多字段匹配)
### best_fields(最佳字段)
+ 为默认值，如果不指定，默认best_fields匹配。
+ 含义：多个字段中，返回评分最高的。
+ 类似：dis_max query。
+ 使用场景：当字段之间互相竞争，又互相关联。例如title和body，评分来自最匹配的字段

默认 best_fields 与 dis_max等价

```plain
POST blogs/_search
{
  "query": {
    "multi_match": {
      "type": "best_fields",
      "query": "Quick pets",
      "fields": [
        "title",
        "body"
      ],
      "tie_breaker": 0.2
    }
  }
}
```

+ 与上述best_fields等价

```plain
POST blogs/_search
{
  "query": {
    "dis_max": {
      "queries": [
        {
          "match": {
            "title": "Quick pets"
          }
        },
        {
          "match": {
            "body": "Quick pets"
          }
        }
      ],
      "tie_breaker": 0.2
    }
  }
}
```

### most_fields(多数字段)
+ 含义：匹配多个字段，返回的综合评分（非最高分）
+ 类似：bool+多字段匹配。
+ 使用场景：处理英文内容时，在主字段抽取词干，加入同义词，以匹配更多的文档。相同的文本，加入子字段，以提供更精确的匹配。匹配的字段越多越好

most_fields 与下面的bool等价

```plain
GET /titles/_search
{
  "query": {
    "multi_match": {
      "query": "barking dogs",
      "type": "most_fields",
      "fields": [
        "title^10",
        "title.std"
      ]
    }
  }
}
```

+ 与上面的most_fields等价

```plain
GET titles/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "title": {
              "query": "barking dogs",
              "boost": 10
            }
          }
        },
        {
          "match": {
            "title.std": "barking dogs"
          }
        }
      ]
    }
  }
}
```

### cross_fields(混合字段)
+ 含义：跨字段匹配——待查询内容在多个字段中都显示。
+ 类似：bool+dis_max组合。
+ 场景：对人名、地址等信息，需要在多个字段中确定信息，单个字段只能作为整体的一部分。希望在任何这些列出的字段中找到尽可能多的词。

与下面的bool查询逻辑一致

```plain
GET test003/_validate/query?explain=true
{
  "query": {
    "multi_match": {
      "query": "Will Smith",
      "type": "cross_fields",
      "fields": [
        "first_name",
        "last_name"
      ],
      "operator": "and"
    }
  }
}
```

## 参考文档
es全文检索：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/full-text-queries.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/full-text-queries.html)


