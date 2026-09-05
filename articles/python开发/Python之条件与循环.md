# 一、条件语句

先来看一个简单的示例，如下：

```python
if x > 0:
  x = 1
else:
  x = 0
```

这就是一个简单的条件语句，旨在判断x的值，如果大于0，将x重新赋值为1，反之赋值为0。值得注意的是，在python中条件是不需要括号包起来的，如下是不允许的：

```python
if (x>1):
    .....
```

还有一点，那就是条件语句的条件后是需要加"："，这是python的语法要求。

在python中是没有switch语句的，如果需要实现类似的效果就需要if...elif...else来实现，如下：

```python
if id = 1:
    print("登录1")
elif id = 2:
    print("登录2")
elif id = 3:
    print("登录3")
else:
    print("不存在")
```

条件语句是顺序执行的，也就是说如果id=1满足要求，则后续的id=2等等就不再执行，反之，就会执行下面的elif语句，直到条件满足，如果所有的elif语句都不满足，则最后执行else语句。

注意：if语句是可以单独使用的，但是elif和else都必须和if配对。

在实际运用中，我们还会使用如下的写法：

```python
if a:
    ....
```

这种省略用法a的结果是True或者False，一般是满足如下要求：

<table class="lake-table" style="width: 721px;"><colgroup><col span="1" width="360" /><col span="1" width="360" /></colgroup><tbody><tr style="height: 33px;"><td><p>数据类型</p></td><td><p>数据结果</p></td></tr><tr style="height: 33px;"><td><p>String</p></td><td><p>空字符串为False，其他为True</p></td></tr><tr style="height: 33px;"><td><p>Int</p></td><td><p>0为False，其他为True</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Bool</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>True为True，False为False</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>List/Tuple/Dic/Set</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>空为False，其他为True</p></td></tr><tr><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>Object</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>null为False，其他为True</p></td></tr></tbody></table>

在实际应用中，建议除了Bool类型的，其他的都建议写完整表达式，这样更直观的显示输出，方便调试。

# 二、循环语句

循环语句的本质上是遍历集合中的元素，python中的循环有for和while循环，如下示例：

```python
li = [1,2,3,4]
for i in li:
    print(i)

j = 0
while j < len(li):
    print(j)
```

在python中，只要数据结构是可迭代的（interable），比如列表、集合，都可以使用以下方面来遍历元素：

```python
for i in [1,2,3,4]:
    print(i)
    
for j in (5,6,7,8):
    print(j)
```

需要注意的是：如果是字典，字段的键本身是可迭代的，所以直接循环得到是键而不是值，如果需要得到键值对，就需要其内置方法values()和items()实现，其中values()返回的是字典的值的集合，items()返回的是字典的键的集合。如下：

```python
d = {'name': 'jason', 'dob': '2000-01-01', 'gender': 'male'}
for k in d: # 遍历字典的键
    print(k)
name
dob
gender

for v in d.values(): # 遍历字典的值
    print(v)
jason
2000-01-01
male    

for k, v in d.items(): # 遍历字典的键值对
    print('key: {}, value: {}'.format(k, v))
key: name, value: jason
key: dob, value: 2000-01-01
key: gender, value: male 
```

我们也可以通过集合中的索引来获取数据，这时候我们通常会使用range()函数来获取索引，拿到索引，再去获取元素，如下：

```python
li = [1,2,3,4] 
for i in range(len(li)):
    print(li[i])
```

当我们同时需要索引和元素的时候，还可以借助python的内置函数enumerate()，用来遍历集合，不仅返回元素，还返回索引，如下：

```python
li = [1,2,3,4,5]
for i, v in enumerate(li):
...     print(i,v)
...
0 1
1 2
2 3
3 4
4 5
```

在循环中，我们通常会搭配break，continue来使用。continue是让程序跳出当前循环，继续执行下一次循环，break是让程序结束循环。如下示例：

```python
# name_price: 产品名称 (str) 到价格 (int) 的映射字典
# name_color: 产品名字 (str) 到颜色 (list of str) 的映射字典
name_price = {'a': 999, 'b': 1999}
name_color = ('a': 'red', 'b': 'yellow')
for name, price in name_price.items():
    if price >= 1000:
        continue
    if name not in name_color:
        print('name: {}, color: {}'.format(name, 'None'))
        continue
    for color in name_color[name]:
        if color == 'red':
            continue
        print('name: {}, color: {}'.format(name, color))

```

前面讲了很多for循环，其实while循环也是一样的，for和while循环有时候是可以相互转换的，但是它们也有各自的使用场景，如下：

如果只是遍历一个已知的集合找出满足条件的元素，并进行相应的操作，这时候使用for循环更加简洁。但是如果是不断的循环执行操作直到一个条件结束循环或者不断的循环则用while循环。如下示例使用while循环：

```python
while True:
    try:
        text = input('Please enter your questions, enter "q" to exit')
        if text == 'q':
            print('Exit system')
            break
        ...
        ...
        print(response)
    except as err:
        print('Encountered error: {}'.format(err))
        break 

```

for和while的效率比较，如下示例：

```python
# for 循环
for i in range(0,10000):
    print(i)
    
# while 循环
j = 0
while j < 10000:
    print(i)
    j += 1
```

上面两种使用方式达到的效果是一样的，但是对于for循环，由于range()函数是直接调用C语言写的，调用它的速度非常快，而对于while循环，循环中的j+=1是需要通过python解释器去调用底层的C语言，并且这个表达式又涉及对象的创建和删除，因为j是整型，j+=1相当于j = new int(j + 1)，所以for循环会快一些。

  

# 三、条件和循环的复用

我们经常会看到一些循环和条件代码并为一行的操作，如下：

```python
expression1 if condition else expression2 for item in iterable
```

上面这个例子等同于：

```python
for item in iterable:
    if condition:
        expression1
    else:
        expression2
```

如果没有else，则可以写成如下格式：

```python
expression for item in iterable if condition
```

比如，我们要绘制y=2\*|x|+5的函数图像，已知集合x的数据点，需要计算y的数据点，那么就可以只用一行代码解决，如下：

```python
y = [value * 2 + 5 if value > 0 else -value * 2 + 5 for value in x]
```

再比如，我们要处理文本字符串时，将文本逐行读出，然后按都好分割单词，去掉首尾的空字符串，并过滤长度小于3的单词，再返回单词组的列表，如下：

```python
text = ' Today,  is, Sunday'
text_list = [s.strip() for s in text.split(',') if len(s.strip()) > 3]
print(text_list)
['Today', 'Sunday']
```

当然，这样的复用不局限一个循环，比如，给定两个列表x,y，需要返回所有x,y的元素对组成的元组，相等情况除外，可以用以下方式：

```python
[(xx, yy) for xx in x for yy in y if xx != yy]
```

# 四、总结

（1）、在条件语句中，if语句可以单独执行，而elif和else必须和if配对使用，而if语句的判断，除了bool类型的，其他的都建议显示判断；

（2）、在for循环中，如果需要同时获得索引和值，可以使用enumerate()函数来简化代码；

（3）、写条件循环的时候，合理利用continue和break，可以很大程度上简化代码；

（4）、要注意条件与循环的复用，简单功能往往可以用一行直接完成，极大的提高代码质量和效率。