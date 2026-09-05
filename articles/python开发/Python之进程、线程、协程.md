# 一、进程

进程就是一个程序在数据集上动态的一次动态执行过程。

进程一般由程序、数据集、进程控制块三部分组成。我们编写的程序用来描述进程要完成哪些功能以及如何完成；数据集则是程序在执行过程中所需要使用的资源；进程控制块用来记录进程的外部特征，描述进程的执行变化过程，系统可以利用它来控制和管理进程，它是系统感知进程存在的唯一标志。

  

multiprocessing模块是python的多进程管理包，它和threading很大部分使用同一套API。

**使用共享API的注意事项：**

（1）、在UNIX平台，当某个进程结束后，该进程需要被父进程调用wait，否则会称为僵尸进程，所以有必要对每个process调用join()方法；

（2）、multiprocessing提供threading没有的IPC，效率更高，应该优选Pipe,Queue；

（3）、多进程应该避免共享资源；

  

例子：

```python
from multiprocessing import Process
import time

def f(name):
    time.sleep(1)
    print('hello {} {}'.format(name, time.time()))

if __name__ == "__main__":
    p_list = []
    for i in range(3):
        p = Process(target=f, args=('joker',))
        p_list.append(p)
        p.start()

    for i in p_list:
        i.join()

    print('end')
```

  

例子：用类创建进程

```python
from multiprocessing import Process
import time

class MyProcess(Process):
    def __init__(self, name):
        self.name = name
        super(MyProcess, self).__init__()

    def run(self):
        print("hello {} {}".format(self.name, time.time()))

if __name__ == "__main__":
    p_list = []
    for i in range(3):
        p = MyProcess('joker')
        p_list.append(p)
        p.start()

    for i in p_list:
        i.join()

    print('end')
```

  

## 1、进程间共享数据

### 1.1 Queue

进程之间的Queue是copy的，是通过pickle做序列化存起来，取的时候反pickle取出来。

```python
from multiprocessing import Process, Queue
import time

def func(q, n):
    q.put([42, n, 'hello'])

if __name__ == "__main__":
    q = Queue()
    p_list = []
    for i in range(3):
        p = Process(target=func, args=(q, 2,))
        p_list.append(p)
        p.start()

    print(q.get())
    print(q.get())
    print(q.get())

    for i in p_list:
        i.join()

    print('end')
```

  

### 1.2 Pipes

```python
from multiprocessing import Process, Pipe
def f(conn):
    conn.send([42, None, 'hello'])
    conn.close()
    
if __name__ == '__main__':
    parent_conn, child_conn = Pipe()
    p = Process(target=f, args=(child_conn,))
    p.start()
    print(parent_conn.recv())
    p.join()
```

  

### 1.3 Manger

```python
from multiprocessing import Process
def f(d,l,n):
    d[n] = '1'
    d['2'] = 2
    d[0.25] = None
    l.append(n)
    print(l)
if __name__ == '__main__':
    with Manager() as manager:
        d = manager.dict()
        l = manager.list(range(5))
        p_list = []
        for i in range(10):
            p = Process(target=f, args=(d,l,i))
            p.start()
            p_list.append(p)
            
        for i in p_list:
            i.join()
            
    print(d)
    print(l)
```

  

# 二、线程

线程也叫轻量级进程，它是一个基本的CPU执行单元，也是程序执行过程中的最小单元，由线程ID、程序计数器、寄存器集合 和堆栈共同组成。线程的引入减小了程序并发执行时的开销，提高了操作系统的并发性能。 线程没有自己的系统资源，只拥有在运行时必不可少的资源。但线程可以与同属与同一进程的其他线程共享进程所拥有的其他资源。

线程是属于进程的，线程运行在进程空间内，同一进程所产生的线程共享同一内存空间，当进程退出时该进程所产生的线程都会被强制退出并清除。线程可与属于同一进程的其它线程共享进程所拥有的全部资源，但是其本身基本上不拥有系统资源，只拥有一点在运行中必不可少的信息(如程序计数器、一组寄存器和栈)。

  

# 三、协程