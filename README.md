# TJAspect
一个由 typescript 实现的前端 aop 实现。

### 概念

关于AOP，详情参考 https://en.wikipedia.org/wiki/Aspect-oriented_programming



### 安装

```
npm install tj-aspect
```



### 使用

#### 定义一个切面

```typescript
// 引入类库
import Aspect from "tj-aspect";

// 使Person类变为一个切面
@Aspect.target("Person")
class Person{
  
	// 定义 sayHello 为切点， 可以被后续增强
	@Aspect.pointcut
	public sayHello(){
		console.log('hello');
	}
  
}
```



#### 定义一个增强对象

```typescript
// 引入类库
import Aspect from "tj-aspect";

// 定义一个对 Person 进行增强的类
@Aspect.advice
class PersonAdvice{
  
	// 对 sayHello 进行增强，在 sayHello 调用之前执行
	@Aspect.before("Person", "sayHello")
	public beforeSayHello(){
		console.log('before person sayHello');
	}

	@Aspect.after("Person", "sayHello")
    public afterSayHello(){
		console.log("after person sayHello");
    }

}
```



#### 进行增强组合

```typescript
// 继续上述代码
const person = new Person();
const personAdvice = new PersonAdvice();

// 切面进行注入
const disposer = Aspect.weaving(person, personAdvice);

// 执行 disposer 来取消注入
disposer();

```

