代码编程中，用方法调用匹配名字的函数，非常有效

利用go的反射机制可以实现

```go
import (
    "errors"
    "fmt"
    "reflect"
)
func foor() {
    fmt.Println("Start->foor()")
}
func say(number int) {
    fmt.Printf("This text is %d", number)
}
func Call(m map[string]interface{}, name string, params ...interface{}) (result []reflect.Value, err error) {
    f := reflect.ValueOf(m[name])
    if len(params) != f.Type().NumIn() {
        err = errors.New("The number of params is not adapted.")
        return
    }
    in := make([]reflect.Value, len(params))
    for k, param := range params {
        in[k] = reflect.ValueOf(param)
    }
    result = f.Call(in)
    return
}
func main() {
    fmt.Println("Start Main func()")
    // map 直接调用函数
    funcs := map[string]func(){"foor": foor}
    funcs["foor"]()
    // 反射
    xfuncs := map[string]interface{}{"say": say}
    Call(xfuncs, "say", 123)
}
// 输出
// Start->foor()
// This text is 123
```