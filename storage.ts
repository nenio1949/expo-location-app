/**
 * 对本地storage管理进行封装（注：RN自带AsyncStorage已不维护！！！）
 * 对所有数据进行统一包装：{ data: xxx } 或 { data: { ... } }
 * 提供：get、set、remove、clear、getMultiple、getAllKeys、merge
 * Todo：后续基于Hook的方式实现
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 枚举Key（eg.根据自己需要定义，仅供参考）
 */
const enumKeys = {
  token: 'token', // 认证信息
  checkList: 'checkList', // 检查记录信息
  user: 'user', // 用户信息
};

const Storage = {
  enumKeys,

  /**
   * 获取
   * @param {*} key
   */
  get: async (key: string) => {
    try {
      const res = await AsyncStorage.getItem(key);

      if (res) {
        let parseRes = JSON.parse(res);
        let {data} = parseRes;
        return data;
      } else {
        return null;
      }
    } catch (e) {
      console.log('获取记录失败', e);
    }
  },

  /**
   * 插入
   * @param {*} key
   * @param {*} value
   */
  set: async (key: string, value: any) => {
    try {
      const res = JSON.stringify({data: value});

      return await AsyncStorage.setItem(key, res);
    } catch (e) {
      console.log('新增记录失败', e);
    }
  },

  /**
   * 删除
   * @param {*} key
   */
  remove: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.log('移除记录失败', e);
    }
  },

  /**
   * 清空
   */
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.log('清除记录失败', e);
    }
  },

  /**
   * 合并（即二者数据叠加）
   */
  merge: () => {},

  /**
   * 获取所有keys
   */
  getAllKeys: async () => {
    let keys: any = [];
    try {
      keys = await AsyncStorage.getAllKeys();
    } catch (e) {
      console.log(`获取keys失败：${e}`);
    }

    return keys;
  },

  /**
   * 批量获取指定keys的值
   * @param {*} keys Array
   * 返回结果：[ ['@MyApp_user', 'myUserValue'], ['@MyApp_key', 'myKeyValue'] ]
   */
  getMultiple: async (keys: Array<string>) => {
    let values;

    try {
      values = await AsyncStorage.multiGet(keys);
    } catch (e) {
      // read error
    }

    return values;
  },
};

export default Storage;
