JWT是json web token的缩写，它将用户信息加密到token中，然后返回给client，client在下次请求的时候带上token即可。

  

## JWT的构成

##### Header

JWT的header由两部分组成：

-   类型
-   加密算法

  

##### Playload

playload可以填充两种类型数据

1.标准中注册的声明：

```katex
iss: 签发者
sub: 面向的用户
aud: 接收方
exp: 过期时间
nbf: 生效时间
iat: 签发时间
jti: 唯一身份标识
```

2.自定义数据

  

##### Signature

签名的算法：

```go
HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret
)
```

  

## 示例代码

##### 生成token

```go
// 加密的key
var jwtKey = []byte("secret_key")

type claims struct {
	UserID uint
	jwt.StandardClaims
}

// 生成token
func GenerateToken(user model.User)(string,error){
	expireTime := time.Now().Add(7*24*time.Hour)
	newClaim := claims{
		UserID:         user.ID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expireTime.Unix(),
			IssuedAt: time.Now().Unix(),
			Issuer: "joker",
			Subject: "user token",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,newClaim)
	tokenString,err := token.SignedString(jwtKey)
	if err != nil {
		return "",err
	}
	return tokenString, nil
}
```

  

##### 解析token

```go
// 解析Token
func ParseToken(tokenString string)(*jwt.Token,*claims,error){
	newClaim := &claims{}
	token, err := jwt.ParseWithClaims(tokenString,newClaim, func(token *jwt.Token) (i interface{}, err error) {
		return jwtKey,err
	})
	return token,newClaim,err
}
```

  

##### 注册或者登录的时候发放token

```go
func Register(ctx *gin.Context) {
	db := common.GetDB()
	// 获取注册数据
	name := ctx.PostForm("name")
	password := ctx.PostForm("password")
	telephone := ctx.PostForm("telephone")
	// 校验用户名、密码、手机号码
	// 手机号码必须是11位，如果手机号存在则返回已注册
	// 密码不能为空
	// 用户名如果为空，则生成十位随机字符串作为用户名

	if len(telephone) != 11 || len(telephone) == 0 {
		response.Response(ctx,http.StatusUnprocessableEntity, 422,nil,"手机号不能为空或者必须是11位")
		return
	}

	if len(password) == 0 {
		response.Response(ctx,http.StatusUnprocessableEntity, 422,nil,"密码不能为空")
		return
	}

	if len(name) == 0 {
		name = utils.RandomString(10)
		fmt.Println(name)
	}
	// 数据库中查找手机号是否存在，如果存在，则返回已注册
	if isTelephoneExist(db, telephone) {
		response.Response(ctx,http.StatusUnprocessableEntity, 422,nil,"手机号码已被注册")
		return
	}

	// 密码加密
	hasePassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		response.Response(ctx,http.StatusInternalServerError, 500,nil,"密码加密失败")
		return
	}
	// 开始注册
	newUser := model.User{
		UserName:  name,
		PassWord:  string(hasePassword),
		Telephone: telephone,
	}
	db.Create(&newUser)

	// 生成token
	token, err := common.GenerateToken(newUser)
	if err != nil {
		ctx.JSON(500, gin.H{
			"code": 500,
			"msg":  "系统错误",
		})
		response.Response(ctx,http.StatusInternalServerError, 500,nil,"系统错误")
		log.Println("generate token failed. err : " + err.Error())
		return
	}
	// 注册成功
	response.Success(ctx,gin.H{"token":token,},"注册成功")
}
```

  

##### 定义中间件来进行认证

```go
// 用户认证的中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// 从请求中获取Authorization
		tokenString := ctx.GetHeader("Authorization")
		fmt.Println(tokenString)
		// 判断Authorization是否合法
		if tokenString == "" || !strings.HasPrefix(tokenString, "Bearer"){
			ctx.JSON(http.StatusUnauthorized,gin.H{
				"code":401,
				"msg": "权限不足",
			})
			ctx.Abort()
			return
		}
		log.Println("Authorization 合法")
		// 解析Authorization
		tokenString = tokenString[7:]
		token, claims, err := common.ParseToken(tokenString)
		if err != nil || !token.Valid {
			ctx.JSON(http.StatusUnauthorized,gin.H{
				"code":401,
				"msg": "权限不足",
			})
			ctx.Abort()
			return
		}
		log.Println("token 解析成功")
		// 获取user信息
		userId := claims.UserID
		db := common.GetDB()
		var user model.User
		db.First(&user,userId)

		// 用户不存在，返回401
		if user.ID == 0{
			ctx.JSON(http.StatusUnauthorized,gin.H{
				"code":401,
				"msg": "权限不足",
			})
			ctx.Abort()
			return
		}
		// 用户存在，写入上下文
		ctx.Set("user",user)
		ctx.Next()
	}
}

```