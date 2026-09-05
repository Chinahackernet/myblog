# 分词器（analysis）

> 分类：ELK Stack / 第2章：ES数据建模
> 原文：https://www.cuiliangblog.cn/detail/section/68433044
> 来源：崔亮的博客

---

## 内置分词器
### 常用分词器
+ Standard Analyzer——默认分词器，按词切分，小写处理
+ Simple Analyzer——按照非字母切分（符号被过滤），小写处理
+ Stop Analyzer——小写处理，停用词过滤(the,a,is)
+ Whitespace Analyzer——按照空格切分，不转小写
+ Keyword Analyze——不分词，直接将输入当作输出
+ Patter Analyzer——正则表达式，默认\W+(非字符分隔)
+ Language——提供了30多种常见语言的分词器
+ Customer Analyzer——自定义分词器

## 中文分词
1. 常用中文分词器，IK、jieba、THULAC等，推荐使用IK分词器。
2. IK分词器 Elasticsearch插件地址：[https://github.com/medcl/elasticsearch-analysis-ik](https://github.com/medcl/elasticsearch-analysis-ik)
3. 部署安装lk分词器：将下载到的elasticsearch-analysis-ik解压到/usr/share/elasticsearch/plugins/ik目录下，然后重启elasticsearch即可。
+ 示例：使用ik分词器对“听音乐”分词

```json
POST /_analyze
{
	"analyzer": "ik_max_word",
	"text": "听音乐"
}	
# 响应
{
  "tokens" : [
    {
      "token" : "听音乐",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "CN_WORD",
      "position" : 0
    },
    {
      "token" : "听音",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "CN_WORD",
      "position" : 1
    },
    {
      "token" : "音乐",
      "start_offset" : 1,
      "end_offset" : 3,
      "type" : "CN_WORD",
      "position" : 2
    }
  ]
}
```

## 自定义分词器
当自带的分词无法满足需求时，可以自定义分词

通过自定义 Character Filters、Tokenizer 和 Token Filter 实现

### Character Filters
**在 Tokenizer 之前对原始文本进行处理，比如增加、删除或替换字符等**

自带的如下：

+ HTML Strip 去除 html 标签和转换 html 实体
+ Mapping 进行字符替换操作
+ Pattern Replace 进行正则匹配替换

会影响后续 tokenizer 解析的 postion 和 offset 信息

使用HTML Strip测试

```json
POST /_analyze
{
  "tokenizer": "keyword", // keyword类型的tokenizer可以直接看到输出结果
  "char_filter": ["html_strip"], // 指明使用HTML Strip
  "text": "<p>very<br><span></span>good</p>"
}
# 响应
{
  "tokens" : [
    {
      "token" : """
very
good
""",
      "start_offset" : 0,
      "end_offset" : 32,
      "type" : "word",
      "position" : 0
    }
  ]
}
```

### Tokenizer
**将原始文本按照一定规则切分为单词（term or token）**

自带的如下：

+ standard 按照单词进行分割
+ letter 按照非字符类进行分割
+ whitespace 按照空格进行分割
+ UAX URL Email 按照 standard 分割，但不会分割邮箱和 url
+ NGram 和 Edge NGram 连词分割
+ Path Hierarchy 按照文件路径进行切割

使用Path Hierarchy测试

```json
POST /_analyze
{
  "tokenizer": "path_hierarchy",
  "text": "/var/lib/elasticsearch"
}
# 响应
{
  "tokens" : [
    {
      "token" : "/var",
      "start_offset" : 0,
      "end_offset" : 4,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "/var/lib",
      "start_offset" : 0,
      "end_offset" : 8,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "/var/lib/elasticsearch",
      "start_offset" : 0,
      "end_offset" : 22,
      "type" : "word",
      "position" : 0
    }
  ]
}
```

### Token Filters
**对于 tokenizer 输出的 单词（term） 进行增加、删除、修改等操作**

自带的如下：

+ lowercase 将所有 term 转换为小写
+ stop 删除停用词，例如 a and are of等
+ NGram 和 Edge NGram 连词分割
+ Synonym 添加近义词的 term

使用stop和lowercase测试

```json
POST /_analyze
{
  "tokenizer": "standard",
  "text": "Hello,World!,Hi",
  "filter": [
    "stop",
    "lowercase",
    {
      "type": "ngram",
      "min_gram": 4,
      "max_gram": 4
    }
  ]
}
# 响应
{
  "tokens" : [
    {
      "token" : "hell",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "ello",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "worl",
      "start_offset" : 6,
      "end_offset" : 11,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "orld",
      "start_offset" : 6,
      "end_offset" : 11,
      "type" : "<ALPHANUM>",
      "position" : 1
    }
  ]
}

```

### 自定义分词器
![](assets/01-ELK-Stack/6c5ece8a8f901a774240.png)

+ 定义如下所示的自定义分词器

| 分词器名称 | custom_analyzer |
| --- | --- |
| Character Filters | html_strip |
| Tokenizer  | standard |
| Token Filters | lowercase、asciifolding |


+ 创建自定义分词器

```json
PUT test_index_1
{
  "settings": {
    "analysis": {
      "analyzer": {
        "custom_analyzer": {
          "char_filter": [
            "html_strip"
          ],
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding"
          ]
        }
      }
    }
  }
}
```

+ 验证自定义分词器

```json
POST test_index_1/_analyze
{
  "analyzer": "custom_analyzer",
  "text":"My Name <p>Xiao Ming</p>?"
}
# 响应
{
  "tokens" : [
    {
      "token" : "my",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "name",
      "start_offset" : 3,
      "end_offset" : 7,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "xiao",
      "start_offset" : 11,
      "end_offset" : 15,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "ming",
      "start_offset" : 16,
      "end_offset" : 20,
      "type" : "<ALPHANUM>",
      "position" : 3
    }
  ]
}
```

## Analyze API
### 指定分词器进行分词
```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Hello, World!"
}
# 响应
{
  "tokens" : [
    {
      "token" : "hello", // 分词结果
      "start_offset" : 0, // 起始偏移
      "end_offset" : 5, // 结束偏移
      "type" : "<ALPHANUM>", 
      "position" : 0 // 分词位置
    },
    {
      "token" : "world",
      "start_offset" : 7,
      "end_offset" : 12,
      "type" : "<ALPHANUM>",
      "position" : 1
    }
  ]
}

```

### 指定索引分词
```json
POST myindex/_analyze
{
  "analyzer": "standard", // 指定分词器
  "field": "name", // 分词字段
  "text": "雷夫托儿斯" // 内容
}
# 响应
{
  "tokens" : [
    {
      "token" : "hello",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "小",
      "start_offset" : 6,
      "end_offset" : 7,
      "type" : "<IDEOGRAPHIC>",
      "position" : 1
    },
    {
      "token" : "明",
      "start_offset" : 7,
      "end_offset" : 8,
      "type" : "<IDEOGRAPHIC>",
      "position" : 2
    }
  ]
}
```

### 使用自定义分词器验证
```json
POST test_index_1/_analyze
{
  "analyzer": "custom_analyzer",
  "text":"My Name <p>Xiao Ming</p>?"
}
```

## 分词使用
### 分词何时使用
+ 创建或更新文档是，会对相应的文档进行分词处理
+ 查询索引时，会对查询语句进行分词

### 写入时分词
写时分词发生在文档写入时，ES会对文档进行分词，然后将结果存入到倒排索引中

该部分最终会以文件的形式存储在磁盘上，不会因为ES重启而丢失

写时分词器需要在mapping中指定，后期不能修改，只能创建新索引。

+ 创建mapping时指定分词器

```json
PUT myindex2
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "keyword"
      }
    }
  }
}
GET myindex2/_mapping
{
  "myindex2" : {
    "mappings" : {
      "properties" : {
        "title" : {
          "type" : "text",
          "analyzer" : "keyword"
        }
      }
    }
  }
}
```

### 读取时分词
读取分词发生在用户查询时，es会对关键词进行分词

分词结果只存在内存中，当查询结束后，分词结果会消失。

+ 查询时指定分词器

```json
GET myindex/_search
{
  "query": {
    "match": {
      "text": {
        "query": "hello",
        "analyzer": "keyword"
      }
    }
  }
}
```

## 分词使用建议
明确字段是否需要分词，不需要分词的字段就将 type 设置为 keyword，可以节省空间和提高写性能

善用 _analyze API，查看文档的具体分词结果

## 参考文档
es内置分词器[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-tokenizers.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-tokenizers.html)

es<font style="color:rgb(33, 37, 41);">Analyze API </font>[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-analyze.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/indices-analyze.html)

es自定义分词器[https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-custom-analyzer.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-custom-analyzer.html)


