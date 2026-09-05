# 过滤Filtering

> 分类：Python / 第10章：DRF扩展
> 原文：https://www.cuiliangblog.cn/detail/section/33258735
> 来源：崔亮的博客

---

# 安装
1. 对于列表数据可能需要根据字段进行过滤，我们可以通过添加django-fitlter扩展来增强支持。.

```bash
pip install django-filter
```

2. 在配置文件中增加过滤后端的设置：

```python
INSTALLED_APPS = [
    ...
    'django_filters',  # 需要注册应用，
]
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend']
}
```

# 模型指定字段过滤
在视图中添加filterset_fields属性，指定可以过滤的字段

```python
from django_filters.rest_framework import DjangoFilterBackend

class BookListView(ListAPIView):
    queryset = BookInfo.objects.all()
    serializer_class = BookInfoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ('btitle', 'bread')
# 127.0.0.1:8000/books/?btitle=西游记
# 127.0.0.1:8000/books/?btitle=西游记
```

# 自定义过滤器
+ <font style="color:rgb(77, 77, 77);">自定义过滤类（filter.py）</font>

```python
from django_filters import FilterSet, CharFilter
from change.models import ChangeDataSource


class DataSourceFilter(FilterSet):
    """
    数据源名称，模糊查询
    """
    name = CharFilter(field_name='name', lookup_expr='icontains')  # icontains，包含且忽略大小写
    kind_id = CharFilter(field_name='kind_id')

    class Meta:
        # 指定模型
        models = ChangeDataSource
        # 指定需要模糊查询的字段
        fields = ['name', 'kind_id']
```

+ 视图中调用过滤类

```python
from django_filters.rest_framework import DjangoFilterBackend
class ChangeDataSourceViewSet(viewsets.ModelViewSet):
    """
    数据源切换列表增删改查
    """
    queryset = ChangeDataSource.objects.all()
    serializer_class = ChangeDataSourceSerializer
    filter_backends = [DjangoFilterBackend]
    # 指定自定义的过滤器
    filterset_class = DataSourceFilter
```

# 常见需求
## 参数说明
field_name（必选）：模型类的属性  
lookup_expr（可选）：判断条件

+ iexact：表示精确匹配, 并且忽略大小写
+ icontains：表示模糊查询（包含），并且忽略大小写
+ exact：表示精确匹配
+ gte：用于规定范围，大于等于
+ lte： 用于范围，小于等于

method： 自己定义一个方法  
help_text： 帮助说明

## 指定日期查询
+ 模型为DateField

```python
class DataFilter(FilterSet):
    """
    数据查询
    """
    date = DateFilter(field_name='create_time', lookup_expr='date', input_formats=['%Y-%m-%d'])

    class Meta:
        # 指定模型
        models = Data
        fields = ['date']
```

## 指定年、月、日查询
```python
#定义按年查询，
pub_year = filters.CharFilter(field_name='bpub_date',lookup_expr='year')
# 年份应该大于某值
pub_year__gt = filters.CharFilter(field_name='bpub_date',lookup_expr='year__gt')
#年份应该小于某值
bread__lt = filters.NumberFilter(field_name='bread',lookup_expr="lt")
示例：
http://127.0.0.1:8000/book/?title=&bread=&bcomment=&btitle=&pub_year=&pub_year__gt=2014&bread__gt=&bread__lt=
```

## 指定日期时间范围
```python
from django_filters import FilterSet, CharFilter, DateTimeFromToRangeFilter
from api.models import IPC


class IPCFilter(FilterSet):
    """
    工控机查询
    """
    time = DateTimeFromToRangeFilter(field_name='time')

    class Meta:
        # 指定模型
        models = IPC
        fields = ['time']
# 查询参数 time_after=2022-11-20 00:00:00 time_before=2022-11-20 22:20:20
```

## 不区分大小写查询
```python
import django_filters
from change.models import ChangeDataSource


class DataSourceFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')  # icontains，包含且忽略大小写

    class Meta:
        # 指定模型
        models = ChangeDataSource
        # 指定需要模糊查询的字段
        fields = ['name']
```

## 数值范围查询
```python
from django_filters import FilterSet, RangeFilter
# 方式1
class ApartmentFilter(FilterSet):
    price = RangeFilter()
    class Meta:
        model = Apartment
        fields = ['price']
# 方式2
class ApartmentFilter(FilterSet):
    # 大于
    price__gt = filters.NumberFilter(field_name='price',lookup_expr="gt")
    # 小于
    price__lt = filters.NumberFilter(field_name='price',lookup_expr="lt")
    class Meta:
        model = Apartment
        fields = ['price','price']
# 在请求参数中将其作为price_min和price_max发送
```

## 外键其他字段关联查询
+ 模型

```python
# 工控机
class IPC(models.Model):
    mac = models.CharField('硬件编号', max_length=64)
    alias = models.CharField('逻辑编号', max_length=32, blank=True, null=True)

    def __str__(self):
        return self.mac

    class Meta:
        verbose_name = '工控机'
        verbose_name_plural = verbose_name


# 传感器数据
class Data(models.Model):
    ipc = models.ForeignKey(IPC, on_delete=models.CASCADE, verbose_name='工控机', blank=True, null=True)
    time = models.DateTimeField('采集时间')

    def __str__(self):
        return self.ipc.mac

    class Meta:
        verbose_name = '传感器数据'
        verbose_name_plural = verbose_name
        ordering = ("-time",)
```

**需求：查询data模型的数据，通过ipc的alias字段筛选**

+ 过滤器(ModelMultipleChoiceFilter)

```python
class DataFilter(FilterSet):
    """
    数据查询
    """
    alias = CharFilter(field_name='ipc__alias', lookup_expr='exact') 

    class Meta:
        # 指定模型
        models = Data
        fields = ['alias']
```

+ 过滤器(lookup_expr)

```python
class DataFilter(FilterSet):
    """
    数据查询
    """
    alias = CharFilter(field_name='ipc', lookup_expr='alias')

    class Meta:
        # 指定模型
        models = Data
        fields = ['alias']
```

+ 请求参数：`http://127.0.0.1:8000/v1/data/?alias=101000`

## 自定义函数
模型

```bash
# 工控机
class IPC(models.Model):
    mac = models.CharField('硬件编号', max_length=64)
    alias = models.CharField('逻辑编号', max_length=64, blank=True, null=True)
    k_value = models.FloatField('K值', default=0.97)

    def __str__(self):
        return self.mac

    class Meta:
        verbose_name = '工控机'
        verbose_name_plural = verbose_name
```

**需求：查询 k_value 值为 0.97 和不是 0.97 的数据**

+ 过滤器

```bash
class NewDataFilter(FilterSet):
    """
    数据查询
    """
    k_value = CharFilter(method="filter_k_value")

    def filter_k_value(self, queryset, name, value):
        logger.info(value)
        if value == '0.97':
            queryset = queryset.filter(ipc__k_value='0.97')
        else:
            queryset = queryset.exclude(ipc__k_value='0.97')
        return queryset

    class Meta:
        # 指定模型
        models = NewData
        fields = ['k_value']
```


