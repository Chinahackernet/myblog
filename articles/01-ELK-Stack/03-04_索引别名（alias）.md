# 索引别名（alias）

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/68668990
> 来源：崔亮的博客

---

## 别名
是一个可以指向多个索引的软链

简单而重要的功能，为高级功能，如 rollover、ILM 等提供了实现基础

对使用者屏蔽真实索引，降低心智负担

## 使用场景
假设你首先创建一个包含单个主分片的索引，然后再决定是否需要更多索引容量。 如果你使用原始别名 index，你现在可以将该别名更改为指向另外创建的索引，而无需更改你正在搜索的索引的名称。 

创建不同索引的窗口; 例如，如果你为数据创建每日索引，则可能需要创建一个名为 last-7-days 的别名的上周数据的滑动窗口; 然后每天创建新的每日索引时，可以将其添加到别名中，同时删除8天的索引。

修改了我们的 index 的 mapping，让后通过 reindex API 来把我们的现有的 index 转移到新的 index 上，那么如果在我们的应用中，我们利用 alias 就可以很方便地做这件事。在我们成功转移到新的 index 之后，我们只需要重新定义我们的 alias 指向新的 index，而在我们的客户端代码中，我们一直使用 alias 来访问我们的 index，这样我们的代码不需要任何的改动。

## 别名创建
### 索引配置
```json
# 请求
PUT /test1
{
  "aliases": {
    "my_test": {}
  }
}
# 响应
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "test1"
}
GET /my_test
{
  "test1" : {
    "aliases" : {
      "my_test" : { }
    },
    "mappings" : { },
    "settings" : {
      "index" : {
        "routing" : {
          "allocation" : {
            "include" : {
              "_tier_preference" : "data_content"
            }
          }
        },
        "number_of_shards" : "1",
        "provided_name" : "test1",
        "creation_date" : "1649773015012",
        "number_of_replicas" : "1",
        "uuid" : "GzuByagcR2C922rbpQ4QgQ",
        "version" : {
          "created" : "7130499"
        }
      }
    }
  }
}
```

### alias api配置
<font style="color:rgb(77, 77, 77);">通过alias api操作，在 action 里，我们可以有如下的几种：</font>

+ <font style="color:rgb(51, 51, 51);">add: 添加一个别名</font>
+ <font style="color:rgb(51, 51, 51);">remove: 删除一个别名</font>
+ <font style="color:rgb(51, 51, 51);">remove_index: 删除一个index或它的别名</font>

```json
# 请求
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "test1",
        "alias": "alias1"
      }
    },
    {
      "add": {
        "index": "test2",
        "alias": "alias2"
      }
    }
  ]
}
# 响应
{
  "acknowledged" : true
}
```

### 多个index添加同一个别名
```json
# 指定index名称
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "test1",
        "alias": "alias1"
      }
    },
    {
      "add": {
        "index": "test2",
        "alias": "alias1"
      }
    },
    {
      "add": {
        "index": "test3",
        "alias": "alias1"
      }
    }
  ]
}
# 模糊匹配
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "test*",
        "alias": "all_test_indices"
      }
    }
  ]
}
```

## 别名获取
### 获取所有index别名
```json
# 请求
GET /_alias
# 响应
{
  "myindex_new" : {
    "aliases" : {
      "myindex" : { }
    }
  },
  "test1" : {
    "aliases" : {
      "alias1" : { },
      "my_test" : { }
    }
  },
}
```

### 获取指定别名
```json
# 请求
GET /_alias/myindex
# 响应
{
  "myindex_new" : {
    "aliases" : {
      "myindex" : { }
    }
  }
}
```

### 获取指定index的指定别名
```json
# 请求
GET /test2/_alias/my_test2
# 响应
{
  "test2" : {
    "aliases" : {
      "my_test2" : { }
    }
  }
}
```

## 别名更新
```json
# 重命名一个别名（先删除，后添加）
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "twitter",
        "alias": "alias1"
      }
    },
    {
      "add": {
        "index": "twitter",
        "alias": "alias2"
      }
    }
  ]
}
```

## 别名删除
### URL方式删除
```json
DELETE /myindex_new/_aliases/myindex
```

### alias api删除
```json
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "twitter",
        "alias": "alias1"
      }
    }
  ]
}
```

## 别名映射到指定文档（<font style="color:rgb(79, 79, 79);">Filtered alias</font>）
<font style="color:rgb(77, 77, 77);">带有过滤器的别名提供了创建相同索引的不同“视图”的简单方法。过滤器可以使用查询DSL定义，并应用于所有搜索、计数、按查询删除以及类似于此别名的操作。</font>

+ <font style="color:rgb(77, 77, 77);">设置索引mapping</font>

```json
PUT /test1
{
  "mappings": {
    "_doc": {
      "properties": {
        "user" : {
          "type": "keyword"
        }
      }
    }
  }
}
```

+ <font style="color:rgb(77, 77, 77);">为别名设置过滤器</font>

```json
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "China_Provice_Index",
        "alias": "shanghai_index",
        "filter": {
          "term": {
            "provice": "shanghai"
          }
        }
      }
    },
    {
      "add": {
        "index": "China_Provice_Index",
        "alias": "guangzhou_index",
        "filter": {
          "term": {
            "provice": "guangzhou"
          }
        }
      }
    }
  ]
}
```

通过为China_Provice_Index（中国各省份人才数据库索引）创建别名，shanghai_index、guangzhou_index，这样从两个别名进行数据查询，只会查出各自省份的数据，是不是有点类似于”多租户“，也即通过索引别名并指定过滤器，能为同一个索引提供不同的视图。

## 指定写入索引(<font style="color:rgb(77, 77, 77);">Write Index</font>)
<font style="color:rgb(77, 77, 77);">如果一个别名只映射了一个真实索引，则可以使用别名进行index api(即索引文档，写文档)，但如果一个别名同一时间映射了多个索引，默认是不能直接使用别名进行索引文档，因为ES不知道文档该发往哪个索引。</font>

<font style="color:rgb(77, 77, 77);">使用is_write_index属性为一个别名下的其中一个索引指定为写索引，此时则可以直接使用别名进行index api的调用</font>

```json
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "test",
        "alias": "alias1",
        "is_write_index": true
      }
    },
    {
      "add": {
        "index": "test2",
        "alias": "alias1"
      }
    }
  ]
}
```

## 参考文档
es 索引别名 [https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-aliases.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-aliases.html)


