### 普通路由

```go
r.GET("/index", func(c *gin.Context) {...})
r.GET("/login", func(c *gin.Context) {...})
r.POST("/login", func(c *gin.Context) {...})
```

此外，还有一个可以匹配所有请求方法的`Any`方法如下：

```go
r.Any("/test", func(c *gin.Context) {...})
```

为没有配置处理函数的路由添加处理程序，默认情况下它返回404代码，下面的代码为没有匹配到路由的请求都返回`views/404.html`页面。

```go
r.NoRoute(func(c *gin.Context) {
		c.HTML(http.StatusNotFound, "views/404.html", nil)
	})
```

### 路由组

我们可以将拥有共同URL前缀的路由划分为一个路由组。习惯性一对`{}`包裹同组的路由，这只是为了看着清晰，你用不用`{}`包裹功能上没什么区别。

```go
func main() {
	r := gin.Default()
	userGroup := r.Group("/user")
	{
		userGroup.GET("/index", func(c *gin.Context) {...})
		userGroup.GET("/login", func(c *gin.Context) {...})
		userGroup.POST("/login", func(c *gin.Context) {...})
	}
	shopGroup := r.Group("/shop")
	{
		shopGroup.GET("/index", func(c *gin.Context) {...})
		shopGroup.GET("/cart", func(c *gin.Context) {...})
		shopGroup.POST("/checkout", func(c *gin.Context) {...})
	}
	r.Run()
}
```

路由组也是支持嵌套的，例如：

```go
shopGroup := r.Group("/shop")
	{
		shopGroup.GET("/index", func(c *gin.Context) {...})
		shopGroup.GET("/cart", func(c *gin.Context) {...})
		shopGroup.POST("/checkout", func(c *gin.Context) {...})
		// 嵌套路由组
		xx := shopGroup.Group("xx")
		xx.GET("/oo", func(c *gin.Context) {...})
	}
```

通常我们将路由分组用在划分业务逻辑或划分API版本时。

### 路由原理

Gin框架中的路由使用的是[httprouter](https://github.com/julienschmidt/httprouter)这个库。

其基本原理就是构造一个路由地址的前缀树。

  

### Handler处理器

路由需要传入两个参数，一个为路径，另一个为路由执行的方法，我们叫做它处理器 `Handler` ，而且，该参数是可变长参数。也就是说，可以传入多个 handler，形成一条 handler chain 。

同时对 handler 该函数有着一些要求，该函数需要传入一个 `Gin.Context` **指针**，同时要通过该指针进行值得处理。

Handler 函数可以对前端返回 字符串，Json，Html 等多种格式或形式文件。

  

我们已`GET`为例，其内部实现如下：

```go
func (group *RouterGroup) GET(relativePath string, handlers ...HandlerFunc) IRoutes {
	return group.handle(http.MethodGet, relativePath, handlers)
}
```

  

### 获取路由路径中的参数

#### 获取路径中的参数

获取路径中的参数用`context.Param`。在定义路由的时候用`/:`后面的符号是一个占位符，我们可以对该值进行传值。如下：

  

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	// 1、创建路由
	g := gin.Default()
	// 2、绑定路由规则，执行视图函数
	g.GET("/usr/:name", func(c *gin.Context) {
		// 获取值
		name := c.Param("name")
		// 3、返回值
		c.String(http.StatusOK,name)
	})
	// 4、开启监听
	g.Run(":8000")
}
```

  

然后我们在浏览器上输入如下地址`http://127.0.0.1:8000/usr/joker`，那么我们获取到的name就是joker，并返回给我们，如下：

![image.png](assets/go开发/第二种_gin路由/第二种_gin路由-1.png)

  

#### 获取queryString参数

`querystring`指的是URL中`?`后面携带的参数，例如：`/user/search?username=joker&age=30`。

获取请求的querystring参数的方法如下：

  

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	// 1、创建路由
	g := gin.Default()
	// 2、绑定路由规则，执行视图函数
	g.GET("/usr/:name", func(c *gin.Context) {
		// 获取值
		name := c.Param("name")
		username := c.Query("username")
		age := c.Query("age")
		// 3、返回值
		c.String(http.StatusOK,"name: "+name+" username: "+username+"age: "+age)
	})
	// 4、开启监听
	g.Run(":8000")
}
```

![image.png](assets/go开发/第二种_gin路由/第二种_gin路由-2.png)

  

还可以使用`DefaultQuery()`为没有设置参数的值设置一个默认值。

如下：

  

```go
username := c.DefaultQuery("username", "joker")
```

  

  

使用QueryArray()获取多个值。

```go
ids = c.QueryArrary("ids")
```

请求：http://127.0.0.1:8000/query?ids=1,2,3,4,5

  

使用QueryMap()获取Map类型的数据

```go
user = c.QueryMap("name")
```

请求：http://127.0.0.1:8000/query?user[name]=joker&user[age]=18