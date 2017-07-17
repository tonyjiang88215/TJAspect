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
export declare type IDisposer = () => void;
export declare class Aspect implements IAspect {
    static PointcutMark: string;
    static AdviceMark: string;
    static BeforeAdviceMark: string;
    static AfterAdviceMark: string;
    static InterceptAdviceMark: string;
    static AspectTarget: string;
    static AspectAdvice: string;
    static instance: Aspect;
    static getInstance(): Aspect;
    target(targetName: any): (targetClass: any) => any;
    pointcut(target: any, pointcutName: any): void;
    advice(targetClass: any): any;
    weaving(target: any, injector: any): IDisposer;
    before(targetName: string, pointcutName: string): (target: any, adviceName: any) => void;
    after(targetName: string, pointcutName: string): (target: any, adviceName: any) => void;
    intercept(targetName: string, pointcutName: string): (target: any, adviceName: any) => void;
}
declare const _default: Aspect;
export default _default;
