# 组件模板(component_templates)

> 分类：ELK Stack / 第3章：ES数据增删改查
> 原文：https://www.cuiliangblog.cn/detail/section/136806529
> 来源：崔亮的博客

---

# 模板
索引模板（Index template）是一种告诉 Elasticsearch 在创建索引时如何配置索引的方法。 对于数据流（data stream），索引模板会在创建流时支持其后备索引。 在创建索引之前先配置模板，然后在手动创建索引或通过对文档建立索引创建索引时，模板设置将用作创建索引的基础。

模板有两种类型：索引模板和组件模板。 组件模板是可重用的构建块，用于配置映射，设置和别名。 你使用组件模板来构造索引模板，但它们不会直接应用于一组索引。 索引模板可以包含组件模板的集合，也可以直接指定设置，映射和别名。

![](assets/01-ELK-Stack/f31f2f1eac95430ec212.png)

如上图所示，索引模板 A 和 C 和 D 在它们之间共享组件模板（例如，所有三个索引模板都使用组件模板 2）。 索引模板 2 是一个独立的模板，它不包含任何组件模板。 我们可以创建一个没有组件模板的索引模板。 这给我们带来了创建模板时的某些规则：

使用配置创建的索引显式优先于索引或组件模板中定义的配置。 这意味着如果你使用显式设置创建索引，不要期望它们被模板覆盖。

旧模板的优先级低于可组合模板。

如果新数据流或索引与多个索引模板匹配，则使用优先级最高的索引模板。

# 创建可组合的 index template
下面，我们来使用一个例子来展示如何使用可组合的 index template。

## 创建两个组件模板
```bash
PUT _component_template/component_template1
{
  "template": {
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        }
      }
    }
  }
}
 
PUT _component_template/other_component_template
{
  "template": {
    "mappings": {
      "properties": {
        "ip_address": {
          "type": "ip"
        }
      }
    }
  }
}
```

在上面，我们定义了 component_template1 以及 other_component_template 两个组合模板。我们运用上面的两个 component template 来组合一个 index tempate。 这两个 component template 分别定义了一个 index template 的其中的一部分字段。

## 创建index template
```bash
PUT _index_template/template_1
{
  "index_patterns": ["te*", "bar*"],
  "template": {
    "settings": {
      "number_of_shards": 1
    },
    "mappings": {
      "_source": {
        "enabled": false
      },
      "properties": {
        "host_name": {
          "type": "keyword"
        },
        "created_at": {
          "type": "date",
          "format": "EEE MMM dd HH:mm:ss Z yyyy"
        }
      }
    },
    "aliases": {
      "mydata": { }
    }
  },
  "priority": 200,
  "composed_of": ["component_template1", "other_component_template"],
  "version": 3,
  "_meta": {
    "description": "my custom"
  }
}
```

在上面，请注意这个部分：

"composed_of": ["component_template1", "other_component_template"],

也就是说这个叫做 template_1 的 index template，它包含了两个可组合的 component templates：component_template 及 other_component_template。

## 创建索引
在上面，我们定义了以 te 和 bar 开头的索引所应该具有的 index template。我们在 Kibana 中创建一个叫做 test 的索引：

```bash
PUT test
```

我们可以通过如下的命令来进行检查：

```bash
GET test
```

上面的命令的响应如下：

```bash
{
  "test" : {
    "aliases" : {
      "mydata" : { }
    },
    "mappings" : {
      "_source" : {
        "enabled" : false
      },
      "properties" : {
        "@timestamp" : {
          "type" : "date"
        },
        "created_at" : {
          "type" : "date",
          "format" : "EEE MMM dd HH:mm:ss Z yyyy"
        },
        "host_name" : {
          "type" : "keyword"
        },
        "ip_address" : {
          "type" : "ip"
        }
      }
    },
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
        "provided_name" : "test",
        "creation_date" : "1612751497863",
        "number_of_replicas" : "1",
        "uuid" : "ki41iwTGR66yxkLBLCi80Q",
        "version" : {
          "created" : "7100099"
        }
      }
    }
  }
}
```

显然 test 索引它具有我们先前在两个 component template 里具有的 mapping。

# 模拟多组件模板
由于模板不仅可以由多个组件模板组成，还可以由索引模板本身组成，因此有两个模拟API可以确定最终的索引设置是什么。

## 模拟将应用于特定索引名称的设置
```bash
POST /_index_template/_simulate_index/test
```

我们将看到如下的输出：

```bash
{
  "template" : {
    "settings" : {
      "index" : {
        "number_of_shards" : "1"
      }
    },
    "mappings" : {
      "_source" : {
        "enabled" : false
      },
      "properties" : {
        "@timestamp" : {
          "type" : "date"
        },
        "created_at" : {
          "type" : "date",
          "format" : "EEE MMM dd HH:mm:ss Z yyyy"
        },
        "host_name" : {
          "type" : "keyword"
        },
        "ip_address" : {
          "type" : "ip"
        }
      }
    },
    "aliases" : {
      "mydata" : { }
    }
  },
  "overlapping" : [ ]
}
```

## 模拟将从现有模板中应用的设置
```bash
POST /_index_template/_simulate/template_1
```

在上面的练习中，我们已经创建了 template_1 的模板。上面命令的输出为：

```bash
{
  "template" : {
    "settings" : {
      "index" : {
        "number_of_shards" : "1"
      }
    },
    "mappings" : {
      "_source" : {
        "enabled" : false
      },
      "properties" : {
        "@timestamp" : {
          "type" : "date"
        },
        "created_at" : {
          "type" : "date",
          "format" : "EEE MMM dd HH:mm:ss Z yyyy"
        },
        "host_name" : {
          "type" : "keyword"
        },
        "ip_address" : {
          "type" : "ip"
        }
      }
    },
    "aliases" : {
      "mydata" : { }
    }
  },
  "overlapping" : [ ]
}
```

## 在模拟请求中指定模板定义
你也可以在模拟请求中指定模板定义。 这样，你可以在添加新模板之前验证设置是否将按预期应用。

```bash
PUT /_component_template/ct1
{
  "template": {
    "settings": {
      "index.number_of_shards": 2
    }
  }
}
 
PUT /_component_template/ct2
{
  "template": {
    "settings": {
      "index.number_of_replicas": 0
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        }
      }
    }
  }
}
```

在上面我们定义了两个 component template。我们在一下的命令中来模拟一下这个模板：

```bash
POST /_index_template/_simulate
{
  "index_patterns": ["my*"],
  "template": {
    "settings" : {
        "index.number_of_shards" : 3
    }
  },
  "composed_of": ["ct1", "ct2"]
}
```

上面的命令输出为：

```bash
{
  "template" : {
    "settings" : {
      "index" : {
        "number_of_shards" : "3",
        "number_of_replicas" : "0"
      }
    },
    "mappings" : {
      "properties" : {
        "@timestamp" : {
          "type" : "date"
        }
      }
    },
    "aliases" : { }
  },
  "overlapping" : [ ]
}
```

该响应显示将应用于匹配索引的 settings，mappings 和 aliases，以及任何配置将被模拟模板主体或更高优先级模板取代的重叠模板。

# 使用Kibana创建index template
在上面，我们使用了命令行来创建可组合 index template。在这节里，我们使用 Kibana 来创建我们的可组合 index template。

我们打开 Kinana 界面：

![](assets/01-ELK-Stack/1c1da33f43ccf9b25d2e.png)

我们向下滚动，你就可以发现我们在上面已经创建好的 template_1 index template:

![](assets/01-ELK-Stack/42e55bdd2452451ea2b3.png)

从上面我们可以看出来 template_1 有两个 component template 组成的。

接下来，我们来创建一个新的 index template。

## 创建 component template
![](assets/01-ELK-Stack/49cbcf5a74a806bb731b.png)

![](assets/01-ELK-Stack/9163b0254134efff27ba.png)

![](assets/01-ELK-Stack/d7dde55c35042817d169.png)

在这个 template 里，我们只配置一个如上的设置。

![](assets/01-ELK-Stack/136dfcf4bd454586bd45.png)

在之后的设置中，我们一直点击 Next 按钮，并不做任何的设置，直到保存。

![](assets/01-ELK-Stack/423819e298ea40b7f44a.png)

这样我们就创建了一个叫做 component_temp1 的模板。

我们接下来创建另外一个叫做 component_temp2 的模板：

![](assets/01-ELK-Stack/0f65841ea0ca74e7489d.png)

![](assets/01-ELK-Stack/bb99fa738e058080116d.png)

在上面，我们定义了一个叫做 ip_address 的字段，并定义了它的数据类型 IP。

![](assets/01-ELK-Stack/31595a5a8f8c272d12d3.png)

这样我们就生产了一个叫做 component_temp2 的模板。

## 创建index template
我们接下来创建一个叫做 template2 的 index template:

![](assets/01-ELK-Stack/d9a0a08bbc85ee9b25ae.png)

![](assets/01-ELK-Stack/d0ea1cbcd8cf9e737fbe.png)

在上面，我们定义了 index pattern: "good-*"。

![](assets/01-ELK-Stack/585d0a4807c3c92d0b95.png)

在上面，我们选中已经创建好的 component template:

![](assets/01-ELK-Stack/a7fbef3d4b37cc965860.png)

这样就创建了叫做 template2 的 index template。

![](assets/01-ELK-Stack/0ce1c56810f9149131c4.png)

## 测试
我们可以直接在 Kibana 的 console 中进行如下的测试：

```bash
PUT good-morning
```

我们通过如下的方式来进行检查：

```bash
GET good-morning
```

上面的命令显示的结果为：

```bash
{
  "good-morning" : {
    "aliases" : { },
    "mappings" : {
      "properties" : {
        "ip_address" : {
          "type" : "ip"
        }
      }
    },
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
        "auto_expand_replicas" : "0-2",
        "provided_name" : "good-morning",
        "creation_date" : "1612755833290",
        "number_of_replicas" : "0",
        "uuid" : "8AHF5hl_QU6euyqaKgn2hg",
        "version" : {
          "created" : "7100099"
        }
      }
    }
  }
}
```

从上面的显示中，我们可以看出来 ip_address 字段以及 auto_expand_replicas 都是我们之前在 component_temp1 以及 component_temp2 里所定义的。

# 参考文档
[https://www.elastic.co/guide/en/elasticsearch/reference/8.8/indices-component-template.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.8/indices-component-template.html)


