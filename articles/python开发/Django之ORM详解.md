# 一、ORM介绍

## 1、ORM概念

对象关系映射（Object Relational Mapping，简称ORM）模式是一种为了解决面向对象与关系数据库存在的互不匹配的现象的技术。

简单的说，ORM是通过使用描述对象和数据库之间映射的元数据，将程序中的对象自动持久化到关系数据库中。

ORM在业务逻辑层和数据库层之间充当了桥梁的作用。

  

## 2、ORM优势

（1）、ORM解决的主要问题是对象和关系的映射。它通常把一个类和一个表一一对应，类的每个实例对应表中的一条记录，类的每个属性对应表中的每个字段。 

（2）、ORM提供了对数据库的映射，不用直接编写SQL代码，只需像操作对象一样从数据库操作数据。

（3）、让软件开发人员专注于业务逻辑的处理，提高了开发效率。

  

## 3、ORM劣势

ORM的缺点是会在一定程度上牺牲程序的执行效率。

  

## 4、ORM总结

ORM只是一种工具，工具确实能解决一些重复，简单的劳动。这是不可否认的。

但我们不能指望某个工具能一劳永逸地解决所有问题，一些特殊问题还是需要特殊处理的。

但是在整个软件开发过程中需要特殊处理的情况应该都是很少的，否则所谓的工具也就失去了它存在的意义。

  

# 二、Django中的ORM

## 1、Django项目使用MySQL数据库

（1）、在Django项目的settings.py文件中，配置数据库连接信息

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "你的数据库名称",  # 需要自己手动创建数据库
        "USER": "数据库用户名",
        "PASSWORD": "数据库密码",
        "HOST": "数据库IP",
        "POST": 3306
    }
}
```

  

（2）、在Django项目的\_\_init\_\_.py文件中写如下代码，告诉Django使用pymysql模块连接MySQL数据库

```python
import pymysql
pymysql.install_as_MySQLdb(
```

  

## 2、Django中的Model

在Django中model是你数据的单一、明确的信息来源。它包含了你存储的数据的重要字段和行为。通常，一个模型（model）映射到一个数据库表。

  
基本情况：

-   每个模型都是一个Python类，它是django.db.models.Model的子类。
-   模型的每个属性都代表一个数据库字段。
-   综上所述，Django为您提供了一个自动生成的数据库访问API，详询[官方文档链接](https://docs.djangoproject.com/en/2.0/topics/db/queries/)。

如下图：

![image.png](assets/python开发/Django之ORM详解/Django之ORM详解-1.png)

## 3、例子

下面这个例子定义了一个 **Person** 模型，包含 **first\_name** 和 **last\_name**。

```python
from django.db import models

class Person(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
```

**first\_name** 和 **last\_name** 是模型的字段。每个字段被指定为一个类属性，每个属性映射到一个数据库列。

  

上面的 **Person** 模型将会像这样创建一个数据库表：

```python
CREATE TABLE myapp_person (
    "id" serial NOT NULL PRIMARY KEY,
    "first_name" varchar(30) NOT NULL,
    "last_name" varchar(30) NOT NULL
);
```

  

说明：

-   表myapp\_person的名称是自动生成的，如果你要自定义表名，需要在model的Meta类中指定 db\_table 参数，强烈建议使用小写表名，特别是使用MySQL作为后端数据库时。
-   id字段是自动添加的，如果你想要指定自定义主键，只需在其中一个字段中指定 primary\_key=True 即可。如果Django发现你已经明确地设置了Field.primary\_key，它将不会添加自动ID列。
-   本示例中的CREATE TABLE SQL使用PostgreSQL语法进行格式化，但值得注意的是，Django会根据配置文件中指定的数据库后端类型来生成相应的SQL语句。
-   Django支持MySQL5.5及更高版本。

  

# 三、Django中ORM常用字段和参数

## 1、常用字段

<table class="lake-table" style="width: 739px;"><colgroup><col span="1" width="144" /><col span="1" width="594" /></colgroup><tbody><tr style="height: 33px;"><td style="background-color: #FADB14;"><p>字段名</p></td><td style="background-color: #FFF08F;"><p>作用</p></td></tr><tr style="height: 33px;"><td style="text-align: left;"><p>AutoField</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">int自增列，必须填入参数 primary_key=True。当model中如果没有自增列，则自动会创建一个列名为id的列。</span></td></tr><tr style="height: 33px;"><td><p>IntegerField</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">一个整数类型,范围在 -2147483648 to 2147483647。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>CharField</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">字符类型，必须提供max_length参数， max_length表示字符长度。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>DateField</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">日期字段，日期格式  YYYY-MM-DD，相当于Python中的datetime.date()实例。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>DateTimeField</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">日期时间字段，格式 YYYY-MM-DD HH:MM[:ss[.uuuuuu]][TZ]，相当于Python中的datetime.datetime()实例。</span></td></tr></tbody></table>

## 2、字段集合

```python
AutoField(Field)
        - int自增列，必须填入参数 primary_key=True

    BigAutoField(AutoField)
        - bigint自增列，必须填入参数 primary_key=True

        注：当model中如果没有自增列，则自动会创建一个列名为id的列
        from django.db import models

        class UserInfo(models.Model):
            # 自动创建一个列名为id的且为自增的整数列
            username = models.CharField(max_length=32)

        class Group(models.Model):
            # 自定义自增列
            nid = models.AutoField(primary_key=True)
            name = models.CharField(max_length=32)

    SmallIntegerField(IntegerField):
        - 小整数 -32768 ～ 32767

    PositiveSmallIntegerField(PositiveIntegerRelDbTypeMixin, IntegerField)
        - 正小整数 0 ～ 32767
    IntegerField(Field)
        - 整数列(有符号的) -2147483648 ～ 2147483647

    PositiveIntegerField(PositiveIntegerRelDbTypeMixin, IntegerField)
        - 正整数 0 ～ 2147483647

    BigIntegerField(IntegerField):
        - 长整型(有符号的) -9223372036854775808 ～ 9223372036854775807

    BooleanField(Field)
        - 布尔值类型

    NullBooleanField(Field):
        - 可以为空的布尔值

    CharField(Field)
        - 字符类型
        - 必须提供max_length参数， max_length表示字符长度

    TextField(Field)
        - 文本类型

    EmailField(CharField)：
        - 字符串类型，Django Admin以及ModelForm中提供验证机制

    IPAddressField(Field)
        - 字符串类型，Django Admin以及ModelForm中提供验证 IPV4 机制

    GenericIPAddressField(Field)
        - 字符串类型，Django Admin以及ModelForm中提供验证 Ipv4和Ipv6
        - 参数：
            protocol，用于指定Ipv4或Ipv6， 'both',"ipv4","ipv6"
            unpack_ipv4， 如果指定为True，则输入::ffff:192.0.2.1时候，可解析为192.0.2.1，开启此功能，需要protocol="both"

    URLField(CharField)
        - 字符串类型，Django Admin以及ModelForm中提供验证 URL

    SlugField(CharField)
        - 字符串类型，Django Admin以及ModelForm中提供验证支持 字母、数字、下划线、连接符（减号）

    CommaSeparatedIntegerField(CharField)
        - 字符串类型，格式必须为逗号分割的数字

    UUIDField(Field)
        - 字符串类型，Django Admin以及ModelForm中提供对UUID格式的验证

    FilePathField(Field)
        - 字符串，Django Admin以及ModelForm中提供读取文件夹下文件的功能
        - 参数：
                path,                      文件夹路径
                match=None,                正则匹配
                recursive=False,           递归下面的文件夹
                allow_files=True,          允许文件
                allow_folders=False,       允许文件夹

    FileField(Field)
        - 字符串，路径保存在数据库，文件上传到指定目录
        - 参数：
            upload_to = ""      上传文件的保存路径
            storage = None      存储组件，默认django.core.files.storage.FileSystemStorage

    ImageField(FileField)
        - 字符串，路径保存在数据库，文件上传到指定目录
        - 参数：
            upload_to = ""      上传文件的保存路径
            storage = None      存储组件，默认django.core.files.storage.FileSystemStorage
            width_field=None,   上传图片的高度保存的数据库字段名（字符串）
            height_field=None   上传图片的宽度保存的数据库字段名（字符串）

    DateTimeField(DateField)
        - 日期+时间格式 YYYY-MM-DD HH:MM[:ss[.uuuuuu]][TZ]

    DateField(DateTimeCheckMixin, Field)
        - 日期格式      YYYY-MM-DD

    TimeField(DateTimeCheckMixin, Field)
        - 时间格式      HH:MM[:ss[.uuuuuu]]

    DurationField(Field)
        - 长整数，时间间隔，数据库中按照bigint存储，ORM中获取的值为datetime.timedelta类型

    FloatField(Field)
        - 浮点型

    DecimalField(Field)
        - 10进制小数
        - 参数：
            max_digits，小数总长度
            decimal_places，小数位长度

    BinaryField(Field)
        - 二进制类型
```

  

## 3、自定义字段

```python
class UnsignedIntegerField(models.IntegerField):
    def db_type(self, connection):
        return 'integer UNSIGNED'
```

  

自定义char类型字段

```python
class FixedCharField(models.Field):
    """
    自定义的char类型的字段类
    """
    def __init__(self, max_length, *args, **kwargs):
        super().__init__(max_length=max_length, *args, **kwargs)
        self.length = max_length

    def db_type(self, connection):
        """
        限定生成数据库表的字段类型为char，长度为length指定的值
        """
        return 'char(%s)' % self.length

class Class(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=25)
    # 使用上面自定义的char类型的字段
    cname = FixedCharField(max_length=25)
```

## 4、ORM字段与数据库实际字段的对应关系

```python
'AutoField': 'integer AUTO_INCREMENT',
'BigAutoField': 'bigint AUTO_INCREMENT',
'BinaryField': 'longblob',
'BooleanField': 'bool',
'CharField': 'varchar(%(max_length)s)',
'CommaSeparatedIntegerField': 'varchar(%(max_length)s)',
'DateField': 'date',
'DateTimeField': 'datetime',
'DecimalField': 'numeric(%(max_digits)s, %(decimal_places)s)',
'DurationField': 'bigint',
'FileField': 'varchar(%(max_length)s)',
'FilePathField': 'varchar(%(max_length)s)',
'FloatField': 'double precision',
'IntegerField': 'integer',
'BigIntegerField': 'bigint',
'IPAddressField': 'char(15)',
'GenericIPAddressField': 'char(39)',
'NullBooleanField': 'bool',
'OneToOneField': 'integer',
'PositiveIntegerField': 'integer UNSIGNED',
'PositiveSmallIntegerField': 'smallint UNSIGNED',
'SlugField': 'varchar(%(max_length)s)',
'SmallIntegerField': 'smallint',
'TextField': 'longtext',
'TimeField': 'time',
'UUIDField': 'char(32)',

```

  

## 5、字段参数

<table class="lake-table" style="width: 737px;"><colgroup><col span="1" width="174" /><col span="1" width="562" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数名</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td><p>null</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">用于表示某个字段可以为空。</span></td></tr><tr style="height: 33px;"><td><p>unique</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">如果设置为unique=True 则该字段在此表中必须是唯一的 。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>db_index</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">如果db_index=True 则代表着为此字段设置数据库索引。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>default</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">为该字段设置默认值。</span></td></tr></tbody></table>

## 6、时间字段参数

DatetimeField、DateField、TimeField这个三个时间字段，都可以设置如下属性。

<table class="lake-table" style="width: 742px;"><colgroup><col span="1" width="181" /><col span="1" width="560" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数名</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td><p>auto_now_add</p></td><td><p><span style="color: #000000;">配置auto_now_add=True，创建数据记录的时候会把当前时间添加到数据库。</span></p></td></tr><tr style="height: 33px;"><td><p>auto_now</p></td><td><p><span style="color: #000000;">配置上auto_now=True，每次更新数据记录的时候会更新该字段。</span></p></td></tr></tbody></table>

## 7、关系字段

### 7.1、ForeignKey

外键类型在ORM中用来表示外键关联关系，一般把ForeignKey字段设置在 '一对多'中'多'的一方。

ForeignKey可以和其他表做关联关系同时也可以和自身做关联关系。

#### 7.1.1、字段参数

<table class="lake-table" style="width: 726px;"><colgroup><col span="1" width="171" /><col span="1" width="554" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td><p>to</p></td><td><p><span style="color: #000000;">设置要关联的表</span></p></td></tr><tr style="height: 33px;"><td><p>to_field</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">设置要关联的表的字段</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>related_name</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span style="color: #000000;">反向操作时，使用的字段名，用于代替原反向查询时的'表名_set'。</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>related_query_name</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span style="color: #000000;">反向查询操作时，使用的连接前缀，用于替换表名。</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>on_delete</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">当删除关联表中的数据时，当前表与其关联的行的行为。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>db_constraint</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">是否在数据库中创建外键约束，默认为True。</span></td></tr></tbody></table>

**on\_delete相关参数如下：**

<table class="lake-table" style="width: 726px;"><colgroup><col span="1" width="203" /><col span="1" width="522" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1"><strong>models.CASCADE</strong></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">删除关联数据，与之关联也删除</span></td></tr><tr style="height: 33px;"><td rowspan="1" colspan="1"><strong>models.DO_NOTHING</strong></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">删除关联数据，引发错误IntegrityError</span></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>models.PROTECT</strong></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">删除关联数据，引发错误ProtectedError</span></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>models.SET_NULL</strong></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">删除关联数据，与之关联的值设置为null（前提FK字段需要设置为可空）</span></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>models.SET_DEFAULT</strong></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">删除关联数据，与之关联的值设置为默认值（前提FK字段需要设置默认值）</span></td></tr><tr style="height: 33px;"><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><strong>models.SET</strong></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span style="color: #000000; background-color: #FFFFFF;">删除关联数据</span></p><p><span style="color: #000000;">a. 与之关联的值设置为指定值，设置：models.SET(值)</span></p><p><span style="color: #000000;">b. 与之关联的值设置为可执行对象的返回值，设置：models.SET(可执行对象)</span></p></td></tr></tbody></table>

  

---

related\_name的例子：

```python
class Classes(models.Model):
    name = models.CharField(max_length=32)

class Student(models.Model):
    name = models.CharField(max_length=32)
    theclass = models.ForeignKey(to="Classes")
```

当我们要查询某个班级关联的所有学生（反向查询）时，我们会这么写：

```python
models.Classes.objects.first().student_set.all()
```

当我们在ForeignKey字段中添加了参数 related\_name 后:

```python
class Student(models.Model):
    name = models.CharField(max_length=32)
    theclass = models.ForeignKey(to="Classes", related_name="students")
```

这时候我们要查询某个班级关联的所有学生（反向查询）时，我们会这么写：

```python
models.Classes.objects.first().students.all()
```

  

---

### 7.2、OneToOneField

一对一字段。

通常一对一字段用来扩展已有字段。

  

例子：一对一的关联关系多用在当一张表的不同字段查询频次差距过大的情况下，将本可以存储在一张表的字段拆开放置在两张表中，然后将两张表建立一对一的关联关系。

```python
class Author(models.Model):
    name = models.CharField(max_length=32)
    info = models.OneToOneField(to='AuthorInfo')
    

class AuthorInfo(models.Model):
    phone = models.CharField(max_length=11)
    email = models.EmailField()
```

  

#### 7.2.1、字段参数

<table class="lake-table" style="width: 714px;"><colgroup><col span="1" width="161" /><col span="1" width="552" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数名</p></td><td><p>  含义</p></td></tr><tr style="height: 33px;"><td><p>to</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">设置要关联的表。</span></td></tr><tr style="height: 33px;"><td><p>to_field</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">设置要关联的字段。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>on_delete</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">当删除关联表中的数据时，当前表与其关联的行的行为。</span></td></tr></tbody></table>

### 7.3、ManyToManyField

用于表示多对多的关联关系。在数据库中通过第三张表来建立关联关系。

#### 7.3.1、字段参数

<table class="lake-table" style="width: 705px;"><colgroup><col span="1" width="160" /><col span="1" width="544" /></colgroup><tbody><tr style="height: 33px;"><td><p>参数名</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td><p>to</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">设置要关联的表</span></td></tr><tr style="height: 33px;"><td><p>related_name</p></td><td style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span style="color: #000000;">反向操作时，使用的字段名，用于代替原反向查询时的'表名_set'。</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>related_query_name</p></td><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p><span style="color: #000000;">反向查询操作时，使用的连接前缀，用于替换表名。</span></p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>symmetrical</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">仅用于多对多自关联时，指定内部是否创建反向操作的字段。默认为True。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>through</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p style="text-align: left; background-color: #FFFFFF;">在使用ManyToManyField字段时，Django将自动生成一张表来管理多对多的关联关系。</p><p style="text-align: left; background-color: #FFFFFF;">但我们也可以手动创建第三张表来管理多对多关系，此时就需要通过through来指定第三张表的表名。</p></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>through_field</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">设置关联的字段。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>db_table</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">默认创建第三张表时，数据库中表的名称。</span></td></tr></tbody></table>

#### 7.3.2 多对多关联表的三种方式

方式一、自行创建第三张表

```python
class Book(models.Model):
    title = models.CharField(max_length=32, verbose_name="书名")

class Author(models.Model):
    name = models.CharField(max_length=32, verbose_name="作者姓名")

# 自己创建第三张表，分别通过外键关联书和作者
class Author2Book(models.Model):
    author = models.ForeignKey(to="Author")
    book = models.ForeignKey(to="Book")

    class Meta:
        unique_together = ("author", "book")
```

  

方式二、通过ManyToManyField自动创建第三张表

```python
class Book(models.Model):
    title = models.CharField(max_length=32, verbose_name="书名")

# 通过ORM自带的ManyToManyField自动创建第三张表
class Author(models.Model):
    name = models.CharField(max_length=32, verbose_name="作者姓名")
    books = models.ManyToManyField(to="Book", related_name="authors")
```

  

方式三、设置ManyToManyField并指定自行创建第三张表

```python
class Book(models.Model):
    title = models.CharField(max_length=32, verbose_name="书名")

# 自己创建第三张表，并通过ManyToManyField指定关联
class Author(models.Model):
    name = models.CharField(max_length=32, verbose_name="作者姓名")
    books = models.ManyToManyField(to="Book", through="Author2Book", through_fields=("author", "book"))
    # through_fields接受一个2元组（'field1'，'field2'）：
    # 其中field1是定义ManyToManyField的模型外键的名（author），field2是关联目标模型（book）的外键名。

class Author2Book(models.Model):
    author = models.ForeignKey(to="Author")
    book = models.ForeignKey(to="Book")

    class Meta:
        unique_together = ("author", "book")
```

  

**注意：**

（1）、当我们需要在第三张关系表中存储额外的字段时，就要使用第三种方式。

（2）、但是当我们使用第三种方式创建多对多关联关系时，就无法使用set、add、remove、clear方法来管理多对多的关系了，需要通过第三张表的model来管理多对多关系。

  

### 7.4、元信息

ORM对应的类里面包含另一个Meta类，而Meta类封装了一些数据库的信息。主要字段如下:

  

<table class="lake-table" style="width: 692px;"><colgroup><col span="1" width="130" /><col span="1" width="561" /></colgroup><tbody><tr style="height: 33px;"><td><p>字段名</p></td><td><p>含义</p></td></tr><tr style="height: 33px;"><td><p>db_table</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">ORM在数据库中的表名默认是 </span><strong>app_</strong><span style="color: #000000; background-color: #FFFFFF;">类名，可以通过</span><strong><span>db_table</span></strong><span style="color: #000000; background-color: #FFFFFF;">可以重写表名。</span></td></tr><tr style="height: 33px;"><td><p>index_together</p></td><td rowspan="1" colspan="1"><span style="color: #000000; background-color: #FFFFFF;">联合索引。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>unique_together</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><span style="color: #000000; background-color: #FFFFFF;">联合唯一索引。</span></td></tr><tr style="height: 33px;"><td colspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p>ordering</p></td><td colspan="1" rowspan="1" style="vertical-align: top; background-color: #FFFFFF; color: #262626;"><p style="text-align: left; background-color: #FFFFFF;">指定默认按什么字段排序。</p><p style="text-align: left; background-color: #FFFFFF;">只有设置了该属性，我们查询到的结果才可以被reverse()。</p></td></tr></tbody></table>