export interface IAspect {
    target: (targetName: string) => Function;
    advice: (targetClass: Function) => Function;
    weaving: (aspect: any, advice: any) => void;

    before: (targetName: string, pointcutName: string) => Function;
    intercept: (targetName: string, pointcutName: string) => Function;
    after: (targetName: string, pointcutName: string) => Function;
}


export interface IAdviceConfig {
    type: string;
    target: string;
    pointcut: string;
    advice: string;
}

export type IDisposer = () => void;

const InterceptAdviceType = "interceptAdvices";
const BeforeAdviceType = "beforeAdvices";
const AfterAdviceType = "afterAdvices";

const AdviceTypes = [InterceptAdviceType, BeforeAdviceType, AfterAdviceType];

class AspectAdvices {
    beforeAdvices: Map<string, Array<IAdviceConfig>>;
    afterAdvices: Map<string, Array<IAdviceConfig>>;
    interceptAdvices: Map<string, Array<IAdviceConfig>>;

    constructor(targetInstance: Object, advices: Array<string>) {
        this.beforeAdvices = new Map();
        this.afterAdvices = new Map();
        this.interceptAdvices = new Map();

        advices.forEach(adviceFuncName => {

            const adviceFunc = targetInstance[adviceFuncName];
            const config = adviceFunc[Aspect.AdviceMark];
            const { type, pointcut } = config;

            switch (type) {
                case Aspect.BeforeAdviceMark:
                    this.addAdvice('beforeAdvices', pointcut, config);
                    break;

                case Aspect.AfterAdviceMark:
                    this.addAdvice("afterAdvices", pointcut, config);
                    break;

                case Aspect.InterceptAdviceMark:
                    this.addAdvice("interceptAdvices", pointcut, config);
                    break;

            }
        });
    }

    addAdvice(adviceName: string, pointcutName: string, config: IAdviceConfig) {
        if (!this[adviceName]) {
            // console.log('adviceName error');
            return;
        }

        if (!this[adviceName].has(pointcutName)) {
            this[adviceName].set(pointcutName, []);
        }

        this[adviceName].get(pointcutName).push(config);
    }
}

type AspectProxyAdviceItem = {
    id?: number;
    injector: Object;
    config: IAdviceConfig;
}

class AspectProxy {
    public readonly name: string;
    public readonly pointcuts: Array<string>;

    public prototypeFunctions: Map<string, Function>;
    public proxyFunctions: Map<string, Function>;
    public advices: Map<string, {
        beforeAdvices: Array<AspectProxyAdviceItem>,
        interceptAdvices: Array<AspectProxyAdviceItem>,
        afterAdvices: Array<AspectProxyAdviceItem>

    }>;

    private id = 0;

    private generateID() {
        return this.id++;
    }

    constructor(targetName: string, targetClass: ClassDecorator, pointcuts: Array<string>) {
        this.name = targetName;
        this.pointcuts = pointcuts;

        this.prototypeFunctions = new Map();
        this.proxyFunctions = new Map();
        this.advices = new Map();

        pointcuts.forEach(pointcutName => {
            this.prototypeFunctions.set(pointcutName, targetClass.prototype[pointcutName]);
            this.makeProxyFunction(pointcutName);
        });
    }

    public hasAdvices(pointcutName: string) {
        if (this.advices.has(pointcutName)) {
            const advices = this.advices.get(pointcutName);
            return advices.beforeAdvices.length + advices.interceptAdvices.length + advices.afterAdvices.length > 0;
        } else {
            return false;
        }
    }

    public addAdvice(pointcutName: string, adviceType: string, item: AspectProxyAdviceItem) {
        if (!this.advices.has(pointcutName)) {
            this.advices.set(pointcutName, {
                beforeAdvices: [],
                interceptAdvices: [],
                afterAdvices: []
            });
        }

        const advices = this.advices.get(pointcutName);
        const id = this.generateID();
        advices[adviceType].push(Object.assign(item, { id: id }));

        return id;
    }

    public removeAdvice(pointcutName: string, adviceType: string, id: number) {
        if (this.advices.has(pointcutName)) {
            const advices = this.advices.get(pointcutName)[adviceType];
            const index = advices.findIndex(item => item.id === id);
            if (index !== -1) {
                advices.splice(index, 1);
            }
        }
    }

    makeProxyFunction(pointcutName) {


        this.proxyFunctions.set(pointcutName, async function (...args) {
            const proxy = this[Aspect.AspectTarget];
            const advices = proxy.advices.get(pointcutName);

            // 执行 intercept， 如果被拦截，则不继续执行
            try {
                for (var i = 0; i < advices.interceptAdvices.length; i++) {
                    const { injector, config } = advices.interceptAdvices[i];
                    const stop = await injector[config.advice](...args);
                    console.log('interceptors result', stop);
                    if (stop) {
                        return;
                    }
                }
            } catch (e) {
                return;
            }

            // intercept 执行通过，说明可以执行，则执行before
            advices.beforeAdvices.forEach(({ injector, config }) => {
                injector[config.advice](...args);
            });


            // 执行函数本体，并获取返回值
            const response = Reflect.apply(proxy.prototypeFunctions.get(pointcutName), this, args);

            advices.afterAdvices.forEach(({ injector, config }) => {
                injector[config.advice](response);

            });

            return response;
        });

    }
}

export class Aspect implements IAspect {
    static PointcutMark = "PointcutMark";
    static AdviceMark = "AdviceMark";

    static BeforeAdviceMark = "Before";
    static AfterAdviceMark = "After";
    static InterceptAdviceMark = "Intercept";

    static AspectTarget = "__$$AspectTarget";
    static AspectAdvice = "__$$AspectAdvice";
    // static AspectNamespace = "__$$Aspect";

    static instance: Aspect;
    static getInstance() {
        if (!Aspect.instance) {
            Aspect.instance = new Aspect();
        }
        return Aspect.instance;
    }

    target(targetName) {
        return (targetClass) => {

            // 使用代理来重新定义 Pointcut 装饰的方法，并在执行时监测
            const pointcuts = Object.keys(targetClass.prototype)
                .filter(pointcutName => (targetClass.prototype[pointcutName] instanceof Function && targetClass.prototype[pointcutName].hasOwnProperty(Aspect.PointcutMark)));

            return new Proxy(targetClass, {
                construct: function (target, args) {
                    const instance = new target(...args);

                    instance[Aspect.AspectTarget] = new AspectProxy(targetName, targetClass, pointcuts);

                    return new Proxy(instance, {
                        get: function (target, name: string) {
                            const proxy = target[Aspect.AspectTarget] as AspectProxy;
                            if (proxy.pointcuts.indexOf(name) !== -1 && proxy.hasAdvices(name)) {
                                return proxy.proxyFunctions.get(name).bind(target);
                            } else {
                                return target[name];
                            }
                        }
                    });
                }
            });
        }
    }

    pointcut(target, pointcutName) {
        target[pointcutName][Aspect.PointcutMark] = true;
    }

    advice(targetClass) {

        const advices = Object.keys(targetClass.prototype)
            .filter(adviceName => (targetClass.prototype[adviceName] instanceof Function && targetClass.prototype[adviceName].hasOwnProperty(Aspect.AdviceMark)));

        return new Proxy(targetClass, {
            construct: function (target, args) {
                // const instance = Object.create(targetClass.prototype);
                // Reflect.apply(target, instance, args);
                const instance = new target(...args);

                instance[Aspect.AspectAdvice] = new AspectAdvices(instance, advices);

                if (instance[Aspect.AspectTarget]) {
                    return new Proxy(instance, {
                        get: function (target, name: string) {
                            const proxy = target[Aspect.AspectTarget] as AspectProxy;
                            if (proxy.proxyFunctions.has(name)) {
                                return proxy.proxyFunctions.get(name)
                            } else {
                                return target[name];
                            }
                        }
                    });
                } else {
                    return instance;
                }


            }
        })
    }

    weaving(target: any, injector: any): IDisposer {
        const proxy = target[Aspect.AspectTarget] as AspectProxy;
        const advices = injector[Aspect.AspectAdvice] as AspectAdvices;

        const disposers = [];

        if (!proxy || !(proxy instanceof AspectProxy)) {
            throw new Error(`${injector} is not a advice`);
        }

        // console.log(`weaving: target is  ${proxy.name}`);

        AdviceTypes.forEach(adviceType => {
            advices[adviceType].forEach((storeArray, pointcutName) => {
                storeArray.forEach((config) => {
                    if (config.target === proxy.name) {
                        const id = proxy.addAdvice(pointcutName, adviceType, {
                            injector: injector,
                            config: config
                        });

                        disposers.push(() => (proxy.removeAdvice(pointcutName, adviceType, id)));
                    }

                });
            });
        });

        return () => {
            disposers.forEach(disposer => disposer());
        }
    }

    before(targetName: string, pointcutName: string) {
        return (target, adviceName) => {
            target[adviceName][Aspect.AdviceMark] = {
                type: Aspect.BeforeAdviceMark,
                target: targetName,
                pointcut: pointcutName,
                advice: adviceName
            };
        };
    }

    after(targetName: string, pointcutName: string) {
        return (target, adviceName) => {
            target[adviceName][Aspect.AdviceMark] = {
                type: Aspect.AfterAdviceMark,
                target: targetName,
                pointcut: pointcutName,
                advice: adviceName
            };
        };
    }

    intercept(targetName: string, pointcutName: string) {
        return (target, adviceName) => {
            target[adviceName][Aspect.AdviceMark] = {
                type: Aspect.InterceptAdviceMark,
                target: targetName,
                pointcut: pointcutName,
                advice: adviceName
            };
        };
    }
}

export default Aspect.getInstance();