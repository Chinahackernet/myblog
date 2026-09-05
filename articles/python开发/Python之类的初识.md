# 一、类的初识

类，是一群有着相同属性和方法的对象的集合。

我们先来看下面一个例子：

```python
>>> class Foo:
...     def __init__(self, name, age):
...         self.name = name
...         self.age = age
...         self.__money = 100
...     def get_name(self):
...         return self.name
...     def get_money(self):
...         return self.__money
...
>>> f = Foo("joker",18)
>>> print(f.get_name)
<bound method Foo.get_name of <__main__.Foo object at 0x000001F4B8339438>>
>>> print(f.get_name())
joker
>>> print(f.get_money())
100
>>> print(f.name)
joker
>>> print(f.age)
18
>>> print(f.__money)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'Foo' object has no attribute '__money'
>>>
```

结合上面的例子，做几个名称解释：

（1）、类：一群有着相似性事物的集合，对应上面的class（关键字），Foo是类名

（2）、对象：集合中的事物，由类生成，对应上面的f

（3）、属性：对象的某个特征，对应上面的name,age,\_\_money

（4）、方法：对象的某个动态能力，对应上面的get\_name()，get\_money()

从上面可以看到class定义了一个类Foo，它的下面有三个方法，其中init()是构造方法，它会在生成对象的时候自动执行，而get\_name和get\_money是普通方法，由对象来调用。

Foo类有三个属性值(name,age,\_\_money)，其中name和age是普通属性值，而\_\_money是私有属性值，普通属性值可以使用对象调用得到具体的值，而私有的属性值只能在类中调用，对象无法调用，如果需要获得私有属性值的内容，可以像上面定义一个方法，通过对象调用方法取得私有属性。

  

# 二、类的字段

类中的字段包含静态字段和普通字段。其中静态字段保存在类中，可以通过对象和类访问，普通字段保存在对象中，只能通过对象访问。

如下例子：

```python
>>> class Foo:
...     NAME = "中国"
...     def __init__(self, city):
...         self.city = city
...
>>> f = Foo("上海")
>>> print(f.NAME)
中国
>>> print(Foo.NAME)
中国
>>> print(f.city)
上海
>>> print(Foo.city)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: type object 'Foo' has no attribute 'city'
>>>
```

上面例子中NAME是静态字段，city是普通字段，静态字段NAME可以通过对象f和类Foo调用（如上），而普通字段只能通过对象f调用。

# 三、类的方法

类得方法分为：

（1）、普通方法

（2）、静态方法

（3）、类方法

应用场景如下：

（1）、如果对象中需要保存一些值，调用方法需要调用对象中的值，用普通方法；

（2）、如果不需要对象中的值，用静态方法；

（3）、在方法中如果需要当前的类名，用类方法；

```python
>>> class Foo:
...     def bar(self):
...         print("bar")
...     @staticmethod
...     def static_method():
...         print("static method")
...     @staticmethod
...     def static_method2(a,b):
...         print(a,b)
...     @classmethod
...     def class_method(cls):
...         print("class method",cls)
...
>>> f = Foo()
>>> f.bar()
bar
>>> Foo.bar(f)
bar
>>> f.static_method()
static method
>>> Foo.static_method()
static method
>>> Foo.static_method(1,2)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: static_method() takes 0 positional arguments but 2 were given
>>> Foo.static_method2(1,2)
1 2
>>> Foo.class_method()
class method <class '__main__.Foo'>
>>>
```

上面定义了一个类Foo，它里面有普通方法bar()，有静态方法static\_method(),static\_method2()，还有类方法class\_method()，其中@staticmethod表示该方法是静态方法，@classmethod表示该方法是类方法。它们都可以通过对象和类名调用，其中，如果用类名调用普通方法，是要传对象名的，调用静态方法，不用传参数，调用类方法也不用传参数。