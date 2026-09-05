# Django的View（视图）

一个视图函数（类），简称视图，是一个简单的Python 函数（类），它接受Web请求并且返回Web响应。

响应可以是一张网页的HTML内容，一个重定向，一个404错误，一个XML文档，或者一张图片。

无论视图本身包含什么逻辑，都要返回响应。代码写在哪里也无所谓，只要它在你当前项目目录下面。除此之外没有更多的要求了——可以说“没有什么神奇的地方”。为了将代码放在某处，大家约定成俗将视图放置在项目（project）或应用程序（app）目录中的名为views.py的文件中。

## 一个简单的视图

下面是一个以HTML文档的形式返回当前日期和时间的视图：

![](assets/python开发/Django之视图/Django之视图-1.gif)

from django.http import HttpResponse

import datetime

  

def current\_datetime(request):

    now = datetime.datetime.now()

    html = "<html><body>It is now %s.</body></html>" % now

    return HttpResponse(html)

![](assets/python开发/Django之视图/Django之视图-2.gif)

让我们来逐行解释下上面的代码：

-   首先，我们从 django.http模块导入了HttpResponse类，以及Python的datetime库。  
    
-   接着，我们定义了current\_datetime函数。它就是视图函数。每个视图函数都使用HttpRequest对象作为第一个参数，并且通常称之为request。  
    注意，视图函数的名称并不重要；不需要用一个统一的命名方式来命名，以便让Django识别它。我们将其命名为current\_datetime，是因为这个名称能够比较准确地反映出它实现的功能。  
    
-   这个视图会返回一个HttpResponse对象，其中包含生成的响应。每个视图函数都负责返回一个HttpResponse对象。  
    

Django使用请求和响应对象来通过系统传递状态。

当浏览器向服务端请求一个页面时，Django创建一个HttpRequest对象，该对象包含关于请求的元数据。然后，Django加载相应的视图，将这个HttpRequest对象作为第一个参数传递给视图函数。

每个视图负责返回一个HttpResponse对象。

## CBV和FBV

我们之前写过的都是基于函数的view，就叫FBV。还可以把view写成基于类的。

就拿我们之前写过的添加班级为例：

### FBV版：

![](assets/python开发/Django之视图/Django之视图-3.gif)

# FBV版添加班级

def add\_class(request):

    if request.method == "POST":

        class\_name = request.POST.get("class\_name")

        models.Classes.objects.create(name=class\_name)

        return redirect("/class\_list/")

    return render(request, "add\_class.html")

![](assets/python开发/Django之视图/Django之视图-4.gif)

### CBV版：

![](assets/python开发/Django之视图/Django之视图-5.gif)

# CBV版添加班级

from django.views import View

  

  

class AddClass(View):

  

    def get(self, request):

        return render(request, "add\_class.html")

  

    def post(self, request):

        class\_name = request.POST.get("class\_name")

        models.Classes.objects.create(name=class\_name)

        return redirect("/class\_list/")

![](assets/python开发/Django之视图/Django之视图-6.gif)

注意：

使用CBV时，urls.py中也做对应的修改：

# urls.py中

url(r'^add\_class/$', views.AddClass.as\_view()),

## 给视图加装饰器

### 使用装饰器装饰FBV

FBV本身就是一个函数，所以和给普通的函数加装饰器无差：

![](assets/python开发/Django之视图/Django之视图-7.gif)

def wrapper(func):

    def inner(\*args, \*\*kwargs):

        start\_time = time.time()

        ret = func(\*args, \*\*kwargs)

        end\_time = time.time()

        print("used:", end\_time-start\_time)

        return ret

    return inner

  

  

# FBV版添加班级

@wrapper

def add\_class(request):

    if request.method == "POST":

        class\_name = request.POST.get("class\_name")

        models.Classes.objects.create(name=class\_name)

        return redirect("/class\_list/")

    return render(request, "add\_class.html")

![](assets/python开发/Django之视图/Django之视图-8.gif)

### 使用装饰器装饰CBV

类中的方法与独立函数不完全相同，因此不能直接将函数装饰器应用于类中的方法 ，我们需要先将其转换为方法装饰器。

Django中提供了method\_decorator装饰器用于将函数装饰器转换为方法装饰器。

![](assets/python开发/Django之视图/Django之视图-9.gif)

# CBV版添加班级

from django.views import View

from django.utils.decorators import method\_decorator

  

class AddClass(View):

  

    @method\_decorator(wrapper)

    def get(self, request):

        return render(request, "add\_class.html")

  

    def post(self, request):

        class\_name = request.POST.get("class\_name")

        models.Classes.objects.create(name=class\_name)

        return redirect("/class\_list/")

![](assets/python开发/Django之视图/Django之视图-10.gif)

![](assets/python开发/Django之视图/Django之视图-11.gif) 关于CBV的扩展阅读

# Request对象和Response对象

## request对象

当一个页面被请求时，Django就会创建一个包含本次请求原信息的HttpRequest对象。

Django会将这个对象自动传递给响应的视图函数，一般视图函数约定俗成地使用 request 参数承接这个对象。

[官方文档](https://docs.djangoproject.com/en/1.11/ref/request-response/)

### 请求相关的常用值

-   **path\_info**     返回用户访问url，不包括域名
-   **method**        请求中使用的HTTP方法的字符串表示，全大写表示。
-   **GET**              包含所有HTTP  GET参数的类字典对象
-   **POST**           包含所有HTTP POST参数的类字典对象
-   **body**            请求体，byte类型 request.POST的数据就是从body里面提取到的

### 属性

所有的属性应该被认为是只读的，除非另有说明。

![](assets/python开发/Django之视图/Django之视图-12.gif) request属性相关

上传文件示例

![](assets/python开发/Django之视图/Django之视图-13.gif) 上传文件示例代码

### 方法

![](assets/python开发/Django之视图/Django之视图-14.gif) 请求相关方法

注意：键值对的值是多个的时候,比如checkbox类型的input标签，select标签，需要用：

request.POST.getlist("hobby")

## Response对象

与由Django自动创建的HttpRequest对象相比，HttpResponse对象是我们的职责范围了。我们写的每个视图都需要实例化，填充和返回一个HttpResponse。

HttpResponse类位于django.http模块中。

### 使用

传递字符串

from django.http import HttpResponse

response = HttpResponse("Here's the text of the Web page.")

response = HttpResponse("Text only, please.", content\_type="text/plain")

设置或删除响应头信息

response = HttpResponse()

response['Content-Type'] = 'text/html; charset=UTF-8'

del response['Content-Type']

### 属性

HttpResponse.content：响应内容

HttpResponse.charset：响应内容的编码

HttpResponse.status\_code：响应的状态码

## JsonResponse对象

JsonResponse是HttpResponse的子类，专门用来生成JSON编码的响应。

from django.http import JsonResponse

  

response = JsonResponse({'foo': 'bar'})

print(response.content)

  

b'{"foo": "bar"}'

默认只能传递字典类型，如果要传递非字典类型需要设置一下safe关键字参数。

response = JsonResponse([1, 2, 3], safe=False)

## Django shortcut functions

[官方文档](https://docs.djangoproject.com/en/1.11/topics/http/shortcuts/)

### render()

![](assets/python开发/Django之视图/Django之视图-15.png)

结合一个给定的模板和一个给定的上下文字典，并返回一个渲染后的 HttpResponse 对象。

参数：

     request： 用于生成响应的请求对象。

  

     template\_name：要使用的模板的完整名称，可选的参数

  

     context：添加到模板上下文的一个字典。默认是一个空字典。如果字典中的某个值是可调用的，视图将在渲染模板之前调用它。

  

     content\_type：生成的文档要使用的MIME类型。默认为 DEFAULT\_CONTENT\_TYPE 设置的值。默认为'text/html'

  

     status：响应的状态码。默认为200。

  

   useing: 用于加载模板的模板引擎的名称。

  

一个简单的例子：

from django.shortcuts import render

  

def my\_view(request):

    # 视图的代码写在这里

    return render(request, 'myapp/index.html', {'foo': 'bar'})

上面的代码等于：

![](assets/python开发/Django之视图/Django之视图-16.gif)

from django.http import HttpResponse

from django.template import loader

  

def my\_view(request):

    # 视图代码写在这里

    t = loader.get\_template('myapp/index.html')

    c = {'foo': 'bar'}

    return HttpResponse(t.render(c, request))

![](assets/python开发/Django之视图/Django之视图-17.gif)

### redirect()

参数可以是：

-   一个模型：将调用模型的get\_absolute\_url() 函数
-   一个视图，可以带有参数：将使用urlresolvers.reverse 来反向解析名称
-   一个绝对的或相对的URL，将原封不动的作为重定向的位置。

默认返回一个临时的重定向；传递permanent=True 可以返回一个永久的重定向。

示例:[  
](http://python.usyiyi.cn/documents/django_182/topics/http/shortcuts.html#examples)

你可以用多种方式使用redirect() 函数。

**传递一个具体的ORM对象（了解即可）**

将调用具体ORM对象的get\_absolute\_url() 方法来获取重定向的URL：

from django.shortcuts import redirect

def my\_view(request):

    ...

    object = MyModel.objects.get(...)

    return redirect(object)

**传递一个视图的名称**

def my\_view(request):

    ...

    return redirect('some-view-name', foo='bar')

**传递要重定向到的一个具体的网址**

def my\_view(request):

    ...

    return redirect('/some/url/')

**当然也可以是一个完整的网址**

def my\_view(request):

    ...

    return redirect('http://example.com/')

默认情况下，redirect() 返回一个临时重定向。以上所有的形式都接收一个permanent 参数；如果设置为True，将返回一个永久的重定向：

def my\_view(request):

    ...

    object = MyModel.objects.get(...)

    return redirect(object, permanent=True)　 

**扩展阅读：**

临时重定向（响应状态码：302）和永久重定向（响应状态码：301）对普通用户来说是没什么区别的，它主要面向的是搜索引擎的机器人。

A页面临时重定向到B页面，那搜索引擎收录的就是A页面。

A页面永久重定向到B页面，那搜索引擎收录的就是B页面。