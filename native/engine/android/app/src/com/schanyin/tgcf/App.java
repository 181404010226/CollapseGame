package com.schanyin.tgcf;

import android.app.Application;
import android.app.Activity;
import android.content.Context;
import android.util.Log;

// 连云山安全SDK导入
import com.volcengine.mobsecBiz.metasec.listener.ITokenObserver;
import com.volcengine.mobsecBiz.metasec.ml.MSConfig;
import com.volcengine.mobsecBiz.metasec.ml.MSManagerUtils;

// 巨量引擎转化SDK导入
import com.bytedance.ads.convert.BDConvert;
import com.bytedance.ads.convert.config.BDConvertConfig;

// 友盟SDK导入
import com.umeng.commonsdk.UMConfigure;
import com.umeng.analytics.MobclickAgent;

public class App extends Application {
    private static final String TAG = "App";
    private static App instance;
    
    // 友盟SDK配置
    private static final String UMENG_APPKEY = "6840ffc079267e02107a4583";
    private static final String UMENG_CHANNEL = "juliang";
    
    // 连云山SDK配置
    static String appID = "776278";
    static String licenseStr = "hEZDnvsUMmI80ySwYyi/ItamN4NExeCzkKXphUVH9QHs+RtES/UXRAv5DhEoy0ElRw5o+pwvr6MpfsoUi8WrCPRMDQuZl9folC3q0vvdXomntZRzei8Kic0dByaFj0wuaZQFmBRYk3j8S+MhuHT4CLOkkL86WwjGZk5bbFqSzz3R6Ii0CF0Ubs94MhNIWHkAN2kxRxI0frNoWgBbOXH0I7GjZf3SaFChE/fqBWfZiHblIvI5qzY+cg5j1B3lVkNDIN7z4CCIzDXR9KtpgTBXdNDLrFGFGpSeIyNvtBG9FA6/q4SS";
    static String channel = "juliang"; // 渠道信息，可根据实际情况修改
    
    // 设备token存储
    private static String deviceToken = "";
    
    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.e(TAG, "=== App onCreate 开始 ===");
        
        // 友盟SDK预初始化（合规要求）
        // 预初始化函数不会采集设备信息，也不会向友盟后台上报数据
        UMConfigure.preInit(this, UMENG_APPKEY, UMENG_CHANNEL);
        Log.e(TAG, "友盟SDK预初始化完成");
        
        // 初始化连云山安全SDK
        // 注意：此版本安全SDK初始化不会在APP本地采集任何数据
        initMetaSec(this);
        
        // 初始化 token，调用此接口会开始采集并上报设备数据以及获取设备token
        // 必须在初始化之后立即调用，避免缺失APP启动时的风险识别能力
        MSManagerUtils.initToken(appID);
        
        // 初始化友盟SDK（正式初始化）
        // 注意：在实际应用中，应该在用户同意隐私政策后再调用此方法
        initUmengSDK(this);
        
        // 巨量引擎转化SDK将在Activity启动时初始化
        
        Log.e(TAG, "=== App onCreate 完成 ===");
    }
    
    /**
     * 友盟SDK正式初始化
     * 注意：此方法会真正采集设备信息并上报数据
     * 根据合规要求，应该在用户同意隐私政策后调用
     */
    private void initUmengSDK(Context context) {
        Log.e(TAG, "开始友盟SDK正式初始化...");
        
        try {
            Log.e(TAG, "友盟SDK配置 - AppKey: " + UMENG_APPKEY + ", Channel: " + UMENG_CHANNEL);
            
            // 友盟SDK正式初始化
            // 参数1: Context
            // 参数2: Appkey（使用类中定义的常量）
            // 参数3: 渠道名称（使用类中定义的常量）
            // 参数4: 设备类型（UMConfigure.DEVICE_TYPE_PHONE为手机、UMConfigure.DEVICE_TYPE_BOX为盒子）
            // 参数5: Push推送业务的secret（没有可以传null）
            UMConfigure.init(context, UMENG_APPKEY, UMENG_CHANNEL, UMConfigure.DEVICE_TYPE_PHONE, null);
            
            // 设置组件化的Log开关
            // 参数: boolean 默认为false，如需查看LOG设置为true
            UMConfigure.setLogEnabled(true);
            
            // 选择AUTO页面采集模式
            MobclickAgent.setPageCollectionMode(MobclickAgent.PageMode.AUTO);
            
            Log.e(TAG, "友盟SDK正式初始化成功");
            
        } catch (Exception e) {
            Log.e(TAG, "友盟SDK正式初始化失败: " + e.getMessage(), e);
        }
    }
    

    
    /**
     * 初始化巨量引擎转化SDK（需要在Activity中调用）
     */
    public static void initOceanEngineSDK(Activity activity) {
        Log.e(TAG, "开始初始化巨量引擎转化SDK...");
        
        try {
            // 创建SDK配置
            BDConvertConfig config = new BDConvertConfig();
            config.setEnableLog(true);  // 开启日志
            // 初始化SDK（会自动发送启动事件）
            BDConvert.INSTANCE.init(activity, config, activity);
            
            Log.e(TAG, "巨量引擎转化SDK初始化成功");
            
        } catch (Exception e) {
            Log.e(TAG, "巨量引擎转化SDK初始化失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 初始化连云山安全SDK
     */
    void initMetaSec(Context context) {
        Log.e(TAG, "开始初始化连云山安全SDK...");
        
        try {
            MSConfig.Builder builder = new MSConfig.Builder(appID, licenseStr, MSConfig.COLLECT_MODE_DEFAULT);
            // 正常采集模式：MSConfig.COLLECT_MODE_DEFAULT
            // 基础采集模式：MSConfig.COLLECT_MODE_ML_MINIMIZE
            
            MSConfig config = builder
                .setChannel(channel)
                .addDataObserver(new ITokenObserver() {
                    @Override
                    public void onTokenLoaded(String token) {
                        // 此为回调方法，在SDK获取到设备token之后主动回调
                        Log.e(TAG, "连云山SDK获取到设备token: " + (token != null ? token.substring(0, Math.min(20, token.length())) + "..." : "null"));
                        deviceToken = token != null ? token : "";
                        
                        // 通知Cocos Creator端token已获取
                        notifyTokenLoaded(token);
                    }
                })
                .build();
                
            MSManagerUtils.init(context, config);
            
            Log.e(TAG, "连云山安全SDK初始化成功");
            
        } catch (Exception e) {
            Log.e(TAG, "连云山安全SDK初始化失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取设备token
     */
    public static String getDeviceToken() {
        try {
            // 主动获取token方式
            com.volcengine.mobsecBiz.metasec.ml.MSManager mgr = MSManagerUtils.get(appID);
            if (mgr != null) {
                String token = mgr.getToken();
                if (token != null && !token.isEmpty()) {
                    deviceToken = token;
                    return token;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "获取设备token失败: " + e.getMessage(), e);
        }
        
        return deviceToken;
    }
    
    /**
     * 主动上报风控数据
     */
    public static void reportScene(String sceneName) {
        try {
            com.volcengine.mobsecBiz.metasec.ml.MSManager mgr = MSManagerUtils.get(appID);
            if (mgr != null) {
                mgr.report(sceneName);
                Log.e(TAG, "连云山SDK上报场景: " + sceneName);
            }
        } catch (Exception e) {
            Log.e(TAG, "连云山SDK上报失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取Android ID
     */
    public static String getAndroidId(Context context) {
        try {
            return android.provider.Settings.Secure.getString(
                context.getContentResolver(),
                android.provider.Settings.Secure.ANDROID_ID
            );
        } catch (Exception e) {
            Log.e(TAG, "获取Android ID失败: " + e.getMessage(), e);
            return "";
        }
    }
    
    /**
     * 手动发送启动事件（用于测试）
     */
    public static void sendLaunchEvent(Context context) {
        try {
            BDConvert.INSTANCE.sendLaunchEvent(context);
            Log.e(TAG, "手动发送启动事件成功");
        } catch (Exception e) {
            Log.e(TAG, "手动发送启动事件失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 通知Cocos Creator端token已加载
     */
    private void notifyTokenLoaded(String token) {
        try {
            // 延迟通知，确保Cocos引擎已完全启动
            new android.os.Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        // 使用JsbBridge通知Cocos Creator
                        Class<?> jsbBridgeClass = Class.forName("com.cocos.lib.JsbBridge");
                        java.lang.reflect.Method sendToScriptMethod = jsbBridgeClass.getMethod("sendToScript", String.class, String.class);
                        sendToScriptMethod.invoke(null, "lianyunshan_token_loaded", token != null ? token : "");
                        
                        Log.e(TAG, "已通知Cocos Creator端token加载完成");
                    } catch (Exception e) {
                        Log.e(TAG, "通知Cocos Creator端失败: " + e.getMessage(), e);
                    }
                }
            }, 2000); // 延迟2秒
            
        } catch (Exception e) {
            Log.e(TAG, "设置token通知失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 获取Application的Context
     * @return Application Context
     */
    public static Context getContext() {
        return instance;
    }
}