# 上下文管理器简介

  

在任何一门编程语言中，文件的打开和关闭，数据库的连接和释放都是常见的操作。但是资源都是有限的，在写程序时必须保证资源在未使用时会合理的释放，不然很容易造成资源泄露。

  

在python中为了避免程序造成资源浪费而采用的机制是上下文管理其（context manager）。上下文管理其是能够帮助你自动分配并且释放资源，其中最典型的应用便是with语句。

比如我们在打开文件时：

```plain
with open("test.txt", "w") as f:
	f.write("Hello World!")
```

在程序执行完后它内部会自动调用close()来释放资源，并不需要我们专门去调用一下close()。

当然还可以写成下面这种：

```plain
f = open("test.txt", "w")
try:
	f.write("Hello World!")
finally:
	f.close()
```

如果采用下面这种写法，finally代码块是必须的，不然就会造成资源浪费。不过和with语句相比较就可以很容易的看到with语句代码比较清晰简洁，所以推荐使用 with语句，也可以避免因为自己疏忽忘记close()造成不必要的浪费。

  

还有一个典型的例子是python中使用Threading.lock类，比如我想获取一个锁，完成后释放，那么可以写成下面这段代码：

```plain
my_lock = threading.Lock()
my_lock.acquire()
try:
	......
finally:
	my_lock.release()
```

如果用with语句，则可以写成下面这样子：

```plain
my_lock = threading.Lock()
my_lock.acquire()
with my_lock:
	......
```

  

# 上下文管理器应用

## 基于类的上下文管理器

  

定义一个类FileManager，模拟文件的打开、关闭操作：

```plain
class FileManager:
    def __init__(self, name, mode):
        print('calling __init__ method')
        self.name = name
        self.mode = mode 
        self.file = None
        
    def __enter__(self):
        print('calling __enter__ method')
        self.file = open(self.name, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        print('calling __exit__ method')
        if self.file:
            self.file.close()
            
with FileManager('test.txt', 'w') as f:
    print('ready to write to file')
    f.write('hello world')
    
## 输出
calling __init__ method
calling __enter__ method
ready to write to file
calling __exit__ method
```

需要注意的是当我们用类来创建上下文管理器的时候，必须保证这个类包括方法"\_\_enter\_\_()"和"\_\_exit\_\_()"，其中"\_\_enter\_\_()"返回一个需要被管理的资源，"\_\_exit\_\_()"会存在一些释放和清理资源的操作。

  

我们使用with代码块来执行文件的操作它们依次执行下面四个操作：

（1）、调用\_\_init\_\_()，完成FileManager初始化；

（2）、调用\_\_enter\_\_()，以指定的的模式打开文件，返回打开后的文件对象；

（3）、完成文件操作；

（4）、调用\_\_exit\_\_()，关闭清理打开的文件流；

  

另外方法\_\_exit\_\_()方法中的exc\_type，exc\_val，exc\_tb分别表示exception\_type，exception\_value，traceback。当执行语句中含有上下文管理器with语句时，如果有异常抛出，异常的信息就会包含这三个变量中，传入\_\_exit\_\_()中。

  

如果要处理异常，我们可以把代码写成如下：

```plain
class Foo:
    def __init__(self):
        print('__init__ called')        

    def __enter__(self):
        print('__enter__ called')
        return self
    
    def __exit__(self, exc_type, exc_value, exc_tb):
        print('__exit__ called')
        if exc_type:
            print(f'exc_type: {exc_type}')
            print(f'exc_value: {exc_value}')
            print(f'exc_traceback: {exc_tb}')
            print('exception handled')
        return True
    
with Foo() as obj:
    raise Exception('exception raised').with_traceback(None)

# 输出
__init__ called
__enter__ called
__exit__ called
exc_type: <class 'Exception'>
exc_value: exception raised
exc_traceback: <traceback object at 0x1046036c8>
exception handled

```

  

这里我们在with语句中抛出了异常"exception raised"，这时候\_\_exit\_\_()方法会顺利捕捉到异常并进行处理。不过需要注意的是，如果方法\_\_exit\_\_中没有返回True，异常依然会抛出。因此，如果确定异常被处理了，请在\_\_exit\_\_()的最后加上"return True"。

  

同样数据库的连接操作，也常常可以使用上下文管理器来表示，简短代码如下：

```plain
class DBConnectionManager: 
    def __init__(self, hostname, port): 
        self.hostname = hostname 
        self.port = port 
        self.connection = None
  
    def __enter__(self): 
        self.connection = DBClient(self.hostname, self.port) 
        return self
  
    def __exit__(self, exc_type, exc_val, exc_tb): 
        self.connection.close() 
  
with DBConnectionManager('localhost', '8080') as db_client: 
	......
```

  

它的执行过程与FileManager类似。

  

## 基于生成器的上下文管理器

  

上下文管理器不仅可以通过类来实现，还可以通过生成器的方式。

基于生成器的上下文管理器可以使用contextlib.contextmanager来实现，如下：

```plain
from contextlib import contextmanager

@contextmanager
def file_manager(name, mode):
    try:
        f = open(name, mode)
        yield f
    finally:
        f.close()
        
with file_manager('test.txt', 'w') as f:
    f.write('hello world')

```

代码中file\_manager是一个生成器，当我们使用with语句便会打开文件并返回文件对象，当文件执行完后会执行finally代码块关闭文件。

  

基于类的上下文管理器和基于生成器的上下文管理器实现的功能是一样的，不过他们也有一些区别：

（1）、基于类的上下文管理器更加灵活，适用于大型的系统开发；

（2）、基于生成器的上下文管理更加方便简洁，适用于中小型系统开发；