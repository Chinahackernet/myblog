列表的生成方式有下面三种：

（1）、用[]定义，比如a = [1，2，3，4]；

（2）、用list()方法生成，比如a = list((1,2,3,4))；

（3）、用列表生成式

我们来看看列表生成式的基本语法：

```python
[exp for iter_var in iterable]
```

其工作过程如下：

（1）、迭代iterable中的每个元素；

（2）、每次迭代都先把结果赋值给iter\_var，然后通过exp得到一个新的计算值；

（3）、最后把所有通过exp得到的计算值以一个新列表的形式返回。

其过程相当于下面这种语法：

```python
L = []
for iter_var in iterable:
    L.append(exp)
```

  

带过滤功能的列表生成式的基本语法：

```python
[exp for iter_var in iterable if_exp]
```

其工作过程如下：

（1）、迭代iterable中的每个元素，每次迭代都先判断if\_exp表达式结果为真，如果为真则进行下一步，如果为假则进行下一次迭代；

（2）、把迭代结果赋值给iter\_var，然后通过exp得到一个新的计算值；

（3）、最后把所有通过exp得到的计算值以一个新列表的形式返回；

其过程相当于下面这个例子：

```python
L = []
for iter_var in iterable:
    if_exp:
        L.append(exp)
```

  

循环嵌套的列表生成式的格式：

```python
[exp for iter_var_A in iterable_A for iter_var_B in iterable_B]
```

其工作过程是每迭代iterable\_A中的一个元素，就把ierable\_B中的所有元素都迭代一遍。

相当于下面这种写法：

```python
L = []
for iter_var_A in iterable_A:
    for iter_var_B in iterable_B:
        L.append(exp)
```