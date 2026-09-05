Swagger是基于标准的OpenAPI规范进行设计的。只要按照这套规范编写注解或通过扫描代码生成注解，就能生成统一标准的接口文档和一系列Swagger工具。

  

## 安装

在项目目录下：

```go
go get -u github.com/swaggo/swag/cmd/swag
go get -u github.com/swaggo/gin-swagger
go get -u github.com/swaggo/files
go get -u github.com/alecthomas/template
```

  

验证是否安装成功。

```go
>swag -v
swag version v1.7.0
```

  

## 写入注解

在安装完Swagger关联库后，就需要项目里的API接口编写注解，以便后续在生成时能够正确地运行。

比如：

<table class="lake-table" style="width: 830px;"><colgroup><col span="1" width="159" /><col span="1" width="671" /></colgroup><tbody><tr style="height: 33px;"><td><p data-lake-id="d4a7d011ba258ee4b4c673b682f104d5"> 注解 </p></td><td><p data-lake-id="3afa47e6d39e8231f7f0a74a26c86787"> 描述 </p></td></tr><tr style="height: 33px;"><td><p data-lake-id="b2e6b668ff1b9a9aa2c080e617e79de4_p_0">@Summary</p></td><td><p data-lake-id="a6e5e54fbd1a6a759ab4854adf387653_p_0">摘要</p></td></tr><tr style="height: 33px;"><td><p data-lake-id="b2e6b668ff1b9a9aa2c080e617e79de4_p_0">@Produce</p></td><td><p data-lake-id="b4b2d3a713edf23cf543dcc07f041f75_p_0">API可以产生的MIME类型的列表，可以将MIME简单理解为响应类型，例如JSON、XML、HTML等</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="b2e6b668ff1b9a9aa2c080e617e79de4_p_0">@Tags</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="520f42f3293818f927861ebbd5b15da4_p_0">给API分组</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="a012f9aafb1deae24f035fb04a75825c_p_0">@Param</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="828d807e7c3e4f30810d7c6bb0e7e830_p_0">参数格式，从左到右分别为：参数名，参数类型，数据类型，是否必填，注释</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="b2e6b668ff1b9a9aa2c080e617e79de4_p_0">@Success</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="6ba16b2e59fc8b15b80b26d66ca6fd9c_p_0">响应成功，从左到右分别为：状态码，参数类型，数据类型，注释</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="b2e6b668ff1b9a9aa2c080e617e79de4_p_0">@Failure</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="6ba16b2e59fc8b15b80b26d66ca6fd9c_p_0">响应失败，从左到右分别为：状态码，参数类型，数据类型，注释</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="b2e6b668ff1b9a9aa2c080e617e79de4_p_0">@Router</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #404040;"><p data-lake-id="dccef6bb31d7dbc4d0fdde99d742d42b_p_0">路由，从左到右分别问：路由地址，HTTP方法</p></td></tr></tbody></table>

  

比如Tag的API：

```go
type Tag struct {
}

func NewTag() Tag {
	return Tag{}
}

func (t Tag) Get(ctx *gin.Context) {}

// @Summary 获取多个标签
// @Produce json
// @Tags 标签
// @Param name query string false "标签名称" maxlength(100)
// @Param state query int false "状态" Enums(0, 1) default(1)
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} model.TagSwagger "成功"
// @Failure 400 {object} errcode.Error "请求错误"
// @Failure 500 {object} errcode.Error "内部错误"
// @Router /api/v1/tags [get]
func (t Tag) List(ctx *gin.Context) {}

// @Summary 新增标签
// @Produce json
// @Tags 标签
// @Param name body string true "标签名称" minlength(3) maxlength(100)
// @Param state body int false "状态" Enums(0, 1) default(1)
// @Param created_by body string true "创建者" minlength(3) maxlength(100)
// @Success 200 {object} model.Tag "成功"
// @Failure 400 {object} errcode.Error "请求错误"
// @Failure 500 {object} errcode.Error "内部错误"
// @Router /api/v1/tags [post]
func (t Tag) Create(ctx *gin.Context) {}

// @Summary 更新标签
// @Produce json
// @Tags 标签
// @Param id path int true "标签ID"
// @Param name body string true "标签名称" minlength(3) maxlength(100)
// @Param state body int false "状态" Enums(0, 1) default(1)
// @Param modified_by body string true "修改者" minlength(3) maxlength(100)
// @Success 200 {array} model.Tag "成功"
// @Failure 400 {object} errcode.Error "请求错误"
// @Failure 500 {object} errcode.Error "内部错误"
// @Router /api/v1/tags/{id} [put]
func (t Tag) Update(ctx *gin.Context) {}

// @Summary 删除标签
// @Produce json
// @Tags 标签
// @Param id path int true "标签ID"
// @Success 200 {object} model.Tag "成功"
// @Failure 400 {object} errcode.Error "请求错误"
// @Failure 500 {object} errcode.Error "内部错误"
// @Router /api/v1/tags/{id} [delete]
func (t Tag) Delete(ctx *gin.Context) {}

```

  

然后配置MAIN方法

```go
// @title 博客系统
// @version 1.0
// @description 简单的博客系统
// @termsOfService https://github.com/qiaokebaba/blog_service

func main() {
	gin.SetMode(global.ServerSetting.RunMode)
	router := routers.NewRouter()
	s := &http.Server{
		Addr:              ":" + global.ServerSetting.HttpPort,
		Handler:           router,
		TLSConfig:         nil,
		ReadTimeout:       global.ServerSetting.ReadTimeout,
		ReadHeaderTimeout: 0,
		WriteTimeout:      global.ServerSetting.WriteTimeout,
		IdleTimeout:       0,
		MaxHeaderBytes:    1 << 20,
		TLSNextProto:      nil,
		ConnState:         nil,
		ErrorLog:          nil,
		BaseContext:       nil,
		ConnContext:       nil,
	}
	//global.Logger.Info("服务器启动成功，监听：")
	_ = s.ListenAndServe()

}
```

  

## 生成swagger文件

在编写完或更新完注解后，在项目跟目录下，执行以下命令：

```go
> swag init
2021/02/03 11:43:40 Generate swagger docs....
2021/02/03 11:43:40 Generate general API Info, search dir:./
2021/02/03 11:43:41 Generating model.Tag
2021/02/03 11:43:41 Generating model.Model
2021/02/03 11:43:41 Generating errcode.Error
2021/02/03 11:43:41 create docs.go at docs\docs.go
2021/02/03 11:43:41 create swagger.json at docs\swagger.json
2021/02/03 11:43:41 create swagger.yaml at docs\swagger.yaml

```

可以看到在docs目录下，分别生成了`docs.go`、`swagger.json`、`swagger.yaml`文件。

  

## 添加访问路由

如何访问接口文件呢？直接添加一个路由即可，比如：

```go
import (
	_ "code.coolops.cn/blog_services/docs"
	v1 "code.coolops.cn/blog_services/internal/routers/api/v1"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	article := v1.NewArticle()
	tag := v1.NewTag()
	apiv1 := r.Group("/api/v1")
	{
		apiv1.POST("/tags", tag.Create)
		apiv1.DELETE("/tags/:id", tag.Delete)
		apiv1.PUT("/tags/:id", tag.Update)
		apiv1.PATCH("/tags/:id/state", tag.Update)
		apiv1.GET("/tags", tag.Get)
	}
	return r
}

```

  

## 查看接口文档

路由配置完成后，启动项目，即可在浏览器访问：`http://127.0.0.1:8080/swagger/index.html`，如下：

![image.png](assets/go开发/第十二章_Swagger/第十二章_Swagger-1.png)

  

## 不定类型

在实际编写代码中，我们常常会遇到某个对象内的某个字段是interface，并且这个字段的类型是不定的，即公共结构体，比如：

```go
type Test struct{
	Username string
    Content interface{}
}
```

对于这种方式的，就没有特别好的注解方式，官方给出的建议是就是定义一个针对 Swagger 的对象，专门用于Swagger接口文档的展示。

  

比如：

```go
type TagSwagger struct {
	List []*Tag
	Pager *app.Pager
}
```

  

然后将注解处改为如下：

```go
// @Success 200 {object} model.TagSwagger "成功"
```

  

然后重新生成文件，只需执行以下命令

```go
swag init
```

  

最后的效果如下：

![image.png](assets/go开发/第十二章_Swagger/第十二章_Swagger-2.png)