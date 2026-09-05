# metric指标聚合

> 分类：ELK Stack / 第5章：ES数据聚合
> 原文：https://www.cuiliangblog.cn/detail/section/82344550
> 来源：崔亮的博客

---

## 分类
metric聚合查询主要分如下两类：

+ 单值分析，只输出一个分析结果

min,max,avg,sum

cardinality

+ 多值分析，输出多个分析结果

stats,extended stats

percentile, percentile rank

## 单值分析
### min（最小值）
+ 返回数值类型字段的最小值

```json
# 获取age字段的最小值
POST query_test/_search
{
  "size": 0, // 不需要返回文档列表
  "aggs": {
    "min_age": { // 自定义聚合分析名称
      "min": { // 聚合关键字
        "field": "age" // 聚合字段
      }
    }
  }
}
# 响应
{
  "took" : 21,
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
    "min_age" : {
      "value" : 2.0
    }
  }
}
```

### max（最大值）
+ 返回数值类字段的最大值

```json
# 获取age字段的最大值
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "max_age": {
      "max": {
        "field": "age"
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
    "max_age" : {
      "value" : 42.0
    }
  }
}
```

### avg（平均值）
```json
# 获取age字段的平均值
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "avg_age": {
      "avg": {
        "field": "age"
      }
    }
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
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "avg_age" : {
      "value" : 22.166666666666668
    }
  }
}
```

### sum（求和）
```json
# 获取age字段的总和
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "sum_age": {
      "sum": {
        "field": "age"
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
    "sum_age" : {
      "value" : 133.0
    }
  }
}
```

### 一次返回多个聚合结果
```json
# 请求
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "min_age":{
      "min": {
        "field": "age"
      }
    },
    "max_age":{
      "max": {
        "field": "age"
      }
    },
    "avg_age":{
      "avg": {
        "field": "age"
      }
    },
    "sum_age": {
      "sum": {
        "field": "age"
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
    "max_age" : {
      "value" : 42.0
    },
    "avg_age" : {
      "value" : 22.166666666666668
    },
    "sum_age" : {
      "value" : 133.0
    },
    "min_age" : {
      "value" : 2.0
    }
  }
}
```

### value_count（计数）
```json
# 获取age字段值个数
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "count_age":{
      "value_count": {
        "field": "age"
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
    "count_age" : {
      "value" : 6
    }
  }
}
```

### cardinality（去重计算）
```json
# 获取city字段不同值的个数
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "cardinality_city":{
      "cardinality": {
        "field": "city.keyword"
      }
    }
  }
}
# 响应
{
  "took" : 22,
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
    "cardinality_city" : {
      "value" : 4
    }
  }
}
```

## 多值分析
### stats（返回数值类型的统计值）
```json
# 获取age字段的统计值，包含min max avg sum和count
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "stats_age":{
      "stats": {
        "field": "age"
      }
    }
  }
}
# 响应
{
  "took" : 13,
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
    "stats_age" : {
      "count" : 6,
      "min" : 2.0,
      "max" : 42.0,
      "avg" : 23.5,
      "sum" : 141.0
    }
  }
}
```

### Extended（stats扩展）
```json
# 获取age字段方差、标准差等值
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "stats_age":{
      "extended_stats": {
        "field": "age"
      }
    }
  }
}
# 响应
{
  "took" : 10,
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
    "stats_age" : {
      "count" : 6,
      "min" : 2.0,
      "max" : 42.0,
      "avg" : 23.5,
      "sum" : 141.0,
      "sum_of_squares" : 4385.0, // 平方和
      "variance" : 178.58333333333334, // 方差
      "variance_population" : 178.58333333333334, 
      "variance_sampling" : 214.3, // 抽样方差
      "std_deviation" : 13.363507523600731, // 标准差
      "std_deviation_population" : 13.363507523600731,
      "std_deviation_sampling" : 14.638989036132243,
      "std_deviation_bounds" : {
        "upper" : 50.22701504720146,
        "lower" : -3.227015047201462,
        "upper_population" : 50.22701504720146,
        "lower_population" : -3.227015047201462,
        "upper_sampling" : 52.77797807226449,
        "lower_sampling" : -5.777978072264485
      }
    }
  }
}
```

### Percentile（百分位）
```json
# 获取age字段百分位
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "per_age":{
      "percentiles": {
        "field": "age"
      }
    }
  }
}
# 响应
{
  "took" : 52,
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
    "per_age" : {
      "values" : {
        "1.0" : 2.0,
        "5.0" : 2.0,
        "25.0" : 12.0,
        "50.0" : 26.0,
        "75.0" : 33.0,
        "95.0" : 42.0,
        "99.0" : 42.0
      }
    }
  }
}

# 获取age字段指定值的百分位
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "per_age":{
      "percentile_ranks": {
        "field": "age",
        "values": [
          10,
          20
          ]
      }
    }
  }
}
# 响应
{
  "took" : 63,
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
    "per_age" : {
      "values" : {
        "10.0" : 21.666666666666668,
        "20.0" : 38.88888888888889
      }
    }
  }
}
```

### Top hits（桶内最匹配的顶部文档列表）
```json
# 先按city分组，获取每组个数
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "citys":{
      "terms": {
        "field": "city.keyword",
        "size": 10
      }
    }
  }
}
# 响应
{
  "took" : 5,
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
      "sum_other_doc_count" : 0,
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
        },
        {
          "key" : "shen zhen",
          "doc_count" : 1
        }
      ]
    }
  }
}
# 先按city分组，取前两个，然后每组按age排序，返回第1个文档详细内容
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "citys": {
      "terms": {
        "field": "city.keyword",
        "size": 2
      },
      "aggs": {
        "top_employee": {
          "top_hits": {
            "size": 1,
            "sort": [
              {
                "age": {
                  "order": "desc"
                }
              }
            ]
          }
        }
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
    "citys" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 2,
      "buckets" : [
        {
          "key" : "bei jing",
          "doc_count" : 2,
          "top_employee" : {
            "hits" : {
              "total" : {
                "value" : 2,
                "relation" : "eq"
              },
              "max_score" : null,
              "hits" : [
                {
                  "_index" : "query_test",
                  "_type" : "_doc",
                  "_id" : "2",
                  "_score" : null,
                  "_source" : {
                    "id" : "2",
                    "name" : "join",
                    "age" : 33,
                    "email" : "test2@163.com",
                    "hobby" : "study sleep eat",
                    "city" : "bei jing"
                  },
                  "sort" : [
                    33
                  ]
                }
              ]
            }
          }
        },
        {
          "key" : "shang hai",
          "doc_count" : 2,
          "top_employee" : {
            "hits" : {
              "total" : {
                "value" : 2,
                "relation" : "eq"
              },
              "max_score" : null,
              "hits" : [
                {
                  "_index" : "query_test",
                  "_type" : "_doc",
                  "_id" : "5",
                  "_score" : null,
                  "_source" : {
                    "id" : "5",
                    "name" : "tory",
                    "age" : 42,
                    "email" : "query_test5@qq.com",
                    "hobby" : "football basketball",
                    "city" : "shang hai"
                  },
                  "sort" : [
                    42
                  ]
                }
              ]
            }
          }
        }
      ]
    }
  }
}
```

## 文档
es metric聚合查询：[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations-metrics.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/search-aggregations-metrics.html)


