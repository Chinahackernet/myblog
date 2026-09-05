## Casbin是什么

Casbin是一个强大的、高效的开源访问控制框架，其权限管理机制支持多种访问控制模型，Casbin只负责访问控制[1]。

  

其功能有：

-   支持自定义请求的格式，默认的请求格式为`{subject, object, action}`。
-   具有访问控制模型model和策略policy两个核心概念。
-   支持RBAC中的多层角色继承，不止主体可以有角色，资源也可以具有角色。
-   支持内置的超级用户 例如：`root`或`administrator`。超级用户可以执行任何操作而无需显式的权限声明。
-   支持多种内置的操作符，如 `keyMatch`，方便对路径式的资源进行管理，如 `/foo/bar` 可以映射到 `/foo*`

  

## Casbin的工作原理

在 Casbin 中, 访问控制模型被抽象为基于 `**PERM**` (Policy, Effect, Request, Matcher) [策略，效果，请求，匹配器]的一个文件。

-   Policy：定义权限的规则
-   Effect：定义组合了多个Policy之后的结果
-   Request：访问请求
-   Matcher：判断Request是否满足Policy

  

首先会定义一堆Policy，让后通过Matcher来判断Request和Policy是否匹配，然后通过Effect来判断匹配结果是Allow还是Deny。

  

## Casbin的核心概念

### Model

Model是Casbin的具体访问模型，其主要以文件的形式出现，该文件常常以`.conf`最为后缀。

  

-   Model CONF 至少应包含四个部分: `[request_definition]`, `[policy_definition]`, `[policy_effect]`, `[matchers]`。
-   如果 model 使用 RBAC, 还需要添加`[role_definition]`部分。
-   Model CONF 文件可以包含注释。注释以 # 开头， # 会注释该行剩余部分。  
      
    

比如：

```yaml
# Request定义
[request_definition]
r = sub, obj, act

# 策略定义
[policy_definition]
p = sub, obj, act

# 角色定义
[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

# 匹配器定义
[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

  

-   request\_definition：用于request的定义，它明确了e.Enforce(...)函数中参数的定义，`sub, obj, act` 表示经典三元组: 访问实体 (Subject)，访问资源 (Object) 和访问方法 (Action)。
-   policy\_definition：用于policy的定义，每条规则通常以形如`p`的`policy type`开头，比如`p,joker,data1,read`就是一条joker具有data1读权限的规则。
-   role\_definition：是RBAC角色继承关系的定义。`g` 是一个 RBAC系统，`_, _`表示角色继承关系的前项和后项，即前项继承后项角色的权限。
-   policy\_effect：是对policy生效范围的定义，它对request的决策结果进行统一的决策，比如`e = some(where (p.eft == allow))`就表示如果存在任意一个决策结果为`allow`的匹配规则，则最终决策结果为`allow`。`p.eft` 表示策略规则的决策结果，可以为`allow` 或者`deny`，当不指定规则的决策结果时,取默认值`allow` 。
-   matchers：定义了策略匹配者。匹配者是一组表达式，它定义了如何根据请求来匹配策略规则

  

### Policy

Policy主要表示访问控制关于角色、资源、行为的具体映射关系。

  

比如：

```yaml
p, alice, data1, read
p, bob, data2, write
p, data2_admin, data2, read
p, data2_admin, data2, write
g, alice, data2_admin
```

  

它的关系规则很简单，主要是选择什么方式来存储规则，目前官方提供`csv文件存储`和通过`adapter适配器`从其他存储系统中加载配置文件，比如MySQL, PostgreSQL, SQL Server, SQLite3,MongoDB,Redis,Cassandra DB等。

  

## 实践

### 创建项目

首先创建一个项目，叫casbin\_test。

  

项目里的目录结构如下：

```yaml
├─configs         # 配置文件
├─global				  # 全局变量
├─internal        # 内部模块
│  ├─dao					# 数据处理模块
│  ├─middleware   # 中间件
│  ├─model        # 模型层
│  ├─router       # 路由
│  │  └─api
│  │      └─v1    # 视图
│  └─service      # 业务逻辑层
└─pkg             # 内部模块包
    ├─app         # 应用包
    ├─errcode     # 错误代码包
    └─setting     # 配置包
```

  

下载依赖包，如下：

```yaml
go get -u github.com/gin-gonic/gin
# Go语言casbin的依赖包
go get github.com/casbin/casbin
# gorm 适配器依赖包
go get github.com/casbin/gorm-adapter
# mysql驱动依赖
go get github.com/go-sql-driver/mysql
# gorm 包
go get github.com/jinzhu/gorm
```

  

创建数据库，如下：

```sql
CREATE DATABASE `casbin_test` DEFAULT CHARACTER SET utf8;
GRANT Alter, Alter Routine, Create, Create Routine, Create Temporary Tables, Create View, Delete, Drop, Event, Execute, Index, Insert, Lock Tables, References, Select, Show View, Trigger, Update ON `casbin\_test`.* TO `ops`@`%`;
FLUSH PRIVILEGES;
DROP TABLE IF EXIST `casbin_rule`;
CREATE TABLE `casbin_rule` (
  `p_type` varchar(100) DEFAULT NULL COMMENT '规则类型',
  `v0` varchar(100) DEFAULT NULL COMMENT '角色ID',
  `v1` varchar(100) DEFAULT NULL COMMENT 'api路径',
  `v2` varchar(100) DEFAULT NULL COMMENT 'api访问方法',
  `v3` varchar(100) DEFAULT NULL,
  `v4` varchar(100) DEFAULT NULL,
  `v5` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='权限规则表';
/*插入操作casbin api的权限规则*/
INSERT INTO `casbin_rule`(`p_type`, `v0`, `v1`, `v2`) VALUES ('p', 'admin', '/api/v1/casbin', 'POST');
INSERT INTO `casbin_rule`(`p_type`, `v0`, `v1`, `v2`) VALUES ('p', 'admin', '/api/v1/casbin/list', 'GET');
```

  

### 代码开发

由于代码比较多，这里就不贴全部代码了，全部代码已经放在gitee仓库[3]，可以自行阅读，这些仅仅贴部分关键代码。

  

（1）首先在`configs`目录下创建`rbac_model.conf`文件，写入如下代码：

```go
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && ParamsMatch(r.obj,p.obj) && r.act == p.act
```

（2）在`internal/model`目录下，创建`casbin.go`文件，写入如下代码：

```go
type CasbinModel struct {
	PType  string `json:"p_type" gorm:"column:p_type" description:"策略类型"`
	RoleId string `json:"role_id" gorm:"column:v0" description:"角色ID"`
	Path   string `json:"path" gorm:"column:v1" description:"api路径"`
	Method string `json:"method" gorm:"column:v2" description:"访问方法"`
}

func (c *CasbinModel) TableName() string {
	return "casbin_rule"
}

func (c *CasbinModel) Create(db *gorm.DB) error {
	e := Casbin()
	if success := e.AddPolicy(c.RoleId,c.Path,c.Method); success == false {
		return errors.New("存在相同的API，添加失败")
	}
	return nil
}

func (c *CasbinModel) Update(db *gorm.DB, values interface{}) error {
	if err := db.Model(c).Where("v1 = ? AND v2 = ?", c.Path, c.Method).Update(values).Error; err != nil {
		return err
	}
	return nil
}

func (c *CasbinModel) List(db *gorm.DB) [][]string {
	e := Casbin()
	policy := e.GetFilteredPolicy(0, c.RoleId)
	return policy
}

//@function: Casbin
//@description: 持久化到数据库  引入自定义规则
//@return: *casbin.Enforcer
func Casbin() *casbin.Enforcer {
	s := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=%s&parseTime=%t&loc=Local",
		global.DatabaseSetting.Username,
		global.DatabaseSetting.Password,
		global.DatabaseSetting.Host,
		global.DatabaseSetting.DBName,
		global.DatabaseSetting.Charset,
		global.DatabaseSetting.ParseTime,
	)
	db, _ := gorm.Open(global.DatabaseSetting.DBType, s)

	adapter := gormadapter.NewAdapterByDB(db)
	enforcer := casbin.NewEnforcer(global.CasbinSetting.ModelPath, adapter)
	enforcer.AddFunction("ParamsMatch", ParamsMatchFunc)
	_ = enforcer.LoadPolicy()
	return enforcer
}

//@function: ParamsMatch
//@description: 自定义规则函数
//@param: fullNameKey1 string, key2 string
//@return: bool
func ParamsMatch(fullNameKey1 string, key2 string) bool {
	key1 := strings.Split(fullNameKey1, "?")[0]
	// 剥离路径后再使用casbin的keyMatch2
	return util.KeyMatch2(key1, key2)
}

//@function: ParamsMatchFunc
//@description: 自定义规则函数
//@param: args ...interface{}
//@return: interface{}, error
func ParamsMatchFunc(args ...interface{}) (interface{}, error) {
	name1 := args[0].(string)
	name2 := args[1].(string)

	return ParamsMatch(name1, name2), nil
}
```

（3）在`internal/dao`目录下创建`casbin.go`，写入如下代码：

```go
func (d *Dao) CasbinCreate(roleId string, path, method string) error {
	cm := model.CasbinModel{
		PType:  "p",
		RoleId: roleId,
		Path:   path,
		Method: method,
	}
	return cm.Create(d.engine)
}

func (d *Dao) CasbinList(roleID string) [][]string {
	cm := model.CasbinModel{RoleId: roleID}
	return cm.List(d.engine)
}
```

（4）在`internal/service`目录下创建`service.go`，写入如下代码：

```go
type CasbinInfo struct {
	Path   string `json:"path" form:"path"`
	Method string `json:"method" form:"method"`
}
type CasbinCreateRequest struct {
	RoleId      string       `json:"role_id" form:"role_id" description:"角色ID"`
	CasbinInfos []CasbinInfo `json:"casbin_infos" description:"权限模型列表"`
}

type CasbinListResponse struct {
	List []CasbinInfo `json:"list" form:"list"`
}

type CasbinListRequest struct {
	RoleID string `json:"role_id" form:"role_id"`
}

func (s Service) CasbinCreate(param *CasbinCreateRequest) error {
	for _, v := range param.CasbinInfos {
		err := s.dao.CasbinCreate(param.RoleId, v.Path, v.Method)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s Service) CasbinList(param *CasbinListRequest) [][]string {
	return s.dao.CasbinList(param.RoleID)
}
```

（5）在`internal/router/api/v1`目录下创建`casbin.go`，写入如下代码：

```go
type Casbin struct {
}

func NewCasbin() Casbin {
	return Casbin{}
}

// Create godoc
// @Summary 新增权限
// @Description 新增权限
// @Tags 权限管理
// @Produce json
// @Security ApiKeyAuth
// @Param body body service.CasbinCreateRequest true "body"
// @Success 200 {object} string "成功"
// @Failure 400 {object} errcode.Error "请求错误"
// @Failure 500 {object} errcode.Error "内部错误"
// @Router /api/v1/casbin [post]
func (c Casbin) Create(ctx *gin.Context) {
	param := service.CasbinCreateRequest{}
	response := app.NewResponse(ctx)
	valid, errors := app.BindAndValid(ctx, &param)
	if !valid {
		log.Printf("app.BindAndValid errs: %v", errors)
		errRsp := errcode.InvalidParams.WithDetails(errors.Errors()...)
		response.ToErrorResponse(errRsp)
		return
	}

	// 进行插入操作
	svc := service.NewService(ctx)
	err := svc.CasbinCreate(&param)
	if err != nil {
		log.Printf("svc.CasbinCreate err: %v", err)
		response.ToErrorResponse(errcode.ErrorCasbinCreateFail)
	}
	response.ToResponse(gin.H{})
	return
}

// List godoc
// @Summary 获取权限列表
// @Produce json
// @Tags 权限管理
// @Security ApiKeyAuth
// @Param data body service.CasbinListRequest true "角色ID"
// @Success 200 {object} service.CasbinListResponse "成功"
// @Failure 400 {object} errcode.Error "请求错误"
// @Failure 500 {object} errcode.Error "内部错误"
// @Router /api/v1/casbin/list [post]
func (c Casbin) List(ctx *gin.Context) {
	param := service.CasbinListRequest{}
	response := app.NewResponse(ctx)
	valid, errors := app.BindAndValid(ctx, &param)
	if !valid {
		log.Printf("app.BindAndValid errs: %v", errors)
		errRsp := errcode.InvalidParams.WithDetails(errors.Errors()...)
		response.ToErrorResponse(errRsp)
		return
	}
	// 业务逻辑处理
	svc := service.NewService(ctx)
	casbins := svc.CasbinList(&param)
	var respList []service.CasbinInfo
	for _, host := range casbins {
		respList = append(respList, service.CasbinInfo{
			Path:   host[1],
			Method: host[2],
		})
	}
	response.ToResponseList(respList, 0)
	return
}
```

再在该目录下创建一个`test.go`文件，用于测试，代码如下：

```go
type Test struct {
}

func NewTest() Test {
	return Test{}
}

func (t Test) Get(ctx *gin.Context) {
	log.Println("Hello 接收到GET请求..")
	response := app.NewResponse(ctx)
	response.ToResponse("接收GET请求成功")
}
```

（6）在`internal/middleware`目录下创建`casbin_handler.go`，写入如下代码：

```go
func CasbinHandler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		response := app.NewResponse(ctx)
		// 获取请求的URI
		obj := ctx.Request.URL.RequestURI()
		// 获取请求方法
		act := ctx.Request.Method
		// 获取用户的角色
		sub := "admin"
		e := model.Casbin()
		fmt.Println(obj, act, sub)
		// 判断策略中是否存在
		success := e.Enforce(sub, obj, act)
		if success {
			log.Println("恭喜您,权限验证通过")
			ctx.Next()
		} else {
			log.Printf("e.Enforce err: %s", "很遗憾,权限验证没有通过")
			response.ToErrorResponse(errcode.UnauthorizedAuthFail)
			ctx.Abort()
			return
		}
	}
}
```

（7）在`internal/router`目录下创建`router.go`，定义路由，代码如下：

```go
func NewRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	casbin := v1.NewCasbin()
	test := v1.NewTest()
	apiv1 := r.Group("/api/v1")
	apiv1.Use(middleware.CasbinHandler())
	{
		// 测试路由
		apiv1.GET("/hello", test.Get)

		// 权限策略管理
		apiv1.POST("/casbin", casbin.Create)
		apiv1.POST("/casbin/list", casbin.List)
	}
	return r
}
```

最后就启动项目进行测试。

### 验证

（1）首先访问测试路径，当前情况下没在权限表里，如下：

![image.png](assets/go开发/第十七章_集成Casbin进行访问权限控制/第十七章_集成Casbin进行访问权限控制-1.png)

  

（2）将测试路径添加到权限列表，如下：

![image.png](assets/go开发/第十七章_集成Casbin进行访问权限控制/第十七章_集成Casbin进行访问权限控制-2.png)

（3）然后再次访问测试路径，如下：

![image.png](assets/go开发/第十七章_集成Casbin进行访问权限控制/第十七章_集成Casbin进行访问权限控制-3.png)

并且从日志上也可以看到，如下：

![image.png](assets/go开发/第十七章_集成Casbin进行访问权限控制/第十七章_集成Casbin进行访问权限控制-4.png)

  

## 参考文档：

[1] [https://casbin.org/](https://casbin.org/)

[2] [https://casbin.org/docs/zh-CN/overview](https://casbin.org/docs/zh-CN/overview)

[3] [https://gitee.com/coolops/casbin\_test.git](https://gitee.com/coolops/casbin_test.git)