装饰器必备知识：

（1）、作用域

（2）、高阶函数

（3）、闭包

  

# 作用域

python的作用域分四种：

（1）、L：Local，本地作用域

（2）、E：Enclosing，嵌套作用域

（3）、G：Global，全局作用域

（4）、B：Buit-in，系统内置作用域

  

从下面这个例子来具体了解这几个作用域分别在什么地方：

```python
x = int(2.9)		 # Buit-in
g_count = 0			 # global
def outer():
  e_count = 0	   # Enclosing
  def inner():
    l_count = 0  # Local
```

  

如果嵌套作用域需要使用全局作用域的变量，需要申明global，如下：

```python
g_count = 0
def outer():
    global g_count
    print(g_count)
```

  

如果本地作用域需要使用嵌套作用域的变量，需要申明nonlocal，如下：

```python
def outer():
    e_count = 0
    def inner():
        nonlocal e_count
        print(e_count)
```

  

总结：

（1）、变量的查找顺序是：L-->E-->G-->B；

（2）、对于一个变量，局部要使用全局作用域，要申明global；

（3）、对于一个变量，内部要使用外部作用域，要申明nonlocal；

（4）、只有模块，类，函数才能引用作用域；

  

# 高阶函数

以下两种形式被称为高阶函数：

（1）、函数名作为函数参数；

（2）、函数名作为函数的返回值；

  

如下函数名作为函数参数：

```python
>>> def func1(n):
...     return n*n
...
>>> def func2(a,b,f):
...     print(f(a)+f(b))
...
>>> func2(1,2,func1)
5
>>>
```

  

如下函数名作为返回值：

```python
>>> def func1(n):
...     def func2(m):
...         print(n+m)
...     return func2
...
>>> f = func1(1)
>>> f(2)
3
>>>
```

  

# 闭包

如果在内部函数中，对外部作用域的变量进行了引用，那么内部函数就是闭包。

闭包=函数块+定义函数时的环境

  

如下例子：

```python
>>> def outer():
...     n = 10
...     def inner():
...             print(n)
...     return inner
...
>>> f = outer()
>>> f
<function outer.<locals>.inner at 0x0000023AC9B33620>
>>> f()				# 这就是闭包
10
>>>
```

  

# 装饰器

装饰器的作用是修改其他函数的功能。

  

我们从一个例子来慢慢深入。

例子1：领导叫你实现两个方法，分别是foo和bar，如下：

```python
import time
def foo():
    print("foo.....")
    time.sleep(2)
    
def bar():
    print("bar......")
    time.sleep(2)
    
foo()
bar()
```

功能已经实现了，用了两个普通的函数。

  

例子2：有一天，领导叫你分别计算这两个函数执行所花费的时间，这一次你采用了高阶函数，如下：

```python
import time
def showTime(f):
    start_time = time.time()
    f()
    end_time = time.time()
    print("Spend {} time".format(end_time - start_time))
    
showTime(foo)
showTime(bar)
```

到这一步我们已经实现了功能，但是我们改变了函数的调用方式。

  

例子3：要在不改变函数调用方式的情况下实现功能。这一次我们要使用闭包，如下：

```python
import time
def showTime(f):
    def inner():
        start_time = time.time()
    	f()
    	end_time = time.time()
    	print("Spend {} time".format(end_time - start_time))
    return inner

foo = showTime(foo)
foo()
bar = showTime(bae)
bar()
```

上面的showTime()就是一个装饰器函数。

  

但是这种写法不够美观，为了能够更优雅，更美观，python提供了装饰器的优雅写法，如下：

```python
@showTime
def foo():
    print("foo.....")
    time.sleep(2)

@showTime
def bar():
    print("bar......")
    time.sleep(2)
```

上面我们已经知道装饰器的基本用法了，下面来介绍以下带参数的装饰器。

  

例子4：使用装饰器实现一个加法器

```python
import time
def showTime(f):
    def inner(x, y):
        start_time = time.time()
        f(x, y)
        end_time = time.time()
        print("Spend {} time".format(end_time - start_time))
    return inner

@showTime
def my_sum(a, b):
    print("a+b:{}".format(a+b))
    time.sleep(2)
    
my_sum(1, 2)
```

  

例子5：带不定长参数的加法器

```python
import time
def showTime(f):
    def inner(*args):
        start_time = time.time()
        f(*args)
        end_time = time.time()
        print("Spend {} time".format(end_time - start_time))
    return inner

@showTime
def my_sum(*args):
    sum = 0
    for i in args:
        sum += i
    print(sum)
    time.sleep(2)
    
my_sum(1, 2, 3, 4)
```

  

例子6：给装饰器加参数。需求：给上面打印日志，根据需求打印日志，不是全部打印。

```python
import time
def printLogs(flag):
    def showTime(f):
    	def inner(*args):
        	start_time = time.time()
        	f(*args)
        	end_time = time.time()
        	print("Spend {} time".format(end_time - start_time))
            if flag == 'true':
                print("日志记录")
    	return inner
    return showTime

@printLogs('True')			# 表示打印日志
def foo():
    print("foo.....")
    time.sleep(2)

@printLogs('Flase')			# 表示不打印日志
def bar():
    print("bar......")
    time.sleep(2)
    
foo()
foo.....
Spend 2.00173282623291 time
日志记录

bar()
bar......
Spend 2.0029125213623047 time

print(foo.__name__)
inner
```

我们看到最后这里，我们在print(foo.\_\_name\_\_)的时候应该返回的是foo，但是实际上返回的是inner，这是由于装饰器重写了我们的函数名字和注释文档，这显然不是我们想要的。python对此提供了一个简单的函数来解决这个问题：functools.wraps。

  

例子7：我们把上面的函数改成下面的样子：

```python
import time
from functools import wraps
def printLogs(flag):
    def showTime(f):
        @wraps(f)
        def inner(*args):
            start_time = time.time()
            f(*args)
            end_time = time.time()
            print("Spend {} time".format(end_time - start_time))
            if flag == 'true':
                print("日志记录")
        return inner
    return showTime

@printLogs('true')			# 表示打印日志
def foo():
    print("foo.....")
    time.sleep(2)

@printLogs('flase')			# 表示不打印日志
def bar():
    print("bar......")
    time.sleep(2)
    
print(foo.__name__)			# 现在输出是foo
print(bar.__name__)			# 现在输出是bar
```

  

# 装饰器类

类也可以用来构建装饰器。

  

如下例子：

```python
import time
from functools import wraps
class printLogs(object):
    def __init__(self, flag):
        self.flag = flag

    def __call__(self, func):
        @wraps(func)
        def inner(*args):
            start_time = time.time()
            func(*args)
            end_time = time.time()
            print("Spend {} time".format(end_time - start_time))
            if self.flag == 'true':
                print("日志记录")
        return inner

@printLogs('true')			# 表示打印日志
def foo():
    print("foo.....")
    time.sleep(2)

@printLogs('flase')			# 表示不打印日志
def bar():
    print("bar......")
    time.sleep(2)
```

这样的话可扩展性就更高了，而且比嵌套函数更加直观。