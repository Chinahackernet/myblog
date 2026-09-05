# 索引动态映射（Dynamic Mapping）

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/75877640
> 来源：崔亮的博客

---

## 简介
es 可以自动识别文档字段类型，在插入数据时，不必先创建索引、定义映射类型和定义字段，只需为文档添加索引，类型和字段将自动保存。

## 数据插入与查看mapping
### 数据插入
```bash
# 请求
PUT /test_index/_doc/1
{
  "username":"alfred",
  "age":14,
  "birth":"1988-10-10",
  "married":false,
  "year":"18",
  "tags":["boy","fashion"],
  "money":100.1
}
# 响应
{
  "_index" : "test_index",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}
```

### 查看mapping
```bash
# 请求
GET /test_index/_mapping
# 响应
{
  "test_index" : {
    "mappings" : {
      "properties" : {
        "age" : {
          "type" : "long"
        },
        "birth" : {
          "type" : "date"
        },
        "married" : {
          "type" : "boolean"
        },
        "money" : {
          "type" : "float"
        },
        "tags" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "username" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "year" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}
```

## 支持的字段类型
es 是依靠 JSON 文档的字段类型来实现自动识别字段类型，支持的类型如下

| JSON类型 | ES类型 |
| --- | --- |
| null | 忽略 |
| boolean | boolean |
| 浮点类型 | float |
| 整数 | long |
| object | object |
| array | 由第一个非 null 值的类型决定 |
| string | 匹配为日期则设为 date 类型（默认开启）<br/>匹配为数字的话设为 float 或 long 类型（默认关闭）<br/>设为 text 类型，并附带 keyword 的子字段 |


## Dynamic Templates设定
### 基本格式
```json
PUT my-index-000001/
{
  "mappings": {
    "dynamic_templates": [
      {
        "strings_as_ip": {  # 模板名称
          "match_mapping_type": "string", # 匹配 es 自动识别的字段类型
          "match": "ip*", # 匹配字段名
          "mapping": {
            "type": "ip"
          }
        }
      }
    ]
  }
}
```

### 匹配规则参数
+ match_mapping_type 匹配 es 自动识别的字段类型，如boolean,long,string等
+ match,unmatch 匹配字段名
+ path_match,path_unmatch 匹配路径

### 示例
• 所有以 message 开头的字段都设定为 text 类型，即分词

```json
# 请求
PUT test_index_temp
{
 "mappings": {
    "dynamic_templates": [
      {
        "strings_as_message": {
          "match_mapping_type": "string",
          "match": "message*",
          "mapping": {
            "type": "text"
          }
        }
      }
    ]
  }
}
# 响应
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "test_index_temp"
}
```

+ 验证

```json
# 插入数据
PUT /test_index_temp/_doc/1
{
  "username":"alfred",
  "message":"hello world"
}
# 查看mapping
GET /test_index_temp/_mapping
# 响应
{
  "test_index_temp" : {
    "mappings" : {
      "dynamic_templates" : [
        {
          "strings_as_message" : {
            "match" : "message*",
            "match_mapping_type" : "string",
            "mapping" : {
              "type" : "text"
            }
          }
        }
      ],
      "properties" : {
        "message" : {
          "type" : "text"
        },
        "username" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}
```

## 参考文档
[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/dynamic-mapping.html#dynamic-mapping](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/dynamic-mapping.html#dynamic-mapping)


