注意事项

map记得分配内存

解析出来的int类型会变成float64类型

注意判断不为nil后再转换类型

```go
package main
import (
   "fmt"
   "encoding/json"
)
func main() {
   var m map[string]interface{}    //声明变量，不分配内存
   m = make(map[string]interface{}) //必可不少，分配内存
   m["name"] = "simon"
   var age int = 12
   m["age"] = age
   m["addr"] = "China"
   print_map(m)
   fmt.Println()
   data, err:=json.Marshal(m)
   fmt.Println("err:", err)
   fmt.Println(data)
   fmt.Println()
   m1 := make(map[string]interface{})
   err = json.Unmarshal(data, &m1)
   fmt.Println("err:", err)
   fmt.Println(m1)
   print_map(m1)
   fmt.Println()
   if m1["name"]!= nil {
       fmt.Println(m1["name"].(string))
   }
   if m1["type"]!= nil {
       fmt.Println(m1["type"].(string))
   } else {
       fmt.Println("there is not the key of type")
   }
}
//解析 map[string]interface{} 数据格式
func print_map(m map[string]interface{}) {
   for k, v := range m {
       switch value := v.(type) {
       case nil:
           fmt.Println(k, "is nil", "null")
       case string:
           fmt.Println(k, "is string", value)
       case int:
           fmt.Println(k, "is int", value)
       case float64:
           fmt.Println(k, "is float64", value)
       case []interface{}:
           fmt.Println(k, "is an array:")
           for i, u := range value {
               fmt.Println(i, u)
           }
       case map[string]interface{}:
           fmt.Println(k, "is an map:")
           print_map(value)
       default:
           fmt.Println(k, "is unknown type", fmt.Sprintf("%T", v))
       }
   }
}
```