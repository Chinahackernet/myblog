# 并发和并行

  

并发（concurrency）是某个特定时刻只允许有一个任务发现，只不过线程/任务之间会互相切换，直到任务完成。

![image.png](assets/python开发/Python之并发编程/Python之并发编程-1.png)

图中thread和task两种切换方式的不同分别对应python并发的两种形式：threading和asyncio。

对于threading，操作系统知道每个线程的所有信息，它会在适当的时候做线程切换。这样的好处是程序员不用做任何线程操作处理，但是在切换的过程中也可能因为某个语句或程序正在执行而出现race condition的情况。

对于asyncio，主程序想要切换任务时，必须得到此任务可以被切换的通知，这样就可以避免上面的race condition情况。

  

并行（parallelism）是指同一时刻，同时发生。multi-processing就是并行操作。

![image.png](assets/python开发/Python之并发编程/Python之并发编程-2.png)

总结：

（1）、并发通常应用于IO操作频繁的场景，比如要从网站下载很多文件，IO操作时间可能比CPU运行时间长的多；

（2）、并行通常应用于CPU heavy的场景，比如MapReduce中的并行运算，为了加快运算速度，通常是多台服务器并行处理；

  

# 并发编程Futures

## 单线程与多线程的性能比较

假如有一个任务，下载一些网站的内容并打印，使用单线程的代码如下：

  

```python
import requests
import time

def download_one(url):
    resp = requests.get(url)
    print('Read {} from {}'.format(len(resp.content), url))
    
def download_all(sites):
    for site in sites:
        download_one(site)

def main():
    sites = [
        'https://en.wikipedia.org/wiki/Portal:Arts',
        'https://en.wikipedia.org/wiki/Portal:History',
        'https://en.wikipedia.org/wiki/Portal:Society',
        'https://en.wikipedia.org/wiki/Portal:Biography',
        'https://en.wikipedia.org/wiki/Portal:Mathematics',
        'https://en.wikipedia.org/wiki/Portal:Technology',
        'https://en.wikipedia.org/wiki/Portal:Geography',
        'https://en.wikipedia.org/wiki/Portal:Science',
        'https://en.wikipedia.org/wiki/Computer_science',
        'https://en.wikipedia.org/wiki/Python_(programming_language)',
        'https://en.wikipedia.org/wiki/Java_(programming_language)',
        'https://en.wikipedia.org/wiki/PHP',
        'https://en.wikipedia.org/wiki/Node.js',
        'https://en.wikipedia.org/wiki/The_C_Programming_Language',
        'https://en.wikipedia.org/wiki/Go_(programming_language)'
    ]
    start_time = time.perf_counter()
    download_all(sites)
    end_time = time.perf_counter()
    print('Download {} sites in {} seconds'.format(len(sites), end_time - start_time))
    
if __name__ == '__main__':
    main()

# 输出
Read 129886 from https://en.wikipedia.org/wiki/Portal:Arts
Read 184343 from https://en.wikipedia.org/wiki/Portal:History
Read 224118 from https://en.wikipedia.org/wiki/Portal:Society
Read 107637 from https://en.wikipedia.org/wiki/Portal:Biography
Read 151021 from https://en.wikipedia.org/wiki/Portal:Mathematics
Read 157811 from https://en.wikipedia.org/wiki/Portal:Technology
Read 167923 from https://en.wikipedia.org/wiki/Portal:Geography
Read 93347 from https://en.wikipedia.org/wiki/Portal:Science
Read 321352 from https://en.wikipedia.org/wiki/Computer_science
Read 391905 from https://en.wikipedia.org/wiki/Python_(programming_language)
Read 321417 from https://en.wikipedia.org/wiki/Java_(programming_language)
Read 468461 from https://en.wikipedia.org/wiki/PHP
Read 180298 from https://en.wikipedia.org/wiki/Node.js
Read 56765 from https://en.wikipedia.org/wiki/The_C_Programming_Language
Read 324039 from https://en.wikipedia.org/wiki/Go_(programming_language)
Download 15 sites in 2.464231112999869 seconds

```

我们可以看到总耗时2.4s，单线程的优点是代码清晰明了，但是效率低下。下面看多线程的代码：

  

```python
import concurrent.futures
import requests
import threading
import time

def download_one(url):
    resp = requests.get(url)
    print('Read {} from {}'.format(len(resp.content), url))

def download_all(sites):
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(download_one, sites)

def main():
    sites = [
        'https://en.wikipedia.org/wiki/Portal:Arts',
        'https://en.wikipedia.org/wiki/Portal:History',
        'https://en.wikipedia.org/wiki/Portal:Society',
        'https://en.wikipedia.org/wiki/Portal:Biography',
        'https://en.wikipedia.org/wiki/Portal:Mathematics',
        'https://en.wikipedia.org/wiki/Portal:Technology',
        'https://en.wikipedia.org/wiki/Portal:Geography',
        'https://en.wikipedia.org/wiki/Portal:Science',
        'https://en.wikipedia.org/wiki/Computer_science',
        'https://en.wikipedia.org/wiki/Python_(programming_language)',
        'https://en.wikipedia.org/wiki/Java_(programming_language)',
        'https://en.wikipedia.org/wiki/PHP',
        'https://en.wikipedia.org/wiki/Node.js',
        'https://en.wikipedia.org/wiki/The_C_Programming_Language',
        'https://en.wikipedia.org/wiki/Go_(programming_language)'
    ]
    start_time = time.perf_counter()
    download_all(sites)
    end_time = time.perf_counter()
    print('Download {} sites in {} seconds'.format(len(sites), end_time - start_time))

if __name__ == '__main__':
    main()

## 输出
Read 151021 from https://en.wikipedia.org/wiki/Portal:Mathematics
Read 129886 from https://en.wikipedia.org/wiki/Portal:Arts
Read 107637 from https://en.wikipedia.org/wiki/Portal:Biography
Read 224118 from https://en.wikipedia.org/wiki/Portal:Society
Read 184343 from https://en.wikipedia.org/wiki/Portal:History
Read 167923 from https://en.wikipedia.org/wiki/Portal:Geography
Read 157811 from https://en.wikipedia.org/wiki/Portal:Technology
Read 91533 from https://en.wikipedia.org/wiki/Portal:Science
Read 321352 from https://en.wikipedia.org/wiki/Computer_science
Read 391905 from https://en.wikipedia.org/wiki/Python_(programming_language)
Read 180298 from https://en.wikipedia.org/wiki/Node.js
Read 56765 from https://en.wikipedia.org/wiki/The_C_Programming_Language
Read 468461 from https://en.wikipedia.org/wiki/PHP
Read 321417 from https://en.wikipedia.org/wiki/Java_(programming_language)
Read 324039 from https://en.wikipedia.org/wiki/Go_(programming_language)
Download 15 sites in 0.19936635800002023 seconds

```

我们可以看到总耗时0.2s，比单线程速度提升十倍。

  

单线程与多线程代码主要不同之处在于：

```python
   with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(download_one, sites)
```

这里我们创建了一个线程池，总共5个线程，其中executor.map()和函数式编程中的map()类似，依次取出sites中的元素，调用download\_one()方法。其中线程数的定义是需要根据实际需求测试得到一个最优的线程，不是随便写一个数字，这是因为线程的创建、维护和删除是有一定的开销的，如果设置过大，导致开销大，反而降低了速度，如果设置过小，又达不到我们想要的结果。

  

当然我们也可以用并行的方式去提高运行效率，只要在download\_all()中做如下改变：

```python
with futures.ThreadPoolExecutor(workers) as executor
=>
with futures.ProcessPoolExecutor() as executor: 
```

其中ProcessPoolExecutor()是用来创建进程池，我们这里可以不指定进程数量workers，它会根据服务器CPU个数来作为进程数量。

  

并行一般使用在CPU heavy场景，因为对于IO heavy场景中，多数IO都会处于等待状态，相比于多线程，多进程并不会提升运行效率，反而在很多时候，由于CPU个数的限制，多进程的执行效率反而不如多线程。

  

## 什么是Futures

python中的Futures模块位于concurrent.futures和asyncio中，它们都表示带我延迟的操作。Futures会将处于等待的操作包裹起来放入队列中，这些操作的状态随时可以查询，当然，它们的结果或是异常，也能在操作完成后获取。

  

通常来说，对于用户，我们不用考虑如何去创建Futures，我们只考虑如何去调度这些Futures。

Futures有三个重要的方法：

（1）、done()：返回布尔值，表示Future是否已经执行；

（2）、add\_done\_callback()：这个方法只有一个参数，类型是可调用对象，Future运行结束后会回调这个对象；

（3）、result()：如果Future运行结束后调用result()，会返回可调用对象的结果或抛出异常，如果Future没有运行结束时调用result()，这时会阻塞调用方法所在的线程，直到有结果的返回。此时result()可以接受timeout参数，如果在指定的时间内Future没有运行完毕，会抛出TimeError异常。

  

例如：

```python
import concurrent.futures
import requests
import time

def download_one(url):
    resp = requests.get(url)
    print('Read {} from {}'.format(len(resp.content), url))

def download_all(sites):
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        to_do = []
        for site in sites:
            future = executor.submit(download_one, site)
            to_do.append(future)
            
        for future in concurrent.futures.as_completed(to_do):
            future.result()
def main():
    sites = [
        'https://en.wikipedia.org/wiki/Portal:Arts',
        'https://en.wikipedia.org/wiki/Portal:History',
        'https://en.wikipedia.org/wiki/Portal:Society',
        'https://en.wikipedia.org/wiki/Portal:Biography',
        'https://en.wikipedia.org/wiki/Portal:Mathematics',
        'https://en.wikipedia.org/wiki/Portal:Technology',
        'https://en.wikipedia.org/wiki/Portal:Geography',
        'https://en.wikipedia.org/wiki/Portal:Science',
        'https://en.wikipedia.org/wiki/Computer_science',
        'https://en.wikipedia.org/wiki/Python_(programming_language)',
        'https://en.wikipedia.org/wiki/Java_(programming_language)',
        'https://en.wikipedia.org/wiki/PHP',
        'https://en.wikipedia.org/wiki/Node.js',
        'https://en.wikipedia.org/wiki/The_C_Programming_Language',
        'https://en.wikipedia.org/wiki/Go_(programming_language)'
    ]
    start_time = time.perf_counter()
    download_all(sites)
    end_time = time.perf_counter()
    print('Download {} sites in {} seconds'.format(len(sites), end_time - start_time))

if __name__ == '__main__':
    main()

# 输出
Read 129886 from https://en.wikipedia.org/wiki/Portal:Arts
Read 107634 from https://en.wikipedia.org/wiki/Portal:Biography
Read 224118 from https://en.wikipedia.org/wiki/Portal:Society
Read 158984 from https://en.wikipedia.org/wiki/Portal:Mathematics
Read 184343 from https://en.wikipedia.org/wiki/Portal:History
Read 157949 from https://en.wikipedia.org/wiki/Portal:Technology
Read 167923 from https://en.wikipedia.org/wiki/Portal:Geography
Read 94228 from https://en.wikipedia.org/wiki/Portal:Science
Read 391905 from https://en.wikipedia.org/wiki/Python_(programming_language)
Read 321352 from https://en.wikipedia.org/wiki/Computer_science
Read 180298 from https://en.wikipedia.org/wiki/Node.js
Read 321417 from https://en.wikipedia.org/wiki/Java_(programming_language)
Read 468421 from https://en.wikipedia.org/wiki/PHP
Read 56765 from https://en.wikipedia.org/wiki/The_C_Programming_Language
Read 324039 from https://en.wikipedia.org/wiki/Go_(programming_language)
Download 15 sites in 0.21698231499976828 seconds

```

  

## Future的异常处理

Futures有三种异常类：

（1）、exception concurrent.futures.CancelledError 在future取消时引发。

（2）、exception concurrent.futures.TimeoutError 在future操作超过给定超时时触发。

（3）、exception concurrent.futures.process.BrokenProcessPool，从 RuntimeError 派生，当 ProcessPoolExecutor 的一个工人以非干净方式终止（例如，如果它从外部被杀死）时，引发此异常类。

  

# 并发编程asyncio

  

## sync和async的区别

sync：是指操作是一个一个执行，下一个操作必须等上一个操作完成后才能执行；

async：是指不同操作之间可以互相交替执行，如果其中某个操作被block，程序并不会等待，会去找可执行的操作继续执行；

  

## asyncio的原理

asyncio是单线程，它只有一个主线程，但是可以进行多个任务（task），这里的任务就是特殊的future对象，这些不同的任务，被一个叫做event loop的对象控制。

asyncio的任务在运行时不会被外部的一些因素打断，因此，asyncio的操作不会出现race condition，这样就不必担心线程安全问题。

  

## asyncio的用法

例子：

```shell
import asyncio
import aiohttp
import time

async def download_one(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            print('Read {} from {}'.format(resp.content_length, url))

async def download_all(sites):
    tasks = [asyncio.create_task(download_one(site)) for site in sites]
    await asyncio.gather(*tasks)

def main():
    sites = [
        'https://en.wikipedia.org/wiki/Portal:Arts',
        'https://en.wikipedia.org/wiki/Portal:History',
        'https://en.wikipedia.org/wiki/Portal:Society',
        'https://en.wikipedia.org/wiki/Portal:Biography',
        'https://en.wikipedia.org/wiki/Portal:Mathematics',
        'https://en.wikipedia.org/wiki/Portal:Technology',
        'https://en.wikipedia.org/wiki/Portal:Geography',
        'https://en.wikipedia.org/wiki/Portal:Science',
        'https://en.wikipedia.org/wiki/Computer_science',
        'https://en.wikipedia.org/wiki/Python_(programming_language)',
        'https://en.wikipedia.org/wiki/Java_(programming_language)',
        'https://en.wikipedia.org/wiki/PHP',
        'https://en.wikipedia.org/wiki/Node.js',
        'https://en.wikipedia.org/wiki/The_C_Programming_Language',
        'https://en.wikipedia.org/wiki/Go_(programming_language)'
    ]
    start_time = time.perf_counter()
    asyncio.run(download_all(sites))
    end_time = time.perf_counter()
    print('Download {} sites in {} seconds'.format(len(sites), end_time - start_time))
    
if __name__ == '__main__':
    main()

## 输出
Read 63153 from https://en.wikipedia.org/wiki/Java_(programming_language)
Read 31461 from https://en.wikipedia.org/wiki/Portal:Society
Read 23965 from https://en.wikipedia.org/wiki/Portal:Biography
Read 36312 from https://en.wikipedia.org/wiki/Portal:History
Read 25203 from https://en.wikipedia.org/wiki/Portal:Arts
Read 15160 from https://en.wikipedia.org/wiki/The_C_Programming_Language
Read 28749 from https://en.wikipedia.org/wiki/Portal:Mathematics
Read 29587 from https://en.wikipedia.org/wiki/Portal:Technology
Read 79318 from https://en.wikipedia.org/wiki/PHP
Read 30298 from https://en.wikipedia.org/wiki/Portal:Geography
Read 73914 from https://en.wikipedia.org/wiki/Python_(programming_language)
Read 62218 from https://en.wikipedia.org/wiki/Go_(programming_language)
Read 22318 from https://en.wikipedia.org/wiki/Portal:Science
Read 36800 from https://en.wikipedia.org/wiki/Node.js
Read 67028 from https://en.wikipedia.org/wiki/Computer_science
Download 15 sites in 0.062144195078872144 seconds
```

  

这里的async和await关键字是asyncio的最新写法，表示这个函数/语句是non-block的，如果执行过程的过程需要等待，则将其放入等待状态的列表中，然后继续执行预备状态的任务。

主函数是asyncio.run(coro)是asyncio的root call，表示拿到event loop，运行输入的coro，直到它结束关闭这个event loop。asyncio.run()是python 3.7引入的，3.7之前的写法如下：

```shell
loop = asyncio.get_event_loop()
try:
    loop.run_until_complete(coro)
finally:
    loop.close()
```

  

asyncio版本的download\_all()和上面的多线程有很大的区别：

```shell
tasks = [asyncio.create_task(download_one(site)) for site in sites]
await asyncio.gather(*task)
```

  

这里的asyncio.create\_task(coro)表示对输入的协程coro创建一个任务，安排它执行，并返回此对象。这个函数也是3.7新增的，如果是之前的版本，可以用asyncio.ensure\_future(coro)替代，可以看到，我们对每一个网站的下载都创建了一个任务。

在往下的asyncio.gather(\*aws, loop=None, return\_exception=False)，则表示event loop运行aws的所有任务。

  

## asyncio的缺陷

想用好asyncio，需要有相应的python库支持，asyncio的软件库兼容问题一直是一个大问题。另外，使用asyncio时，因为在任务调度方面有更大的自主权，写代码的时候需要注意，不然很容易出错。

举个例子：如果需要使用await的一系列操作，就得使用asyncio.gather()，如果只是单个得future，或许只需要用asyncio.wait()就可以了，那么对于future，是选择使用run\_until\_conplete还是run\_forever()就需要仔细考虑了。

  

# 多线程还是asyncio的选择

  

基本遵循下面伪代码的情况就可以了：

```shell
if io_bound:
    if io_slow:
        print('Use Asyncio')
    else:
        print('Use multi-threading')
else if cpu_bound:
    print('Use multi-processing')

```

  

（1）、如果是IO BOUND，如果IO操作很慢，需要多线程/多任务协同实现，就用asyncio；

（2）、如果是IO BOUND，如果IO操作很快，只需要有限数量的任务/线程，就用多线程；

（3）、如果是CPU BOUND，就用多进程实现；

# 总结

（1）、并发通过线程和任务之间互相切换的方式实现，但同一时刻，只允许一个线程或任务执行；

（2）、并行是多个进程完全同步同时的执行；

（3）、并发通常使用于IO操作频繁的场景，并行通常适用于CPU heavy的场景；

（4）、不同于多线程，Asyncio是单线程，但其内部是event loop机制，它可以并发的运行多个任务，并且比多线程享有更大的自主控制权；

（5）、Asyncio中的任务，在运行过程中不会被打断，因此不会出现race condition情况，尤其是在IO 操作heavy的情况下，Asyncio比多线程运行效率高，因为Asyncio内部切换的损耗比多线程切换的是损耗小，并且Asyncio开启的任务数也比多线程开启的任务数多；

（6）、在很多情况下，Asyncio需要特定的第三方库支持；