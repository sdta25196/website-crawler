import fetch from "node-fetch"

/**
*
* @author : 田源
* @date : 2023-07-17 09:42
* @description : 代理池
*
*/
class TProxy {

  constructor() {
    this.proxyPool = [] // {ip,port,user,pwd}
    this.blacks = [] // ip
  }

  /** 添加一组数据进入 proxyPool, 添加时，顺便清理过期的 proxy */
  addProxyPool = (list) => {
    this.proxyPool = this.proxyPool.filter(proxy => this.blacks.indexOf(proxy.ip) === -1 && Date.now() - proxy.t < 540000) // 到时间就取消
    const newProxys = list.map(item => ({ ip: item.sever, port: item.port, user: item.user, pwd: item.pw, t: Date.now() }))
    this.proxyPool.unshift(newProxys[0])
  }

  /** 获取不在黑名单中的一个 proxy */
  getProxy = async () => {
    const proxyItem = this.proxyPool[0]
    if (proxyItem && this.blacks.indexOf(proxyItem.ip) === -1 && Date.now() - proxyItem.t < 540000) {
      return proxyItem
    } else {
      console.log('重新获取代理iP............')
      await this.requestProxys()
      return this.proxyPool[0]
    }
  }

  /** 添加指定 ip 进入黑名单 */
  addBlacks = (ip) => {
    this.blacks.push(ip)
  }

  /** 请求指定数量的 proxy，默认 1 */
  requestProxys = async ({ count = 1 } = {}) => {
    // 小熊ip
    const proxyLink = `https://find.xiaoxiongip.com/find_http?key=430079813c5af7aa&count=1&type=json&only=1&pw=yes`
    try {
      let { status, list } = await fetch(proxyLink).then(res => res.json())
      if (status === '0') {
        this.addProxyPool(list)
      }
    } catch (e) {
      const t = Date.now()
      while (t + 1000 > Date.now());
      await this.requestProxys()
    }
  }
}

export default TProxy