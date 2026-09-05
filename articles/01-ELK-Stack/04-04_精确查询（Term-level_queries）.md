# 精确查询（Term-level queries）

> 分类：ELK Stack / 第4章：ES数据查询
> 原文：https://www.cuiliangblog.cn/detail/section/76394618
> 来源：崔亮的博客

---

## term查询
### 查询特点
term是代表完全匹配，即不会对查询语句做分词处理，将查询语句作为整个单词进行查询，文档中必须包含整个搜索的词汇

### 注意事项
当字段类型为text时，存储到es后已使用默认分词器进行分词处理保存，避免text类型做term精准匹配时，可使用.keyword类型。

### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
    "term": { # 查询关键词
      "key": "VALUE" # 查询字段：查询值
    }
  }
}
```

### 查询示例
```json
# 精确查询hobby字段值为sleep的文档
GET query_test/_search
{
  "query": {
    "term": {
      "hobby": "sleep"
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
    "max_score" : 1.1704489,
    "hits" : [
      {
        "_index" : "query_test",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.1704489,
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
        "_score" : 1.0054247,
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
# 精确查询hobby字段值为sleep eat的文档
GET query_test/_search
{
  "query": {
    "term": {
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
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}
```

由于建立索引时，hobby字段进行了分词（假定分词后的结果为sleep和eat），当term搜索到sleep或者eat，均可匹配此条数据；但是 "sleep eat" 并不在分词集合中，因此无法匹配该文档

<font style="color:rgb(64, 64, 64);">如果建立索引时，此字段 "无分词"，则完全匹配此字段（如果对于某个字段，你想精确匹配，即搜索什么词匹配什么词）</font>

## <font style="color:rgb(64, 64, 64);">terms查询</font>
### 查询特点
+ <font style="color:rgba(0, 0, 0, 0.75);">查询某个字段里含有多个关键词的文档</font>
+ <font style="color:rgba(0, 0, 0, 0.75);">相对于term来，terms是在针对一个字段包含多个值的时候使用</font>
+ <font style="color:rgba(0, 0, 0, 0.75);">通俗来说就是term查询一次可以匹配一个条件，terms一个可以匹配多个条件</font>

### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
    "terms": { # 查询关键字
      "key": ["value1","vaule2"] # 查询字段名称：[多个查询字段值]
    }
  }
}
```

### 查询示例
```json
# 查询name字段值为alex1和alex2的文档
GET query_test/_search
{
  "query": {
    "terms": {
      "name": ["alex1","alex2"]
    }
  }
}
# 响应
{
  "took" : 8,
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

## exists (是否存在)
### 查询特点
<font style="color:rgb(77, 77, 77);">过滤文档，只查找那些在特定字段有值的文档，注意的是值为""可以查到，值为null查询不到。</font>

### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
     "exists": { # 查询关键字
      "field": "user" # 查询的字段
    }
  }
}
```

### 查询示例
```bash
# 查询name字段有值的文档
GET query_test/_search
{
  "query": {
    "exists": {
      "field": "name"
    }
  }
}
```

## range（区间检索）
### 基本语法
```json
GET query_test/_search # 查询的index
{
  "query": {
    "range": { # 区间查询关键字
      "FIELD": { # 查询字段名
        "gte": 10, # 查询条件
        "lte": 20
      }
    }
  }
}
```

+ gte 大于等于
+ gt 大于
+ lte小于等于
+  lt 小于

### 数字区间查询
+ **查询示例**

```json
# 查询age值大于等于10小于等于20的文档
GET query_test/_search
{
  "query": {
    "range": {
      "age": {
        "gte": 10,
        "lte": 20
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
    "max_score" : 1.0,
    "hits" : [
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
          "hobby" : "sleep eat",
          "birth" : "2010-06-18"
        }
      }
    ]
  }
}
```

### 日期范围查询
elasticsearch针对日期提供了一种更友好的计算方式既可以以当前日期做加减，也可以指定具体的日期。

+ 当前日期为基准：

now+1h：当前时间+1个小时

now-1d：当前时间-1天

now/d：当前时间保留舍入到天

+ 指定日期为基准：

2020-01-01||+1d：2020年1月1日+1天

elasticsearch的日期单位主要有以下几种：

+ y - years
+ M - months
+ w - weeks
+ d - days
+ h - hours
+ m - minutes
+ s - seconds

假设 now 为 2020-01-02 12:00:00，那么如下的计算结果实际为：

| 计算公式 | 实际结果 |
| --- | --- |
| now+1h | 2020-01-02 13:00:00 |
| now-1h | 2020-01-02 11:00:00 |
| now-1h/d | 2020-01-02 00:00:00 |
| 2016-01-01||+1M/d | 2016-02-01 00:00:00 |


+ 查询出生日期大于等于1980年1月1日 小于等于1989年12月31日的记录

```json
# 请求
GET query_test/_search
{
  "query": {
    "range": {
      "birth": {
        "gte": "1980-01-01",
        "lte": "1989-12-31"
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
          "hobby" : "study sleep eat",
          "birth" : "1989-12-12"
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
      }
    ]
  }
}
```

+ 查询10年前出生的记录

```json
# 请求
GET query_test/_search
{
  "query": {
    "range": {
      "birth": {
        "gte": "now-10y"
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
      }
    ]
  }
}
```

### 时间范围查询(带时区)
+ 例如查询指定时间范围指定时区的数据，则查询语句如下，ES会自动进行时区转换：

```json
GET ca_access-2022.09.04/_search
{
  "query": {
    "range": {
      "orig_timestamp": {
        "gte": "2022-09-04T20:33:01.00+08:00",
        "lte": "2022-09-04T20:33:59.00+08:00"
      }
    }
  }
}
```

## 参考文档
es精确查询：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/term-level-queries.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/term-level-queries.html)

## 
## 



