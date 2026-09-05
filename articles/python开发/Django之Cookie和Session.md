# 一、Cookie

## Cookie的由来

因为HTTP是无状态服务，每一次请求都是独立的，所以就用一个中间值（cookie）来记录一些用户行为。

  

## Cookie是什么

Cookie就是保存在浏览器上的键值对。

服务端控制着响应，在响应里让浏览器在本地保存Cookie（键值对），下一次请求在发送的时候就会自动携带这个Cookie值。

  

## Cookie的应用

1、登录，7天免登录

2、记录用户的浏览器习惯

3、简单的投票机制

  

Cookie是服务端设置的，我们浏览器可以不让服务端设置Cookie（禁用Cookie）。

  

Cookie可以设置超时时间，如果不设置，Cookie默认关闭浏览器就失效了。

  

## Django中操作Cookie

### 设置Cookie

```shell
rep = HttpResponse(...)
rep ＝ render(request, ...)

rep.set_cookie(key,value,...)
rep.set_signed_cookie(key,value,salt='加密盐', max_age=None, ...)
```

参数：

-   key, 键
-   value='', 值
-   max\_age=None, 超时时间
-   expires=None, 超时时间(IE requires expires, so set it if hasn't been already.)
-   path='/', Cookie生效的路径，/ 表示根路径，特殊的：根路径的cookie可以被任何url的页面访问
-   domain=None, Cookie生效的域名
-   secure=False, https传输
-   httponly=False 只能http协议传输，无法被JavaScript获取（不是绝对，底层抓包可以获取到也可以被覆盖）

### 获取Cookie

```shell
request.COOKIES['key']
request.get_signed_cookie(key, default=RAISE_ERROR, salt='', max_age=None)
```

参数：

-   default: 默认值
-   salt: 加密盐
-   max\_age: 后台控制过期时间

### 删除Cookie

```shell
def logout(request):
    rep = redirect("/login/")
    rep.delete_cookie("user")  # 删除用户浏览器上之前设置的usercookie值
    return rep
```

  

例子：views.py

```shell
from django.shortcuts import render, HttpResponse, redirect
from orm import models
from utils.mypage import Page
from functools import wraps

# Create your views here.

# 装饰器
def check_login_status(func):
    @wraps(func)
    def inner(request, *args, **kwargs):
        # 获取cookie
        get_cookie = request.get_signed_cookie("is_login", salt="login", default=None)
        next_url = request.path_info
        if get_cookie == "123":
            return func(request, *args, **kwargs)
        else:
            return redirect("/login/?next={}".format(next_url))
    return inner

def login(request):
    """用户登录"""
    if request.method == "POST":
        user = request.POST.get("username")
        pwd = request.POST.get("password")
        # 获取跳转url
        next_url = request.GET.get("next")
        check_username = models.Userinfo.objects.filter(username=user)
        if check_username:
            if pwd == check_username[0].password:
                if next_url:
                    ret = redirect("{}".format(next_url))
                else:
                    ret = redirect("/home/")
                ret.set_signed_cookie("is_login", "123", salt="login")
                return ret
    return render(request, "login.html")

@check_login_status
def home(request):
    return render(request, "home.html")

```

  

# 二、Session

Session是保存在服务端的键值对，它必须依赖Cookie。

  

## 存Session

1、在服务端生成随机字符串

2、生成一个和上面随机字符串对于的字典，用来保存用户的数据

3、随机字符串当Cookie值返回给浏览器

  

## 取Session

1、从请求携带的Cookie中找随机字符串

2、拿到随机字符串，在Session中找对应的字典

3、从字典中根据Key取值

  

## Session优势

1、比Cookie存的数据多

2、安全性比Cookie高，数据保存在服务端

## Session缺点

1、数据量大，占用资源

  

## 在Django中使用Session

```shell
# 获取、设置、删除Session中数据
request.session['k1']
request.session.get('k1',None)
request.session['k1'] = 123
request.session.setdefault('k1',123) # 存在则不设置
del request.session['k1']

# 所有 键、值、键值对
request.session.keys()
request.session.values()
request.session.items()
request.session.iterkeys()
request.session.itervalues()
request.session.iteritems()

# 会话session的key
request.session.session_key

# 将所有Session失效日期小于当前日期的数据删除
request.session.clear_expired()

# 检查会话session的key在数据库中是否存在
request.session.exists("session_key")

# 删除当前会话的所有Session数据
request.session.delete()
　　
# 删除当前的会话数据并删除会话的Cookie。
request.session.flush() 
    这用于确保前面的会话数据不可以再次被用户的浏览器访问
    例如，django.contrib.auth.logout() 函数中就会调用它。

# 设置会话Session和Cookie的超时时间
request.session.set_expiry(value)
    * 如果value是个整数，session会在些秒数后失效。
    * 如果value是个datatime或timedelta，session就会在这个时间后失效。
    * 如果value是0,用户关闭浏览器session就会失效。
    * 如果value是None,session会依赖全局session失效策略。
```

![image.png](assets/python开发/Django之Cookie和Session/Django之Cookie和Session-1.png)

  

### Django中Session配置

```shell
1. 数据库Session
SESSION_ENGINE = 'django.contrib.sessions.backends.db'   # 引擎（默认）

2. 缓存Session
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'  # 引擎
SESSION_CACHE_ALIAS = 'default'                            # 使用的缓存别名（默认内存缓存，也可以是memcache），此处别名依赖缓存的设置

3. 文件Session
SESSION_ENGINE = 'django.contrib.sessions.backends.file'    # 引擎
SESSION_FILE_PATH = None                                    # 缓存文件路径，如果为None，则使用tempfile模块获取一个临时地址tempfile.gettempdir() 

4. 缓存+数据库
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'        # 引擎

5. 加密Cookie Session
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'   # 引擎

其他公用设置项：
SESSION_COOKIE_NAME ＝ "sessionid"                       # Session的cookie保存在浏览器上时的key，即：sessionid＝随机字符串（默认）
SESSION_COOKIE_PATH ＝ "/"                               # Session的cookie保存的路径（默认）
SESSION_COOKIE_DOMAIN = None                             # Session的cookie保存的域名（默认）
SESSION_COOKIE_SECURE = False                            # 是否Https传输cookie（默认）
SESSION_COOKIE_HTTPONLY = True                           # 是否Session的cookie只支持http传输（默认）
SESSION_COOKIE_AGE = 1209600                             # Session的cookie失效日期（2周）（默认）
SESSION_EXPIRE_AT_BROWSER_CLOSE = False                  # 是否关闭浏览器使得Session过期（默认）
SESSION_SAVE_EVERY_REQUEST = False                       # 是否每次请求都保存Session，默认修改之后才保存（默认）

```

  

### Session版登录验证

```shell
from django.shortcuts import render, HttpResponse, redirect
from orm import models
from utils.mypage import Page
from functools import wraps
from django.views import View
from django.utils.decorators import method_decorator

# Create your views here.

# 装饰器
def check_login_status(func):
    @wraps(func)
    def inner(request, *args, **kwargs):
        # 获取cookie
        get_cookie = request.session.get("is_login")
        next_url = request.path_info
        if get_cookie == "123":
            return func(request, *args, **kwargs)
        else:
            return redirect("/app02/login/?next={}".format(next_url))
    return inner

def login(request):
    """用户登录"""
    if request.method == "POST":
        user = request.POST.get("username")
        pwd = request.POST.get("password")
        # 获取跳转url
        next_url = request.GET.get("next")
        check_username = models.Userinfo.objects.filter(username=user)
        if check_username:
            if pwd == check_username[0].password:
                if next_url:
                    ret = redirect("{}".format(next_url))
                else:
                    ret = redirect("/app02/home/")
                # 设置session
                request.session["is_login"] = "123"
                return ret
    return render(request, "app02/login.html")

@check_login_status
def home(request):
    return render(request, "app02/home.html")
```

  

# 三、Token

Token也是会话保持技术，它是Session的增强版，拥有Session的所有功能，其优点是可以自定义，下面我们自定义一个Token。

首先我们创建一个学生的模型类，如下：

```python
class Student(models.Model):
    s_name = models.CharField(max_length=16, unique=True)
    g_name = models.ForeignKey(Grade)
    s_token = models.CharField(max_length=256)
```

  

然后我们创建一个学生注册的视图和模板：

views.py

```python
def student_register(request):
    if request.method == "POST":
        """用户注册POST请求"""
        try:
            username = request.POST.get('username')
            grade_name = request.POST.get('grade')
            grade_obj = models.Grade.objects.get(g_name=grade_name)
            # 注册
            models.Student.objects.create(s_name=username, g_name=grade_obj)
            return HttpResponse("注册成功")
        except Exception as e:
            print(e)
            redirect(reverse("app01:student_register"))
    # 获取现有的班级列表
    grades = models.Grade.objects.all()
    return render(request, "student_register.html", locals())
```

student\_register.html

```python
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>StudentRegister</title>
</head>
<body>
<hr>
<h1>用户注册</h1>
<form action="{% url 'app01:student_register' %}" method="post">
    <button>用户名：</button>
    <input type="text" name="username" placeholder="请输入用户名">
    <br>
    <button>班级：</button>
    <select name="grade" id="">
        {% for grade in grades %}
            <option value="{{ grade.g_name }}">{{ grade.g_name }}</option>
        {% endfor %}
    </select>
    <br>
    <button>注册</button>
</form>
</body>
</html>
```

  

然后做一个登录，登录成功->生成Token->拿到Token就可以登录了。

```python
def student_login(request):
    """用户登录"""
    print(request.META)
    if request.method == "POST":
        username = request.POST.get('username')
        grade_name = request.POST.get('grade')
        grade_obj = models.Grade.objects.get(g_name=grade_name)
        result = models.Student.objects.filter(s_name=username).filter(g_name=grade_obj)
        if result:
            # 生成token
            try:
                ip = request.META.get("REMOTE_ADDR")
            except Exception as e:
                ip = "127.0.0.1"
            print(ip)
            token = generate_token(ip, username)
            student_obj = models.Student.objects.get(s_name=username)
            student_obj.s_token = token
            student_obj.save()
            response = HttpResponse("登录成功")
            response.set_cookie("token", token)
            return response
    grades = models.Grade.objects.all()
    return render(request, "student_login.html", locals())

def generate_token(ip, username):
    """生成token"""
    now_time = time.ctime()
    print(type(ip), type(username), type(now_time))
    return hashlib.new('md5', (ip + username + now_time).encode('utf8')).hexdigest()
```

  

student\_login.html

```python
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>StudentRegister</title>
</head>
<body>
<hr>
<h1>用户注册</h1>
<form action="{% url 'app01:student_login' %}" method="post">
    <button>用户名：</button>
    <input type="text" name="username" placeholder="请输入用户名">
    <br>
    <button>班级：</button>
    <select name="grade" id="">
        {% for grade in grades %}
            <option value="{{ grade.g_name }}">{{ grade.g_name }}</option>
        {% endfor %}
    </select>
    <br>
    <button>登录</button>
</form>
</body>
</html>
```

  

登录后就会生成一串Token，我们就可以用这个token登录其他页面了。

  

使用Token就是在一些不支持浏览器Cookie的场景，比如手机端等。

  

# 四、CSRF\_TOKEN

Django中还有一种内置的Token叫csrf\_token，它主要是用来防跨站攻击、防恶意注册。其开启方法也很简单，只需要在我们需要POST请求的地方加入csrf\_token，比如如下：

```python
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>StudentRegister</title>
</head>
<body>
<hr>
<h1>用户注册</h1>
<form action="{% url 'app01:student_login' %}" method="post">
    {% csrf_token %}
    <button>用户名：</button>
    <input type="text" name="username" placeholder="请输入用户名">
    <br>
    <button>班级：</button>
    <select name="grade" id="">
        {% for grade in grades %}
            <option value="{{ grade.g_name }}">{{ grade.g_name }}</option>
        {% endfor %}
    </select>
    <br>
    <button>登录</button>
</form>
</body>
</html>
```

这时候在第一次请求的时候就会自动生成Token，

其流程为：

1、在我们存csrf\_token的标签页面，响应会自动生成cookie（csrftoken）

2、当我们提交的时候会自动验证csrftoken

3、验证通过正常执行流程，如果失败返回403