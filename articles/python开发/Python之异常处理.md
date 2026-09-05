# 一、错误和异常

所谓的错误就是语法错误，也就是代码不符合python规范，比如：

```python
for i in range(0,10)
	print(i)
```

for循环的条件后来漏掉了":"，所以程序运行的时候就会输出：invalid syntax。

而异常则是语法正确，符合python的语法规范，所以程序可以执行，只是在执行的过程中出现错误，抛出异常。如下：

```python
>>> 1/0
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ZeroDivisionError: division by zero
>>> order * 2
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
NameError: name 'order' is not defined
>>> 1 + [1,2]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: unsupported operand type(s) for +: 'int' and 'list'
>>>
```

显然语法是没有问题的，只是0不能作为除数，也不能使用未定义的变量，所以在执行过程中就会抛出异常，上面的ZeroDivisionError，NameError，TypeError就是常见的异常类型。

实际中还有很多的异常类型，详细可以见[官方介绍](https://docs.python.org/3/library/exceptions.html#bltin-exceptions)。

# 二、异常处理

在处理异常的时候，我们通常都用try....except....来处理。比如：

```python
try:
    s = input('please enter two numbers separated by comma: ')
    num1 = int(s.split(',')[0].strip())
    num2 = int(s.split(',')[1].strip())
except ValueError as err:
    print('Value Error: {}'.format(err))

print('continue')
```

用户输入逗号相隔的两个整型数字，如果输入的不一致，就会跳出try，抛出异常ValueError，再继续后续输出continue。这种情况是规定了异常类型是ValueError，如果异常类型匹配，则会输出'Value Error: ....'，然后输出下面的continue，如果异常不匹配，程序依然会跳出try，但是是直接退出了，并不会打印下面的continue。如下所示：

```python
# 异常类型匹配
please enter two numbers separated by comma: 1,2
continue

# 异常类型不匹配
please enter two numbers separated by comma: 1
Traceback (most recent call last):
  File "c:\Users\Joker\.vscode\extensions\ms-python.python-2019.4.12954\pythonFiles\ptvsd_launcher.py", line 43, in <module>
    main(ptvsdArgs)
  File "c:\Users\Joker\.vscode\extensions\ms-python.python-2019.4.12954\pythonFiles\lib\python\ptvsd\__main__.py", line 410, in main
    run()
  File "c:\Users\Joker\.vscode\extensions\ms-python.python-2019.4.12954\pythonFiles\lib\python\ptvsd\__main__.py", line 291, in run_file
    runpy.run_path(target, run_name='__main__')
  File "D:\software\python3\lib\runpy.py", line 263, in run_path
    pkg_name=pkg_name, script_name=fname)
  File "D:\software\python3\lib\runpy.py", line 96, in _run_module_code
    mod_name, mod_spec, pkg_name, script_name)
  File "D:\software\python3\lib\runpy.py", line 85, in _run_code
    exec(code, run_globals)
  File "e:\Joker\工作日志\个人文件\python_scripts\Python\test.py", line 219, in <module>
    num2 = int(s.split(',')[1].strip())
IndexError: list index out of range
```

由上可知，如果只写一个异常类型的局限性很大，因为不一定所有的异常类型都会考虑到，所以我们还可以采用定义多种异常来处理，如下：

```python
try:
    s = input('please enter two numbers separated by comma: ')
    num1 = int(s.split(',')[0].strip())
    num2 = int(s.split(',')[1].strip())
except ValueError as err:
    print('Value Error: {}'.format(err))
except IndexError as err:
    print('Index Error: {}'.format(err))

print('continue')
```

也可以写成下面这种形式，效果是一样的：

```python
try:
    s = input('please enter two numbers separated by comma: ')
    num1 = int(s.split(',')[0].strip())
    num2 = int(s.split(',')[1].strip())
except (ValueError,IndexError) as err:
    print('Value Error: {}'.format(err))

print('continue')
```

这种写法只要满足任意一个异常即可。但是如果异常太多，如果把全部异常都写上，那么就会造成代码非常的繁重，所以我们会用Exception来处理其他异常，它可以匹配任意异常，如下：

```python
try:
    s = input('please enter two numbers separated by comma: ')
    num1 = int(s.split(',')[0].strip())
    num2 = int(s.split(',')[1].strip())
except ValueError as err:
    print('Value Error: {}'.format(err))
except IndexError as err:
    print('Index Error: {}'.format(err))
except Exception as err:						# 这里也可以写成：except: 表示与任意异常相匹配
    print('Exception: {}'.format(err))

print('continue')
```

注意：如果程序中定义了多个except，最多只有一个except被执行。换句话说，如果多个except都与实际异常相匹配，则只有最前面的会被执行，其他的都会忽略。

异常处理中，还有一个常用的用法：finally，经常和try,except放在一起使用，它表示无论是什么异常，finally下的语句都会被执行，哪怕try，except里有return语句。

一般场景如下，读取文件操作：

```python
import sys
try:
    f = open('file.txt', 'r')
    .... # some data processing
except OSError as err:
    print('OS error: {}'.format(err))
except:
    print('Unexpected error:', sys.exc_info()[0])
finally:
    f.close()
```

在这段代码中，不论try,except是怎样，finally中的f.close()都会被执行，确保文件的完整性。

一般情况下，我们会把无论如何都要执行的语句放在finally中。

# 三、自定义异常

异常也可以自定义，如下：

```python
class MyInputError(Exception):
    """Exception raised when there're errors in input"""
    def __init__(self, value): # 自定义异常类型的初始化
        self.value = value
    def __str__(self): # 自定义异常类型的 string 表达形式
        return ("{} is invalid input".format(repr(self.value)))
    
try:
    raise MyInputError(1) # 抛出 MyInputError 这个异常
except MyInputError as err:
    print('error: {}'.format(err))
```

在实际工作中，如果内置的异常类型不能满足生产中需要的时候，就可以自定义异常，不过大多数情况下内置的异常类型足够用了。

# 四、异常的使用场景和注意点

通常来说，我们不确定一段代码是否能够成功执行，就需要在这些地方进行异常处理。

举一个例子：大型网站的后台，需要针对用户发送的请求返回相应的记录，用户数据往往存储在key-value的数据库中，每次请求过来，我们会拿到用户ID，然后在数据库中读出所在行，返回相应的记录，而数据返回的原始数据，往往是json string形式，这时候往往就需要我们对数据进行decode，这时候往往你会想到以下方法：

```python
import json
raw_data = queryDB(uid) # 根据用户的 id，返回相应的信息
data = json.loads(raw_data)
```

但是，上面这种情况就必须保证数据是完全正常的，不然就会报错，这时候加异常就变得很重要了，如下形式：

```python
import json
try:
    raw_data = queryDB(uid) # 根据用户的 id，返回相应的信息
    data = json.loads(raw_data)
except JSONDecodeError as err:
    print('JSONDecodeError: {}'.format(err))

```

所以异常处理在代码中是非常重要的，但是，我们也不能滥用异常处理，比如：

```python
d = {'name': 'jason', 'age': 20}
try:
    value = d['dob']
except KeyError as err:
    print('KeyError: {}'.format(err))

```

这样的写法没什么毛病，但是给人的感觉就很傻逼，完全没这个必要。这种时候就完全没必要做异常处理。

# 五、总结

（1）、异常，通常是指程序运行过程种遇到错误，终止并退出，我们通常会使用try....except....语法去处理异常，这样程序就不会被终止，仍然会继续执行；

（2）、处理异常时，如果有必须执行的语句，则将这个语句放在finally中；

（3）、异常处理，通常用在不确定某段代码是否能够成功执行，也无法轻易判断的情况下，比如数据库连接、读取等等，正常的flow-control逻辑，就不需要使用异常处理，直接用条件语句就能解决。