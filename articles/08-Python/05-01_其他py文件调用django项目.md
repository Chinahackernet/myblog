# 其他py文件调用django项目

> 分类：Python / 第5章：Django
> 原文：https://www.cuiliangblog.cn/detail/section/70067262
> 来源：崔亮的博客

---

```bash
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rice_field.settings")
django.setup()
from public.models import SensorHistory, Sensor
```

<font style="color:rgb(77, 77, 77);">将配置添加到pycharm中的python配置中</font>

![](assets/08-Python/b4a811bcc05c07fb33a8.png)


