方法见下：

1）首先建立一个空白文件夹。

```bash
mkdir /tmp/empty
```

2）之后使用以下语句即可快速的删除文件。

  

```bash
rsync --delete-before -d /tmp/empty/ /the/folder/you/want/delete/
```

z注意：不要忘记文件夹后的"/"

rsync提供了一些跟删除相关的参数 

rsync --help | grep delete 

     --del                   an alias for --delete-during 

     --delete                delete files that don't exist on the sending side 

     --delete-before         receiver deletes before transfer (default) 

     --delete-during         receiver deletes during transfer, not before 

     --delete-after          receiver deletes after transfer, not before 

     --delete-excluded       also delete excluded files on the receiving side 

     --ignore-errors         delete even if there are I/O errors 

     --max-delete=NUM        don't delete more than NUM files 

rsync --delete-before -a -H -v --progress --stats /tmp/test/ log/

这样我们要删除的log目录就会被清空了，删除的速度会非常快。rsync实际上用的是替换原理，处理数十万个文件也是秒删。

**选项说明**：

–delete-before 接收者在传输之前进行删除操作

–progress 在传输时显示传输过程

\-a 归档模式，表示以递归方式传输文件，并保持所有文件属性

\-H 保持硬连接的文件

\-v 详细输出模式

–stats 给出某些文件的传输状态