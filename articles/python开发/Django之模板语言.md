博客地址：[https://www.cnblogs.com/liwenzhou/p/7931828.html#autoid-2-1-0](https://www.cnblogs.com/liwenzhou/p/7931828.html#autoid-2-1-0)

# 一、常用语法

模板语言中需要记住两种特殊符号：{{}}和{%%}，其中变量相关的用{{}}，逻辑相关的用{%%}。

## 1、变量

在Django模板语言中使用变量的语法：{{ 变量 }}。

当模板引擎遇到变量，它将计算这个变量，然后用结果替换它本身。

变量的命名包括数字，字母，下划线，变量名称中不能带有空格和标点符号。

在模板语言中"."是有特殊含义的，如果模板语言中有"."，它将以以下顺序查询：

（1）、字典查询

（2）、属性和方法查询

（3）、数字索引查询

不过需要注意的是：

（1）、如果计算的结果值是可调用的，它将被无参数的调用，调用的结果将称为模板的值；

（2）、如果使用的变量不存在，系统将插入string\_if\_invalid的值，它被默认设置为空（""）；

  

我们来根据几个例子来看看模板语言中变量是怎么使用的：

```python
def template_test(request):
    l = [11, 22, 33]
    d = {"name": "alex"}

    class Person(object):
        def __init__(self, name, age):
            self.name = name
            self.age = age

        def dream(self):
            return "{} is dream...".format(self.name)

    Alex = Person(name="Alex", age=34)
    Egon = Person(name="Egon", age=9000)
    Eva_J = Person(name="Eva_J", age=18)

    person_list = [Alex, Egon, Eva_J]
    return render(request, "template_test.html", {"l": l, "d": d, "person_list": person_list})
```

模板中支持的语法：

```python
{# 取l中的第一个参数 #}
{{ l.0 }}
{# 取字典中key的值 #}
{{ d.name }}
{# 取对象的name属性 #}
{{ person_list.0.name }}
{# .操作只能调用不带参数的方法 #}
{{ person_list.0.dream }}
```

## 2、Filters（过滤器）

在Django的模板语言中，通过使用 过滤器 来改变变量的显示。

过滤器的语法： {{ value|filter\_name:参数 }}

使用管道符"|"来应用过滤器。

例如：{{ name|lower }}会将name变量应用lower过滤器之后再显示它的值。lower在这里的作用是将文本全都变成小写。

注意事项：

1\. 过滤器支持“链式”操作。即一个过滤器的输出作为另一个过滤器的输入。

2\. 过滤器可以接受参数，例如：{{ sss|truncatewords:30 }}，这将显示sss的前30个词。

3\. 过滤器参数包含空格的话，必须用引号包裹起来。比如使用逗号和空格去连接一个列表中的元素，如：{{ list|join:', ' }}

4\. '|'左右没有空格没有空格没有空格

  

### 2.1 常用的内置Filter

#### 2.1.1 default

如果一个变量是false或者为空，使用给定的默认值，否则使用给定的变量值。

```python
{{ value|default:"nothing"}}
```

如果value没有传值或者为空，则复制给"nothing"。

  

#### 2.1.2 length

返回值的长度，作用于列表和字符串。

```python
{{ value|length }}
```

返回value的长度，如果value=[1,2,3,4]，则返回4.

  

#### 2.1.3 filesizeformat

将值格式化为一个 “人类可读的” 文件尺寸 （例如 `'13 KB'`, `'4.1 MB'`, `'102 bytes'`, 等等）。

```python
{{ value|filesizeformat }}
```

如果 value 是 123456789，输出将会是 117.7 MB。    

  

#### 2.1.4 slice

切片:

```python
{{value|slice:"2:-1"}}
```

  

#### 2.1.5 date

时间格式化：

```python
{{ value|date:"Y-m-d H:i:s"}}
```

  

#### 2.1.6 safe

Django的模板中会对HTML标签和JS等语法标签进行自动转义，原因显而易见，这样是为了安全。但是有的时候我们可能不希望这些HTML元素被转义，比如我们做一个内容管理系统，后台添加的文章中是经过修饰的，这些修饰可能是通过一个类似于FCKeditor编辑加注了HTML修饰符的文本，如果自动转义的话显示的就是保护HTML标签的源文件。为了在Django中关闭HTML的自动转义有两种方式，如果是一个单独的变量我们可以通过过滤器“|safe”的方式告诉Django这段代码是安全的不必转义。

```python
value = "<a href='#'>点我</a>"
{{ value|safe}}
```

  

#### 2.1.7 truncatechars

如果字符串字符多于指定的字符数量，那么会被截断。截断的字符串将以可翻译的省略号序列（“...”）结尾。  
      参数：截断的字符数.

```python
{{ value|truncatechars:9}}
```

  

#### 2.1.8 truncatewords

在一定数量的字后截断字符串。

```python
{{ value|truncatewords:9}}
```

  

#### 2.1.9 cut

**移除value中所有的与给出的变量相同的字符串.**

```python
{{ value|cut:' ' }}
```

如果value为'i love you'，那么将输出'iloveyou'.

  

#### 2.1.10 join

**使用字符串连接列表，例如Python的str.join(list).**

#### 2.1.11 timesince

将日期格式设为自该日期起的时间（例如，“4天，6小时”）。

采用一个可选参数，它是一个包含用作比较点的日期的变量（不带参数，比较点为现在）。 例如，如果blog\_date是表示2006年6月1日午夜的日期实例，并且comment\_date是2006年6月1日08:00的日期实例，则以下将返回“8小时”：

```python
{{ blog_date|timesince:comment_date }}
```

分钟是所使用的最小单位，对于相对于比较点的未来的任何日期，将返回“0分钟”。

  

#### 2.1.12 timeuntil

似于timesince，除了它测量从现在开始直到给定日期或日期时间的时间。 例如，如果今天是2006年6月1日，而conference\_date是保留2006年6月29日的日期实例，则{{ conference\_date | timeuntil }}将返回“4周”。

使用可选参数，它是一个包含用作比较点的日期（而不是现在）的变量。 如果from\_date包含2006年6月22日，则以下内容将返回“1周”：

```python
{{ conference_date|timeuntil:from_date }}
```

  

### 2.2 自定义filter

自定义过滤器只是带有一个或两个参数的Python函数:

-   变量（输入）的值 - -不一定是一个字符串
-   参数的值 - 这可以有一个默认值，或完全省略

例如，在过滤器{{var | foo:'bar'}}中，过滤器**foo**将传递变量**var**和参数**“bar”**。

#### 2.2.1 定义

（1）、在项目下面创建一个templatetags包（python包）；

（2）、在包里创建一个xx.py文件，在文件里写具体的内容；

```python
from django import template

# 名字必须是register
register = template.Library()

@register.filter(name="cut")
def cut(value, arg):
    return value.replace(arg, "")

@register.filter(name="addSB")
def add_sb(value):
    return "{} SB".format(value)
```

  

#### 2.2.2 调用

（1）、导入

（2）、使用

```python
{# 先导入我们自定义filter那个文件 #}
{% load app01_filters %}

{# 使用我们自定义的filter #}
{{ somevariable|cut:"0" }}
{{ d.name|addSB }}
```

  

## 3、Tags

### 3.1 for循环

普通的for循环：

```python
<ul>
{% for user in user_list %}
    <li>{{ user.name }}</li>
{% endfor %}
</ul>
```

  

for循环常用的参数：

<table class="lake-table" style="text-align: center; width: 685px;"><colgroup><col span="1" width="342" /><col span="1" width="342" /></colgroup><thead><tr style="height: 33px;"><td style="background-color: #FAFAFA;">Variable</td><td style="background-color: #FAFAFA;">Description</td></tr></thead><tbody><tr style="height: 33px;"><td><code><span>forloop.counter</span></code></td><td>当前循环的索引值（从1开始）</td></tr><tr style="height: 33px;"><td><code><span>forloop.counter0</span></code></td><td>当前循环的索引值（从0开始）</td></tr><tr style="height: 33px;"><td><code><span>forloop.revcounter</span></code></td><td>当前循环的倒序索引值（从1开始）</td></tr><tr style="height: 33px;"><td><code><span>forloop.revcounter0</span></code></td><td>当前循环的倒序索引值（从0开始）</td></tr><tr style="height: 33px;"><td><code><span>forloop.first</span></code></td><td>当前循环是不是第一次循环（布尔值）</td></tr><tr style="height: 33px;"><td><code><span>forloop.last</span></code></td><td>当前循环是不是最后一次循环（布尔值）</td></tr><tr style="height: 33px;"><td><code><span>forloop.parentloop</span></code></td><td>本层循环的外层循环</td></tr></tbody></table>

for ... empty:

```python
<ul>
{% for user in user_list %}
    <li>{{ user.name }}</li>
{% empty %}
    <li>空空如也</li>
{% endfor %}
</ul>
```

  

### 3.2 if判断

常用语法：

```python
{% if user_list %}
  用户人数：{{ user_list|length }}
{% elif black_list %}
  黑名单数：{{ black_list|length }}
{% else %}
  没有用户
{% endif %}
```

当然也可以只有if...else...

```python
{% if user_list|length > 5 %}
  七座豪华SUV
{% else %}
    黄包车
{% endif %}
```

if语句支持 and 、or、==、>、<、!=、<=、>=、in、not in、is、is not判断。

  

### 3.3 with语句

定义一个中间变量，多用于给一个复杂的变量起别名。

注意等号左右不要加空格。

```html
{% with total=business.employees.count %}
    {{ total }} employee{{ total|pluralize }}
{% endwith %}
```

或者

```python
{% with business.employees.count as total %}
    {{ total }} employee{{ total|pluralize }}
{% endwith %}
```

  

### 3.4 csrf\_token

这个标签用于跨站请求伪造保护。

在页面的form表单里面写上{% csrf\_token %}。

### 3.5 注释

```python
{# ... #}
```

### 3.6 注意事项

1\. Django的模板语言不支持连续判断，即不支持以下写法：

```python
{% if a > b > c %}
...
{% endif %}
```

2\. Django的模板语言中属性的优先级大于方法

```python
def xx(request):
    d = {"a": 1, "b": 2, "c": 3, "items": "100"}
    return render(request, "xx.html", {"data": d})
```

  

如上，我们在使用render方法渲染一个页面的时候，传的字典d有一个key是items并且还有默认的 d.items() 方法，此时在模板语言中:

  

```python
{{ data.items }}
```

  

默认会取d的items key的值。

  

## 4、母版

### 4.1 母版的定义

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="x-ua-compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Title</title>
  {% block page-css %}
  
  {% endblock %}
</head>
<body>

<h1>这是母板的标题</h1>

{% block page-main %}

{% endblock %}
<h1>母板底部内容</h1>
{% block page-js %}

{% endblock %}
</body>
</html>
```

注意：我们通常会在母板中定义页面专用的CSS块和JS块，方便子页面替换。

### 4.2 母版的继承

在子页面中在页面最上方使用下面的语法来继承母板。

  

```html
{% extends 'base.html' %}
```

### 4.3 母版中的块（block）

通过在母板中使用`{% block  xxx %}`来定义"块"。

在子页面中通过定义母板中的block名来对应替换母板中相应的内容。

```html
{% block page-main %}
  <p>世情薄</p>
  <p>人情恶</p>
  <p>雨送黄昏花易落</p>
{% endblock %}
```

  

## 5、组件

可以将常用的页面内容如导航条，页尾信息等组件保存在单独的文件中，然后在需要使用的地方按如下语法导入即可。

  

```html
{% include 'navbar.html' %}
```

## 6、静态文件相关

### 6.1 {% static %}

  

```html
{% load static %}
<img src="{% static "images/hi.jpg" %}" alt="Hi!" />
```

引用JS文件例子：

  

```html
{% load static %}
<script src="{% static "mytest.js" %}"></script>
```

某个文件多处被用到可以存为一个变量，例如：

  

```html
{% load static %}
{% static "images/hi.jpg" as myphoto %}
<img src="{{ myphoto }}"></img>
```

  

### 6.2 {% get\_static\_prefix %}

它会在settings.py里找到相应的uri，然后做字符串拼接。

```html
{% load static %}
<img src="{% get_static_prefix %}images/hi.jpg" alt="Hi!" />
```

或者

  

```html
{% load static %}
{% get_static_prefix as STATIC_PREFIX %}

<img src="{{ STATIC_PREFIX }}images/hi.jpg" alt="Hi!" />
<img src="{{ STATIC_PREFIX }}images/hi2.jpg" alt="Hello!" />
```

  

## 7、simple\_tag

和自定义filter类似，只不过接收更灵活的参数。

定义注册simple tag

  

```html
@register.simple_tag(name="plus")
def plus(a, b, c):
    return "{} + {} + {}".format(a, b, c)
```

使用：

  

```html
{% load app01_demo %}

{# simple tag #}
{% plus "1" "2" "abc" %}
```

  

## 8、inclusion\_tag

多用于返回html代码片段

示例：

templatetags/my\_inclusion.py

  

```python
from django import template

register = template.Library()

@register.inclusion_tag('result.html')
def show_results(n):
    n = 1 if n < 1 else int(n)
    data = ["第{}项".format(i) for i in range(1, n+1)]
    return {"data": data}
```

  

templates/snippets/result.html

```python
<ul>
  {% for choice in data %}
    <li>{{ choice }}</li>
  {% endfor %}
</ul>
```

  

templates/index.html

```python
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="x-ua-compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>inclusion_tag test</title>
</head>
<body>

{% load inclusion_tag_test %}

{% show_results 10 %}
</body>
</html>
```