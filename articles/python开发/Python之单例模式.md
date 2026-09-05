单例模式，即为一个类的实例从始至终只能被创建一次。

  

## 1、使用\_\_new\_\_方法

```python
class Singleton(object):
    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, "_instance"):
            cls._instance = super(Singleton, cls).__new__(cls)
        return cls._instance

class A(Singleton):
    def __init__(self, fruit):
        self.fruit = fruit

if __name__ == "__main__":
    banana = A('banana')
    apple = A('apple')
    print(id(banana) == id(apple))

# ----------------------
True
```

在python中，id()是用来查看对象在内存中的位置，如果其值相同，则代表其指向了同一个对象。

  

\_\_new\_\_()方法作用在\_\_init\_\_()之前，决定是否启用\_\_init\_\_()方法，通过\_\_new\_\_()方法将类的方法在创建时绑定到\_instance，如果cls.\_instance为空，表示未被实例化，然后进行实例化操作，反之，表示已经被实例化，后面每次实例化都使用第一次实例化创建的实例。

  

## 2、通过函数装饰器

```python
def singleton(cls):
    _instance = {}
    def inner():
        if cls not in _instance:
            _instance[cls] = cls()
        return _instance[cls]
    return inner

@singleton
class Singleton(object):
    def __init__(self):
        self.name = "ceshi"

a = Singleton()
b = Singleton()
print(id(a) == id(b))

# ----------------------------
True
```

这里使用\_instance = {}来保存实例对象，每次都判断以下该类是否存在实例，如果存在就直接返回该实例，反之创建实例。

  

## 3、通过类装饰器

```python
class Singleton(object):
    def __init__(self, cls):
        self.cls = cls
        self._instance = {}

    def __call__(self):
        if self.cls not in self._instance:
            self._instance[self.cls] = self.cls()
        return self._instance[self.cls]

@Singleton
class Test1(object):
    def __init__(self):
        self.name = "ceshi"

a = Test1()
b = Test1()
print(id(a) == id(b))
```

道理和函数装饰器类似。

  

## 4、使用\_\_metaclass\_\_元类

```python
class Singleton(type):
    def __init__(self, name, bases, class_dict):
        super(Singleton,self).__init__(name, bases, class_dict)
        self._instance = None
    def __call__(self, *args, **kwargs):
        if self._instance is None:
            self._instance = super(Singleton,self).__call__(*args, **kwargs)
        return self._instance
if __name__ == '__main__':
    class A(metaclass = Singleton):
        pass      
    a = A()
    b = A()
    print(id(a) == id(b))
```

我们将类A的metaclass指向Singleton，让Singleton中的type来创建A的实例。

  

## 5、调用独有的实例对象

```python
# 定义一个模块sites.py
class Singleton(object):
    def __init__(self):
        print("这是一个被实例化的类")

singleton = Singleton()

# 然后在另外的模块中导入上面定义的模块test.py
from sites import singleton
```

只要程序启动，singleton就是唯一的Singleton()的实例化对象。