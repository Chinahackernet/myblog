## 练习题1

要求：

1、启动1个协程，将1~2000个数放进channel里，比如为newChan

2、启动10个协程，从newChan中取出数据n,并计算1+..+n的值，将其存入新的channel中，比如retChan

3、打印retChan的结果，比如ret[1]=1....

  

```go
package main

import (
	"fmt"
	"sync"
)

/*
练习题：
1、启动1个协程，将1~2000个数放进channel里，比如为newChan
2、启动10个协程，从newChan中取出数据n,并计算1+..+n的值，将其存入新的channel中，比如retChan
3、打印retChan的结果，比如ret[1]=1....
*/

var wg sync.WaitGroup

func writeData(newChan chan int) {
	// 向里面写入1~2000个数字
	for i := 1; i <= 2000; i++ {
		newChan <- i
	}
	close(newChan)
}

func readData(newChan chan int, retChan chan map[int]int) {

	for {
		data, ok := <-newChan
		if !ok {
			break
		}
		ret := 0
		for i := 0; i < data; i++ {
			ret += i
		}
		retMap := make(map[int]int)
		retMap[data] = ret
		retChan <- retMap
		defer wg.Done()
	}
	// close(retChan)
}

func main() {
	// 初始channel
	newChan := make(chan int, 2000)
	retChan := make(chan map[int]int, 2000)
	wg.Add(2000)
	go writeData(newChan)
	// 开启8个线程去读写
	for i := 0; i < 8; i++ {
		go readData(newChan, retChan)
	}
	wg.Wait()
	close(retChan)
	for data := range retChan {
		// fmt.Println(data)
		for key, value := range data {
			fmt.Printf("ret[%d]=%d\n", key, value)
		}
	}
}
```

  

## 练习题2

要求：

1、开启1个协程writeDataToFile，随机生产1000个数字，存放到文件中

2、当writeDataToFile完成1000个数字写入后，让sort协程从中读取1000个数据对其进行排序，并将排序好的数字存入新的文件中

  

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"math/rand"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
)

/*
1、开启1个协程writeDataToFile，随机生产1000个数字，存放到文件中
2、当writeDataToFile完成1000个数字写入后，让sort协程从中读取1000个数据对其进行排序，并将排序好的数字存入新的文件中
*/

var wg sync.WaitGroup

func writeDataToFile(fileChan chan bool) {
	writeFile, err := os.OpenFile("./random.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		fmt.Println("open file failed, err:", err)
		return
	}
	defer writeFile.Close()
	for i := 1; i <= 1000; i++ {
		// 生成随机数
		randomNum := rand.Int31() % 10000
		// 将随机数保存到文件中
		writeFile.WriteString(strconv.Itoa(int(randomNum)) + "\n")
	}
	fileChan <- true
	close(fileChan)
}

func sortData(fileChan chan bool) {
	for {
		ret, ok := <-fileChan
		if !ok {
			break
		}
		if ret {
			readFile, err := os.Open("./random.txt")
			if err != nil {
				fmt.Println("read file failed, err:", err)
			}
			defer readFile.Close()
			newFile, err := os.OpenFile("./newfile.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
			if err != nil {
				fmt.Println("open new file failed, err:", err)
				return
			}
			defer newFile.Close()
			newReader := bufio.NewReader(readFile)
			// 逐行读取，将其转换为int，存到slice中
			var newSlice []int
			for {
				line, err := newReader.ReadString('\n')
				if err == io.EOF {
					break
				}
				if err != nil {
					fmt.Println(err)
				}
				// fmt.Println()
				ret, _ := strconv.Atoi(strings.Split(line, "\n")[0])
				// fmt.Println(ret)
				// fmt.Printf("%T\n", ret)
				newSlice = append(newSlice, ret)

			}
			// fmt.Println(newSlice)
			// 对切片进行排序
			// fmt.Println(len(newSlice))
			sort.Ints(newSlice)
			// fmt.Println(len(newSlice))
			// 将排序好的数据写入新文件
			for _, v := range newSlice {
				newFile.WriteString(strconv.Itoa(v) + "\n")
			}
			defer wg.Done()
			// close(exitChan)
		}
	}
}

func main() {
	// 定义一个channel，用来记录文件已经写完
	fileChan := make(chan bool, 1)
	// exitChan := make(chan bool, 1)
	wg.Add(1)
	go writeDataToFile(fileChan)
	// go sortData(fileChan, exitChan)
	go sortData(fileChan)
	// for {
	// 	_, ok := <-exitChan
	// 	if !ok {
	// 		break
	// 	}
	// }
	wg.Wait()
}
```

  

扩展：

1、开启10个协程writeDataToFile，随机生产1000个数字，存放到10文件中

2、当writeDataToFile完成10个文件1000个数字写入后，让sort协程从10个文件中读取1000个数据对其进行排序，并将排序好的数字存入新的10的文件中

  

## 练习题3

*使用goroutine和channel实现一个计算int64随机数各位数和的程序。*

*1、开启一个goroutine循环生成int64类型的随机数，发送到jobChan*

*2、开启24个goroutine从jobChan中取出随机数计算各位数的和，将结果发送到resultChan*

*3、主goroutine从resultChan取出结果并打印到终端输出*

  

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

/*
使用goroutine和channel实现一个计算int64随机数各位数和的程序。
1、开启一个goroutine循环生成int64类型的随机数，发送到jobChan
2、开启24个goroutine从jobChan中取出随机数计算各位数的和，将结果发送到resultChan
3、主goroutine从resultChan取出结果并打印到终端输出
*/

type job struct {
	value int64
}

type result struct {
	job *job
	sum int64
}

var wg sync.WaitGroup

func insertData(ch1 chan<- *job) {
	defer wg.Done()
	// 循环写
	for {
		// 生成随机数
		num := rand.Int63()
		// 实例化job
		numJob := &job{
			value: num,
		}
		ch1 <- numJob
		time.Sleep(time.Millisecond * 500)
	}
}

func sumData(ch1 <-chan *job, retChan chan<- *result) {
	defer wg.Done()
	for {
		// 循环从ch1读数据
		num := <-ch1
		sum := int64(0)
		// 计算位数之和
		n := num.value
		for n > 0 {
			sum += n % 10
			n = n / 10
		}
		// 实例化result
		newResult := &result{
			job: num,
			sum: sum,
		}
		retChan <- newResult
	}
}

func main() {
	inChan := make(chan *job, 100)
	retChan := make(chan *result, 100)
	wg.Add(1)
	go insertData(inChan)
	for i := 1; i <= 24; i++ {
		wg.Add(1)
		go sumData(inChan, retChan)
	}
	// 打印结果
	for ret := range retChan {
		fmt.Printf("Job: [%d] Sum: [%d]\n", ret.job.value, ret.sum)
	}
	wg.Wait()

}
```