# 异步检索(Async search)

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/84295988
> 来源：崔亮的博客

---

## 异步搜索简介
### 异步搜索定义
异步搜索 API 可让您异步执行搜索请求、监控其进度并检索可用的部分结果。

### 异步搜索适用场景
异步搜索允许用户在异步搜索结果可用时检索它们，从而消除了仅在查询完全完成后才等待最终响应的情况。

## 异步搜索实战
### 执行异步检索


```plain
POST test_data/_async_search?size=0
{
  "sort": [
    {
      "last_updated": {
        "order": "asc"
      }
    }
  ],
  "aggs": {
    "sale_date": {
      "date_histogram": {
        "field": "last_updated",
        "calendar_interval": "1d"
      }
    }
  }
}
```

返回结果如下：

```plain
{
  "id" : "FjUxQURkZFZyUVVlUUNydjVSZXhmWGcedFJCVnRVSVhSdVM0emN2YXZfTU9ZQToyNzE3MTcy",
  "is_partial" : true,
  "is_running" : true,
  "start_time_in_millis" : 1628662256012,
  "expiration_time_in_millis" : 1629094256012,
  "response" : {
    "took" : 1008,
    "timed_out" : false,
    "terminated_early" : false,
    "num_reduce_phases" : 0,
    "_shards" : {
      "total" : 1,
      "successful" : 0,
      "skipped" : 0,
      "failed" : 0
    },
    "hits" : {
      "total" : {
        "value" : 0,
        "relation" : "gte"
      },
      "max_score" : null,
      "hits" : [ ]
    }
  }
}
```

核心返回参数解释一下：

+  id代表：可用于监控其进度、检索其结果和/或删除它的异步搜索的标识符。 
+  is_partial：当查询不再运行时，指示在所有分片上搜索是失败还是成功完成。 在执行查询时，is_partial 始终设置为 true。 
+  is_running：搜索是否仍在执行中或已完成。 
+  total：总体而言，将在多少个分片上执行搜索。 
+  successful：有多少分片已成功完成搜索。 

### 查看异步检索
```plain
GET /_async_search/FjFoeU8xMHJKUW9pd1dzN1g2Rm9wOGcedFJCVnRVSVhSdVM0emN2YXZfTU9ZQToyNjYyNjk5
```

### 查看异步检索状态
```plain
GET /_async_search/status/FjUxQURkZFZyUVVlUUNydjVSZXhmWGcedFJCVnRVSVhSdVM0emN2YXZfTU9ZQToyNzE3MTcy/
```

### 删除/中止异步执行
```plain
DELETE /_async_search/FjFoeU8xMHJKUW9pd1dzN1g2Rm9wOGcedFJCVnRVSVhSdVM0emN2YXZfTU9ZQToyNjYyNjk5
```

## 官方文档地址
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/async-search.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/async-search.html)


