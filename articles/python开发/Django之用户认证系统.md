# auth模块

Djngo内置了强大的用户认证系统--auth，它默认使用 auth\_user 表来存储用户数据。

```python
from django.contrib import auth
```

  

## authenticate

提供用户认证功能，既验证用户名和密码是否正确，一般需要username，password两个关键字参数。

如果验证成功，就会返回一个User对象。

authenticate()会在该 User 对象上设置一个属性来标识后端已经认证了该用户，且该信息在后续的登录过程中是需要的。

用法：

```python
from django.contrib.auth import authenticate
user = authenticate(username='theuser',password='thepassword')
```

  

## login

该方法接受一个request和user对象。这个user对象是经过认证的。

该函数实现一个用户登陆的功能，本质上是在后端为该用户生成相关的session数据。

用法：

```python
def login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = auth.authenticate(username=username, password=password)
        if user:
            auth.login(request, user)
            return render(request, "test.html")
    return render(request, "login.html")
```

  

注意：

只要使用login(request, user\_obj)之后，request.user就能拿到当前登录的用户对象。否则request.user得到的是一个匿名用户对象（AnonymousUser Object）。

  

## logout

该函数接收一个HttpRequest对象，无返回值。

当调用该函数时，当前请求的session信息会全部清楚。该用户即使没有登陆，使用该函数也不会报错。

用法：

```python
from django.contrib.auth import logout
   
def logout_view(request):
  logout(request)
  return redirect("/login/")
```

  

## is\_authenticated

用来判断当前请求是否通过验证。

用法：

  

```python
def my_view(request):
  if not request.user.is_authenticated():
    return redirect('%s?next=%s' % (settings.LOGIN_URL, request.path))
```

  

## login\_requierd

auth提供的装饰器工具，用来给视图添加登陆验证。

用法：

  

```python
from django.contrib.auth.decorators import login_required
      
@login_required
def my_view(request):
```

若用户没有登录，则会跳转到django默认的 登录URL '/accounts/login/ ' 并传递当前访问url的绝对路径 (登陆成功后，会重定向到该路径)。

如果需要自定义登录的URL，则需要在settings.py文件中通过LOGIN\_URL进行修改。

示例：

settings.py

```python
LOGIN_URL = '/login/'  # 这里配置成你项目登录页面的路由
```

  

## create\_user

auth 提供的一个创建新用户的方法，需要提供必要参数（username、password）等。

用法：

```python
from django.contrib.auth.models import User
user = User.objects.create_user（username='用户名',password='密码',email='邮箱',...）
```

  

## create\_superuser

auth 提供的一个创建新的超级用户的方法，需要提供必要参数（username、password）等。

用法：

  

```python
from django.contrib.auth.models import User
user_obj = User.objects.create_superuser（username='用户名',password='密码',email='邮箱',...）
```

  

## check\_password

auth 提供的一个检查密码是否正确的方法，需要提供当前请求用户的密码。

密码正确返回True，否则返回False。

用法：

```python
ok = user_obj.check_password('密码')
```

  

或者直接针对当前请求的user对象校验原密码是否正确：

```python
ok = request.user.check_password(raw_password='原密码')
```

  

## set\_password

auth 提供的一个修改密码的方法，接收 要设置的新密码 作为参数。

注意：设置完一定要调用用户对象的save方法！！！

用法：

```python
user_obj.set_password('新密码')
user_obj.save()
```

  

例子：修改密码的简单视图

```python
@login_required
def set_password(request):
    user = request.user
    err_msg = ''
    if request.method == 'POST':
        old_password = request.POST.get('old_password', '')
        new_password = request.POST.get('new_password', '')
        repeat_password = request.POST.get('repeat_password', '')
        # 检查旧密码是否正确
        if user.check_password(old_password):
            if not new_password:
                err_msg = '新密码不能为空'
            elif new_password != repeat_password:
                err_msg = '两次密码不一致'
            else:
                user.set_password(new_password)
                user.save()
                return redirect("/login/")
        else:
            err_msg = '原密码输入错误'
    content = {
        'err_msg': err_msg,
    }
    return render(request, 'set_password.html', content)
```

  

## 用户对象属性

user\_obj能够拿到认证所用用户表的数据属性，比如username， password等。

其他常用属性含义如下：

is\_staff ： 用户是否拥有网站的管理权限.

is\_active ： 是否允许用户登录, 设置为 False，可以在不删除用户的前提下禁止用户登录。

  

# 扩展auth\_user表

这内置的认证系统这么好用，但是auth\_user表字段都是固定的那几个，我在项目中没法拿来直接使用啊！

比如，我想要加一个存储用户手机号的字段，怎么办？

聪明的你可能会想到新建另外一张表然后通过一对一和内置的auth\_user表关联，这样虽然能满足要求但是有没有更好的实现方式呢？

答案是当然有了。

我们可以通过继承内置的 AbstractUser 类，来定义一个自己的Model类。

这样既能根据项目需求灵活的设计用户表，又能使用Django强大的认证系统了。

  

```python
from django.contrib.auth.models import AbstractUser
class UserInfo(AbstractUser):
    """
    用户信息表
    """
    nid = models.AutoField(primary_key=True)
    phone = models.CharField(max_length=11, null=True, unique=True)
    
    def __str__(self):
        return self.username
```

  

注意：

按上面的方式扩展了内置的auth\_user表之后，一定要在settings.py中告诉Django，我现在使用我新定义的UserInfo表来做用户认证。写法如下：

```python
# 引用Django自带的User表，继承使用时需要设置
AUTH_USER_MODEL = "app名.UserInfo"
```

  

自定义认证系统默认使用的数据表之后，我们就可以像使用默认的auth\_user表那样使用我们的UserInfo表了。比如：

创建普通用户：

```python
UserInfo.objects.create_user(username='用户名', password='密码')
```

  

创建超级用户：

```python
UserInfo.objects.create_superuser(username='用户名', password='密码')
```