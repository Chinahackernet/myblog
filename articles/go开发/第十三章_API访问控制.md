在开发完业务接口后，需要对API接口进行访问控制，以免所有接口直接暴露在外，非常不安全。

  

目前常见得API访问控制有两种方案：

-   OAuth 2.0
-   JWT

  

OAuth 2.0本质上是一个授权的行业标准协议，提供了一整套授权机制的指导标准，常用于使用第三方登录的情况。例如，在登录某些网站时，也可以用第三方站点（例如用微信、QQ、GitHub账号）关联登录，这些往往是用OAuth 2.0的标准实现的。OAuth 2.0 相对会“重”一些，常常还会授予第三方应用获取对应账号的个人基本信息等。

  

JWT与OAuth 2.0完全不同，它常用于前后端分离的情况，能够非常便捷地给API接口提供安全鉴权。

  

### JWT简介

JSON Web令牌（JWT）是一个开放标准（RFC7519），它定义了一种紧凑且自包含的方式，用于在各方之间以JSON对象安全地传输信息。由于此信息是经过数字签名的，因此可以被验证和信任。我们可以使用RSA或ECDSA的公用或专用密钥对JWT进行签名。

  

JWT是以紧凑的形式由三部分组成的，这三部分之间以点“.”分隔，组成“xxxxx.yyyyy.zzzzz”的格式，三个部分的含义如下：

-   Header：头部。
-   Payload：有效载荷。
-   Signature：签名。

  

#### Header

Header （头部）通常由两部分组成，分别是令牌的类型和所使用的签名算法（HMAC SHA256、RSA等），它们会组成一个JSON对象，用于描述其元数据，例如：

```go
{
    "alg": "HS256",
    "typ": "JWT"
}
```

在上述JSON对象中，alg字段用来表示使用的签名算法，默认是HMAC SHA256（HS256）。type字段用来表示使用的令牌类型，这里使用的是JWT。最后，用base64UrlEncode算法对上面的JSON对象进行转换，使其成为JWT的第一部分。

  

#### Payload

Payload（有效负载）是一个JSON对象，主要用于存储在JWT中实际传输的数据，代码如下（注意，这里只截选了部分代码）：

```go
{
    "sub": "123456",
    "name": "joker",
    "admin": "true"
}
```

参数有：

-    aud（Audience）：受众，即接受JWT的一方。
-   exp（ExpiresAt）：所签发的JWT过期时间，过期时间必须大于签发时间。
-   jti（JWT Id）：JWT的唯一标识。
-   iat（IssuedAt）：签发时间
-   iss（Issuer）：JWT的签发者。
-   nbf（Not Before）：JWT的生效时间，如果未到这个时间，则不可用。
-   sub（Subject）：主题。

  

同样，使用base64UrlEncode算法对该JSON对象进行转换，使其成为JWT Token的第二部分。需要注意的是，JWT 在转换时用的是base64UrlEncode 算法，而该算法是可逆的，因此一些敏感信息建议不要放到JWT中。如果一定要放，则应进行一定的加密处理。

  

#### Signature

Signature（签名）部分是对前面两个部分（Header+Payload）进行约定算法和规则的签名。签名一般用于校验消息在整个过程中有没有被篡改，并且对使用了私钥进行签名的令牌，它还可以验证JWT的发送者是否是它的真实身份。

  

在生成签名时，首先在应用程序中指定密钥（secret），然后使用传入的指定签名算法（默认是HMAC SHA256）通过下述签名方式生成Signature，代码如下：

```go
HMACSHA256{
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret
}
```

由此可以看出，JWT 的第三部分是由Header、Payload和secret的算法组成的，因而可以用来校验消息是否被篡改。因为一旦消息被篡改，Signature就无法对上。

  

#### Base64UrlEncode算法

Base64UrlEncode算法是Base64算法的变种。为什么要变呢？原因是JWT令牌经常被放在Header或Query Param中，即URL中。

  

而在URL中，一些个别字符是有特殊意义的，如“+”“/”“=”等。因此在Base64 UrlEncode算法中，会对其进行替换。例如，把“+”替换为“-”、把“/”替换为“\_”，而"=" 会被忽略处理，以此保证JWT令牌在URL中的可用性和准确性。

  

### JWT使用场景

首先，在内部约定好JWT令牌的交流方式，比如可以存储在Header、QueryParam、cookie或session 中，最常见的是存储在Header中。然后，服务器端提供一个获取JWT令牌的接口方法，返回给客户端使用。当客户端请求其余接口时，需要带上所签发的JWT令牌，而服务器端接口也会到约定位置获取JWT令牌进行鉴权处理。

  

### 安装JWT

首先拉取jwt-go库，该库提供了JWT的Go实现，能够便捷地提供JWT支持，然后执行如下命令：

```go
go get -u github.com/dgrijalva/jwt-go
```

  

### 配置JWT

#### 创建表

```sql
create table `auth` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `app_key` varchar(20) DEFAULT '' COMMENT 'key',
    `app_secret` varchar(50) DEFAULT '' COMMENT 'Secret',
    `created_on` int(10) unsigned default '0' comment '创建时间',
    `created_by` varchar(100) default '' comment '创建人',
    `modified_on` int(10) unsigned default '0' comment '修改时间',
    `modified_by` varchar(100) default '' comment '修改人',
    `deleted_on` int(10) unsigned default '0' comment '删除时间',
    `is_del` tinyint(3) unsigned default '0' comment '是否删除，0表示未删除，1表示删除', 
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT="认证管理";
```

  

新增一条测试数据：

```sql
INSERT INTO `blog_auth`(`id`, `app_key`, `app_secret`, `created_on`, `created_by`, `modified_on`, `modified_by`, `deleted_on`, `is_del`) VALUES (1, 'coolops', 'mysecret', 0, 'joker', 0, '', 0, 0);
```

  

#### 新建Model对象

```go
package model

import "github.com/jinzhu/gorm"

// 公共
type Model struct {
	ID         uint32 `gorm:"primary_key" json:"id"`
	CreatedBy  string `json:"created_by"`
	ModifiedBy string `json:"modified_by"`
	CreatedOn  uint32 `json:"created_on"`
	ModifiedOn uint32 `json:"modified_on"`
	DeletedOn  uint32 `json:"deleted_on"`
	IsDel      uint8  `json:"is_del"`
}

// 认证
type Auth struct {
	*Model
	AppKey    string `json:"app_key"`
	AppSecret string `json:"app_secret"`
}

func (a Auth) TableName() string {
	return "auth"
}
```

  

#### 初始化配置

在配置文件config.yaml中新增JWT配置，如下：

```go
# 认证
JWT:
  Secret: mysecret
  Issuer: blog_service
  Expire: 7200
```

新增配置文件解析结构体，如下：

```go
// JWT配置
type JWTSettingS struct {
	Secret string
	Issuer string
	Expire time.Duration
}
```

将JWTSettingS加入全局配置中，如下：

```go
package global

// 全局配置文件
import "code.coolops.cn/blog_services/pkg/setting"

var (
	...
	JWTSetting      *setting.JWTSettingS
)
```

配置main.go，读取配置文件

```go
func setupSetting() error {
	setting, err := setting2.NewSetting()
	if err != nil {
		return err
	}
	......
	err = setting.ReadSection("JWT", &global.JWTSetting)
	if err != nil {
		return err
	}
	global.JWTSetting.Expire *= time.Second
	return nil
}
```

需要注意的是，千万不要把Secret暴露给外部，即只能让服务器端知道，否则一旦被解密出来，会非常危险。

  

### 处理JWT令牌

虽然jwt-go库能够快捷地处理JWT令牌相关的行为，但是仍需要根据项目特性对其进行设计。简单来讲，就是组合其提供的API，设计鉴权场景。

  

打开pkg/app并创建jwt.go文件，写下如下代码：

```go
package app

import (
	"code.coolops.cn/blog_services/global"
	"code.coolops.cn/blog_services/pkg/util"
	"github.com/dgrijalva/jwt-go"
	"time"
)

type Claims struct {
	AppKey    string `json:"app_key"`
	AppSecret string `json:"app_secret"`
	jwt.StandardClaims
}

func GetJWTSecret() []byte {
	return []byte(global.JWTSetting.Secret)
}
```

这里主要涉及JWT的一些基本属性。第一个是GetJWTSecret方法，它用于获取该项目的JWT Secret，目前我们使用的是默认配置的Secret。第二个是Claims结构体，它分为两大块：第一块是嵌入的AppKey和AppSecret，用于我们自定义的认证信息；第二块是jwt.StandardClaims结构体，它是在jwt-go库中预定义的，涉及的字段如下：

```go
type StandardClaims struct {
	Audience  string `json:"aud,omitempty"`
	ExpiresAt int64  `json:"exp,omitempty"`
	Id        string `json:"jti,omitempty"`
	IssuedAt  int64  `json:"iat,omitempty"`
	Issuer    string `json:"iss,omitempty"`
	NotBefore int64  `json:"nbf,omitempty"`
	Subject   string `json:"sub,omitempty"`
}
```

这些字段都是非强制性的，但官方建议使用预定义权利要求，能够提供一组有用的、可相互操作的约定。

  

然后写下如下代码：

```go
// 生成Token
func GenerateToken(appKey, appSecret string) (string, error) {
	nowTime := time.Now()
	expireTime := nowTime.Add(global.JWTSetting.Expire)
	claims := Claims{
		AppKey:    util.EncodeMD5(appKey),
		AppSecret: util.EncodeMD5(appSecret),
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expireTime.Unix(),
			Issuer:    global.JWTSetting.Issuer,
		},
	}
	tokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := tokenClaims.SignedString(GetJWTSecret())
	return token, err
}

// 校验Token
func ParseToken(token string) (*Claims, error) {
	tokenClaims, err := jwt.ParseWithClaims(token, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return GetJWTSecret(), nil
	})
	if tokenClaims != nil {
		claims, ok := tokenClaims.Claims.(*Claims)
		if ok && tokenClaims.Valid {
			return claims, nil
		}
	}
	return nil, err
}
```

GenerateToken方法的主要功能是生成JWT Token，其流程是根据客户端传入的AppKey和AppSecret，以及在项目配置中设置的签发者（Issuer）和过期时间（ExpiresAt），根据指定的算法生成签名后的Token。这其中涉及两个内部方法，具体如下。

-   jwt.NewWithClaims：根据Claims结构体创建Token实例。它一共包含两个形参，第一个形参是 SigningMethod，其包含 SigningMethodHS256、SigningMethodHS384 和SigningMethodHS512三种crypto.Hash加密算法的方案。第二个形参是Claims，主要用于传递用户预定义的一些权利要求，以便后续的加密、校验等行为。
-   tokenClaims.SignedString：生成签名字符串，根据传入的 Secret，进行签名并返回标准的Token。

  

ParseToken方法的主要的功能是解析和校验Token，其流程是解析传入的Token，然后根据Claims的相关属性要求进行校验。这其中涉及两个内部方法，具体如下。

-   ParseWithClaims：用于解析鉴权的声明，方法内部是具体的解码和校验的过程，最终返回\*Token。
-   Valid：验证基于时间的声明，如过期时间（ExpiresAt）、签发者（Issuer）、生效时间（Not Before）。需要注意的是，即便在令牌中没有任何声明，也仍然被认为是有效的。

  

至此我们介绍了JWT令牌的生成、解析和校验的方法，在后续应用中间件时，会对其进行调用，使其能够在应用程序中将一整套的动作串联起来。

  

### 获取JWT令牌

#### 新增Model方法

为了获取令牌信息，需要新增Model方法，如下：

```go
func (a Auth) Get(db *gorm.DB) (Auth, error) {
	var auth Auth
	db = db.Where(
		"app_key = ? AND app_secret = ? AND is_del = ?",
		a.AppKey, a.AppSecret, 0,
	)
	err := db.First(&auth).Error
	if err != nil {
		return auth, err
	}
	return auth, nil
}
```

上述方法主要用于服务器端在获取客户端传入的 app\_key 和 app\_secret 后，根据传入的认证信息进行验证，以此判别是否真的存在这样一条数据。

  

#### 新增dao方法

```go
package dao

import "code.coolops.cn/blog_services/internal/model"

func (d *Dao) GetAuth(appKey, appSecret string) (model.Auth, error) {
	auth := model.Auth{
		AppKey:    appKey,
		AppSecret: appSecret,
	}
	return auth.Get(d.engine)
}
```

  

#### 新增service方法

新增service方法，对基本逻辑进行处理。

```go
package service

import "errors"

type AuthRequest struct {
	AppKey    string `form:"app_key" binding:"required"`
	AppSecret string `form:"app_secret" binding:"required"`
}

func (s *Service) CheckAuth(param *AuthRequest) error {
	auth, err := s.dao.GetAuth(param.AppKey, param.AppSecret)
	if err != nil {
		return err
	}
	if auth.ID > 0 {
		return nil
	}
	return errors.New("auth info does not exist")
}

```

在上述代码中，我们声明了AuthRequest结构体，用于接口入参的校验。AppKey和AppSecret都设置为必填项。在CheckAuth方法中，我们使用客户端传入的认证信息作为筛选条件获取数据行，根据是否取到认证信息ID判定认证信息ID是否存在。

  

#### 新增路由方法

```go
package api

import (
	"code.coolops.cn/blog_services/global"
	"code.coolops.cn/blog_services/internal/service"
	"code.coolops.cn/blog_services/pkg/app"
	"code.coolops.cn/blog_services/pkg/errcode"
	"github.com/gin-gonic/gin"
)

func GetAuth(ctx *gin.Context) {
	param := service.AuthRequest{
		AppKey: ctx.GetHeader("app_key"),
		AppSecret: ctx.GetHeader("app_secret"),
	}
	response := app.Response{Ctx: ctx}
	valid, errs := app.BindAndValid(ctx, &param)
	if !valid {
		global.Logger.ErrorF("app.BindAndValid err: %v", errs)
		response.ToErrorResponse(errcode.InvalidParams.WithDetails(errs.Errors()...))
		return
	}

	svc := service.NewService(ctx)
	err := svc.CheckAuth(&param)
	if err != nil {
		global.Logger.ErrorF("svc.CheckAuth err: %v", err)
		response.ToErrorResponse(errcode.UnauthorizedAuthNotExist)
		return
	}

	token, err := app.GenerateToken(param.AppKey, param.AppSecret)
	if err != nil {
		global.Logger.ErrorF("app.GenerateToken err: %v", err)
		response.ToErrorResponse(errcode.UnauthorizedTokenGenerate)
		return
	}
	response.ToResponse(gin.H{
		"token": token,
	})
}
```

这部分的主要逻辑是在校验及获取入参后，通过Query获取的app\_key和app\_secrect进行数据库查询，检查认证信息是否存在，若存在则进行Token的生成并返回。

  

然后新增路由：

```go
r.POST("/auth", api.GetAuth)
```

#### 接口验证

启动服务，使用postman进行验证，如下：

![image.png](assets/go开发/第十三章_API访问控制/第十三章_API访问控制-1.png)

  

### 处理应用中间件

#### 编写JWT中间件

虽然能获取Token了，但是对于其他的业务接口，它还没产生任何作用，应如何将整个应用流程串联起来呢？此时就涉及特定类别的接口统一处理了，即选择应用中间件的方式。打开internal/middleware，新建jwt.go文件，写入如下代码：

```go
package middleware

import (
	"code.coolops.cn/blog_services/pkg/app"
	"code.coolops.cn/blog_services/pkg/errcode"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

func JWT() gin.HandlerFunc  {
	return func(ctx *gin.Context) {
		var (
			token string
			ecode = errcode.Success
		)
		if s,exist:=ctx.GetQuery("token");exist{
			token = s
		}else {
			token = ctx.GetHeader("token")
		}
		if token == ""{
			ecode = errcode.InvalidParams
		}else {
			_, err := app.ParseToken(token)
			if err != nil {
				switch err.(*jwt.ValidationError).Errors {
				case jwt.ValidationErrorExpired:
					ecode = errcode.UnauthorizedTokenTimeout
				default:
					ecode = errcode.UnauthorizedTokenError
				}
			}
		}
		if ecode != errcode.Success{
			response := app.NewResponse(ctx)
			response.ToErrorResponse(ecode)
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}

```

在上述代码中，我们通过GetHeader方法从Header中获取token参数，并调用ParseToken对其进行解析，再根据返回的错误类型进行断言，其返回的错误类型所包含的场景如下：

```go
const (
	ValidationErrorMalformed        uint32 = 1 << iota // Token is malformed
	ValidationErrorUnverifiable                        // Token could not be verified because of signing problems
	ValidationErrorSignatureInvalid                    // Signature validation failed

	// Standard Claim validation errors
	ValidationErrorAudience      // AUD validation failed
	ValidationErrorExpired       // EXP validation failed
	ValidationErrorIssuedAt      // IAT validation failed
	ValidationErrorIssuer        // ISS validation failed
	ValidationErrorNotValidYet   // NBF validation failed
	ValidationErrorId            // JTI validation failed
	ValidationErrorClaimsInvalid // Generic claims validation error
)
```

  

#### 接入JWT中间件

在编写完JWT的中间件后，我们需要将其接入应用流程中。需要注意的是，并非所有的接口都需要用到JWT中间件，因此我们需要利用gin中的分组路由的概念，只对apiv1的路由分组进行JWT中间件的引用。也就是说，只有apiv1路由分组里的路由方法会受此中间件的约束，代码如下：

```go
apiv1 := r.Group("/api/v1")
	apiv1.Use(middleware.JWT())
		{
		apiv1.POST("/tags", tag.Create)
		apiv1.DELETE("/tags/:id", tag.Delete)
		apiv1.PUT("/tags/:id", tag.Update)
		apiv1.PATCH("/tags/:id/state", tag.Update)
		apiv1.GET("/tags", tag.List)
	}
	return r
```

  

#### 验证

（1）没加Token

![image.png](assets/go开发/第十三章_API访问控制/第十三章_API访问控制-2.png)

（2）加入错误Token

![image.png](assets/go开发/第十三章_API访问控制/第十三章_API访问控制-3.png)

（3）加入正确Token

![image.png](assets/go开发/第十三章_API访问控制/第十三章_API访问控制-4.png)

  

### JWT反向解密

JWT 令牌的内容是非严格加密的。也就是说，对JWT 令牌机制有一定了解的人可以进行反向解密.

  

调用接口/auth获取到Token，如下：

```go
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiYjdkZjVhOTMyYzk4OTBlMzE2OTZhNzFkMmNiNTJhMTIiLCJhcHBfc2VjcmV0IjoiMDZjMjE5ZTViYzgzNzhmM2E4YTNmODNiNGI3ZTQ2NDkiLCJleHAiOjE2MTI0Mjk2OTMsImlzcyI6ImJsb2dfc2VydmljZSJ9.Q6OH9wPSkO-V7smeo6FEaHRPSMyvhYjQVL4oE3rqW5Q"
}
```

针对新获取的Token值，手动复制中间一段（即Payload），编写一个测试Demo进行base64的解码。Demo代码如下：

```go
package main

import (
	"encoding/base64"
	"fmt"
)

func main() {
	paylod, _ := base64.StdEncoding.DecodeString("eyJhcHBfa2V5IjoiYjdkZjVhOTMyYzk4OTBlMzE2OTZhNzFkMmNiNTJhMTIiLCJhcHBfc2VjcmV0IjoiMDZjMjE5ZTViYzgzNzhmM2E4YTNmODNiNGI3ZTQ2NDkiLCJleHAiOjE2MTI0MzA4ODYsImlzcyI6ImJsb2dfc2VydmljZSJ9")
	fmt.Println(string(paylod))
}
```

  

运行后得到如下代码：

```go
{"app_key":"b7df5a932c9890e31696a71d2cb52a12","app_secret":"06c219e5bc8378f3a8a3f83b4b7e4649","exp":1612430886,"iss":"blog_service"}
```

可以看到，假设有人拦截到Token后，是可以通过解密该Token来获取Payload信息的。也就是说，在 Payload 中不应该明文存储重要的信息，若一定要存，则必须进行不可逆加密，以确保信息的安全性。

  

过期时间是存储在Payload中的，也就是说，JWT令牌一旦签发，在没有做特殊逻辑的情况下，过期时间是不可以再度变更的，因此请务必根据实际项目情况进行设计。

  

> 文章来自《Go语言编程之旅》