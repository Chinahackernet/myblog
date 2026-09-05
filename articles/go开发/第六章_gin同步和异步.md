```go
package main

import (
	"github.com/gin-gonic/gin"
	"log"
	"time"
)

type Login struct{
	User string `form:"username" json:"username" xml:"username" uri:"username" binding:"required"`
	Password string `form:"password" json:"password" xml:"password" uri:"password" binding:"required"`
}

func main(){
	// 1、创建路由
	g := gin.Default()
	// 2、绑定路由规则
	g.GET("/sync",syncFunc)
	g.GET("/async",asyncFunc)
	g.Run(":8000")
}

func syncFunc(context *gin.Context){
	time.Sleep(time.Second*5)
	log.Println("同步操作...", context.Request.URL.Path)
}

func asyncFunc(context *gin.Context){
	copyC := context.Copy()
	go func(){
		time.Sleep(time.Second*5)
		log.Panicln("异步操作...", copyC.Request.URL.Path)
	}()
}
```

  

其中`syncFunc`是同步操作，`asyncFunc`是异步操作。

> 注意：异步操作不能直接使用context，需要使用其副本

同步操作的话需要等待5秒，才打印日志，如下：

  

```go
2020/04/02 15:25:34 同步操作... /sync
[GIN] 2020/04/02 - 15:25:34 |?[97;42m 200 ?[0m|    5.0308557s |       127.0.0.1 |?[97;44m GET     ?[0m "/sync"

```

  

异步操作如下：

  

```go
[GIN] 2020/04/02 - 15:27:59 |?[97;42m 200 ?[0m|            0s |       127.0.0.1 |?[97;44m GET     ?[0m "/async"
2020/04/02 15:28:04 异步操作... /async

```