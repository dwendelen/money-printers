package rxjs.ajax

import rxjs.Observable

inline operator fun <T> AjaxCreationMethod.invoke(url: String): Observable<AjaxResponse<T>> {
    return asDynamic()(url) as Observable<AjaxResponse<T>>
}