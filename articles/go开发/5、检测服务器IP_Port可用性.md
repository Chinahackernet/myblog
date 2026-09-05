用net包来检测服务器端口是否被占用

```go
package main

import (
	"fmt"
	"net"
	"time"
)

func main(){
	conn, err := net.DialTimeout("tcp", "127.0.0.1:8088", 3*time.Second)
	if err != nil {
		err = fmt.Errorf("端口未被占用")
		fmt.Println(err)
		return
	}
	defer conn.Close()
	fmt.Println("端口已被占用")
}
```