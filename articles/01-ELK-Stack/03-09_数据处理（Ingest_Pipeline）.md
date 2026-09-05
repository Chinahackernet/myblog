# 数据处理（Ingest Pipeline）

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/76304999
> 来源：崔亮的博客

---

## Ingest Node（预处理角色的节点）
### 简介
功能上类似 logstash 的 filter，提供 grok、add field、drop field 等 ETL 的能力

是在数据落入 ES 数据节点前的最后一道处理流程

不能像 logstash 一般可以自由定制 input 和 output，相当于只有 logstash filter 的能力，input 和

output 都是 es 自身

+ input 可以理解是 es coordinating 节点
+ output 可以理解是 es data节点

### 使用场景举例
日志数据希望通过 grok 提取部分信息到专用字段里，如 ip statu_code 等

线上索引数据某个字段名设置错了，希望修复为正确的字段名

希望增加一个 ingest_timestamp 记录数据进入 es 的时间

## Pipeline（处理管道）
### 定义
```json
# 请求
PUT _ingest/pipeline/my-pipeline-id
{
  "description": "describe pipeline",
  "processors": [
    {
      "set": {
        "field": "foo",
        "value": "bar"
      }
    }
  ]
}
# 响应
{
  "acknowledged" : true
}
```

### 查看
```json
# 请求
GET _ingest/pipeline/my-pipeline-id
# 响应
{
  "my-pipeline-id" : {
    "description" : "describe pipeline",
    "processors" : [
      {
        "set" : {
          "field" : "foo",
          "value" : "bar"
        }
      }
    ]
  }
}
```

### 使用
Ingest Pipeline 的使用时机是在写入文档的时候

+ create or update

```json
PUT test_pipeline/_doc/1?pipeline=my-pipeline-id
POST /_bulk?pipeline=my-pipeline-id
```

+ index settings

```json
PUT /my_index/_settings
{
  "index" : {
    "default_pipeline" : "my-pipeline-id"
  }
}
```

+ reindex or update by query

```json
POST _reindex
{
  "source": {
    "index": "source"
  },
  "dest": {
    "index": "dest",
    "pipeline": "my-pipeline-id"
  }
}
POST my_index/_update_by_query?pipeline=my-pipeline-id
```

### 调试（Simulate）
```json
POST _ingest/pipeline/_simulate
{
  "pipeline": {
    "description": "_description",
    "processors": [
      {
        "set": {
          "field": "field2",
          "value": "_value"
        }
      }
    ]
  },
  "docs": [
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "foo": "bar"
      }
    }
  ]
}

POST _ingest/pipeline/my_pipeline/_simulate
{
  "docs": [
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "foo": "bar"
      }
    }
  ]
}
```

## 处理器（Processors）
### Date（日期字符串转换为时间戳）
```json
{
	"description": "...",
	"processors": [{
		"date": {
			"field": "initial_date",
			"target_field": "timestamp",
			"formats": ["dd/MM/yyyy hh:mm:ss"],
			"timezone": "Asia/Shanghai"
		}
	}]
}
```

## Gusb（字符串替换）
```bash
{
	"description": "...",
	"processors": [{
		"gsub": {
      "field": "field1",  # 要替换的字段
      "pattern": "\\.",   # 旧字符串
      "replacement": "-"	# 新字符串
  }
	}]
}
```

### Drop（符合条件时丢弃该文档，不入库）
```json
{
	"description": "...",
	"processors": [{
			"drop": {
				"if": "ctx.network_name == 'Guest'"
			}
		},
		{
			"drop": {
				"if": """
            Collection tags = ctx.tags;
            if (tags != null) {
              for (String tag: tags) {
                if (tag.toLowerCase().contains('prod')) {
                  return false;
                }
              }
            }
            return true;
				""
				"
			}
		}
	]
}
```

### Foreach（遍历数组字段的所有值，并做相应的处理）
```json
{
  "description" : "...",
  "processors" : [
    {
    "foreach" : {
      "field" : "values",
      "processor" : {
        "uppercase" : {
          "field" : "_ingest._value"
        }
      }
    }
  ]
}
```

### Grok（从原始内容中匹配部分内容到独立的字段）
```json
{
	"description": "...",
	"processors": [{
			"grok": {
				"field": "message",
				"patterns": ["%{IP:client} %{WORD:method} %{URIPATHPARAM: request} % {NUMBER: bytes} %{NUMBER: duration}"]
				}
			}
	]
}
```

### JSON（json 字符串转成 json 对象）
```json
{
	"description": "...",
	"processors": [{
		"json": {
			"field": "string_source",
			"target_field": "json_target"
		}
	}]
}
```

### Remove（删除指定字段）
```json
{
	"description": "...",
	"processors": [{
		"remove": {
			"field": ["user_agent", "url"]
		}
	}]
}
```

### Rename（重命名指定字段）
```json
{
	"description": "...",
	"processors": [{
		"rename": {
			"field": "provider",
			"target_field": "cloud.provider"
		}
	}]
}
```

### Set（设置字段的值，可以获取现有字段的值来实现拼接等功能）
```json
{
	"description": "...",
	"processors": [{
		"set": {
			"field": "host.os.name",
			"value": "{{os}}"
		}
	}]
}
```

### Script（通过自定义脚本的方式更改相关字段名和字段值）
```json
{
	"description": "...",
	"processors": [{
		"script": {
			"lang": "painless",
			"source": "ctx.field_a_plus_b_times_c = (ctx.field_a + ctx.field_b) * params.param_c",
			"params": {
				"param_c": 10
			}
		}
	}]
}
```

### Split（将字符串分割为数组）
```json
{
	"description": "...",
	"processors": [{
		"split": {
			"field": "my_field",
			"separator": "\\s+"
		}
	}]
}
```

## Pipeline异常处理
处理异常时，默认会停止并退出后续的处理流程

可以通过增加异常捕捉逻辑，增加自定义的处理流程，比如报错的数据写入另一个索引，或者打上另外的标签

+ Processor 级别

```json
{
	"description": "my first pipeline with handled exceptions",
	"processors": [{
		"rename": {
			"field": "foo",
			"target_field": "bar",
			"on_failure": [{
				"set": {
					"field": "error",
					"value": "field \"foo\" does not exist, cannot rename to \"bar\""
				}
			}]
		}
	}]
}
```

+ Pipeline 级别

```json
{
	"description": "my first pipeline with handled exceptions",
	"processors": [...],
	"on_failure": [{
		"set": {
			"field": "_index",
			"value": "failed-{{ _index }}"
		}
	}]
}
```

## 使用举例
### 数据准备
```json
# 请求
PUT test_blogs/_doc/1
{
  "title": "This is the title of the test",
  "tags": "hadoop,elasticsearch,spark",
  "content": "This is the content, hello world"
}
```

### 调试pipeline
+ 使用<font style="color:rgb(64, 64, 64);">_simulate API，将tags字段的值用 "," 分割</font>

```json
# 请求
POST _ingest/pipeline/_simulate
{
  "pipeline": {
    "description": "to split blog tags",
    "processors": [
      {
        "split": {
          "field": "tags",
          "separator": ","
        }
      }
    ]
  },
  "docs": [
    {
      "_index": "index",
      "_id": "1",
      "_source": {
        "title": "Introducing big data......",
        "tags": "hadoop,elasticsearch,spark",
        "content": "You konw, for big data"
      } 
    },
    {
      "_index": "index",
      "_id": "2",
      "_source": {
        "title": "Introducing cloud computering",
        "tags": "openstack,k8s",
        "content": "You konw, for cloud"
      } 
    }
  ]
}
# 响应
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "title" : "Introducing big data......",
          "content" : "You konw, for big data",
          "tags" : [
            "hadoop",
            "elasticsearch",
            "spark"
          ]
        },
        "_ingest" : {
          "timestamp" : "2022-05-07T02:10:20.383939265Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "2",
        "_source" : {
          "title" : "Introducing cloud computering",
          "content" : "You konw, for cloud",
          "tags" : [
            "openstack",
            "k8s"
          ]
        },
        "_ingest" : {
          "timestamp" : "2022-05-07T02:10:20.383959857Z"
        }
      }
    }
  ]
}
```

+ 使用<font style="color:rgb(64, 64, 64);">_simulate API，为文档添加字段 views，并设置默认值 0</font>

```json
# 请求
POST _ingest/pipeline/_simulate
{
  "pipeline": {
    "description": "to split blog tags",
    "processors": [
      {
        "split": {
          "field": "tags",
          "separator": ","
        }
      },
      {
        "set": {
          "field": "views",
          "value": "0"
        }
      }
    ]
  },
  "docs": [
    {
      "_index": "index",
      "_id": "1",
      "_source": {
        "title": "Introducing big data......",
        "tags": "hadoop,elasticsearch,spark",
        "content": "You konw, for big data"
      } 
    },
    {
      "_index": "index",
      "_id": "2",
      "_source": {
        "title": "Introducing cloud computering",
        "tags": "openstack,k8s",
        "content": "You konw, for cloud"
      } 
    }
  ]
}
# 响应
{
  "docs" : [
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "1",
        "_source" : {
          "title" : "Introducing big data......",
          "content" : "You konw, for big data",
          "views" : "0",
          "tags" : [
            "hadoop",
            "elasticsearch",
            "spark"
          ]
        },
        "_ingest" : {
          "timestamp" : "2022-05-07T02:12:55.225191266Z"
        }
      }
    },
    {
      "doc" : {
        "_index" : "index",
        "_type" : "_doc",
        "_id" : "2",
        "_source" : {
          "title" : "Introducing cloud computering",
          "content" : "You konw, for cloud",
          "views" : "0",
          "tags" : [
            "openstack",
            "k8s"
          ]
        },
        "_ingest" : {
          "timestamp" : "2022-05-07T02:12:55.225203122Z"
        }
      }
    }
  ]
}
```

### 添加**<font style="color:rgb(64, 64, 64);">Pipeline</font>**
+ 创建pipeline

```json
# 请求
PUT _ingest/pipeline/blog_pipline
{
  "description": "to split blog tags",
  "processors": [
    {
      "split": {
        "field": "tags",
        "separator": ","
      }
    },
    {
      "set": {
        "field": "views",
        "value": "0"
      }
    }
  ]
}
# 响应
{
  "acknowledged" : true
}
```

+ 查看pipeline

```json
# 请求
GET _ingest/pipeline/blog_pipline
# 响应
{
  "blog_pipline" : {
    "description" : "to split blog tags",
    "processors" : [
      {
        "split" : {
          "field" : "tags",
          "separator" : ","
        }
      },
      {
        "set" : {
          "field" : "views",
          "value" : "0"
        }
      }
    ]
  }
}
```

### 使用pipeline
+ 插入数据时指定pipeline

```json
# 请求
PUT test_blogs/_doc/2?pipeline=blog_pipline
{
  "title": "This is the second title of the test",
  "tags": "k8s,prometheus,elk",
  "content": "This is the second content, hello world"
}
# 查询
GET test_blogs/_doc/2
{
  "_index" : "test_blogs",
  "_type" : "_doc",
  "_id" : "2",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "title" : "This is the second title of the test",
    "content" : "This is the second content, hello world",
    "views" : "0",
    "tags" : [
      "k8s",
      "prometheus",
      "elk"
    ]
  }
}
```

+ 使用pipeline对index重建

```json
# 只对没有 views 字段的文档作用 blog_pipeline
POST test_blogs/_update_by_query?pipeline=blog_pipline
{
  "query": {
    "bool": {
      "must_not": [
        {
          "exists": {
            "field": "views"
          }
        }
      ]
    }
  }
}
# 查看数据
GET test_blogs/_search
{
  "query": {
    "match_all": {}
  }
}
# 响应
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 3,
    "successful" : 3,
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
        "_index" : "test_blogs",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.0,
        "_source" : {
          "title" : "This is the second title of the test",
          "content" : "This is the second content, hello world",
          "views" : "0",
          "tags" : [
            "k8s",
            "prometheus",
            "elk"
          ]
        }
      },
      {
        "_index" : "test_blogs",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "title" : "This is the title of the test",
          "content" : "This is the content, hello world",
          "views" : "0",
          "tags" : [
            "hadoop",
            "elasticsearch",
            "spark"
          ]
        }
      }
    ]
  }
}
```

+ 设置index指定默认pipeline

```json
# 创建index
PUT /my_index
{
  "settings": {
    "index": {
      "default_pipeline": "blog_pipline"
    }
  }
}
# 插入数据
POST _bulk
{"create":{"_index": "my_index","_type": "_doc","_id": "2001"}}
{"title": "title 1","tags": "hadoop,elasticsearch,spark","content": "content 1"}
{"create":{"_index": "my_index","_type": "_doc","_id": "2002"}}
{"title": "title 2","tags": "linux,centos,mysql","content": "content 2"}
{"create":{"_index": "my_index","_type": "_doc","_id": "2003"}}
{"title": "title 3","tags": "nginx,httpd","content": "content 3"}

# 查看数据
GET my_index/_search
{
  "query": {
    "match_all": {}
  }
}
# 响应
{
  "took" : 841,
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
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "my_index",
        "_type" : "_doc",
        "_id" : "2001",
        "_score" : 1.0,
        "_source" : {
          "title" : "title 1",
          "content" : "content 1",
          "views" : "0",
          "tags" : [
            "hadoop",
            "elasticsearch",
            "spark"
          ]
        }
      },
      {
        "_index" : "my_index",
        "_type" : "_doc",
        "_id" : "2002",
        "_score" : 1.0,
        "_source" : {
          "title" : "title 2",
          "content" : "content 2",
          "views" : "0",
          "tags" : [
            "linux",
            "centos",
            "mysql"
          ]
        }
      },
      {
        "_index" : "my_index",
        "_type" : "_doc",
        "_id" : "2003",
        "_score" : 1.0,
        "_source" : {
          "title" : "title 3",
          "content" : "content 3",
          "views" : "0",
          "tags" : [
            "nginx",
            "httpd"
          ]
        }
      }
    ]
  }
}
```

## 参考文档
管道:[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ingest.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/ingest.html)

处理器[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/processors.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/processors.html)




