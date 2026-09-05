map是一种无序的，基于`key-value` 的数据结构。它是Go语言中的映射关系容器，其内部是使用`散列表（hash）` 实现的。

  

> 注意：Go语言中的map是引用类型，所以必须初始化才能使用。

  

## map的定义

  

map定义的基本语法如下：

  

```
map[keyType]valueType
```

  

其中：

  

-   keyType：是key的类型
-   valueType：是key对应的值的类型

  

map类型的初始值是`nil`，要使用需要使用`make()`函数来初始化分配内存地址，语法如下：

  

```
make(map[keyType]valueType, [cap])
```

  

其中`cap` 表示map的容量。该参数虽然不是必须的，但是我们应该在初始化map的时候就为其指定一个合适的容量。

  

## map的使用

  

例子如下：

  

```go
package main

import "fmt"

func main() {
	// 定义一个map类型的变量并初始化
	m := make(map[string]int, 10)
	// 添加键值
	m["Joker"] = 18
	m["Jack"] = 25
	fmt.Println(m)          // map[Jack:25 Joker:18]
	fmt.Println(m["Joker"]) // 18
	fmt.Printf("%T\n", m)   //map[string]int
}
```

  

map也可以在声明的时候添加键值对，如下：

  

```go
package main

import "fmt"

func main() {
	m := map[string]int{
		"Joker": 18,
		"Jack":  25,
	}
	fmt.Println(m)
}
```

  

## 判断某个键是否存在

  

Go语言中判断某个键是否存在的特殊写法如下：

  

```
value, ok := map[key]
```

  

比如：

  

```
package main

import "fmt"

func main() {
	// 定义一个map类型的变量并初始化
	m := map[string]int{
		"Joker": 18,
		"Jack":  25,
	}
	fmt.Println(m)
	value, ok := m["Jim"]
	if ok {
		fmt.Println(value)
	} else {
		fmt.Println("nobody")
	}
}
```

  

## map的遍历

  

遍历`map` 使用`for range`。如下：

  

```
package main

import "fmt"

func main() {
	// 定义一个map类型的变量并初始化
	m := map[string]int{
		"Joker": 18,
		"Jack":  25,
	}
	fmt.Println(m)
	// 遍历map，输出key-value
	for key, value := range m {
		fmt.Printf("key:%s - value:%d\n", key, value)
	}
}
```

  

如果仅需要key，则用下面写法：

  

```
package main

import "fmt"

func main() {
	// 定义一个map类型的变量并初始化
	m := map[string]int{
		"Joker": 18,
		"Jack":  25,
	}
	fmt.Println(m)
	// 遍历map，输出Key
	for key := range m {
		fmt.Println(key)
	}
}
```

  

## 删除map的元素

  

使用`delete()`内建函数从map中删除一组键值对，`delete()`函数的格式如下：

  

```go
delete(map, key)
```

  

其中：

  

-   map:表示要删除键值对的map
-   key:表示要删除的键值对的键

  

例如：

  

```
package main

import "fmt"

func main() {
	// 定义一个map类型的变量并初始化
	m := map[string]int{
		"Joker": 18,
		"Jack":  25,
	}
	// 删除key为Joker的键值对
	fmt.Println(m) //map[Jack:25 Joker:18]
	delete(m, "Joker")
	fmt.Println(m) //map[Jack:25]
}
```

  

## 按顺序遍历map

  

`map`是无序的，如果要想按顺序来遍历`map` ，我们需要先讲map的key遍历出来保存为切片，然后使用`sort` 函数来对切片进行排序，最后再通过排好序的切片来获取key并获取其对应的值。

  

例如：

  

```
package main

import (
	"fmt"
	"math/rand"
	"sort"
	"time"
)

func main() {
	rand.Seed(time.Now().UnixNano()) //初始化随机数种子

	var scoreMap = make(map[string]int, 200)

	for i := 0; i < 100; i++ {
		key := fmt.Sprintf("stu%02d", i) //生成stu开头的字符串
		value := rand.Intn(100)          //生成0~99的随机整数
		scoreMap[key] = value
	}
	//取出map中的所有key存入切片keys
	var keys = make([]string, 0, 200)
	for key := range scoreMap {
		keys = append(keys, key)
	}
	//对切片进行排序
	sort.Strings(keys)
	//按照排序后的key遍历map
	for _, key := range keys {
		fmt.Println(key, scoreMap[key])
	}
}
```

  

## 元素为map类型的切片

  

```
package main

import "fmt"

func main() {
	// 定义元素为Map类型的切片
	s := make([]map[string]int, 3)
	// 对Map进行申请内存
	s[0] = make(map[string]int)
	s[0]["Joker"] = 18
	fmt.Println(s)
}
```

  

## 元素为切片的map类型

  

```go
package main

import "fmt"

func main() {
	// 定义一个切片类型的map
	m := make(map[string][]int, 3)
	fmt.Println(m)
	value, ok := m["Joker"]
	if ok {
		fmt.Println(value)
	} else {
		value = make([]int, 1, 2)
	}
	value = append(value, 1)
	m["Joker"] = value
	fmt.Println(m)
}
```

  

输出为：

  

```go
map[]
map[Joker:[0 1]]
```