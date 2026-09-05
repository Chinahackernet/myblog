在python中有6种标准的数据类型，它们分别是可变的和不可变的，其中有3种是不可变的，它们分别是Number，String，Tuple；另外3种是可变的，它们分别是List，Dictionary，Set.

# 浅拷贝

浅拷贝用copy模块中的copy()方法实现，它有如下特点：

（1）、对于不可变类型，浅拷贝仅仅是地址指向，不会开辟新的空间；

（2）、对于可变类型，浅拷贝会开辟新的空间（仅仅是最顶层开辟空间，里层不会改变）；

（3）、浅拷贝后，如果改变原始数据中可变类型的值，拷贝后对象的值也会受影响，如果改变原始数据中不可变类型的值，只有原始数据受影响，拷贝后对象的值不受影响；

例如对于不可变类型：

  

```python
# Number
>>> num1 = 66
>>> num2 = copy.copy(num1)
>>> print("num1:{}".format(id(num1)))
num1:140718733224624
>>> print("num2:{}".format(id(num2)))
num2:140718733224624
  
# String
>>> str1 = "hello"
>>> str2 = copy.copy(str1)
>>> print("str1:{}".format(id(str1)))
str1:2953634367896
>>> print("str2:{}".format(id(str2)))
str2:2953634367896
    
# Tuple
>>> tup1 = (1,2)
>>> tup2 = copy.copy(tup1)
>>> print("tup1:{}".format(id(tup1)))
tup1:2953634226824
>>> print("tup2:{}".format(id(tup2)))
tup2:2953634226824
>>>

# 分别修改原始数据
>>> num1 = 77
>>> num2
66
>>> str1 = "world"
>>> str2
'hello'
>>> tup1 = (3,4)
>>> tup2
(1, 2)
>>>
```

  

对于可变数据类型，例如：

  

```python
# List
>>> list1 = [1,2,3]
>>> list2 = copy.copy(list1)
>>> print("list1:{}".format(id(list1)))
list1:2953634215688
>>> print("list2:{}".format(id(list2)))
list2:2953634365192
>>> list11 = [4,5,[6,7,8]]
>>> list12 = copy.copy(list11)
>>> print("list11:{}".format(id(list11)))
list11:2953634365064
>>> print("list12:{}".format(id(list12)))
list12:2953634365320

# Dictionary
>>> dict1 = {"name": "joker", "age": 18}
>>> dict2 = copy.copy(dict1)
>>> print("dict1:{}".format(id(dict1)))
dict1:2953634147640
>>> print("dict2:{}".format(id(dict2)))
dict2:2953634194272
    
# Set
>>> set1 = {'a','b'}
>>> set2 = copy.copy(set1)
>>> print("set1:{}".format(id(set1)))
set1:2953634207336
>>> print("set2:{}".format(id(set2)))
set2:2953634208232

# 对原始数据进行修改
>>> list1[0]=100
>>> list2
[1, 2, 3]
>>> dict1["age"]=33
>>> dict2
{'name': 'joker', 'age': 18}
>>> list11[0]=400
>>> list12
[4, 5, [6, 7, 8]]
>>> list11[2][1]=600
>>> list12
[4, 5, [6, 600, 8]]
>>>
```

  

如果原始数据是可变类型，如下：

  

```python
>>> list3 = [100,200,300]
>>> list4 = [500,600,700]
>>> num = 999
>>> list34 = [list3, list4, num]
>>> list56 = copy.copy(list34)
>>> num = 888
>>> list34
[[100, 200, 300], [500, 600, 700], 999]
>>> list56
[[100, 200, 300], [500, 600, 700], 999]
>>> list3[0]=1000
>>> list34
[[1000, 200, 300], [500, 600, 700], 999]
>>> list56
[[1000, 200, 300], [500, 600, 700], 999]
>>>
```

  

# 深拷贝

深拷贝用copy模块中deepcopy()方法实现，它有如下特点：

（1）、深拷贝就是克隆了一份，完全复制；

（2）、经过深拷贝后，原始对象和新拷贝的对象是相互独立的；

  

对于只有一层的数据，深拷贝和浅拷贝几乎一致，因为深拷贝更多的是强调递归，强调的是资源数，如下：

  

```python
>>> list3 = [100,200,300]
>>> list4 = [500,600,700]
>>> num = 999
>>> list34 = [list3, list4, num]
>>> list78 = copy.deepcopy(list34)
>>> num = 888
>>> list34
[[100, 200, 300], [500, 600, 700], 999]
>>> list78
[[100, 200, 300], [500, 600, 700], 999]
>>> list3[0]=1000
>>> list34
[[1000, 200, 300], [500, 600, 700], 999]
>>> list78
[[100, 200, 300], [500, 600, 700], 999]
>>>
```

本例是跟浅拷贝做对比的。

在之前的浅拷贝中，子元素是不会开辟新空间做拷贝的。

而在深拷贝中，子元素也进行了拷贝。