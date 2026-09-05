# nested

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061471
> 来源：崔亮的博客

---

# mapping+query
## 题目
```json
DELETE phones
PUT phones/_doc/1
{
  "brand": "Samsumg",
  "model": "Galaxy S9+",
  "features": [
    {
      "type": "os",
      "value": "Android"
    },
    {
      "type": "storage",
      "value": "64"
    },
    {
      "type": "camera_resolution",
      "value": "12"
    }
  ]
}
PUT phones/_doc/2
{
  "brand": "Apple",
  "model": "iPhone XR",
  "features": [
    {
      "type": "os",
      "value": "Apple 10s"
    },
    {
      "type": "storage",
      "value": "128"
    },
    {
      "type": "camera_resolution",
      "value": "12"
    }
  ]
}
GET /phones/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "features.type": "storage"
          }
        },
        {
          "match": {
            "features.value": "12"
          }
        }
      ]
    }
  }
}
# 插入两条数据，然后搜索features.type = "storage" 并且"features.value": "12"的文档(期望结果是搜不到，解决这个问题)

```

## 答案
```json
GET phones/_mapping
PUT task10
{
  "mappings": {
    "properties": {
      "brand": {
        "type": "text"
      },
      "model": {
        "type": "text"
      },
      "features": {
        "type": "nested",
        "properties": {
          "os": {
            "type": "text"
          },
          "type": {
            "type": "text"
          },
          "value": {
            "type": "text"
          }
        }
      }
    }
  }
}
PUT task10/_doc/1
{
  "brand": "Samsumg",
  "model": "Galaxy S9+",
  "features": [
    {
      "type": "os",
      "value": "Android"
    },
    {
      "type": "storage",
      "value": "64"
    },
    {
      "type": "camera_resolution",
      "value": "12"
    }
  ]
}
PUT task10/_doc/2
{
  "brand": "Apple",
  "model": "iPhone XR",
  "features": [
    {
      "type": "os",
      "value": "Apple 10s"
    },
    {
      "type": "storage",
      "value": "128"
    },
    {
      "type": "camera_resolution",
      "value": "12"
    }
  ]
}

POST task10/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "features.type": "storage"
          }
        },
        {
          "match": {
            "features.value": "12"
          }
        }
      ]
    }
  }
}
```

# nested+aggs
## 题目
**对**my_test_nested进行检索，查询出版日期(pub_date)在2021年11月期间的文档，按照作者的姓氏分桶，统计每个姓氏的书籍总量，并找出书籍最多的姓氏

```json
PUT /my_test_nested
{
  "settings": {
    "number_of_replicas": 0,
    "number_of_shards": 1
  },
  "mappings": {
    "properties": {
      "bookname":{
        "type": "keyword"
      },
      "pub_date":{
        "type": "date"
      },
      "price":{
        "type":"float"
      },
      "user":{
        "type": "nested",
        "properties": {
          "firstname":{
            "type":"keyword"
          },
          "lastname":{
            "type":"keyword"
          },
          "birth":{
            "type":"date"
          },
          "bookcount":{
            "type":"integer"
          }
        }
      }
    }
  }
}

PUT my_test_nested/_bulk
{"index":{"_id":1}}
{"bookname":"elasticsearch","pub_date":"2021-12-01","price":"120","user":[{"firstname":"chen","lastname":"qingfeng","birth":"1990-01-02", "bookcount":"2"},{"firstname":"liu","lastname":"dewen","birth":"1990-03-01", "bookcount":"3"},{"firstname":"zhen","lastname":"liming","birth":"1990-05-01", "bookcount":"4"}]}
{"index":{"_id":2}}
{"bookname":"elasticsearch","pub_date":"2021-11-02","price":"100","user":[{"firstname":"chen","lastname":"qingfeng","birth":"1990-01-02", "bookcount":"2"},{"firstname":"chen","lastname":"yunpeng","birth":"1990-08-01", "bookcount":"4"},{"firstname":"du","lastname":"wei","birth":"1990-06-01", "bookcount":"4"}]}
```

## 答案
```json
GET my_test_nested/_search
{
  "query": {
    "range": {
      "pub_date": {
        "gte": "2021-11-01",
        "lte": "2021-11-31"
      }
    }
  },
  "aggs": {
    "nested_aggs": {
      "nested": {
        "path": "user"
      },
      "aggs": {
        "bucket_user": {
          "terms": {
            "field": "user.firstname"
          },
          "aggs": {
            "sum_bookcount": {
              "sum": {
                "field": "user.bookcount"
              }
            }
          }
        },
        "max_user_bookcount":{
          "max_bucket": {
            "buckets_path": "bucket_user>sum_bookcount"
          }
        }
      }
    }
  }
}
```

## 

