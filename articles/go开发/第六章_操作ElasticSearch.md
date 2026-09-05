## ES和关系数据库的比较

  

<table class="lake-table" style="width: 713px;"><colgroup><col span="1" width="388" /><col span="1" width="325" /></colgroup><thead><tr style="height: 33px;"><td style="background-color: #3F3F3F; text-align: center; color: #FFFFFF;">ES概念</td><td style="background-color: #3F3F3F; text-align: center; color: #FFFFFF;">关系型数据库</td></tr></thead><tbody><tr style="height: 33px;"><td>Index（索引）支持全文检索</td><td>Database（数据库）</td></tr><tr style="height: 33px;"><td>Type（类型）</td><td>Table（表）</td></tr><tr style="height: 33px;"><td>Document（文档），不同文档可以有不同的字段集合</td><td>Row（数据行）</td></tr><tr style="height: 33px;"><td>Field（字段）</td><td>Column（数据列）</td></tr><tr style="height: 33px;"><td>Mapping（映射）</td><td>Schema（模式）</td></tr></tbody></table>

  

## ES API

### 查看健康状态

```plain
curl -X GET 127.0.0.1:9200/_cat/health?v
```

  

### 查询当前es集群中所有的indices

```plain
curl -X GET 127.0.0.1:9200/_cat/indices?v
```

  

### 创建索引

```plain
curl -X PUT 127.0.0.1:9200/www
```

  

### 删除索引

```plain
curl -X DELETE 127.0.0.1:9200/www
```

  

### 插入记录

```plain
curl -H "ContentType:application/json" -X POST 127.0.0.1:9200/user/person -d '
{
	"name": "joker",
	"age": 9000,
	"married": true
}'
```

  

也可以使用PUT方法，但是需要传入id

```plain
curl -H "ContentType:application/json" -X PUT 127.0.0.1:9200/user/person/4 -d '
{
	"name": "sb",
	"age": 9,
	"married": false
}'
```

  

### 检索

Elasticsearch的检索语法比较特别，使用GET方法携带JSON格式的查询条件。

  

全检索：

```plain
curl -X GET 127.0.0.1:9200/user/person/_search
```

  

按条件检索：

```plain
curl -H "ContentType:application/json" -X PUT 127.0.0.1:9200/user/person/4 -d '
{
	"query":{
		"match": {"name": "sb"}
	}	
}'
```

  

ElasticSearch默认一次最多返回10条结果，可以像下面的示例通过size字段来设置返回结果的数目。

```plain
curl -H "ContentType:application/json" -X PUT 127.0.0.1:9200/user/person/4 -d '
{
	"query":{
		"match": {"name": "sb"},
		"size": 2
	}	
}'
```

  

## Go操作Elasticsearch

### elastic client

我们使用第三方库[https://github.com/olivere/elastic](https://github.com/olivere/elastic)来连接ES并进行操作。

注意下载与你的ES相同版本的client，例如我们这里使用的ES是7.2.1的版本，那么我们下载的client也要与之对应为`github.com/olivere/elastic/v7`。

使用`go.mod`来管理依赖：

```go
require (
    github.com/olivere/elastic/v7 v7.0.4
)
```

简单示例：

```go
package main
import (
	"context"
	"fmt"
	"github.com/olivere/elastic/v7"
)
// Elasticsearch demo
type Person struct {
	Name    string `json:"name"`
	Age     int    `json:"age"`
	Married bool   `json:"married"`
}
func main() {
	client, err := elastic.NewClient(elastic.SetURL("http://127.0.0.1:9200"))
	if err != nil {
		// Handle error
		panic(err)
	}
	fmt.Println("connect to es success")
	p1 := Person{Name: "rion", Age: 22, Married: false}
	put1, err := client.Index().
		Index("user").
		BodyJson(p1).
		Do(context.Background())
	if err != nil {
		// Handle error
		panic(err)
	}
	fmt.Printf("Indexed user %s to index %s, type %s\n", put1.Id, put1.Index, put1.Type)
}
```