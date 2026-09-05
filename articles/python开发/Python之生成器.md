在python中使用yield的函数称为生成器。如下：

```python
def count(n):
    while n > 0:
        yield n
        n -= 1
```

跟普通函数不同的是生成器返回的是一个迭代器函数，只能用于迭代操作，可以说生成器就是一个迭代器。在调用生成器运行的过程中，每次运行到yield会暂停并保存所有的运行信息并返回yield的值，在下次调用next()方法的时候当前的位置继续运行。

例如：

```python
# 用普通函数创建斐波拉契函数
>>> def fib1(n):
...     a, b, count = 0, 1, 0
...     while count < n:
...             print(a)
...             a, b = b, a+b
...             count += 1
...
>>> fib1(10)
0
1
1
2
3
5
8
13
21
34
>>>

# 用生成器创建
>>> def fib2(n):
...     a,b,count = 0,1,0
...     while count<n:
...             yield a
...             a,b=b,a+b
...             count += 1
...
>>> for i in fib2(10):
...     print(i)
...
0
1
1
2
3
5
8
13
21
34
```

作为生成器，因为每次迭代就会返回一个值，所以不能显示的在生成器函数中return 某个值，包括None值也不行，否则会抛出“SyntaxError”的异常，但是在函数中可以出现单独的return，表示结束该语句。

通过固定长度的缓冲区不断读文件，防止一次性读取出现内存溢出的例子：

```python
def read_file(path):  
    size = 1024  
    with open(path,'r') as f:  
        while True:  
            block = f.read(SIZE)  
            if block:  
                yield block  
            else:  
                return  
```