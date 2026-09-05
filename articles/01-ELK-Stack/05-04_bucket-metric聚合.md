# bucket+metric聚合

> 分类：ELK Stack / 第5章：ES数据聚合
> 原文：https://www.cuiliangblog.cn/detail/section/82344469
> 来源：崔亮的博客

---

Bucket 聚合分析允许通过添加子分析来进一步进行分析，该子分析可以是 Bucket 也可以是 Metric。这也使得

es 的聚合分析能力变得异常强大

## 先分桶再分桶
```json
# 先按city分桶，取前两个，然后每个桶再按age字段分桶统计。
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "citys":{
      "terms": { 
        "field": "city.keyword", 
        "size": 2
      },
      "aggs": {
        "ages": {
          "terms": {
            "field": "age"
          }
        }
      }
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
          "ages" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : 2,
                "doc_count" : 1
              },
              {
                "key" : 33,
                "doc_count" : 1
              }
            ]
          }
        },
        {
          "key" : "shang hai",
          "doc_count" : 2,
          "ages" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : 12,
                "doc_count" : 1
              },
              {
                "key" : 22,
                "doc_count" : 1
              }
            ]
          }
        }
      ]
    }
  }
}
```

## 先分桶再分析
```json
# 先按age字段分桶，然后再分析每个桶的统计值。
POST query_test/_search
{
  "size": 0,
  "aggs": {
    "ages":{
      "terms": { 
        "field": "age", 
        "size": 2
      },
      "aggs": {
        "ages": {
          "stats": {
            "field": "age"
          }
        }
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
    "ages" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 3,
      "buckets" : [
        {
          "key" : 22,
          "doc_count" : 2,
          "ages" : {
            "count" : 2,
            "min" : 22.0,
            "max" : 22.0,
            "avg" : 22.0,
            "sum" : 44.0
          }
        },
        {
          "key" : 2,
          "doc_count" : 1,
          "ages" : {
            "count" : 1,
            "min" : 2.0,
            "max" : 2.0,
            "avg" : 2.0,
            "sum" : 2.0
          }
        }
      ]
    }
  }
}

```


