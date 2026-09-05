函数是python编程中不可或缺的一部分。好的自定义函数可以使代码更加模块化、规范化。

# 一、函数基础

函数就是为了实现某一功能的代码块，只要函数写好了，就可以被重复利用，我们来看下面这个例子：

```python
def my_func(message):
    print('Got a message: {}'.format(message))
    return 1

# 调用函数 my_func()
my_func('Hello World')
# 输出
Got a message: Hello World
```

其中：

-   def 是函数的声明
-   my\_func是函数的名称
-   message是函数的参数
-   print这一行是函数的实体，可以是相应的执行语句
-   函数的最后可以返回调用结果（return，yield）

大概是下面这种形式：

```python
def name(param1, param2, ..., paramN):
    statements
    return/yield value # optional
```

  

python函数可以设置默认值，如下：

```python
def func(param = 0):
    ...
```

这样在调用func()函数的时候，如果没有传递参数，则参数的默认值就为0，如果传入了参数，则param就会被覆盖了为传入的值。

python与其他语言相比的一大特点是：python是dynamically typed，可以接受任何数据类型。对于函数参数来说一样适用，如下：

```python
def my_sum(a, b):
    return a + b

result = my_sum(3, 5)
print(result)

# 输出
8
```

上面的传递两个数值，其实传递两个列表也是可以的，表示两个列表相连接：

```python
print(my_sum([1, 2], [3, 4]))

# 输出
[1, 2, 3, 4]
```

同理，传递字符串也是可以的，表示字符串的拼接：

```python
print(my_sum('hello ', 'world'))

# 输出
hello world
```

但是，如果两个参数的数据类型不同，比如一个是列表，一个是字符串，这两者是无法相加的，那就会报错，如下：

```python
print(my_sum([1, 2], 'hello'))
TypeError: can only concatenate list (not "str") to list
```

由上我们可以看到，python不用考虑输入的数据类型，而是将其交给具体的代码和解释器去判断，同样的一个函数，可以应用在整型，列表，字符串等等的操作中。在python语言中，我们把这种行为称为多态。

  

python的另一个特性是支持函数的嵌套，所谓的函数的嵌套，就是函数里面又定义了函数，如下：

```python
def f1():
    print('hello')
    def f2():
        print('world')
    f2()
f1()

# 输出
hello
world
```

上面的例子中函数f1()中又嵌套了一个函数f2()，在调用f1()的时候，会先打印字符串"hello"，然后再在f1()中调用f2()，打印字符串"world"。

函数的嵌套的主要所用如下：

（1）、函数的嵌套可以保证内部函数的隐私，只能被外部函数所调用和访问，不会暴露在全局作用域，因此，有一些隐私数据不想暴露在外，这时候可以使用函数的嵌套。如下：

```python
def connect_DB():
    def get_DB_configuration():
        ...
        return host, username, password
    conn = connector.connect(get_DB_configuration())
    return conn
```

这里的get\_DB\_configuration就是内部函数，它不会被除connect\_DB以外的程序调用，如下直接调用是会报错的：

```python
get_DB_configuration()

# 输出
NameError: name 'get_DB_configuration' is not defined
```

（2）、合理的使用嵌套，可以提高代码的运行效率。如下：

```python
def factorial(input):
    # validation check
    if not isinstance(input, int):
        raise Exception('input must be an integer.')
    if input < 0:
        raise Exception('input must be greater or equal to 0' )
    ...

    def inner_factorial(input):
        if input <= 1:
            return 1
        return input * inner_factorial(input-1)
    return inner_factorial(input)

print(factorial(5))
```

上面的例子是递归计算一个数的阶乘，在计算之前需要检查输入是否合法，如果不使用函数嵌套，每一次递归的时候都要检查一次，大大降低了代码的运行效率。如果使用了递归，那么只会检查一次。

# 二、函数变量的作用域

python中变量的作用域和其他语言类似。如果变量在函数内部定义，就称为局部变量，只有在函数内部有效，一旦函数执行完毕，局部变量会被回收，无法访问，如下：

  

```python
def read_text_from_file(file_path):
    with open(file_path) as file:
        ...
```

我们内部定义的fie这个变量，只有在函数内部有效，在外部是无法访问的。

  

相应的，全局变量是定义在整个文件层次上面的，如下:

```python
MIN_VALUE = 1
MAX_VALUE = 10
def validation_check(value):
    if value < MIN_VALUE or value > MAX_VALUE:
        raise Exception('validation check fails')
```

MIN\_VALUE和MAX\_VALUE是全局变量，在任意地方都可以调用。但是我们不能在函数内部随意更改全局变量的值。比如下面的写法就会有问题：

```python
MIN_VALUE = 1
MAX_VALUE = 10
def validation_check(value):
    MIN_VALUE += 1
validation_check(5)

Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 2, in validation_check
UnboundLocalError: local variable 'MIN_VALUE' referenced before assignment
```

这是因为python解释器会默认内部变量为局部变量，但是在局部又发现MIN\_VALUE并没有声明，因此就无法操作，如果想要在函数内部操作全局变量的值，则需要global声明，如下：

```python
MIN_VALUE = 1
MAX_VALUE = 10
def validation_check(value):
    global MIN_VALUE
    MIN_VALUE += 1
validation_check(5)
```

这里的global关键字并不是表示重新创建了一个变量，而是告诉python解释器，MIN\_VALUE就是全局变量，可以对其进行操作。

但是，如果局部变量和全局变量同名，那么在函数内部，局部变量会覆盖全局变量，如下：

```python
MIN_VALUE = 1
MAX_VALUE = 10
def validation_check(value):
    MIN_VALUE = 3
```

  

类似的，对于嵌套函数来说，内部函数可以访问外部函数的变量，但是无法对其进行修改，如果要修改，则要加上nonlocal关键字，如下：

```python
def outer():
    x = "local"
    def inner():
        nonlocal x # nonlocal 关键字表示这里的 x 就是外部函数 outer 定义的变量 x
        x = 'nonlocal'
        print("inner:", x)
    inner()
    print("outer:", x)
outer()
# 输出
inner: nonlocal
outer: nonlocal
```

如果不加nonlocal关键字，内部函数变量又和外部函数变量同名，那么同样的，内部函数变量会覆盖外部函数的变量，如下：

```python
def outer():
    x = "local"
    def inner():
        x = 'nonlocal' # 这里的 x 是 inner 这个函数的局部变量
        print("inner:", x)
    inner()
    print("outer:", x)
outer()
# 输出
inner: nonlocal
outer: local
```

# 三、闭包

闭包其实和嵌套函数类似，不同的是嵌套函数返回的是一个值，而闭包返回的是一个函数，返回的函数通常赋予一个变量，这个变量可以被执行调用。

比如我们想计算一个数的n次幂，用闭包写成如下：

```python
def nth_power(exponent):
    def exponent_of(base):
        return base ** exponent
    return exponent_of # 返回值是 exponent_of 函数

square = nth_power(2) # 计算一个数的平方
cube = nth_power(3) # 计算一个数的立方 
square
# 输出
<function __main__.nth_power.<locals>.exponent(base)>

cube
# 输出
<function __main__.nth_power.<locals>.exponent(base)>

print(square(2))  # 计算 2 的平方
print(cube(2)) # 计算 2 的立方
# 输出
4 # 2^2
8 # 2^3
```

这里的外部函数nth\_power()的返回值是exponent\_of()的函数名，而不是一个具体值，需要注意的是在执行square = nth\_power(2)和cube = nth\_power(3)，外部函数nth\_power的参数exponent仍然会被内部exponent\_of()函数记住，这样我们调用square(2)和cube(2)，程序会顺利的输出结果。

闭包可以让程序变得更简洁易读，并且可以减少调用导致的不必要的开销，增强程序运行效率。

# 四、总结

（1）、python中函数的参数可以接受任意数据类型，使用起来需要注意，必要是在函数开头加入数据类型检查；

（2）、python中的函数参数可以设置默认值；

（3）、嵌套函数的使用，可以保证一定数据的隐私性，提高程序的运行效率；

（4）、合理的使用闭包，可以降低程序的复杂性，提高可读性；