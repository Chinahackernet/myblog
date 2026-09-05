# django创建新项目

> 分类：Python / 第5章：Django
> 原文：https://www.cuiliangblog.cn/detail/section/31616452
> 来源：崔亮的博客

---

## settings.py文件配置
```python
ALLOWED_HOSTS = []      #修改前
ALLOWED_HOSTS = ['*']  #修改后，表示任何域名都能访问。如果指定域名的话，在''里放入指定的域名即可
```

## 配置数据库
1. 在__init__.py文件中写入两行代码

```python
import pymysql
pymysql.install_as_MySQLdb()
```

2. 在settings.py中修改以下内容

```python
DATABASES = {
    'default': {
        'ENGINE':'django.db.backends.mysql',
        'NAME': 数据库名,
        'USER':用户名,
        'PASSWORD':数据库密码,
        'HOST':数据库服务器ip,
        'PORT':端口,
    }
}
```

## 创建激活应用
1. 创建应用

执行<python manage.py  startapp  myApp>

2. 激活应用
+ settings.py中改为以下内容

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'myApp'
]
```

## 定义模型
1. 在models.py文件中定义模型

```python
from django.db import models
 
# Create your models here.
class Grades(models.Model):
    gname   = models.CharField(max_length=20)
    gdate   = models.DateTimeField()
    ggirlnum = models.IntegerField()
    gboynum = models.IntegerField()
    isDelete = models.BooleanField(default=False)
 
class Students(models.Model):
    sname    = models.CharField(max_length=20)
    sgender  = models.BooleanField(default=True)
    sage       = models.IntegerField()
    scontend = models.CharField(max_length=20)
    isDelete = models.BooleanField(default=False)
    # 关联外键
    sgrade   = models.ForeignKey("Grades")
• 不需要定义主键，在生成时自动添加，并且值为自动增加
```

## 在数据库中生成数据表
1. 生成迁移文件

执行<python manage.py  makemigrations>

2. 执行迁移

执行<python manage.py  migrate>

## admin站点管理
1. 创建管路员用户

执行<python  manage.py createsuperuser>

依次输入用户名、邮箱、密码

2. 修改为中文
+ 修改settings.py文件

LANGUAGE_CODE = 'zh-Hans'

TIME_ZONE = 'Asia/Shanghai'

3. 使用装饰器完成注册
+ 修改admin.py文件

```python
@admin.register(Students)
class StudentsAdmin(admin.ModelAdmin):
     list_display = ['pk','sname','sage',gender,'scontend','sgrade','isDelete']
   # 显示的字段
```

## 视图
1. 配置url

```python
修改project目录下的urls.py文件
from myapp import views
path('test', views.test,name='test'）,
```

2. 修改views视图

```python
def test(request):
	lists = Students.objecrs.all()
	return render(requests,'test.html',locals())
```

## 模板
1. 配置静态资源路径
+ 修改settings.py文件下的TEMPLATES

```python
STATIC_URL = '/static/'  # HTML中使用的静态文件夹前缀
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),  # 静态文件存放位置
]
#设置文件上传路径，图片上传、文件上传都会存放在此目录里
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

2. 创建test.html模板文件

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>学生信息</title>
</head>
<body>
    <h1>学生信息列表</h1>
    <ul>
        {%for student in students%}
        <li>
           {{student.sname}}--{{student.scontend}}--{{student.sgrade}}
        </li>
        {%endfor%}
    </ul>
</body>
</html>
```


