在介绍libcontainer之前，先简单说一下docker daemon借助execdriver创建和启动容器的过程：

1）、在docker daemon中创建driver（默认是用libcontainer创建的），并在这个过程中初始化Factory，默认为Linux的工厂类factory = libcontainer.New()；

2）、在docker daemon中会调用execdriver.Run，提交三大参数，容器配置，管道描述符，回调函数，driver.Run(command, pipes, startCallback)；

3）、接下来创建容器的全过程都在driver中执行（也就是libcontainer）

-   使用工厂Factory和容器配置container创建逻辑容器（Container），container中的各项内容都来自command，Container = factory.Create("id", container)
-   创建将要在容器中运行的进程Process，Process = libcontainer,Process{参数}
-   使用上述创建的进程启动物理进程，Container.Start(Process)
-   执行回调函数startCallback()
-   进程使用wait()函数阻塞直到物理容器创建完成，status = Process.Wait()
-   如果需要，销毁容器，Container.Destory()

  

接下来详细介绍一下创建和启动容器的全过程。

  

## 1、用Factory创建逻辑容器Container

libcontainer中Factory存在的意义就是能够创建一个逻辑容器Container，这个逻辑容器并不是运行着的Docker容器，而是包含了容器要运行的指令、参数、namespace、cgroups配置参数。

Factory创建Container的详细过程如下：

1）、检查容器运行目录，容器ID和配置的合法性；

2）、检查容器ID和现有容器是否冲突；

3）、在根目录下创建一个以ID为名的工作目录；

4）、返回一个Container对象；

到这里Container就已经创建和初始化完毕。

  

## 2、启动逻辑容器Container

由前面介绍可知，启动逻辑容器Container是通过Process进程来启动的。而Process是通过libcontainer中的Process创建的，实际上在创建Process过程中一共有两个实例。

-   第一个叫Process，它用于物理容器内进程的配置和IO的管理；
-   另一个是ParentProcess，它负责从物理容器外部处理物理容器启动工作，与Container对象直接进行交互，启动完成后，ParentProcess负责执行等待、发信号、获得容器内进程pid等管理工作；

由上面可知，启动逻辑容器主要是ParentProcess完成的，其创建过程具体如下：

1）、创建一个管道pipe，用来与容器内未来进程进行通信；

2）、根据逻辑容器Container中与未来要运行的进程相关的信息创建一个容器内进程启动命令cmd对象，然后根据cmd对象创建一个新的进程，也就是容器内第一个进程dockerinit。而cmd对象则需要从Container中获得属性包括命令的路径、命令参数、输入输出、执行命令的根目录以及进程管道pipe等；

3）、为cmd对象添加环境变量来告诉容器当前执行的是创建动作；

4）、将容器需要的namespace添加到cmd的Cloneflags中，表示将来这个cmd要运行在上述的namespace中；

5）、将Container中的容器配置和Process中的Entrypoint信息合并为一份容器配置加入到ParentProcess中；

  

## 3、用逻辑容器创建物理容器

  

## 4、Docker daemon与容器之间通信