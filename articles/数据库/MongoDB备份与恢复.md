## 1\. 介绍

在Mongodb中我们使用mongodump命令来备份MongoDB数据。该命令可以导出所有数据到指定目录中。mongodump命令可以通过参数指定导出的数据量级转存的服务器。

## 2\. mongodump

MongoDB中提供了mongostat 和 mongotop 两个命令来监控MongoDB的运行情况。

语法如下:

```bash
>mongodump -h dbhost -d dbname -o dbdirectory
```

参数解释

```bash
-h     指明数据库宿主机的IP
--port 指明数据库的端口 
-u     指明数据库的用户名
-p     指明数据库的密码
-d     指明数据库的名字
-c     指明collection的名字
-o     指明到要导出的文件名
-q     指明导出数据的过滤条件
--authenticationDatabase  验证数据的名称
--gzip 备份时压缩
--oplog use oplog for taking a point-in-time snapshot
```

快速命令

```bash
mkdir full            # 全量备份
mkdir db_cmz          # 单库备份
mkdir db_cmz_col      # 库中表备份
mkdir db_cmz_gzip     # 库备份压缩
mkdir db_cmz_gzip_col # 库中表备份压缩
mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -o ./full
mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -o ./db_cmz/
mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -c col -o ./db_cmz_col
mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -o ./db_cmz_gzip/ --gzip
ongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -c col -o ./db_cmz_gzip_col/ --gzip
```

### 2.0 准备

```bash
[root@leco app]# mkdir full            # 全量备份
[root@leco app]# mkdir db_cmz          # 单库备份
[root@leco app]# mkdir db_cmz_col      # 库中表备份
[root@leco app]# mkdir db_cmz_gzip     # 库备份压缩
[root@leco app]# mkdir db_cmz_gzip_col # 库中表备份压缩
> use cmz
switched to db cmz
> show tables;
col
col2
col3
test
> db.col.find()
{ "_id" : ObjectId("5c76214dfec6d367f28a65db"), "title" : "Books 教程", "description" : "Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。", "by" : "cmz", "url" : "https://caimengzhi.github.io/books", "tags" : [ "Java", "database", "web" ], "likes" : 200 }
{ "_id" : ObjectId("5c76214dfec6d367f28a65dc"), "title" : "Books 教程", "description" : "Python 语言是最近比较流行的语言", "by" : "cmz", "url" : "https://caimengzhi.github.io/books", "tags" : [ "Python", "database", "web" ], "likes" : 150 }
{ "_id" : ObjectId("5c76214efec6d367f28a65dd"), "title" : "Books 教程", "description" : "MongoDB 是一个 Nosql 数据库", "by" : "cmz", "url" : "https://caimengzhi.github.io/books", "tags" : [ "mongodb", "database", "NoSQL" ], "likes" : 100 }
{ "_id" : ObjectId("5c7632efeb4ea775e2693743"), "description" : "Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。", "url" : "https://caimengzhi.github.io/books" }
{ "_id" : ObjectId("5c7632efeb4ea775e2693744"), "description" : "Python 语言是最近比较流行的语言", "url" : "https://caimengzhi.github.io/books" }
{ "_id" : ObjectId("5c7632efeb4ea775e2693745"), "description" : "MongoDB 是一个 Nosql 数据库", "url" : "https://caimengzhi.github.io/books" }
```

### 2.1 全库备份

```bash
[root@leco app]# mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -o ./full
2019-07-27T15:11:23.080+0800    writing admin.system.version to
2019-07-27T15:11:23.095+0800    done dumping admin.system.version (1 document)
2019-07-27T15:11:23.095+0800    writing cmz.col to
2019-07-27T15:11:23.095+0800    writing cmz.col2 to
2019-07-27T15:11:23.095+0800    writing cmz.test to
2019-07-27T15:11:23.095+0800    writing cmz.col3 to
2019-07-27T15:11:23.099+0800    done dumping cmz.col (6 documents)
2019-07-27T15:11:23.099+0800    done dumping cmz.col2 (5 documents)
2019-07-27T15:11:23.100+0800    done dumping cmz.test (1 document)
2019-07-27T15:11:23.100+0800    done dumping cmz.col3 (0 documents)
[root@leco app]# ls ./full/
admin  cmz
```

### 2.2 备份cmz库

```bash
[root@leco app]# mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -o ./db_cmz/
2019-07-27T15:12:44.375+0800    writing cmz.col to
2019-07-27T15:12:44.377+0800    writing cmz.col2 to
2019-07-27T15:12:44.377+0800    writing cmz.test to
2019-07-27T15:12:44.378+0800    writing cmz.col3 to
2019-07-27T15:12:44.379+0800    done dumping cmz.col (6 documents)
2019-07-27T15:12:44.380+0800    done dumping cmz.col2 (5 documents)
2019-07-27T15:12:44.380+0800    done dumping cmz.test (1 document)
2019-07-27T15:12:44.381+0800    done dumping cmz.col3 (0 documents)
[root@leco app]# ls db_cmz
cmz
[root@leco app]# ls db_cmz/cmz/
col2.bson  col2.metadata.json  col3.bson  col3.metadata.json  col.bson  col.metadata.json  test.bson  test.metadata.json
```

### 2.3 备份cmz库下的col集合

```bash
[root@leco app]# mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -c col -o ./db_cmz_col
2019-07-27T15:13:15.706+0800    writing cmz.col to
2019-07-27T15:13:15.707+0800    done dumping cmz.col (6 documents)
[root@leco app]# ls db_cmz
db_cmz/          db_cmz_col/      db_cmz_gzip/     db_cmz_gzip_col/
[root@leco app]# ls db_cmz_col/
cmz
[root@leco app]# ls db_cmz_col/cmz/
col.bson  col.metadata.json
```

### 2.4 压缩备份库

```bash
[root@leco app]# mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -o ./db_cmz_gzip/ --gzip
2019-07-27T15:13:53.005+0800    writing cmz.col to
2019-07-27T15:13:53.005+0800    writing cmz.col2 to
2019-07-27T15:13:53.005+0800    writing cmz.test to
2019-07-27T15:13:53.005+0800    writing cmz.col3 to
2019-07-27T15:13:53.008+0800    done dumping cmz.col (6 documents)
2019-07-27T15:13:53.009+0800    done dumping cmz.col2 (5 documents)
2019-07-27T15:13:53.011+0800    done dumping cmz.test (1 document)
2019-07-27T15:13:53.012+0800    done dumping cmz.col3 (0 documents)
[root@leco app]# ls db_cmz_gzip
db_cmz_gzip/     db_cmz_gzip_col/
[root@leco app]# ls db_cmz_gzip/cmz/
col2.bson.gz  col2.metadata.json.gz  col3.bson.gz  col3.metadata.json.gz  col.bson.gz  col.metadata.json.gz  test.bson.gz  test.metadata.json.gz
```

### 2.5 压缩备份单表

```bash
[root@leco app]# mongodump -h 127.0.0.1:27017 --authenticationDatabase admin  -d cmz -c col -o ./db_cmz_gzip_col/ --gzip
2019-07-27T15:14:26.475+0800    writing cmz.col to
2019-07-27T15:14:26.476+0800    done dumping cmz.col (6 documents)
[root@leco app]# ls db_cmz_gzip_col/cmz/
col.bson.gz  col.metadata.json.gz
```

## 3\. mongorestore

mongodb使用 mongorestore 命令来恢复备份的数据。

```bash
mongorestore -h <hostname><:port> -d dbname <path>
```

参数解释

```bash
--host <:port>, -h <:port>：ongoDB所在服务器地址，默认为： localhost:27017
-h 指明数据库宿主机的IP
-u 指明数据库的用户名
-p 指明数据库的密码
-d 指明数据库的名字
-c 指明collection的名字
-o 指明到要导出的文件名
-q 指明导出数据的过滤条件
--authenticationDatabase 验证数据的名称
--gzip 备份时压缩
--oplog use oplog for taking a point-in-time snapshot
--drop 恢复的时候把之前的集合drop掉
```

### 3.1 整个恢复

#### 3.3.1 全库备份中恢复单库

```bash
[root@leco app]# mongorestore -h 127.0.0.1:27017 --authenticationDatabase admin  --drop  ./full
2019-07-27T15:16:24.608+0800    preparing collections to restore from
2019-07-27T15:16:24.656+0800    reading metadata for cmz.col from full/cmz/col.metadata.json
2019-07-27T15:16:24.661+0800    reading metadata for cmz.col3 from full/cmz/col3.metadata.json
2019-07-27T15:16:24.670+0800    reading metadata for cmz.test from full/cmz/test.metadata.json
2019-07-27T15:16:24.681+0800    reading metadata for cmz.col2 from full/cmz/col2.metadata.json
2019-07-27T15:16:24.707+0800    restoring cmz.col from full/cmz/col.bson
2019-07-27T15:16:24.724+0800    restoring cmz.col3 from full/cmz/col3.bson
2019-07-27T15:16:24.725+0800    no indexes to restore
2019-07-27T15:16:24.725+0800    finished restoring cmz.col3 (0 documents)
2019-07-27T15:16:24.741+0800    restoring cmz.test from full/cmz/test.bson
2019-07-27T15:16:24.756+0800    restoring cmz.col2 from full/cmz/col2.bson
2019-07-27T15:16:24.768+0800    no indexes to restore
2019-07-27T15:16:24.768+0800    finished restoring cmz.test (1 document)
2019-07-27T15:16:24.768+0800    no indexes to restore
2019-07-27T15:16:24.768+0800    finished restoring cmz.col (6 documents)
2019-07-27T15:16:24.768+0800    no indexes to restore
2019-07-27T15:16:24.768+0800    finished restoring cmz.col2 (5 documents)
2019-07-27T15:16:24.768+0800    done
```

## 4\. mongoexport

Mongodb中的mongoexport工具可以把一个collection导出成JSON格式或CSV格式的文件。可以通过参数指定导出的数据项，也可以根据指定的条件导出数据。

```bash
mongoexport -h IP --port 端口 -u 用户名 -p 密码 -d 数据库 -c 表名 -f 字段 -q 条件导出 --csv -o 文件名
```

参数解释

```bash
-h 指明数据库宿主机的IP
-u 指明数据库的用户名
-p 指明数据库的密码
-d 指明数据库的名字
-c 指明collection的名字
-f 指明要导出那些列，以逗号分割，-f uid,name,age导出uid,name,age这三个字段
-o 指明到要导出的文件名
-q 指明导出数据的过滤条件，-q '{ "uid" : "100" }' 导出uid为100的数据
--type 指定文件类型
--authenticationDatabase 验证数据的名称
```

### 4.1 导出整张表

```bash
[root@leco bak]# mongoexport -d cmz -c col -o ./col.dat
2019-07-27T14:26:12.934+0800    connected to: localhost
2019-07-27T14:26:12.952+0800    exported 3 records
[root@leco bak]# ls
admin  cmz  col.dat
[root@leco bak]# cat col.dat
{"_id":{"$oid":"5c76214dfec6d367f28a65db"},"title":"Books 教程","description":"Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["Java","database","web"],"likes":200.0}
{"_id":{"$oid":"5c76214dfec6d367f28a65dc"},"title":"Books 教程","description":"Python 语言是最近比较流行的语言","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["Python","database","web"],"likes":150.0}
{"_id":{"$oid":"5c76214efec6d367f28a65dd"},"title":"Books 教程","description":"MongoDB 是一个 Nosql数据库","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["mongodb","database","NoSQL"],"likes":100.0}
```

### 4.2 导出表中部分字段

```bash
[root@leco bak]# mongoexport -d cmz -c col --csv -f description,tags,likes -o ./col.csv
2019-07-27T14:28:16.132+0800    csv flag is deprecated; please use --type=csv instead
2019-07-27T14:28:16.134+0800    connected to: localhost
2019-07-27T14:28:16.145+0800    exported 3 records
[root@leco bak]# cat col.csv
description,tags,likes
Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。,"[""Java"",""database"",""web""]",200
Python 语言是最近比较流行的语言,"[""Python"",""database"",""web""]",150
MongoDB 是一个 Nosql 数据库,"[""mongodb"",""database"",""NoSQL""]",100
```

### 4.3 根据条件导出数据

```bash
[root@leco bak]# mongoexport -d cmz -c col -q '{likes:{$gt:150}}' -o ./col.json
2019-07-27T14:29:32.399+0800    connected to: localhost
2019-07-27T14:29:32.407+0800    exported 1 record
[root@leco bak]# cat col.json
{"_id":{"$oid":"5c76214dfec6d367f28a65db"},"title":"Books 教程","description":"Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["Java","database","web"],"likes":200.0}
```

### 4.4 other

```bash
[root@leco back]# mongoexport -h 127.0.0.1:27017 --authenticationDatabase admin -d cmz -c col -o ./col.dat
2019-07-27T14:45:13.623+0800    connected to: 127.0.0.1:27017
2019-07-27T14:45:13.643+0800    exported 3 records
[root@leco back]# ls
col.dat
[root@leco back]# cat col.dat
{"_id":{"$oid":"5c76214dfec6d367f28a65db"},"title":"Books 教程","description":"Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["Java","database","web"],"likes":200.0}
{"_id":{"$oid":"5c76214dfec6d367f28a65dc"},"title":"Books 教程","description":"Python 语言是最近比较流行的语言","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["Python","database","web"],"likes":150.0}
{"_id":{"$oid":"5c76214efec6d367f28a65dd"},"title":"Books 教程","description":"MongoDB 是一个 Nosql数据库","by":"cmz","url":"https://caimengzhi.github.io/books","tags":["mongodb","database","NoSQL"],"likes":100.0}
[root@leco back]# mongoexport -h 127.0.0.1:27017 --authenticationDatabase admin -d cmz -c col  --type=csv -f description,url -o ./col_csv.dat
2019-07-27T14:47:01.048+0800    connected to: 127.0.0.1:27017
2019-07-27T14:47:01.059+0800    exported 3 records
[root@leco back]# cat col_csv.dat
description,url
Java 是由Sun Microsystems公司于1995年5月推出的高级程序设计语言。,https://caimengzhi.github.io/books
Python 语言是最近比较流行的语言,https://caimengzhi.github.io/books
MongoDB 是一个 Nosql 数据库,https://caimengzhi.github.io/books
```

## 5\. mongoimport

Mongodb中的mongoimport工具可以把一个特定格式文件中的内容导入到指定的collection中。该工具可以导入JSON格式数据，也可以导入CSV格式数据。

参数解释

```bash
-h 指明数据库宿主机的IP
-u 指明数据库的用户名
-p 指明数据库的密码
-d 指明数据库的名字
-c 指明collection的名字
-f 指明要导出那些列
-o 指明到要导出的文件名
-q 指明导出数据的过滤条件
--drop 插入之前先删除原有的
--headerline 指明第一行是列名，不需要导入。
-j 同时运行的插入操作数（默认为1），并行
--authenticationDatabase 验证数据的名称
```

### 5.1 恢复导出的表数据

```bash
[root@leco back]# mongoimport -h  127.0.0.1:27017 --authenticationDatabase admin  -d cmz -c col  --drop ./col.dat
2019-07-27T14:48:38.415+0800    connected to: 127.0.0.1:27017
2019-07-27T14:48:38.416+0800    dropping: cmz.col
2019-07-27T14:48:38.497+0800    imported 3 documents
```

### 5.2 部分字段的表数据导入

```bash
mongoimport -d cmz -c col --upsertFields description,tags,likes  ./col.dat
```

### 5.3 恢复csv文件

```bash
[root@leco back]# mongoimport -h  127.0.0.1:27017 --authenticationDatabase admin -d cmz -c col --type=csv --headerline --file ./col_csv.dat
2019-07-27T14:49:19.561+0800    connected to: 127.0.0.1:27017
2019-07-27T14:49:19.563+0800    imported 3 documents
```

  

  

作者：程序员同行者

链接：[https://www.jianshu.com/p/7bed88da52f1](https://www.jianshu.com/p/7bed88da52f1)

来源：简书

著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。