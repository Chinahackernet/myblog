# bucket聚合

> 分类：ELK Stack / 第5章：ES数据聚合
> 原文：https://www.cuiliangblog.cn/detail/section/82344473
> 来源：崔亮的博客

---

## 简介
Bucket ，意为桶，即按照一定的规则将文档分配到不同的桶中，达到分类分析的目的，类似MySQL的group by

<font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">桶聚合（bucket aggregation）</font><font style="color:rgb(77, 77, 77);">不像</font><font style="color:rgb(199, 37, 78);background-color:rgb(249, 242, 244);">指标聚合（Metric aggregation）</font><font style="color:rgb(77, 77, 77);">那样计算字段的指标，而是创建文档存储桶。 每个存储桶都与一个标准（取决于聚合类型）相关联，该标准确定当前上下文中的文档是否“落入”其中。 换句话说，存储桶有效地定义了文档集。 除了存储桶本身之外，存储桶聚合还计算并返回落入每个存储桶的文档数量。</font>

按照 Bucket 的分桶策略，常见的 Bucket 聚合分析如下：

+ Terms
+ Range
+ Date Range
+ Histogram
+ Date Histogram

## terms（<font style="color:rgb(68, 68, 68);">按照字段值分桶</font>）
### 基本使用
```json
# 按city分桶，查询每个桶个数
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "citys":{
      "terms": { // 聚合关键词
        "field": "city.keyword", // 指定term字段
        "size": 3 // 返回指定数目
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
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "citys" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 1,
      "buckets" : [
        {
          "key" : "bei jing",
          "doc_count" : 2
        },
        {
          "key" : "shang hai",
          "doc_count" : 2
        },
        {
          "key" : "nan jing",
          "doc_count" : 1
        }
      ]
    }
  }
}
```

### <font style="color:rgb(79, 79, 79);">terms聚合不准确的问题</font>
**误差原因：**

<font style="color:rgb(77, 77, 77);">默认情况下协调节点向目标分片请求它们的Top size个term bucket. 之后每个分片的term bucket都在协调节点上reduce，最终返回给客户端。这种协调节点先请求各自分片的top size词项统计列表，之后再在协调节点上合并最终top size的方式存在误差。</font>

<font style="color:rgb(77, 77, 77);">假设目标索引共三个分片，查询size=5，而其中一个分片由于term项值过小没有排进top5被舍弃，最终导致统计结果偏差。</font>

**<font style="color:rgb(77, 77, 77);">解决方案：</font>**

+ <font style="color:rgb(77, 77, 77);">加大Size参数，size越大，最终结果越准。但是过大的size会增加协调节点合并的压力，并且对于业务上来说，我明明只想要查询TOP5，可我却必须返回TOP100，这会导致不必要的网络传输和数据处理。</font>
+ <font style="color:rgb(77, 77, 77);">不分片，所有数据在一个shard上。这样可以使ES在聚合中使用所有数据，为完全准确。</font>

**反映误差的参数：**

+ doc_count_error_upper_bound 被遗漏的 term 可能的最大值
+ sum_other_doc_count 返回结果 bucket 的 term 外其他 term 的文档总数

## range（按数值范围分桶）
```json
# 分别统计0-20,20-40,40+三个桶的数量
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "age_range":{
      "range": {
        "field": "age",
        "ranges": [
          {
            "to":20
          },
          {
            "from": 20,
            "to":40
          },
          {
            "from": 40
          }
        ]
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
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "age_range" : {
      "buckets" : [
        {
          "key" : "*-20.0",
          "to" : 20.0,
          "doc_count" : 2
        },
        {
          "key" : "20.0-40.0",
          "from" : 20.0,
          "to" : 40.0,
          "doc_count" : 3
        },
        {
          "key" : "40.0-*",
          "from" : 40.0,
          "doc_count" : 1
        }
      ]
    }
  }
}
```

## date range（按日期范围分桶）
```json
# 按1990之前 1990-2010 2010之后分桶聚合。
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "birthday_range": {
      "date_range": {
        "field": "birthday",
        "format": "yyyy",
        "ranges": [
          {
            "to": "1990"
          },
          {
            "from": "1990",
            "to": "2010"
          },
          {
            "from": "2010"
          }
        ]
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
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "birthday_range" : {
      "buckets" : [
        {
          "key" : "*-1990",
          "to" : 6.31152E11,
          "to_as_string" : "1990",
          "doc_count" : 2
        },
        {
          "key" : "1990-2010",
          "from" : 6.31152E11,
          "from_as_string" : "1990",
          "to" : 1.262304E12,
          "to_as_string" : "2010",
          "doc_count" : 2
        },
        {
          "key" : "2010-*",
          "from" : 1.262304E12,
          "from_as_string" : "2010",
          "doc_count" : 2
        }
      ]
    }
  }
}
```

## Historgram（直方图，按固定间隔分割数据）
```json
# age字段，按10为间隔，聚合统计数据
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "age_histogram": {
      "histogram": {
        "field": "age",
        "interval": 10
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
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "age_histogram" : {
      "buckets" : [
        {
          "key" : 0.0,
          "doc_count" : 1
        },
        {
          "key" : 10.0,
          "doc_count" : 1
        },
        {
          "key" : 20.0,
          "doc_count" : 2
        },
        {
          "key" : 30.0,
          "doc_count" : 1
        },
        {
          "key" : 40.0,
          "doc_count" : 1
        }
      ]
    }
  }
}
```

## date historgram（按固定时间间隔分桶）
```json
# 按年为时间间隔分桶，统计每个桶数量
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "birthday_histogram": {
      "date_histogram": {
        "field": "birthday",
        "calendar_interval": "year"
      }
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
      "value" : 6,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "birthday_histogram" : {
      "buckets" : [
        {
          "key_as_string" : "1981-01-01T00:00:00.000Z",
          "key" : 347155200000,
          "doc_count" : 1
        }，
        ………
        {
          "key_as_string" : "2020-01-01T00:00:00.000Z",
          "key" : 1577836800000,
          "doc_count" : 1
        }
      ]
    }
  }
}
```

## 文档
es bucket聚合：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations-bucket.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations-bucket.html)


