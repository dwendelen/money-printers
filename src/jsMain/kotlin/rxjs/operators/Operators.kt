@file:JsModule("rxjs/operators")
@file:JsNonModule
package rxjs.operators

import rxjs.MonoTypeOperatorFunction
import rxjs.OperatorFunction

external fun <T, R> map(project: (value: T, index: Int) -> R): OperatorFunction<T, R>
external fun <T, R> map(project: (value: T, index: Int) -> R, thisArg: Any): OperatorFunction<T, R>
external fun <T, R> map(project: (value: T) -> R): OperatorFunction<T, R>
external fun <T, R> map(project: (value: T) -> R, thisArg: Any): OperatorFunction<T, R>

external fun <T> skip(count: Int): MonoTypeOperatorFunction<T>
