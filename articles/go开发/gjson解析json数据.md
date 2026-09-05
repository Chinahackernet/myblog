项目地址：[https://github.com/tidwall/gjson](https://github.com/tidwall/gjson)

  

下载：  

```go
$ go get -u github.com/tidwall/gjson
```

## 获取值

Get查询指定路径, 通过`.`来区分. 比如"name.last"或者"age". 如果找到了匹配路径, 将返回结果.

```go
package main
import "github.com/tidwall/gjson"
const json = `{"name":{"first":"Janet","last":"Prichard"},"age":47}`
func main() {
    value := gjson.Get(json, "name.last")
    println(value.String())
}
```

输出结果:

```go
Prichard
```

*同时有 [GetMany](https://studygolang.com/articles/13523#get-multiple-values-at-once) 方法批量获取值, 也有 [GetBytes](https://studygolang.com/articles/13523#working-with-bytes) 方法获取字节切片.*

## 路径解析

路径是一系列被`.`分隔的key拼接而成.

路径可能包含通配符'\*'和'?'.

通过下标访问数组值.

通过'#'来获取值在元素中的排位或访问子路径.

`.`和通配符可以通过'\\'来转义.

```go
{
  "name": {"first": "Tom", "last": "Anderson"},
  "age":37,
  "children": ["Sara","Alex","Jack"],
  "fav.movie": "Deer Hunter",
  "friends": [
    {"first": "Dale", "last": "Murphy", "age": 44},
    {"first": "Roger", "last": "Craig", "age": 68},
    {"first": "Jane", "last": "Murphy", "age": 47}
  ]
}
```
```go
"name.last"          >> "Anderson"
"age"                >> 37
"children"           >> ["Sara","Alex","Jack"]
"children.#"         >> 3
"children.1"         >> "Alex"
"child*.2"           >> "Jack"
"c?ildren.0"         >> "Sara"
"fav\.movie"         >> "Deer Hunter"
"friends.#.first"    >> ["Dale","Roger","Jane"]
"friends.1.last"     >> "Craig"
```

你同样能通过`#[...]`来查询数组中的第一个匹配的项, 或通过'#[...]#'查询所有匹配的项.

查询支持`==`, `!=`, `<`, `<=`, `>`, `>=`比较运算符和'%'模糊匹配.

```go
friends.#[last=="Murphy"].first    >> "Dale"
friends.#[last=="Murphy"]#.first   >> ["Dale","Jane"]
friends.#[age>45]#.last            >> ["Craig","Murphy"]
friends.#[first%"D*"].last         >> "Murphy"
```

## JSON 行

同样支持[JSON Lines](http://jsonlines.org/), 使用 `..` 前缀, 把多行文档视作数组.

比如:

```go
{"name": "Gilbert", "age": 61}
{"name": "Alexa", "age": 34}
{"name": "May", "age": 57}
{"name": "Deloise", "age": 44}
```
```go
..#                   >> 4
..1                   >> {"name": "Alexa", "age": 34}
..3                   >> {"name": "Deloise", "age": 44}
..#.name              >> ["Gilbert","Alexa","May","Deloise"]
..#[name="May"].age   >> 57
```

`ForEachLines` 方法可以迭代json.

```go
gjson.ForEachLine(json, func(line gjson.Result) bool{
    println(line.String())
    return true
})
```

## Result Type

GJSON支持json类型包括 `string`, `number`, `bool`, and `null`. 数组和对象被挡住基础类型返回.

`Result` 持有如下其中一种类型:

```go
bool, for JSON booleans
float64, for JSON numbers
string, for JSON string literals
nil, for JSON null
```

直接访问value:

```go
result.Type    // can be String, Number, True, False, Null, or JSON
result.Str     // holds the string
result.Num     // holds the float64 number
result.Raw     // holds the raw json
result.Index   // index of raw value in original json, zero means index unknown
```

有各种各样的方便的函数可以获取结果:

```go
result.Exists() bool
result.Value() interface{}
result.Int() int64
result.Uint() uint64
result.Float() float64
result.String() string
result.Bool() bool
result.Time() time.Time
result.Array() []gjson.Result
result.Map() map[string]gjson.Result
result.Get(path string) Result
result.ForEach(iterator func(key, value Result) bool)
result.Less(token Result, caseSensitive bool) bool
```

`result.Value()` 方法返回 `interface{}` Go基本类型之一.

`result.Array()` 方法返回一组值.

如果结果是不存在的值, 将会返回空数组.

如果结果不是JSON数组, 将会返回只包含一个值的数组.

```plain
boolean >> bool
number  >> float64
string  >> string
null    >> nil
array   >> []interface{}
object  >> map[string]interface{}
```

### 64-bit integers

`result.Int()` 和 `result.Uint()` 返回的是64位大数字.

```go
result.Int() int64    // -9223372036854775808 to 9223372036854775807
result.Uint() int64   // 0 to 18446744073709551615
```

### 读取嵌套数组

假如你想从下列json获取所有的lastName:

```go
{
  "programmers": [
    {
      "firstName": "Janet", 
      "lastName": "McLaughlin", 
    }, {
      "firstName": "Elliotte", 
      "lastName": "Hunter", 
    }, {
      "firstName": "Jason", 
      "lastName": "Harold", 
    }
  ]
}
```

你可以使用如下路径`programmers.#.lastName`:

```go
result := gjson.Get(json, "programmers.#.lastName")
for _, name := range result.Array() {
    println(name.String())
}
```

你同样能获取数组里的对象:

```go
name := gjson.Get(json, `programmers.#[lastName="Hunter"].firstName`)
println(name.String())  // prints "Elliotte"
```

## 对象或数组迭代

`ForEach`方法允许你快速的迭代对象或数组.

key和value被传递给对象的迭代器函数.

只有value被传递给数组. 迭代器返回`false`将会终止迭代.

## 简易的Parse和Get

`Parse(json)`方法可以简单的分析json, `result.Get(path)`查询结果.

比如, 下面的几种情况都将返回相同的结果:

```go
gjson.Parse(json).Get("name").Get("last")
gjson.Get(json, "name").Get("last")
gjson.Get(json, "name.last")
```

## 检查value是否存在

有时你想要知道值是否存在.

```go
value := gjson.Get(json, "name.last")
if !value.Exists() {
    println("no last name")
} else {
    println(value.String())
}
// Or as one step
if gjson.Get(json, "name.last").Exists() {
    println("has a last name")
}
```

## 验证JSON

`Get*` 和 `Parse*` 方法预期json格式是正常的, 如果不正常, 将会返回不可预料的结果.

如果你读取的json来源不可预料, 那么你可以通过GJSON这么事先验证.

```go
if !gjson.Valid(json) {
    return errors.New("invalid json")
}
value := gjson.Get(json, "name.last")
```

## 反序列化到map

反序列化到`map[string]interface{}`:

```go
m, ok := gjson.Parse(json).Value().(map[string]interface{})
if !ok {
    // not a map
}
## 处理Bytes
如果你的JSON包含字节数组切片, 与其调用`Get(string(data), path)`, 不如调用[GetBytes](https://godoc.org/github.com/tidwall/gjson#GetBytes)方法更优.
```go
var json []byte = ...
result := gjson.GetBytes(json, path)
```

如果你在使用`gjson.GetBytes(json, path)`方法, 并且你想避免从`result.Raw` 转换到 `[]byte`, 你可以使用这种模式:

```go
var json []byte = ...
result := gjson.GetBytes(json, path)
var raw []byte
if result.Index > 0 {
    raw = json[result.Index:result.Index+len(result.Raw)]
} else {
    raw = []byte(result.Raw)
}
```

这是最好的模式, 不会为子切片重新分配内存. 这个模式使用了`result.Index`字段, 它直接指向了raw data所处原来json中的位置.

如果`result.Raw`是转换成`[]byte`的, `result.Index`将会为0.

## 一次获取多个值

`GetMany`方法可以用于同时获取多个值.

```go
results := gjson.GetMany(json, "name.first", "name.last", "age")
```

返回值是`[]Result`类型, 总是返回正传入路径个数的数量.