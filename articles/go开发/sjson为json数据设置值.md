安装：

```go
$ go get github.com/tidwall/sjson
```

使用：

```go
package main
import (
  "fmt"
  "github.com/tidwall/sjson"
)
const json = `{"name":{"first":"li","last":"dj"},"age":18}`
func main() {
  value, _ := sjson.Set(json, "name.last", "dajun")
  fmt.Println(value)
}
```

上面代码通过`sjson.Set()`将 JSON 串中`name.last`对应的值设置为`dajun`。与`gjson`一样，`sjson`也通过**键路径**指定具体的位置，键路径即为一系列以`.`分隔的键。`sjson`支持的键路径语法是`gjson`的一个子集，具体键路径的语法可以参见上一篇文章。`sjson.Set()`返回设置之后的 JSON 串。最终程序输出：

```go
{"name":{"first":"li","last":"dajun"},"age":18}
```

## 支持的类型

`sjson`支持的类型包括`nil/bool/int/float/string`等。如果传入`sjson`不支持的类型，`sjson`会调用`json.Marshal`，然后将生成的字符串设置到对应的键路径上：

```go
type User struct {
  Name string `json:"name"`
  Age  int    `json:"age"`
}
func main() {
  nilJSON, _ := sjson.Set("", "key", nil)
  fmt.Println(nilJSON)
  boolJSON, _ := sjson.Set("", "key", false)
  fmt.Println(boolJSON)
  intJSON, _ := sjson.Set("", "key", 1)
  fmt.Println(intJSON)
  floatJSON, _ := sjson.Set("", "key", 10.5)
  fmt.Println(floatJSON)
  strJSON, _ := sjson.Set("", "key", "hello")
  fmt.Println(strJSON)
  mapJSON, _ := sjson.Set("", "key", map[string]interface{}{"hello": "world"})
  fmt.Println(mapJSON)
  u := User{Name: "dj", Age: 18}
  structJSON, _ := sjson.Set("", "key", u)
  fmt.Println(structJSON)
}
```

注意，我们传入一个空字符串，`sjson.Set()`会生成一个空对象，然后按照键路径依次设置值。下面分析上述程序输出：

-   `nil`：在 JSON 中用`null`表示，输出`{"key":null}`；
-   `false`：在 JSON 中布尔值用`true/false`表示，输出`{"key":false}`；
-   `1`和`10.5`：整数和浮点数在 JSON 中都用`number`表示，分别输出`{"key":1}`和`{"key":10.5}`；
-   `hello`：输出`{"key":"hello"}`；
-   `map[string]interface{}`：`sjson`并不原生支持`map`类型，故通过`json.Marshal`将其序列化为`{"hello":"world"}`再设置到键`key`上，输出`{"key":{"hello":"world"}}`；
-   `User`对象：先通过`json.Marshal`序列化为`{"name":"dj","age":18}`再设置；

## 修改数组

修改数组可以通过在键路径后添加索引，有两种特殊情况：

-   使用`-1`或数组长度为索引表示在数组后添加一个新元素；
-   使用的索引超出数组的长度，会在数组中添加很多`null`值。

看下面示例：

```go
func main() {
  fruits := `{"fruits":["apple", "orange", "banana"]}`
  var newValue string
  newValue, _ = sjson.Set(fruits, "fruits.1", "grape")
  fmt.Println(newValue)
  newValue, _ = sjson.Set(fruits, "fruits.3", "pear")
  fmt.Println(newValue)
  newValue, _ = sjson.Set(fruits, "fruits.-1", "strawberry")
  fmt.Println(newValue)
  newValue, _ = sjson.Set(fruits, "fruits.5", "watermelon")
  fmt.Println(newValue)
}
```

-   `fruits.1`：设置第二个水果为`grape`（**索引从 0 开始**），输出`{"fruits":["apple", "grape", "banana"]}`；
-   `fruits.3`：由于数组长度为 3，使用 3 表示在数组后添加一个元素，输出`{"fruits":["apple","orange","banana","pear"]}`；
-   `fruits.-1`：使用`-1`同样表示在数组后添加一个元素，输出`{"fruits":["apple", "orange", "banana","strawberry"]}`;
-   `fruits.5`：索引 5 已经大于数组长度 3 了，所以会多出两个`null`，输出`{"fruits":["apple","orange","banana",null,null,"watermelon"]}`。

## 删除

删除数组元素需要调用`sjson.Delete()`方法，键路径语法相同。如果键路径对应的值不存在，则`Delete()`无效果：

```go
func main() {
  var newValue string
  user := `{"name":{"first":"li","last":"dj"},"age":18}`
  newValue, _ = sjson.Delete(user, "name.first")
  fmt.Println(newValue)
  newValue, _ = sjson.Delete(user, "name.full")
  fmt.Println(newValue)
  fruits := `{"fruits":["apple", "orange", "banana"]}`
  newValue, _ = sjson.Delete(fruits, "fruits.1")
  fmt.Println(newValue)
  newValue, _ = sjson.Delete(fruits, "fruits.-1")
  fmt.Println(newValue)
  newValue, _ = sjson.Delete(fruits, "fruits.5")
  fmt.Println(newValue)
}
```

-   `name.first`：删除字段`name.first`，输出`{"name":{"last":"dj"},"age":18}`；
-   `name.full`：由于字段`name.full`不存在，无效果，输出`{"name":{"first":"li","last":"dj"},"age":18}`；
-   `fruits.1`：删除数组`fruits`的第二个元素，输出`{"fruits":["apple", "banana"]}`；
-   `fruits.-1`：删除数组最后一个元素，输出`{"fruits":["apple", "orange"]}`；
-   `fruits.5`：索引 5 超出数组长度 3，无效果，输出`{"fruits":["apple", "orange", "banana"]}`。

## 错误处理

使用`sjson`出现的错误分为两种，一种是传入的 JSON 串不是合法的串，另一种是键路径语法错误。`Set()`和`Delete()`方法返回的第二个参数为错误，只有非法的键路径会返回错误，非法 JSON 串不会。

### 非法 JSON 串

同`gjson`一样，`sjson`同样不会检查传入的 JSON 串的合法性，它假设传入的是合法的串。如果传入一个非法的 JSON 串，程序输出不确定的结果：

```go
func main() {
  user := `{"name":dj,age:18}`
  newValue, err := sjson.Set(user, "name", "dajun")
  fmt.Println(err, newValue)
}
```

上面程序中，我故意传入一个非法的 JSON 串（`dj`和`age`漏掉了双引号）。最终程序输出：

```go
<nil> {"name":dj,age:"dajun"}
```

将`age`变为了`dajun`，显然不正确。然而此时返回的`err = nil`。

### 非法键路径

与`gjson`相比，`sjson`能使用的键路径语法比较有限，不能使用通配符和一些条件语法。如果传入的键路径非法，将返回非空的错误值：

```go
func main() {
  user := `{"name":"dj","age":18}`
  newValue, err := sjson.Set(user, "na?e", "dajun")
  fmt.Println(err, newValue)
}
```

上次使用通配符`?`，输出：

```go
wildcard characters not allowed in path
```