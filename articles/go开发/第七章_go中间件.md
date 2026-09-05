Gin框架允许开发者在处理请求的过程中，加入用户自己的钩子（Hook）函数。这个钩子函数就叫中间件，中间件适合处理一些公共的业务逻辑，比如登录认证、权限校验、数据分页、记录日志、耗时统计等。

### 定义中间件

Gin中的中间件必须是一个`gin.HandlerFunc`类型。例如我们像下面的代码一样定义一个统计请求耗时的中间件。

  

```go
func MyMiddleWare()(gin.HandlerFunc){
	return func(ctx *gin.Context){
		fmt.Println("中间件开始......")
		ctx.Set("name","joker")
		start := time.Now()
		// 调用Next()处理函数
		ctx.Next()
		// 计算函数耗时多少
		cost := time.Since(start)
		fmt.Println("耗时：",cost)
	}
}
```

  

其中最关键的一点是`ctx.Next()`，调用这个的作用就是处理后续的处理函数。

  

### 注册中间件

在gin框架中，我们可以为每个路由添加任意数量的中间件。

  

#### 全局中间件

定义全局中间件的话就在主函数中用`User()`方法加载中间件。为了代码规范，建议绑定路由规则都包含在`{}`中，如下：

```go
func main(){
	// 1、创建路由
	g := gin.Default()
	// 2、加载中间件
	g.Use(MyMiddleWare())
	{
		// 2、绑定路由规则
		g.GET("/middleware",myFunc)
	}
	g.Run(":8000")
}

func myFunc(context *gin.Context){
	// 获取中间件中设置的值
	ret := context.MustGet("name")
	fmt.Println("中间件中的值：",ret)
	time.Sleep(time.Second*5)
}
```

  

然后访问输出如下：

  

```go
中间件开始......
中间件中的值： joker
耗时： 5.001355s
[GIN] 2020/04/02 - 18:19:56 |?[97;42m 200 ?[0m|    5.0050022s |       127.0.0.1 |?[97;44m GET     ?[0m "/middleware"
```

  

#### 局部中间件

局部中间件也就是为某个路由单独注册中间件，只需要在绑定路由的时候在路径后面跟上中间件函数即可。

如下：

  

```go
package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"time"
)

func MyMiddleWare()(gin.HandlerFunc){
	return func(ctx *gin.Context){
		fmt.Println("中间件开始......")
		ctx.Set("name","joker")
		start := time.Now()
		// 调用Next()处理函数
		ctx.Next()
		// 计算函数耗时多少
		cost := time.Since(start)
		fmt.Println("耗时：",cost)
	}
}

func main(){
	// 1、创建路由
	g := gin.Default()
	// 2、加载中间件
	g.Use(MyMiddleWare())
	{
		// 2、绑定路由规则
		g.GET("/test2",MyMiddleWare(),test2)
	}
	g.Run(":8000")
}

func test2(ctx *gin.Context){
	// 获取中间件中设置的值
	ret := ctx.MustGet("name")
	fmt.Println("中间件中的值：",ret)
	time.Sleep(time.Second*5)
}
```

  

然后访问如下：

  

```go
中间件开始......
中间件开始......
中间件中的值： joker
耗时： 5.0002031s
耗时： 5.0007657s
[GIN] 2020/04/02 - 18:40:55 |?[97;42m 200 ?[0m|    5.0037571s |       127.0.0.1 |?[97;44m GET     ?[0m "/test2"
```

  

我们可以看到执行了两遍中间件，其中在执行函数之前是先执行的全局中间件，然后再是局部中间件，再返回的时候先执行局部中间件，再执行全局中间件。

流程图如下：

![image.png](assets/go开发/第七章_go中间件/第七章_go中间件-1.png)

  

#### 为路由组注册中间件

为路由组注册中间件有以下两种写法。

  

写法1：

```go
shopGroup := r.Group("/shop", StatCost())
{
    shopGroup.GET("/index", func(c *gin.Context) {...})
    ...
}
```

  

写法2：

```go
shopGroup := r.Group("/shop")
shopGroup.Use(StatCost())
{
    shopGroup.GET("/index", func(c *gin.Context) {...})
    ...
}
```

  

### 中间件注意事项

#### gin默认中间件

`gin.Default()`默认使用了`Logger`和`Recovery`中间件，其中：

-   `Logger`中间件将日志写入`gin.DefaultWriter`，即使配置了`GIN_MODE=release`。
-   `Recovery`中间件会recover任何`panic`。如果有panic的话，会写入500响应码。

如果不想使用上面两个默认的中间件，可以使用`gin.New()`新建一个没有任何默认中间件的路由。

#### gin中间件中使用goroutine

当在中间件或`handler`中启动新的`goroutine`时，**不能使用**原始的上下文（c \*gin.Context），必须使用其只读副本（`c.Copy()`）。