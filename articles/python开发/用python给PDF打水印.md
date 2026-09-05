脚本如下

```shell
import os
from PyPDF2 import PdfFileWriter, PdfFileReader
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
BASE_DIR = 'E:\\pdf'

# 添加中文字体
font_dir = os.path.join(BASE_DIR, "msyh.ttc")
pdfmetrics.registerFont(TTFont('msyh', font_dir))

def create_watermark(content):  
    """创建PDF水印模板 
    """  
    watermark_pdf = os.path.join(BASE_DIR, 'watermark.pdf')
    # 使用reportlab来创建一个PDF文件来作为一个水印文件   
    c = canvas.Canvas(watermark_pdf, pagesize= (30*cm, 30*cm))  
    c.translate(10*cm, 5*cm) 
    # 设置字体
    c.setFont('msyh', 80)
  
    # 设置水印文件  
    c.saveState()   
    c.translate(300, 15)   
    # 设置不透明度
    c.setFillAlpha(0.3)
    # 旋转45度
    c.rotate(45)
    # 水印文字  
    c.drawString(-10*cm, 0*cm, content)
    c.drawString(-10*cm, 6*cm, content)
    c.drawString(-10*cm, 12*cm, content)
    c.drawString(-10*cm, 18*cm, content)
    c.restoreState()   
    # 保存水印文件  
    c.save()  
    pdf_watermark = PdfFileReader(open(watermark_pdf, "rb"))
    return pdf_watermark

#所有路径为绝对路径
def add_watermark(pdf_file_in, pdf_file_mark, pdf_file_out):
    pdf_output = PdfFileWriter()
    input_stream = open(pdf_file_in, 'rb')
    pdf_input = PdfFileReader(input_stream)
                                                                                
    # 获取PDF文件的页数
    pageNum = pdf_input.getNumPages()
    #读入水印pdf文件
    pdf_watermark = pdf_file_mark
    # 给每一页打水印
    for i in range(pageNum):
        page = pdf_input.getPage(i)
        page.mergePage(pdf_watermark.getPage(0))
        page.compressContentStreams()   #压缩内容
        pdf_output.addPage(page)
    pdf_output.write(open(pdf_file_out, 'wb'))

if __name__ == "__main__":
    # 创建水印
    pdf_file_mark = create_watermark("个人证件禁止商业用途")
    # 需要打水印的pdf
    pdf_file_in = os.path.join(BASE_DIR, "身份证.pdf")
    # 打完水印后的文件
    pdf_file_out = os.path.join(BASE_DIR, "水印身份证.pdf")
    add_watermark(pdf_file_in, pdf_file_mark, pdf_file_out)
```

  

执行结果如下

![image.png](assets/python开发/用python给PDF打水印/用python给PDF打水印-1.png)

![image.png](assets/python开发/用python给PDF打水印/用python给PDF打水印-2.png)