# FastAPI用户认证

> 分类：Python / 第12章：FastAPI
> 原文：https://www.cuiliangblog.cn/detail/section/245285360
> 来源：崔亮的博客

---

# 用户认证介绍
## 用户认证 vs. 用户授权
在开始之前，先简单区分两个概念：

| 概念 | 说明 |
| --- | --- |
| 认证（Authentication） | 判断你是谁，即“你是否已登录” |
| 授权（Authorization） | 判断你是否有权限做某事，例如“你是否可以删除某条记录” |


本节聚焦在用户认证。

## OAuth2 密码模式 + JWT 简介
FastAPI 支持 OAuth2 多种认证方式，这里我们选择最常见也最易上手的一种：OAuth2 密码模式 + JWT 令牌。

它的基本流程如下：

1. 用户通过用户名和密码登录；
2. 后端验证通过后，返回一个签名的 JWT access token；
3. 前端保存该 token，并在后续请求中通过 `Authorization: Bearer <token>` 携带；
4. 后端验证 token 后允许访问受保护资源。

## OAuth2 是什么
OAuth2 是一种授权协议，用于让第三方应用安全地访问资源。它广泛用于“登录”或“授权”场景。

在实际开发中，OAuth2 有多种使用方式（称为“授权模式”），而我们常用的这种“用户输入用户名密码获得 access token”的方式被称为 OAuth2 密码模式（Password Grant Type）。

它的工作流程如下：

1. 用户填写用户名和密码，发送到后端 `/token` 接口；
2. 后端验证成功后，生成一个 `access_token`；
3. 前端保存该 token，并在之后访问需要登录的接口时携带它。

你可以把 token 理解为一张临时“通行证”。

## JWT 是什么
JWT（全称：JSON Web Token）是用于身份验证的一种令牌格式。

JWT 是一串由三部分组成的字符串，长这样：

```plain
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJhbGljZSIsImV4cCI6MTY4M...
zRyLeKLgdxCgNyjgm5DndS49ArSl94uwac...
```

每个 JWT 包含三部分：

| 部分 | 说明 |
| --- | --- |
| Header（头部） | 指明使用的签名算法（如 HS256） |
| Payload（载荷） | 存放用户信息（如用户名、过期时间） |
| Signature（签名） | 由密钥加密生成，用于防篡改验证 |


JWT 的好处是：

+ 结构清晰，前端和后端都可以解析；
+ 可以不用访问数据库，仅靠 token 判断身份（无状态）；
+ 签名防篡改，更安全。

FastAPI 的推荐做法是：登录成功后返回一个 JWT 令牌，前端拿到后就可以用它访问后端的受保护接口。

## OAuth2 和 JWT关系
OAuth2 规定了“认证流程”，JWT 是实现 token 的一种方式。

换句话说：OAuth2 是流程规范，JWT 是令牌格式。你可以用 OAuth2 的登录流程返回任意类型的 token，但 JWT 是最常见也最推荐的格式。

# 项目示例
## 准备工作
依赖包安装

pip install "python-jose[cryptography]" passlib[bcrypt]

+ `python-jose`：用于生成和验证 JWT；
+ `passlib[bcrypt]`：用于安全地哈希和验证密码。

## 示例项目结构
```plain
.
├── main.py             # FastAPI 主程序
├── auth.py             # 认证逻辑模块（签发、验证 JWT）
└── users.py            # 模拟用户数据库与密码校验
```

## 完整代码示例
1. 模拟用户数据和密码校验（users.py）

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 模拟数据库中的用户
fake_users_db = {
    "alice": {
        "username": "alice",
        "hashed_password": pwd_context.hash("secret"),
    }
}

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(username: str):
    return fake_users_db.get(username)
```

2. JWT 相关逻辑（auth.py）

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt

# 密钥和算法（生产环境需保密）
SECRET_KEY = "CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

3. 主程序（main.py）

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from users import get_user, verify_password
from auth import create_access_token, decode_access_token

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# 登录接口：返回 access_token
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    ifnot user ornot verify_password(form_data.password, user["hashed_password"]):
    raise HTTPException(status_code=401, detail="用户名或密码错误")

access_token = create_access_token(data={"sub": user["username"]})
return {"access_token": access_token, "token_type": "bearer"}

# 受保护接口：必须携带有效 token 才能访问
@app.get("/me")
def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
    payload = decode_access_token(token)
    username = payload.get("sub")
    if username isNone:
        raise HTTPException(status_code=401, detail="无效的 token")
except Exception:
    raise HTTPException(status_code=401, detail="无法验证 token")

    return {"username": username}
```

## 请求示例
你可以使用 Postman、curl、或前端代码来测试：

获取 Token

curl -X POST "http://localhost:8000/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=alice&password=secret"

返回示例：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "token_type": "bearer"
}
```

使用 Token 访问受保护接口

curl -H "Authorization: Bearer <your_token_here>" http://localhost:8000/me

# 小提示
+ 可以将登录信息存入前端本地存储（localStorage 或 cookie）中；
+ 生产环境中应使用 HTTPS 传输 token；
+ 为支持刷新机制，可结合 `refresh_token` 设计。


