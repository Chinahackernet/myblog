函数式编程的特点就是允许把函数本身作为参数传入另一个函数，还允许返回一个函数。

python中函数式编程主要用到下面4个基础函数：

（1）、map()

（2）、reduce()

（3）、filter()

（4）、sorted()

还有一个匿名函数lambda()往往和它们配合使用。

# 一、map

map()函数常见的调用方式如下：

```python
map(function, interable)
```

map()函数中的两个参数是必填的，其中第一个参数是一个函数名或匿名函数，第二个参数是一个可迭代对象，如列表、元组等。

map()函数实现的功能就是把interable中的元素依次传入function中执行并返回结果，在python2.x中是将结果组成一个新的list返回，在python3.x中是返回一个map对象，要取得map对象里得内容可以用list()方法，也可以通过循环遍历。

如下例子（python3）：

```python
>>> map(lambda x: x*2, [1,2,3,4,5])
<map object at 0x0000013D497E92E8>
>>> list(map(lambda x: x*2, [1,2,3,4,5]))
[2, 4, 6, 8, 10]
>>> for i in map(lambda x: x*2, [1,2,3,4,5]):
...     print(i)
...
2
4
6
8
10
>>>
```

当然，map()还是可以传入多个interable对象，如下：

```python
>>> list(map(lambda x,y: x+y, [1,2,3,4,5], [6,7,8,9,10]))
[7, 9, 11, 13, 15]
>>>
```

在传入多个interable对象的时候，首先你的函数体的接受多个参数，比如传入上面例子，传入两个interable对象，函数的接受参数也是两个，即x,y。当传入多个interable对象的时候，函数是依次从interable对象中取值，然后组成一个新的元组，最后将元组传个function，如上例子，第一次取(1,6)传入function得出结果7，第二次取(2,7)得出结果9，依次类推。

# 二、reduce

在python3中，reduce()已经从全局名字空间里移除了，它现在被放在functools模块中了，要使用需要先导入模块，reduce()函数常见的调用方式如下：

```python
from functools import reduce
reduce(function, interable)
```

其中第一个参数是一个函数名或匿名函数，第二个参数是一个可迭代对象，第三个参数是一个初始值（可选参数），它的功能是返回函数的计算结果。如下：

```python
>>> from functools import reduce
>>> reduce(lambda x,y: x+y, [1,2,3,4,5])
15
>>> reduce(lambda x,y: x*y, [1,2,3,4,5])
120
>>> reduce(lambda x,y: x*y, [1,2,3,4,5],100)
12000
```

reduce()的工作原理是，依次取interable对象中的一个元素，和上次的结果做计算，最后返回结果。如果没有传入默认参数，那么第一次计算的时候第一个参数作为结果，从第二个参数开始传值。如果有默认参数，那么直接从第一个参数和默认值进行计算，依次下去。

# 三、filter

filter()函数的调用格式如下：

```python
filter(function, iterable)
```

filter()函数的两个参数，第一个是函数名或者匿名函数，第二个是可迭代对象，比如列表等。filer()函数和map()函数比较类似，都是依次从interable对象中取值传入function中计算的出结果，不同的是filter()函数会判断每次执行结果的bool值，并只将bool值为True的筛选出来，在python2中依然返回的是一个列表，在python3中返回的是一个filter对象，获取里面的值可以用list()方法和循环等。如下：

```python
>>> list(filter(lambda x: x/2, [1,2,3,4,5]))
[1, 2, 3, 4, 5]
>>> list(filter(lambda x: x%2, [1,2,3,4,5]))
[1, 3, 5]
>>>
```

  

# 四、sorted

sorted()函数的调用方式如下：

```python
sorted(iterable, key=None, reverse=False)
```

参数说明如下：

interable，是一个可迭代对象，比如列表，元组等；

key，主要是用来比较的元素，只是一个参数，具体的参数是取自可迭代对象中，指定可迭代对象中一个元素来进行排序；

reverse，排序规则，reverse=True表示降序，reverse=False表示升序，默认是False；

如下例子：

```python
>>> sorted([1,9,8,2,3])
[1, 2, 3, 8, 9]
>>> sorted([1,9,8,2,3], reverse=True)
[9, 8, 3, 2, 1]
>>> sorted(L, key=lambda x:x[1])
[('a', 1), ('b', 2), ('c', 3), ('d', 4), ('e', 5)]
>>>
```

  

# 五、总结

函数式编程的好处如下：

（1）、代码更为简洁；

（2）、代码中没有循环体，少了很多临时变量，逻辑也更为简单；

（3）、数据集，操作和返回值都放在了一起；