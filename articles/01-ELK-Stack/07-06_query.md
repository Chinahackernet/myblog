# query

> 分类：ELK Stack / 第7章：ECE认证
> 原文：https://www.cuiliangblog.cn/detail/section/133061467
> 来源：崔亮的博客

---

# <font style="color:rgb(48, 49, 51);">注意点</font>
**<font style="color:rgb(48, 49, 51);">提高评分</font>**<font style="color:rgb(48, 49, 51);">：主要考boost和function_score，如果题目明确说某个字段权重为X值时使用boost，如果题目说如果有，提分，没有不变的话，用function_score</font>

# <font style="color:rgb(48, 49, 51);">functions自定义评分</font>
## <font style="color:rgb(48, 49, 51);">题目</font>
1. <font style="color:rgb(48, 49, 51);">在title中包含“my”或者“me”。</font>
2. <font style="color:rgb(48, 49, 51);">如果在tags中包含"romatic movies"，该条算分提高，如果不包含则算分不变</font>

```plain
DELETE movie-1
PUT movie-1
{
  "mappings": {
    "properties": {
      "title":{
        "type":"text"
      },
      "tags":{
        "type": "keyword"
      }
    }
  }
}

POST movie-1/_doc/1
{"title":"my me", "tags":["romatic movies"]}
```

## <font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET movie-1/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "title": "my"
          }
        },
        {
          "match": {
            "title": "me"
          }
        }
      ],
      "filter": {
        "term" : { "tags" : "romatic movies" }
      }
    }
  }
}
GET movie-1/_search
{
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "should": [
            {
              "match": {
                "title": "my"
              }
            },
            {
              "match": {
                "title": "me"
              }
            }
          ]
        }
      },
      "functions": [
        {
          "filter": {
            "term": {
              "tags": "romatic movies"
            }
          },
          "weight": 5
        }
      ]
    }
  }
}
```



# <font style="color:rgb(48, 49, 51);">boost提升评分</font>
## <font style="color:rgb(48, 49, 51);">题目</font>
<font style="color:rgb(48, 49, 51);">a字段必须包含action，c字段必须包含good, b字段包含另elasticsearch时可以提升score(不要求c必须包含):</font>

```plain
DELETE my_test_match3
PUT /my_test_match3
{
  "settings": {
    "number_of_replicas": 0,
    "number_of_shards": 1
  },
  "mappings": {
    "properties": {
      "a":{
        "type":"text"
      },
      "b":{
        "type": "text"
      },
      "c":{
        "type": "text"
      }
    }
  }
}

POST my_test_match3/_bulk
{"index":{"_id":1}}
{"a":"elasticsearch in action","b":"elasticsearch good", "c":"very good"}
{"index":{"_id":2}}
{"a":"kibana in action","b":"kibana good", "c":"very good"}
```

## <font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET my_test_match3/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "a": "action"
          }
        },
        {
          "match": {
            "c": "good"
          }
        }
      ],
      "should": [
        {
          "match": {
            "b": {
              "boost": 10,
              "query": "elasticsearch"
            }
          }
        }
      ]
    }
  }
}
```

# <font style="color:rgb(48, 49, 51);">multi_match</font>
## <font style="color:rgb(48, 49, 51);">题目</font>
<font style="color:rgb(48, 49, 51);">有一索引有3个字段，请写一个查询去匹配"fielda",“fieldb”,"fieldc"这三个字段，其中fieldc字段权重为2,并且将他们的分数相加作为最后的总分数</font>

```plain
PUT task4
{
  "mappings": {
    "properties": {
      "fielda":{
        "type": "text"
      },
      "fieldb":{
        "type": "text"
      },
      "fieldc":{
        "type": "text"
      }
    }
  }
}
PUT task4/_doc/1
{
  "fielda":"elasticsearch in action",
  "fieldb":"kibana in action",
  "fieldc":"logstash in action"
}
```

## <font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET task6/_search
{
  "query": {
    "multi_match" : {
      "query":      "action",
      "type":       "most_fields",
      "fields":     ["fielda","fieldb","fieldc^2"]
    }
  }
}
```

# <font style="color:rgb(48, 49, 51);">search template</font>
## <font style="color:rgb(48, 49, 51);">题目</font>
<font style="color:rgb(48, 49, 51);">使用a_01参数查询a字段  
</font><font style="color:rgb(48, 49, 51);">使用start_date和end_date参数范围查询timestamp字段  
</font><font style="color:rgb(48, 49, 51);">如果没有提供end_date参数，那么结束时间默认是现在  
</font><font style="color:rgb(48, 49, 51);">查询结果中b字段必须"active",  
</font><font style="color:rgb(48, 49, 51);">查询2018年6月1日到现在的数据，a字段包含关键字’aaa’</font>

```plain
DELETE task9
PUT task9
{
  "mappings": {
    "properties": {
      "a":{
        "type": "text"
      },
      "b":{
        "type": "keyword"
      },
      "timestamp":{
        "type": "date"
      }
    }
  }
}
POST task9/_bulk
{"index":{"_id":1}}
{"a":"aaa AAA", "b":"b", "timestamp":"2021-11-11T11:21:21.000Z"}
{"index":{"_id":2}}
{"a":"aaa AAA", "b":"active", "timestamp":"2020-11-11T11:21:21.000Z"}
```

## <font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET task9/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "match": {
            "a": "aaa"
          }
        },
        {
          "range": {
            "timestamp": {
              "gte": "2018-06-01",
              "lte": "now"
            }
          }
        }
      ],
      "must": {
        "term": {
          "b": "active"
        }
      }
    }
  }
}

PUT _scripts/my-search-template-9
{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "bool": {
          "filter": [
            {
              "match": {
                "a": "{{a_01}}"
              }
            },
            {
              "range": {
                "timestamp": {
                  "gte": "{{start_date}}",
                  "lte": "{{end_date}}{{^end_date}}now{{/end_date}}"
                }
              }
            }
          ],
          "must": {
            "term": {
              "b": "active"
            }
          }
        }
      }
    }
  }
}
POST _render/template
{
  "id": "my-search-template-9",
  "params": {
    "a_01":"aaa",
    "start_date": "2018-06-01"
  }
}
GET task9/_search/template
{
  "id": "my-search-template-9",
  "params": {
    "a_01":"aaa",
    "start_date": "2018-06-01"
  }
}
```

## <font style="color:rgb(144, 147, 153);background-color:rgb(246, 248, 250);"></font><font style="color:rgb(48, 49, 51);">题目</font>
<font style="color:rgb(48, 49, 51);">定义一个搜索模板，使用a参数查询extension字段，然后对extension字段用标签高亮，然后按bytes倒排</font>

```plain
DELETE task10
PUT task10
{
  "mappings": {
    "properties": {
      "extension":{
        "type": "text"
      },
      "bytes":{
        "type": "double"
      }
    }
  }
}
POST task10/_bulk
{"index":{"_id":1}}
{"extension":"aaa AAA","bytes":3.14}
{"index":{"_id":2}}
{"extension":"active AAA","bytes":9.88}
```

## <font style="color:rgb(144, 147, 153);background-color:rgb(246, 248, 250);"></font><font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET task10/_search
{
  "query": {
    "match": {
      "extension": "AAA"
    }
  },
  "highlight": {
    "pre_tags": [
      "<em>"
    ],
    "post_tags": [
      "</em>"
    ],
    "fields": {
      "extension": {}
    }
  },
  "sort": [
    {
      "bytes": "desc"
    }
  ]
}
PUT _scripts/my-search-template
{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "match": {
          "extension": "{{a}}"
        }
      },
      "highlight": {
        "pre_tags": [
          "<em>"
        ],
        "post_tags": [
          "</em>"
        ],
        "fields": {
          "extension": {}
        }
      },
      "sort": [
        {
          "bytes": "desc"
        }
      ]
    }
  }
}

POST _render/template
{
  "id": "my-search-template",
  "params": {
    "a": "AAA"
  }
}

GET task10/_search/template
{
  "id": "my-search-template",
  "params": {
    "a": "AAA"
  }
}
```

# <font style="color:rgb(48, 49, 51);">bool</font>
## <font style="color:rgb(48, 49, 51);">题目</font>
<font style="color:rgb(48, 49, 51);">三个字段manufacturer, name, brand任意能搜索到"cake",  
</font><font style="color:rgb(48, 49, 51);">highlight某个字段name，加__标签  
</font><font style="color:rgb(48, 49, 51);">sort某个字段brand正序，_score降序,返回20个文档</font>

```plain
PUT food_ingredient
{
  "mappings": {
    "properties": {
      "manufacturer":{
        "type": "text"
      },
      "name":{
        "type": "text"
      },
      "brand":{
        "type": "keyword"
      }
    }
  }
}

POST food_ingredient/_bulk
{"index":{"_id":1}}
{"manufacturer":"cake mix","name":"cake","brand":"mix"}
{"index":{"_id":2}}
{"manufacturer":"text tom","name":"text","brand":"tom"}
{"index":{"_id":3}}
{"manufacturer":"cake1 mix","name":"cake1","brand":"mix1"}
{"index":{"_id":4}}
{"manufacturer":"text1 tom","name":"text1","brand":"tom1"}
{"index":{"_id":5}}
{"manufacturer":"cake mix","name":"cake","brand":"mix"}
{"index":{"_id":6}}
{"manufacturer":"text tom","name":"text","brand":"tom"}
{"index":{"_id":7}}
{"manufacturer":"cake2 mix","name":"cake1","brand":"mix1"}
{"index":{"_id":8}}
{"manufacturer":"cake mix","name":"cake","brand":"cake"}
```

## <font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET food_ingredient/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "manufacturer": "cake"
          }
        },
        {
          "match": {
            "name": "cake"
          }
        },
        {
          "match": {
            "brand": "cake"
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "name": {
        "pre_tags": ["<em>"],
        "post_tags": ["</em>"]
      }
    }
  },
  "sort": [
    {
      "brand.keyword": "desc"
    },
    {
      "_score": "asc"
    }
  ],
  "size": 20
}
```

# <font style="color:rgb(48, 49, 51);">match_prase</font>
使用搜索模板，使用a_01参数查询a字段短语匹配到"in action",  
高亮a字段，加__标签  
b字段降序

## <font style="color:rgb(48, 49, 51);">题目</font>
```plain
PUT task7
{
  "settings": {
    "number_of_replicas": 0,
    "number_of_shards": 1
  },
  "mappings": {
    "properties": {
      "a":{
        "type": "text"
      },
      "b":{
        "type": "integer"
      }
    }
  }
}

PUT task7/_bulk
{"index":{"_id":1}}
{"a":"elasticsearch in action", "b":1}
{"index":{"_id":2}}
{"a":"kibana in action", "b":2}
{"index":{"_id":3}}
{"a":"in filebeat action", "b":3}
```

## <font style="color:rgb(48, 49, 51);">答案</font>
```plain
GET task7/_search
{
  "query": {
    "match_phrase": {
      "a": "in action"
    }
  },
  "highlight": {
    "fields": {
      "a": {
        "pre_tags": [
          "<strong>"
        ],
        "post_tags": [
          "</strong>"
        ]
      }
    }
  },
  "sort" : [
    { "b" : "desc" }
  ]
}

PUT _scripts/my-search-template
{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "match_phrase": {
          "a": "{{a_01}}"
        }
      },
      "highlight": {
        "fields": {
          "a": {
            "pre_tags": [
              "<strong>"
            ],
            "post_tags": [
              "</strong>"
            ]
          }
        }
      },
      "sort": [
        {
          "b": "desc"
        }
      ]
    }
  }
}

POST _render/template
{
  "id": "my-search-template",
  "params": {
    "a_01": "in action"
  }
}

GET task7/_search/template
{
  "id": "my-search-template",
  "params": {
    "a_01": "in action"
  }
}
```


