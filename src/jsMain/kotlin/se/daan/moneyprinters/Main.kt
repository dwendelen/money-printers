package se.daan.moneyprinters

import rxjs.*

fun start() {
    val ee = false
    val observable = if (ee) throwError("aa") else of("aa")

    observable.subscribe(object: NextObserver<Any>, ErrorObserver<Any>, CompletionObserver<Any> {
            override fun next(value: Any) {
                println("next $value")
            }

            override fun error(err: Any) {
                println("err: $err")
            }

            override fun complete() {
                println("complete")
            }
        })
    println("Hello2")
}

