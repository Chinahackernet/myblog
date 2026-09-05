# Gradio(交互演示)

> 分类：AIOPS / 第4章：大模型工具
> 原文：https://www.cuiliangblog.cn/detail/section/228583369
> 来源：崔亮的博客

---

# Gradio 简介
## 什么是 Gradio
 Gradio 是一个开源的 Python 库，主要用于快速构建和分享机器学习模型的 Web 界面。它特别适合**模型原型展示、用户交互测试**，以及快速部署 AI 应用，无需前端开发经验。 

## Gradio 能做什么  
| 功能 | 描述 |
| --- | --- |
| 快速构建界面 | 只需几行代码即可为模型添加网页 UI |
| 模型交互 | 支持用户输入文本、图像、音频、视频等进行推理 |
| 一键分享 | 自动生成可公网访问的链接，便于分享给他人测试 |
| 模块组合 | 支持多个组件组合成多输入/多输出应用 |
| 多框架兼容 | 支持 PyTorch、TensorFlow、Transformers、scikit-learn、OpenAI 等 |


# 常用组件
##  文本类  
| 组件 | 用途 |
| --- | --- |
| `gr.Textbox()` | 文本输入/输出 |
| `gr.TextArea()` | 多行文本 |
| `gr.Label()` | 显示分类标签 |


代码如下：

```bash
import gradio as gr

def greet(name):
    return f"你好，{name}！"

gr.Interface(
    fn=greet,
    inputs=gr.Textbox(label="输入你的名字"),
    outputs=gr.Textbox(label="问候语")
).launch()
```

效果如下：

![](assets/03-AIOps/8a247fb607351964c45a.png)

##  图像类  
| 组件 | 用途 |
| --- | --- |
| `gr.Image()` | 输入或输出图像 |
| `gr.Sketchpad()` | 手绘板（适合涂鸦识别） |


示例代码：

```python
def flip_image(image):
    return image.transpose(method="FLIP_LEFT_RIGHT")

gr.Interface(
    fn=flip_image,
    inputs=gr.Image(type="pil"),
    outputs=gr.Image()
).launch()
```

效果如下：

![](assets/03-AIOps/3acb3784c06cf1ec6ea7.png)

##  音频/视频类  
| 组件 | 用途 |
| --- | --- |
| `gr.Audio()` | 支持录音或上传音频 |
| `gr.Video()` | 上传或播放视频 |


示例代码：

```python
def get_duration(audio):
    return f"音频长度：{len(audio)} bytes"

gr.Interface(
    fn=get_duration,
    inputs=gr.Audio(type="filepath"),
    outputs="text"
).launch()

```

执行效果：

![](assets/03-AIOps/a4c8366cf9c8b8374cbd.png)

##  表单/控件类  
| 组件 | 用途 |
| --- | --- |
| `gr.Checkbox()` | 单个勾选框 |
| `gr.CheckboxGroup()` | 多选框组 |
| `gr.Radio()` | 单选框组 |
| `gr.Dropdown()` | 下拉选择 |
| `gr.Slider()` | 数值滑动条 |
| `gr.Number()` | 数字输入框 |


示例代码：

```python
def calc_tip(price, percent):
    return price * (percent / 100)

gr.Interface(
    fn=calc_tip,
    inputs=[gr.Number(label="价格"), gr.Slider(0, 100, label="小费 %")],
    outputs=gr.Number(label="小费金额")
).launch()
```

效果如下：

![](assets/03-AIOps/cd8f0d9d4828fcb672bd.png)

##  数据与可视化类  
| 组件 | 用途 |
| --- | --- |
| `gr.Dataframe()` | 表格输入/输出 |
| `gr.Plot()` | 绘图展示（Matplotlib / Plotly） |


示例代码：

```python
import gradio as gr
import matplotlib.pyplot as plt

def draw_sin(xmax):
    import numpy as np
    x = np.linspace(0, xmax, 100)
    y = np.sin(x)
    fig, ax = plt.subplots()
    ax.plot(x, y)
    return fig

gr.Interface(
    fn=draw_sin,
    inputs=gr.Slider(1, 20, label="X 最大值"),
    outputs=gr.Plot()
).launch()
```

效果如下：

![](assets/03-AIOps/d6f02e822bf3069d2e5d.png)

## 高级组件
| 组件 | 用途 |
| --- | --- |
| `gr.JSON()` | 显示字典结构（结构化输出） |
| `gr.File()` | 上传/下载文件 |
| `gr.HTML()` | 显示 HTML 内容 |
| `gr.Markdown()` | 显示 Markdown 内容 |


示例代码：

```python
import gradio as gr

def return_info():
    return {"user": "Alice", "score": 92}

gr.Interface(
    fn=return_info,
    inputs=[],
    outputs=gr.JSON()
).launch()
```

执行效果：

![](assets/03-AIOps/30e151a614fdf3e2de76.png)

# 入门示例
## AI 代码聊天
```python
import gradio as gr
import ollama

def chat(user_input, history):
    messages = []
    # 构建上下文：每轮问答各一条
    for pair in history:
        messages.append({"role": "user", "content": pair[0]})
        messages.append({"role": "assistant", "content": pair[1]})
    # 加入当前问题
    messages.append({"role": "user", "content": user_input})

    # 调用 Ollama
    response = ollama.chat(
        model="qwen3:8b", 
        messages=messages,
        stream=False
    )

    reply = response["message"]["content"]
    return reply

# 用最简单的 ChatInterface 启动
gr.ChatInterface(
    fn=chat,
    title="简易 Ollama 对话助手",
    examples=["你好", "你是谁", "推荐一个流量套餐"],
).launch()

```

执行效果如下：

![](assets/03-AIOps/c08a04ea7164257f4e1f.png)


