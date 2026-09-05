反射就是通过字符串的形式导入模块。通过字符串的形式，去模块中寻找函数去执行；利用字符串的形式去对象中操作成员，一切都是基于字符串的事件驱动。

  

# 反射的内置函数

## getattr

  

```python
class A(object):
    def __init__(self, name):
        self.name = name

    def method(self):
        print("Your name is {}".format(self.name))

obj = A("joker")

# 如果obj里有name属性就打印self.name，反之打印not find
print(getattr(obj, "name", "not find"))

# 如果obj里有age属性就打印self.age，反之打印not find
print(getattr(obj, "age", "not find"))

# 如果是方法，就打印其地址，反之打印default
print(getattr(obj, "method", "default"))

# 如果是方法，就打印其地址，反之打印default
print(getattr(obj, "func", "default"))

----------------------------------------------------------------------
joker
not find
<bound method A.method of <__main__.A object at 0x0000018992FD20B8>>
default
```

  

## hasattr

hasattr()返回的是布尔值，判断对象、模块等中是否存在这个值；

  

```python
print(hasattr(obj, "name"))
print(hasattr(obj, "age"))
print(hasattr(obj, "method"))
print(hasattr(obj, "func"))

---------------------------------------------------
True
False
True
False
```

  

## setattr

参数是一个对象,一个字符串和一个任意值。字符串可能会列出一个现有的属性或一个新的属性。这个函数将值赋给属性的。该对象允许它提供.

```python
# 如果对象中有name属性，则把"blala"赋值给它
print(setattr(obj, "name", "blala"))
print(getattr(obj, "name"))
----------------------------------------------
None			<---- set成功会返回None
blala

# 如果对象中没有age属性，则创建一个新属性age,将12赋值给它
print(setattr(obj, "age", 12))
print(getattr(obj, "age"))
-----------------------------------------------
None
12

# 如果对象中有method方法，则重写里面的方法
print(setattr(obj, "method", print("OK")))
print(getattr(obj, "method"))
-----------------------------------------------
None
OK

# 如果对象中没有func方法，则创建一个新的方法func
print(setattr(obj, "func", print("func is OK")))
print(getattr(obj, "func"))
----------------------------------------------
None
func is OK
```

  

## delattr

删除模块或者对象中的属性或方法。删除成功会返回None。

  

```python
print(delattr(obj, "name"))
print(hasattr(obj, "name"))
--------------------------------------
None
False

# 如果不存在，就报异常
print(delattr(obj, "age"))
-------------------------------------
AttributeError: age
    
# 创建一个新的func
print(setattr(obj, "func", print("func is OK")))
print(delattr(obj, "func"))
print(hasattr(obj, "func"))
--------------------------------------
None			<------ 添加成功返回码
func is OK
None			<------ 删除成功返回码
False

# 对象中原有定义的函数是无法del的，会报异常
print(hasattr(obj, "method"))
print(delattr(obj, "method"))
--------------------------------------
True
AttributeError: method
```