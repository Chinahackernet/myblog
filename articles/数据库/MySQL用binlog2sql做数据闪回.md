### 官方地址

  

```
https://github.com/danfengcao/binlog2sql
```

  

### 安装pip

  

```
# wget https://bootstrap.pypa.io/get-pip.py
# python get-pip.py
```

  

### 安装binlog2sql

  

```
# git clone https://github.com/danfengcao/binlog2sql.git && cd binlog2sql
# pip install -r requirements.txt
```

  

### 基本用法

  

#### 解析出标准SQL

  

```
# python binlog2sql.py -h127.0.0.1 -P3306 -uadmin -p'admin' -dtest -t test3 test4 --start-file='mysql-bin.000002'
```

  

#### 解析出回滚SQL

  

```
# python binlog2sql.py --flashback -h127.0.0.1 -P3306 -uadmin -p'admin' -dtest -ttest3 --start-file='mysql-bin.000002' --start-position=763 --stop-position=1147
```

  

#### 保存SQL

  

```
# python binlog2sql.py --flashback -h127.0.0.1 -P3306 -uadmin -p'admin' -dtest -ttest3 --start-file='mysql-bin.000002' --start-position=763 --stop-position=1147 -B >rollback.sql
```

  

#### 导入SQL

  

```
mysql -uadmin -p'admin' <rollback.sql
```