@file:JsModule("rxjs/ajax")
@file:JsNonModule
package rxjs.ajax
import rxjs.Observable

external val ajax: AjaxCreationMethod

external interface AjaxCreationMethod {
    fun <T> get(url: String): Observable<AjaxResponse<T>>
    fun <T> get(url: String, headers: dynamic): Observable<AjaxResponse<T>>
    fun <T> post(url: String): Observable<AjaxResponse<T>>
    fun <T> post(url: String, body: Any): Observable<AjaxResponse<T>>
    fun <T> post(url: String, body: Any, headers: dynamic): Observable<AjaxResponse<T>>
    fun <T> put(url: String): Observable<AjaxResponse<T>>
    fun <T> put(url: String, body: Any): Observable<AjaxResponse<T>>
    fun <T> put(url: String, body: Any, headers: dynamic): Observable<AjaxResponse<T>>
    /*
    patch(url: string, body?: any, headers?: Object): Observable<AjaxResponse>;
    delete(url: string, headers?: Object): Observable<AjaxResponse>;
    getJSON<T>(url: string, headers?: Object): Observable<T>;
    */
}



external interface AjaxResponse<T> {
    val response: T
    val status: Int
    //incomplete
}

external interface AjaxError<T> {
    val status: Int
    val response: T
    // incomplete
}