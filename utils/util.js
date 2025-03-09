const CryptoJS = require('./crypto-js.min.js')
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}
// 服务器端使用的密钥（必须与 PHP 端一致）
const SECRET_KEY = 'douyidoudouyidou';

// 计算 IV（和 PHP 端保持一致）
function getIV(key) {
  return CryptoJS.MD5(key).toString().substring(0, 16); // 使用密钥的 MD5 作为 IV
}

// AES 解密函数
const decryptData = function (encryptedData) {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
  const iv = CryptoJS.enc.Utf8.parse(getIV(SECRET_KEY));

  // 1. 需要先对 encryptedData 进行 Base64 解码
  const decodedData = CryptoJS.enc.Base64.parse(encryptedData);

  // 2. 使用 AES 解密
  const decrypted = CryptoJS.AES.decrypt({
      ciphertext: decodedData
    },
    key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  // 3. 解密后得到的是字节数组，需要转换为 UTF-8 字符串
  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  // 4. 解析 JSON 数据
  try {
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('解密数据格式错误:', error);
    return null;
  }
}
module.exports = {
  formatTime,
  decryptData
}