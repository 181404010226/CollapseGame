/****************************************************************************
Copyright (c) 2015-2016 Chukong Technologies Inc.
Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

http://www.cocos2d-x.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/
package com.schanyin.tgcf;

import android.os.Bundle;
import android.content.Intent;
import android.content.res.Configuration;
import android.content.Context;
import android.os.Build;
import android.util.Log;

// 恢复必要的导入语句
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.content.IntentFilter;
import android.hardware.Sensor;
import android.hardware.SensorManager;

// 添加签名相关导入
import android.content.pm.PackageManager;
import android.content.pm.PackageInfo;
import android.content.pm.Signature;
import java.security.MessageDigest;

// 添加微信SDK导入
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;
import com.tencent.mm.opensdk.modelmsg.SendAuth;

import org.json.JSONObject;
import org.json.JSONException;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

import com.cocos.service.SDKWrapper;
import com.cocos.lib.CocosActivity;
import com.cocos.lib.CocosHelper;

// 穿山甲广告相关导入
import android.widget.FrameLayout;

// 巨量引擎转化SDK已在App.java中初始化，无需在Activity中处理

public class AppActivity extends CocosActivity {

    private static final String TAG = "AppActivity";
    
    // 微信相关常量
    private static final String WECHAT_APP_ID = "wx7870c770371205e4"; // 您的微信AppID
    private IWXAPI mWxApi;
    
    // 穿山甲广告管理器
    private PangleAdManager pangleAdManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.e(TAG, "=== AppActivity onCreate 开始 ===");
        
        // DO OTHER INITIALIZATION BELOW
        SDKWrapper.shared().init(this);
        
        Log.e(TAG, "SDKWrapper 初始化完成");
        
        // 初始化巨量引擎转化SDK
        App.initOceanEngineSDK(this);
        
        // 初始化微信SDK
        initWeChatSDK();
        
        // 初始化穿山甲广告管理器
        initPangleAdManager();
        
        // 延迟初始化设备信息桥接器
        scheduleDelayedInit();
        
        Log.e(TAG, "=== AppActivity onCreate 完成 ===");
    }

    private void scheduleDelayedInit() {
        // 延迟3秒后尝试初始化，确保引擎完全启动
        new android.os.Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.e(TAG, "开始延迟初始化设备信息桥接器...");
                    initDeviceInfoBridgeSafe();
                } catch (Exception e) {
                    Log.e(TAG, "延迟初始化失败: " + e.getMessage(), e);
                }
            }
        }, 3000);
    }

    private void initDeviceInfoBridgeSafe() {
        Log.e(TAG, "安全模式初始化设备信息桥接器...");
        
        try {
            // 使用JsbBridge (Cocos Creator 3.8.x 推荐的桥接方式)
            Class<?> jsbBridgeClass = Class.forName("com.cocos.lib.JsbBridge");
            Log.e(TAG, "JsbBridge类找到");
            
            initDeviceInfoBridge(jsbBridgeClass);
            Log.e(TAG, "设备信息桥接器安全初始化成功");
            
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "JsbBridge类不可用: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "安全初始化失败: " + e.getMessage(), e);
        }
    }

    private void initDeviceInfoBridge(Class<?> jsbBridgeClass) {
        Log.e(TAG, "开始初始化设备信息桥接器，使用JsbBridge");
        
        try {
            // 创建ICallback接口的实现
            Object callback = java.lang.reflect.Proxy.newProxyInstance(
                jsbBridgeClass.getClassLoader(),
                new Class<?>[]{Class.forName("com.cocos.lib.JsbBridge$ICallback")},
                new java.lang.reflect.InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, java.lang.reflect.Method method, Object[] args) throws Throwable {
                        if ("onScript".equals(method.getName()) && args.length == 2) {
                            String command = (String) args[0];
                            String data = (String) args[1];
                            
                            Log.e(TAG, "收到JS命令: " + command + ", 数据: " + data);
                            
                            handleJSCommand(command, data);
                        }
                        return null;
                    }
                }
            );
            
            // 设置回调
            java.lang.reflect.Method setCallbackMethod = jsbBridgeClass.getMethod("setCallback", 
                Class.forName("com.cocos.lib.JsbBridge$ICallback"));
            setCallbackMethod.invoke(null, callback);
            
            Log.e(TAG, "JsbBridge回调设置成功");
        } catch (Exception e) {
            Log.e(TAG, "初始化设备信息桥接器失败: " + e.getMessage(), e);
        }
        
        Log.e(TAG, "设备信息桥接器已初始化");
    }

    // 处理JS命令的方法
    private void handleJSCommand(String command, String data) {
        switch (command) {
            case "getDeviceInfo":
                Log.e(TAG, "处理getDeviceInfo命令");
                handleGetDeviceInfo();
                break;
            case "getAndroidId":
                Log.e(TAG, "处理getAndroidId命令");
                handleGetAndroidId();
                break;
            case "getSimInfo":
                Log.e(TAG, "处理getSimInfo命令");
                handleGetSimInfo();
                break;
            case "getDeviceModel":
                Log.e(TAG, "处理getDeviceModel命令");
                handleGetDeviceModel();
                break;
            case "getBatteryInfo":
                Log.e(TAG, "处理getBatteryInfo命令");
                handleGetBatteryInfo();
                break;
            case "getNetworkInfo":
                Log.e(TAG, "处理getNetworkInfo命令");
                handleGetNetworkInfo();
                break;
            case "getLianyunshanToken":
                Log.e(TAG, "处理getLianyunshanToken命令");
                handleGetLianyunshanToken();
                break;
            case "reportLianyunshanScene":
                Log.e(TAG, "处理reportLianyunshanScene命令: " + data);
                handleReportLianyunshanScene(data);
                break;
            case "getSystemInfo":
                Log.e(TAG, "处理getSystemInfo命令");
                handleGetSystemInfo();
                break;
            case "wechatLogin":
                Log.e(TAG, "处理wechatLogin命令");
                handleWeChatLogin();
                break;
            case "pangleInitSDK":
                Log.e(TAG, "处理pangleInitSDK命令");
                handlePangleInitSDK();
                break;
            case "pangleLoadSplashAd":
                Log.e(TAG, "处理pangleLoadSplashAd命令");
                handlePangleLoadSplashAd();
                break;
            case "pangleShowSplashAd":
                Log.e(TAG, "处理pangleShowSplashAd命令");
                handlePangleShowSplashAd();
                break;
            case "pangleIsAdReady":
                Log.e(TAG, "处理pangleIsAdReady命令");
                handlePangleIsAdReady();
                break;
            case "pangleDestroyAd":
                Log.e(TAG, "处理pangleDestroyAd命令");
                handlePangleDestroyAd();
                break;
            default:
                Log.w(TAG, "未知命令: " + command);
                break;
        }
    }

    // 发送消息到JS的安全方法
    private void sendToScript(String command, String data) {
        try {
            CocosHelper.runOnGameThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        // 构建JS回调代码，触发我们在JS端注册的回调函数
                        String escapeCmd = command.replace("'", "\\'");
                        String escapeData = data.replace("'", "\\'");
                        
                        String jsCode = String.format(
                            "if(typeof native !== 'undefined' && native.bridge && native.bridge.onNative){" +
                            "native.bridge.onNative('%s','%s');" +
                            "} else if(typeof window !== 'undefined' && window.onPangleCallback){" +
                            "window.onPangleCallback('%s','%s');" +
                            "} else if(typeof globalThis !== 'undefined' && globalThis.onPangleCallback){" +
                            "globalThis.onPangleCallback('%s','%s');" +
                            "} else {" +
                            "console.log('无法找到JS回调函数: %s');" +
                            "}", escapeCmd, escapeData, escapeCmd, escapeData, escapeCmd, escapeData, escapeCmd);
                        
                        // 使用CocosJavascriptJavaBridge.evalString执行JS代码
                        Class<?> bridgeClass = Class.forName("com.cocos.lib.CocosJavascriptJavaBridge");
                        java.lang.reflect.Method evalStringMethod = bridgeClass.getMethod("evalString", String.class);
                        evalStringMethod.invoke(null, jsCode);
                        Log.d(TAG, "消息发送到JS成功: " + command);
                    } catch (Exception e) {
                        Log.e(TAG, "发送消息到JS失败: " + e.getMessage(), e);
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "执行JS代码失败: " + e.getMessage(), e);
        }
    }

    private void handleGetDeviceInfo() {
        try {
            JSONObject deviceInfo = new JSONObject();
            
            // 设备标识信息
            deviceInfo.put("androidId", getAndroidId());
            deviceInfo.put("simCard", getSimCardInfo());
            deviceInfo.put("deviceId", getCustomDeviceId());
            
            // 设备硬件信息
            deviceInfo.put("brand", Build.BRAND);
            deviceInfo.put("model", Build.MODEL);
            deviceInfo.put("osVersion", Build.VERSION.RELEASE);
            deviceInfo.put("platform", "Android");
            
            // 网络信息
            deviceInfo.put("ipAddress", getIPAddress());
            deviceInfo.put("hasNetwork", hasNetworkConnection());
            deviceInfo.put("isWiFi", isWiFiConnected());
            deviceInfo.put("isVPN", isVPNConnected());
            
            // 设备状态
            deviceInfo.put("hasGyroscope", hasGyroscope());
            deviceInfo.put("isCharging", isDeviceCharging());
            deviceInfo.put("isRoot", isDeviceRooted());
            deviceInfo.put("debugMode", isAppInDebugMode());
            
            // 时间戳
            deviceInfo.put("updateTime", System.currentTimeMillis());
            
            // 发送到JS
            sendToScript("deviceInfoResult", deviceInfo.toString());
            
        } catch (JSONException e) {
            Log.e(TAG, "创建设备信息JSON失败", e);
            sendToScript("deviceInfoError", "获取设备信息失败: " + e.getMessage());
        }
    }

    private void handleGetAndroidId() {
        String androidId = getAndroidId();
        sendToScript("androidIdResult", androidId);
    }

    private void handleGetSimInfo() {
        String simInfo = getSimCardInfo();
        sendToScript("simInfoResult", simInfo);
    }

    private void handleGetDeviceModel() {
        try {
            JSONObject modelInfo = new JSONObject();
            modelInfo.put("brand", Build.BRAND);
            modelInfo.put("model", Build.MODEL);
            modelInfo.put("manufacturer", Build.MANUFACTURER);
            modelInfo.put("device", Build.DEVICE);
            
            sendToScript("deviceModelResult", modelInfo.toString());
        } catch (JSONException e) {
            Log.e(TAG, "获取设备型号失败", e);
        }
    }

    private void handleGetBatteryInfo() {
        try {
            JSONObject batteryInfo = new JSONObject();
            batteryInfo.put("isCharging", isDeviceCharging());
            batteryInfo.put("batteryLevel", getBatteryLevel());
            
            sendToScript("batteryInfoResult", batteryInfo.toString());
        } catch (JSONException e) {
            Log.e(TAG, "获取电池信息失败", e);
        }
    }

    private void handleGetNetworkInfo() {
        try {
            JSONObject networkInfo = new JSONObject();
            networkInfo.put("hasNetwork", hasNetworkConnection());
            networkInfo.put("isWiFi", isWiFiConnected());
            networkInfo.put("isVPN", isVPNConnected());
            networkInfo.put("ipAddress", getIPAddress());
            
            sendToScript("networkInfoResult", networkInfo.toString());
        } catch (JSONException e) {
            Log.e(TAG, "获取网络信息失败", e);
        }
    }

    private void handleGetSystemInfo() {
        try {
            JSONObject systemInfo = new JSONObject();
            systemInfo.put("osVersion", Build.VERSION.RELEASE);
            systemInfo.put("apiLevel", Build.VERSION.SDK_INT);
            systemInfo.put("buildVersion", Build.VERSION.INCREMENTAL);
            systemInfo.put("debugMode", isAppInDebugMode());
            systemInfo.put("isRoot", isDeviceRooted());
            
            sendToScript("systemInfoResult", systemInfo.toString());
        } catch (JSONException e) {
            Log.e(TAG, "获取系统信息失败", e);
        }
    }

    // 获取Android ID
    private String getAndroidId() {
        try {
            return Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        } catch (Exception e) {
            Log.e(TAG, "获取Android ID失败", e);
            return "unknown";
        }
    }

    // 获取SIM卡信息
    private String getSimCardInfo() {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager != null) {
                // 优先使用SIM卡运营商信息，更准确
                String simOperatorName = telephonyManager.getSimOperatorName();
                if (simOperatorName != null && !simOperatorName.isEmpty() && !"null".equals(simOperatorName)) {
                    // 处理常见的运营商名称映射
                    String operatorName = mapOperatorName(simOperatorName);
                    Log.d(TAG, "SIM运营商名称: " + simOperatorName + " -> " + operatorName);
                    return operatorName;
                }
                
                // 备用方案：使用网络运营商信息
                String networkOperatorName = telephonyManager.getNetworkOperatorName();
                if (networkOperatorName != null && !networkOperatorName.isEmpty() && !"null".equals(networkOperatorName)) {
                    String operatorName = mapOperatorName(networkOperatorName);
                    Log.d(TAG, "网络运营商名称: " + networkOperatorName + " -> " + operatorName);
                    return operatorName;
                }
                
                // 最后尝试通过运营商代码获取
                String simOperator = telephonyManager.getSimOperator();
                if (simOperator != null && simOperator.length() >= 5) {
                    String operatorName = getOperatorNameByCode(simOperator);
                    Log.d(TAG, "运营商代码: " + simOperator + " -> " + operatorName);
                    return operatorName;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "获取SIM卡信息失败", e);
        }
        return "无SIM卡";
    }
    
    // 运营商名称映射
    private String mapOperatorName(String originalName) {
        if (originalName == null || originalName.isEmpty()) {
            return "未知运营商";
        }
        
        String name = originalName.toLowerCase();
        if (name.contains("china mobile") || name.contains("cmcc") || name.contains("中国移动")) {
            return "中国移动";
        } else if (name.contains("china unicom") || name.contains("unicom") || name.contains("中国联通")) {
            return "中国联通";
        } else if (name.contains("china telecom") || name.contains("telecom") || name.contains("中国电信")) {
            return "中国电信";
        } else if (name.contains("china broadcasting") || name.contains("中国广电")) {
            return "中国广电";
        }
        
        return originalName; // 返回原始名称
    }
    
    // 根据运营商代码获取运营商名称
    private String getOperatorNameByCode(String operatorCode) {
        if (operatorCode == null || operatorCode.length() < 5) {
            return "未知运营商";
        }
        
        // 中国的MCC是460
        if (operatorCode.startsWith("460")) {
            String mnc = operatorCode.substring(3);
            switch (mnc) {
                case "00":
                case "02":
                case "07":
                case "08":
                    return "中国移动";
                case "01":
                case "06":
                case "09":
                    return "中国联通";
                case "03":
                case "05":
                case "11":
                    return "中国电信";
                case "12":
                    return "中国广电";
                default:
                    return "未知运营商(" + operatorCode + ")";
            }
        }
        
        return "未知运营商(" + operatorCode + ")";
    }

    // 获取设备ID
    private String getCustomDeviceId() {
        try {
            // 方法1: 尝试获取Android ID (最可靠)
            String androidId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
            if (androidId != null && !androidId.isEmpty() && !"9774d56d682e549c".equals(androidId)) {
                return androidId;
            }
            
            // 方法2: 尝试获取Build.SERIAL (Android 9及以下)
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                String serial = Build.SERIAL;
                if (serial != null && !serial.isEmpty() && !"unknown".equals(serial)) {
                    return serial;
                }
            }
            
            // 方法3: 使用设备硬件信息生成唯一ID
            String deviceInfo = Build.BRAND + "-" + Build.MODEL + "-" + Build.MANUFACTURER + "-" + Build.DEVICE;
            return "DEVICE_" + Math.abs(deviceInfo.hashCode());
            
        } catch (Exception e) {
            Log.e(TAG, "获取设备ID失败", e);
            // 最后的备用方案：使用时间戳和随机数
            return "FALLBACK_" + System.currentTimeMillis() % 1000000;
        }
    }

    // 获取IP地址
    private String getIPAddress() {
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress() && !inetAddress.isLinkLocalAddress()) {
                        return inetAddress.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "获取IP地址失败", e);
        }
        return "unknown";
    }

    // 检查网络连接
    private boolean hasNetworkConnection() {
        try {
            ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
            return activeNetworkInfo != null && activeNetworkInfo.isConnected();
        } catch (Exception e) {
            Log.e(TAG, "检查网络连接失败", e);
            return false;
        }
    }

    // 检查WiFi连接
    private boolean isWiFiConnected() {
        try {
            ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo wifiNetworkInfo = connectivityManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
            return wifiNetworkInfo != null && wifiNetworkInfo.isConnected();
        } catch (Exception e) {
            Log.e(TAG, "检查WiFi连接失败", e);
            return false;
        }
    }

    // 检查VPN连接
    private boolean isVPNConnected() {
        try {
            ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NetworkInfo activeNetwork = connectivityManager.getActiveNetworkInfo();
                return activeNetwork != null && activeNetwork.getType() == ConnectivityManager.TYPE_VPN;
            }
            return false;
        } catch (Exception e) {
            Log.e(TAG, "检查VPN连接失败", e);
            return false;
        }
    }

    // 检查是否有陀螺仪
    private boolean hasGyroscope() {
        try {
            SensorManager sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
            return sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE) != null;
        } catch (Exception e) {
            Log.e(TAG, "检查陀螺仪失败", e);
            return false;
        }
    }

    // 检查是否正在充电
    private boolean isDeviceCharging() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            return status == BatteryManager.BATTERY_STATUS_CHARGING || 
                   status == BatteryManager.BATTERY_STATUS_FULL;
        } catch (Exception e) {
            Log.e(TAG, "检查充电状态失败", e);
            return false;
        }
    }

    // 获取电池电量
    private int getBatteryLevel() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            return (int) ((level / (float) scale) * 100);
        } catch (Exception e) {
            Log.e(TAG, "获取电池电量失败", e);
            return -1;
        }
    }

    // 检查是否Root
    private boolean isDeviceRooted() {
        try {
            Process process = Runtime.getRuntime().exec("su");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 检查是否调试模式
    private boolean isAppInDebugMode() {
        return (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    // ===== 微信登录相关方法 =====
    
    /**
     * 获取应用的MD5签名 - 用于微信开放平台配置
     */
    private String getAppSignatureMD5() {
        try {
            PackageInfo packageInfo = getPackageManager().getPackageInfo(
                getPackageName(), PackageManager.GET_SIGNATURES);
            Signature[] signatures = packageInfo.signatures;
            if (signatures.length > 0) {
                MessageDigest md = MessageDigest.getInstance("MD5");
                md.update(signatures[0].toByteArray());
                byte[] digest = md.digest();
                StringBuilder sb = new StringBuilder();
                for (byte b : digest) {
                    sb.append(String.format("%02x", b));
                }
                String md5Signature = sb.toString();
                Log.e(TAG, "=== 应用MD5签名信息 ===");
                Log.e(TAG, "包名: " + getPackageName());
                Log.e(TAG, "MD5签名: " + md5Signature);
                Log.e(TAG, "请将此MD5签名配置到微信开放平台");
                Log.e(TAG, "=======================");
                return md5Signature;
            }
        } catch (Exception e) {
            Log.e(TAG, "获取MD5签名失败: " + e.getMessage(), e);
        }
        return "";
    }
    
    /**
     * 初始化微信SDK
     */
    private void initWeChatSDK() {
        try {
            Log.e(TAG, "=== 开始初始化微信SDK ===");
            Log.e(TAG, "微信App ID: " + WECHAT_APP_ID);
            Log.e(TAG, "Android版本: " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
            
            mWxApi = WXAPIFactory.createWXAPI(this, WECHAT_APP_ID, true);
            boolean registerResult = mWxApi.registerApp(WECHAT_APP_ID);
            
            Log.e(TAG, "微信SDK初始化: " + (registerResult ? "成功" : "失败"));
            
            if (registerResult) {
                Log.e(TAG, "微信SDK注册成功，AppID: " + WECHAT_APP_ID);
                
                // 检测微信安装状态
                boolean isInstalled = mWxApi.isWXAppInstalled();
                Log.e(TAG, "微信安装检测结果: " + (isInstalled ? "已安装" : "未安装"));
                
                if (isInstalled) {
                    try {
                        int supportApi = mWxApi.getWXAppSupportAPI();
                        Log.e(TAG, "微信支持的API版本: " + supportApi);
                    } catch (Exception e) {
                        Log.w(TAG, "获取微信API版本失败: " + e.getMessage());
                    }
                } else {
                    Log.e(TAG, "检测到微信未安装，可能的原因:");
                    Log.e(TAG, "1. 微信确实未安装");
                    Log.e(TAG, "2. Android 11+包可见性问题（需要在AndroidManifest.xml中添加queries）");
                    Log.e(TAG, "3. 微信SDK版本不兼容");
                    Log.e(TAG, "当前SDK版本: 6.8.34");
                    Log.e(TAG, "目标SDK版本: " + getApplicationInfo().targetSdkVersion);
                }
            } else {
                Log.e(TAG, "微信SDK注册失败");
            }
            
            Log.e(TAG, "=== 微信SDK初始化完成 ===");
        } catch (Exception e) {
            Log.e(TAG, "初始化微信SDK失败: " + e.getMessage(), e);
        }
    }

    /**
     * 处理微信登录命令
     */
    private void handleWeChatLogin() {
        Log.e(TAG, "=== 开始处理微信登录命令 ===");
        
        // 获取并打印MD5签名，用于配置微信开放平台
        String md5Signature = getAppSignatureMD5();
        
        if (mWxApi == null) {
            Log.e(TAG, "微信SDK未初始化");
            sendToScript("wechatLoginError", "微信SDK未初始化");
            return;
        }

        // 检查是否安装微信
        boolean isInstalled = mWxApi.isWXAppInstalled();
        Log.e(TAG, "微信安装状态检查: " + (isInstalled ? "已安装" : "未安装"));
        
        if (!isInstalled) {
            Log.e(TAG, "=== 微信未安装处理 ===");
            Log.e(TAG, "系统信息:");
            Log.e(TAG, "- Android版本: " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
            Log.e(TAG, "- 目标SDK版本: " + getApplicationInfo().targetSdkVersion);
            Log.e(TAG, "- 包名: " + getPackageName());
            
            String errorMsg = "请先安装微信";
            if (Build.VERSION.SDK_INT >= 30) {
                errorMsg += "（如果已安装微信但仍显示此错误，可能是Android 11+兼容性问题）";
                Log.e(TAG, "Android 11+检测到，建议检查:");
                Log.e(TAG, "1. AndroidManifest.xml中是否添加了<queries><package android:name=\"com.tencent.mm\" /></queries>");
                Log.e(TAG, "2. 微信SDK版本是否为6.8.0+");
                Log.e(TAG, "3. 编译工具版本是否满足要求");
            }
            
            sendToScript("wechatLoginError", errorMsg);
            return;
        }

        // 检查微信版本是否支持（在新版本SDK中，这个检查通常不再需要）
        // 如果需要检查特定API支持，可以使用 getWXAppSupportAPI() 方法
        try {
            int supportApi = mWxApi.getWXAppSupportAPI();
            Log.d(TAG, "微信支持的API版本: " + supportApi);
            // 一般情况下，只要微信安装就支持基本功能，这里可以移除版本检查
        } catch (Exception e) {
            Log.w(TAG, "无法获取微信API版本，继续执行登录流程");
        }

        try {
            Log.e(TAG, "=== 准备发起微信登录请求 ===");
            // 发起微信登录请求
            SendAuth.Req req = new SendAuth.Req();
            req.scope = "snsapi_userinfo";
            req.state = "wechat_login_" + System.currentTimeMillis();
            
            Log.e(TAG, "登录请求参数:");
            Log.e(TAG, "- scope: " + req.scope);
            Log.e(TAG, "- state: " + req.state);
            
            boolean result = mWxApi.sendReq(req);
            Log.e(TAG, "发起微信登录请求: " + (result ? "成功" : "失败"));
            
            if (!result) {
                sendToScript("wechatLoginError", "发起微信登录失败");
            }
        } catch (Exception e) {
            Log.e(TAG, "微信登录异常: " + e.getMessage(), e);
            sendToScript("wechatLoginError", "微信登录异常: " + e.getMessage());
        }
        
        Log.e(TAG, "=== 微信登录命令处理完成 ===");
    }

    /**
     * 初始化穿山甲广告管理器
     */
    private void initPangleAdManager() {
        try {
            Log.e(TAG, "=== 开始初始化穿山甲广告管理器 ===");
            pangleAdManager = PangleAdManager.getInstance();
            pangleAdManager.setActivity(this);
            Log.e(TAG, "穿山甲广告管理器初始化完成");
        } catch (Exception e) {
            Log.e(TAG, "初始化穿山甲广告管理器失败: " + e.getMessage(), e);
        }
    }

    /**
     * 处理穿山甲SDK初始化命令
     */
    private void handlePangleInitSDK() {
        if (pangleAdManager != null) {
            pangleAdManager.initSDK(this);
        } else {
            Log.e(TAG, "穿山甲广告管理器未初始化");
            sendToScript("pangleInitResult", "{\"success\":false,\"message\":\"广告管理器未初始化\"}");
        }
    }

    /**
     * 处理穿山甲开屏广告加载命令
     */
    private void handlePangleLoadSplashAd() {
        if (pangleAdManager != null) {
            pangleAdManager.loadSplashAd();
        } else {
            Log.e(TAG, "穿山甲广告管理器未初始化");
            sendToScript("pangleAdLoadResult", "{\"success\":false,\"message\":\"广告管理器未初始化\"}");
        }
    }

    /**
     * 处理穿山甲开屏广告展示命令
     */
    private void handlePangleShowSplashAd() {
        if (pangleAdManager != null) {
            // 创建一个全屏的FrameLayout作为广告容器
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        FrameLayout adContainer = new FrameLayout(AppActivity.this);
                        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT,
                            FrameLayout.LayoutParams.MATCH_PARENT
                        );
                        addContentView(adContainer, params);
                        pangleAdManager.showSplashAd(adContainer);
                    } catch (Exception e) {
                        Log.e(TAG, "创建广告容器失败: " + e.getMessage(), e);
                        sendToScript("pangleAdShowResult", "{\"success\":false,\"message\":\"创建广告容器失败\"}");
                    }
                }
            });
        } else {
            Log.e(TAG, "穿山甲广告管理器未初始化");
            sendToScript("pangleAdShowResult", "{\"success\":false,\"message\":\"广告管理器未初始化\"}");
        }
    }

    /**
     * 处理穿山甲广告状态检查命令
     */
    private void handlePangleIsAdReady() {
        if (pangleAdManager != null) {
            boolean isReady = pangleAdManager.isAdReady();
            String result = "{\"isReady\":" + isReady + "}";
            sendToScript("pangleAdReady", result);
        } else {
            Log.e(TAG, "穿山甲广告管理器未初始化");
            sendToScript("pangleAdReady", "{\"isReady\":false}");
        }
    }

    /**
     * 处理穿山甲广告销毁命令
     */
    private void handlePangleDestroyAd() {
        if (pangleAdManager != null) {
            pangleAdManager.destroyAd();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        SDKWrapper.shared().onResume();
        
        // 巨量引擎转化SDK已在init时自动处理生命周期，无需手动调用
    }

    @Override
    protected void onPause() {
        super.onPause();
        SDKWrapper.shared().onPause();
        
        // 巨量引擎转化SDK已在init时自动处理生命周期，无需手动调用
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Workaround in https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            return;
        }
        SDKWrapper.shared().onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        SDKWrapper.shared().onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        SDKWrapper.shared().onNewIntent(intent);
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        SDKWrapper.shared().onRestart();
    }

    @Override
    protected void onStop() {
        super.onStop();
        SDKWrapper.shared().onStop();
    }

    @Override
    public void onBackPressed() {
        SDKWrapper.shared().onBackPressed();
        super.onBackPressed();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        SDKWrapper.shared().onConfigurationChanged(newConfig);
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        SDKWrapper.shared().onRestoreInstanceState(savedInstanceState);
        super.onRestoreInstanceState(savedInstanceState);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        SDKWrapper.shared().onSaveInstanceState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onStart() {
        SDKWrapper.shared().onStart();
        super.onStart();
    }

    @Override
    public void onLowMemory() {
        SDKWrapper.shared().onLowMemory();
        super.onLowMemory();
    }
    
    /**
     * 处理获取连云山设备token请求
     */
    private void handleGetLianyunshanToken() {
        try {
            String token = App.getDeviceToken();
            sendToScript("lianyunshanTokenResult", token != null ? token : "");
            Log.e(TAG, "连云山设备token获取成功: " + (token != null ? token.substring(0, Math.min(20, token.length())) + "..." : "null"));
        } catch (Exception e) {
            Log.e(TAG, "获取连云山设备token失败: " + e.getMessage(), e);
            sendToScript("lianyunshanTokenError", "获取token失败: " + e.getMessage());
        }
    }
    
    /**
     * 处理连云山场景上报请求
     */
    private void handleReportLianyunshanScene(String sceneName) {
        try {
            if (sceneName == null || sceneName.trim().isEmpty()) {
                sceneName = "default_scene";
            }
            
            App.reportScene(sceneName);
            sendToScript("lianyunshanReportResult", "场景上报成功: " + sceneName);
            Log.e(TAG, "连云山场景上报成功: " + sceneName);
        } catch (Exception e) {
            Log.e(TAG, "连云山场景上报失败: " + e.getMessage(), e);
            sendToScript("lianyunshanReportError", "场景上报失败: " + e.getMessage());
        }
    }
}