
// 目前所有的浏览器中都会把localStorage的值类型限定为string类型
// 设置
export function setCache(key, value){
    localStorage.setItem(key, JSON.stringify(value))
}
// 获取
export function getCache(key){
    return  JSON.parse(localStorage.getItem(key))
}

// 获取字符串
export function getStringCache(key){
    return localStorage.getItem(key)
}
// 删除
export function removeCache(key){
    console.log('key', key)
    localStorage.removeItem(key)
}
// 清空
export function clearCache(){
    localStorage.clear()
}

// sessionStorage

// 设置
export function setSessionStorage(key, value){
    sessionStorage.setItem(key, JSON.stringify(value))
}
// 获取
export function getSessionStorage(key){
    return sessionStorage.getItem(key)
}

// 删除
export function removeSessionStorage(key){
    sessionStorage.removeItem(key)
}


