package com.schanyin.tgcf;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.widget.FrameLayout;
import android.view.Display;
import android.view.Window;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Point;
import android.os.Build;

import com.bytedance.sdk.openadsdk.*;
import com.bytedance.sdk.openadsdk.mediation.manager.MediationBaseManager;
import com.bytedance.sdk.openadsdk.mediation.manager.MediationAdEcpmInfo;
import com.bytedance.sdk.openadsdk.mediation.init.MediationPrivacyConfig;
import com.bytedance.sdk.openadsdk.mediation.ad.MediationAdSlot;

import org.json.JSONObject;
import org.json.JSONException;

import java.lang.reflect.Method;
import android.os.Bundle;

/**
 * 穿山甲开屏广告管理器
 * 负责穿山甲SDK的初始化、开屏广告加载和展示
 * 适配Cocos Creator 3.8.6版本
 */
public class PangleAdManager {
    private static final String TAG = "PangleAdManager";
    private static final String APP_ID = "5708690"; // 您的穿山甲APP ID
    private static final String APP_NAME = "天官赐福"; // 您的应用名称
    private static final String SPLASH_AD_SLOT_ID = "103513340"; // 开屏广告位ID
    private static final String REWARD_AD_SLOT_ID = "103511946"; // 激励视频广告位ID
    
    private static PangleAdManager instance;
    private Activity activity;
    private boolean isInitialized = false;
    private CSJSplashAd currentSplashAd;
    private FrameLayout splashContainer;
    private TTRewardVideoAd currentRewardAd; // 当前激励视频广告
    
    private PangleAdManager() {}
    
    public static synchronized PangleAdManager getInstance() {
        if (instance == null) {
            instance = new PangleAdManager();
        }
        return instance;
    }
    
    /**
     * 设置Activity和广告容器
     */
    public void setActivity(Activity activity) {
        this.activity = activity;
        // 创建广告容器
        if (activity != null) {
            this.splashContainer = new FrameLayout(activity);
            // 设置全屏布局参数
            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 
                FrameLayout.LayoutParams.MATCH_PARENT
            );
            this.splashContainer.setLayoutParams(layoutParams);
        }
    }
    
    /**
     * 初始化聚合SDK
     */
    public void initSDK(Context context) {
        Log.d(TAG, "开始初始化穿山甲SDK...");
        
        if (isInitialized) {
            Log.d(TAG, "穿山甲SDK已经初始化");
            sendInitResult(true, "SDK已经初始化");
            return;
        }
        
        Log.d(TAG, "使用APP ID: " + APP_ID + ", APP Name: " + APP_NAME);
        
        initMediationAdSdk(context);
    }
    
    /**
     * 初始化聚合SDK
     */
    private void initMediationAdSdk(Context context) {
        TTAdSdk.init(context, buildConfig(context));
        TTAdSdk.start(new TTAdSdk.Callback() {
            @Override
            public void success() {
                Log.d(TAG, "穿山甲SDK初始化成功");
                isInitialized = true;
                sendInitResult(true, "初始化成功");
            }

            @Override
            public void fail(int code, String message) {
                Log.e(TAG, "穿山甲SDK初始化失败: code=" + code + ", message=" + message);
                isInitialized = false;
                sendInitResult(false, "初始化失败: [" + code + "] " + message);
            }
        });
    }
    
    /**
     * 构造TTAdConfig
     */
    private TTAdConfig buildConfig(Context context) {
        return new TTAdConfig.Builder()
                .appId(APP_ID) //APP ID
                .appName(APP_NAME) //APP Name
                .useMediation(true)  //开启聚合功能
                .debug(false)  //关闭debug开关
                .themeStatus(0)  //正常模式  0是正常模式；1是夜间模式；
                .supportMultiProcess(false)  //不支持多进程
                .customController(getTTCustomController())  //设置隐私权
                .build();
    }
    
    /**
     * 设置隐私合规
     */
    private TTCustomController getTTCustomController() {
        return new TTCustomController() {
            @Override
            public boolean isCanUseLocation() {  //是否授权位置权限
                return true;
            }

            @Override
            public boolean isCanUsePhoneState() {  //是否授权手机信息权限
                return true;
            }

            @Override
            public boolean isCanUseWifiState() {  //是否授权wifi state权限
                return true;
            }

            @Override
            public boolean isCanUseWriteExternal() {  //是否授权写外部存储权限
                return true;
            }

            @Override
            public boolean isCanUseAndroidId() {  //是否授权Android Id权限
                return true;
            }

            @Override
            public MediationPrivacyConfig getMediationPrivacyConfig() {
                return new MediationPrivacyConfig() {
                    @Override
                    public boolean isLimitPersonalAds() {  //是否限制个性化广告
                        return false;
                    }

                    @Override
                    public boolean isProgrammaticRecommend() {  //是否开启程序化广告推荐
                        return true;
                    }
                };
            }
        };
    }
    
    /**
     * 构造开屏广告的Adslot
     */
    private AdSlot buildSplashAdslot() {
        // 获取真实屏幕尺寸（包括系统栏）
        int[] realScreenSize = getRealScreenSize();
        int screenWidth = realScreenSize[0];
        int screenHeight = realScreenSize[1];
        
        Log.d(TAG, "构建AdSlot - 使用真实屏幕尺寸: " + screenWidth + "x" + screenHeight);
        
        return new AdSlot.Builder()
                .setCodeId(SPLASH_AD_SLOT_ID) //广告位ID
                .setExpressViewAcceptedSize(screenWidth, screenHeight) // 设置真实全屏尺寸
                .build();
    }
    
    /**
     * 构造激励视频广告的Adslot
     */
    private AdSlot buildRewardAdslot() {
        return new AdSlot.Builder()
                .setCodeId(REWARD_AD_SLOT_ID)  //广告位ID
                .setOrientation(TTAdConstant.VERTICAL)  //激励视频方向
                .setMediationAdSlot(
                    new MediationAdSlot.Builder()
                        .setMuted(false)
                        .build()
                )
                .build();
    }
    
    /**
     * 获取真实屏幕尺寸（包括系统栏）
     */
    private int[] getRealScreenSize() {
        if (activity == null) {
            return new int[]{1080, 1920}; // 默认尺寸
        }
        
        try {
            android.view.Display display = activity.getWindowManager().getDefaultDisplay();
            android.graphics.Point realSize = new android.graphics.Point();
            
            // 获取真实屏幕尺寸（包括导航栏和状态栏）
            if (android.os.Build.VERSION.SDK_INT >= 17) {
                display.getRealSize(realSize);
            } else {
                // 对于较老的Android版本，使用反射获取真实尺寸
                try {
                    Class<?> displayClass = android.view.Display.class;
                    java.lang.reflect.Method getRawWidth = displayClass.getMethod("getRawWidth");
                    java.lang.reflect.Method getRawHeight = displayClass.getMethod("getRawHeight");
                    realSize.x = (Integer) getRawWidth.invoke(display);
                    realSize.y = (Integer) getRawHeight.invoke(display);
                } catch (Exception e) {
                    // 如果反射失败，使用常规方法
                    display.getSize(realSize);
                }
            }
            
            Log.d(TAG, "获取到真实屏幕尺寸: " + realSize.x + "x" + realSize.y);
            return new int[]{realSize.x, realSize.y};
            
        } catch (Exception e) {
            Log.e(TAG, "获取屏幕尺寸失败: " + e.getMessage());
            // 返回默认尺寸
            android.util.DisplayMetrics metrics = activity.getResources().getDisplayMetrics();
            return new int[]{metrics.widthPixels, metrics.heightPixels};
        }
    }
    
    /**
     * 加载开屏广告
     */
    public void loadSplashAd() {
        if (!isInitialized) {
            Log.e(TAG, "SDK未初始化，无法加载开屏广告");
            sendAdLoadResult(false, "SDK未初始化");
            return;
        }
        
        if (activity == null) {
            Log.e(TAG, "Activity为空，无法加载开屏广告");
            sendAdLoadResult(false, "Activity为空");
            return;
        }
        
        Log.d(TAG, "开始加载开屏广告...");
        loadSplashAd(activity);
    }
    
    /**
     * 加载激励视频广告
     */
    public void loadRewardAd() {
        if (!isInitialized) {
            Log.e(TAG, "SDK未初始化，无法加载激励视频广告");
            sendRewardAdLoadResult(false, "SDK未初始化");
            return;
        }
        
        if (activity == null) {
            Log.e(TAG, "Activity为空，无法加载激励视频广告");
            sendRewardAdLoadResult(false, "Activity为空");
            return;
        }
        
        Log.d(TAG, "开始加载激励视频广告...");
        loadRewardAd(activity);
    }
    
    /**
     * 静态方法：加载激励视频广告（供JS调用）
     */
    public static void loadRewardAdStatic() {
        PangleAdManager instance = getInstance();
        if (instance != null) {
            instance.loadRewardAd();
        } else {
            Log.e(TAG, "PangleAdManager实例为空，无法加载激励视频广告");
        }
    }
    
    /**
     * 加载开屏广告
     */
    private void loadSplashAd(Activity act) {
        TTAdNative adNativeLoader = TTAdSdk.getAdManager().createAdNative(act);
        adNativeLoader.loadSplashAd(buildSplashAdslot(), new TTAdNative.CSJSplashAdListener() {
            @Override
            public void onSplashLoadSuccess(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "开屏广告加载成功");
                currentSplashAd = csjSplashAd;
                sendAdLoadResult(true, "广告加载成功");
            }

            @Override
            public void onSplashLoadFail(CSJAdError csjAdError) {
                Log.e(TAG, "开屏广告加载失败: " + csjAdError.getMsg());
                sendAdLoadResult(false, "广告加载失败: " + csjAdError.getMsg());
            }

            @Override
            public void onSplashRenderSuccess(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "开屏广告渲染成功");
                currentSplashAd = csjSplashAd;
                sendAdRenderResult(true, "广告渲染成功");
            }

            @Override
            public void onSplashRenderFail(CSJSplashAd csjSplashAd, CSJAdError csjAdError) {
                Log.e(TAG, "开屏广告渲染失败: " + csjAdError.getMsg());
                sendAdRenderResult(false, "广告渲染失败: " + csjAdError.getMsg());
            }
        }, 3500);
    }
    
    /**
     * 展示激励视频广告
     */
    private void showRewardAd(Activity act, TTRewardVideoAd ttRewardVideoAd) {
        if (act == null || ttRewardVideoAd == null) {
            Log.e(TAG, "无法展示激励视频广告：Activity或广告对象为空");
            sendRewardAdShowResult(false, "Activity或广告对象为空");
            return;
        }

        ttRewardVideoAd.setRewardAdInteractionListener(new TTRewardVideoAd.RewardAdInteractionListener() {
            @Override
            public void onAdShow() {
                //广告展示
                Log.d(TAG, "激励视频广告开始展示");
                //获取展示广告相关信息，需要再show回调之后进行获取
                MediationBaseManager manager = ttRewardVideoAd.getMediationManager();
                if (manager != null && manager.getShowEcpm() != null) {
                    MediationAdEcpmInfo showEcpm = manager.getShowEcpm();
                    String ecpm = showEcpm.getEcpm(); //展示广告的价格
                    String sdkName = showEcpm.getSdkName();  //展示广告的adn名称
                    String slotId = showEcpm.getSlotId(); //展示广告的代码位ID
                    Log.d(TAG, "广告展示信息 - ECPM: " + ecpm + ", SDK: " + sdkName + ", SlotID: " + slotId);
                }
                sendRewardAdShowResult(true, "广告开始展示");
            }

            @Override
            public void onAdVideoBarClick() {
                //广告点击
                Log.d(TAG, "激励视频广告被点击");
            }

            @Override
            public void onAdClose() {
                //广告关闭
                Log.d(TAG, "激励视频广告关闭");
                sendRewardAdCloseResult();
            }

            @Override
            public void onVideoComplete() {
                //广告视频播放完成
                Log.d(TAG, "激励视频播放完成");
            }

            @Override
            public void onVideoError() {
                //广告视频错误
                Log.e(TAG, "激励视频播放错误");
            }

            @Override
            public void onRewardVerify(boolean rewardVerify, int rewardAmount, String rewardName, int errorCode, String errorMsg) {
                //奖励发放 已废弃 请使用 onRewardArrived 替代
            }

            @Override
            public void onRewardArrived(boolean isRewardValid, int rewardType, Bundle extraInfo) {
                //奖励发放
                if (isRewardValid) {
                    // 验证通过
                    Log.d(TAG, "激励视频奖励验证通过，奖励类型: " + rewardType);
                    sendRewardAdRewardResult(true, rewardType, "奖励验证通过");
                    // 从extraInfo读取奖励信息
                } else {
                    // 未验证通过
                    Log.w(TAG, "激励视频奖励验证失败");
                    sendRewardAdRewardResult(false, 0, "奖励验证失败");
                }
            }

            @Override
            public void onSkippedVideo() {
                //广告跳过
                Log.d(TAG, "激励视频被跳过");
            }
        });
        ttRewardVideoAd.showRewardVideoAd(act); //展示激励视频
    }
    
    /**
     * 加载激励视频广告
     */
    private void loadRewardAd(Activity act) {
        TTAdNative adNativeLoader = TTAdSdk.getAdManager().createAdNative(act);
        /** 这里为激励视频的简单功能，如需使用复杂功能，如gromore的服务端奖励验证，请参考demo中的AdUtils.kt类中激励部分 */
        adNativeLoader.loadRewardVideoAd(buildRewardAdslot(), new TTAdNative.RewardVideoAdListener() {
            @Override
            public void onError(int errorCode, String errorMsg) {
                //广告加载失败
                Log.e(TAG, "激励视频广告加载失败: " + errorCode + ", " + errorMsg);
                sendRewardAdLoadResult(false, "广告加载失败: [" + errorCode + "] " + errorMsg);
            }

            @Override
            public void onRewardVideoAdLoad(TTRewardVideoAd ttRewardVideoAd) {
                //广告加载成功
                Log.d(TAG, "激励视频广告加载成功");
                currentRewardAd = ttRewardVideoAd;
                sendRewardAdLoadResult(true, "广告加载成功");
            }

            @Override
            public void onRewardVideoCached() {
                //广告缓存成功 此api已经废弃，请使用onRewardVideoCached(TTRewardVideoAd ttRewardVideoAd)
            }

            @Override
            public void onRewardVideoCached(TTRewardVideoAd ttRewardVideoAd) {
                //广告缓存成功 在此回调中进行广告展示
                Log.d(TAG, "激励视频广告缓存成功，准备展示");
                currentRewardAd = ttRewardVideoAd;
                showRewardAd(act, ttRewardVideoAd);
            }
        });
    }
    
    /**
     * 展示开屏广告
     */
    public void showSplashAd() {
        if (currentSplashAd == null) {
            Log.e(TAG, "开屏广告为空，无法展示");
            sendAdShowResult(false, "广告为空");
            return;
        }
        
        if (splashContainer == null) {
            Log.e(TAG, "容器为空，无法展示开屏广告");
            sendAdShowResult(false, "容器为空");
            return;
        }
        
        showSplashAd(currentSplashAd, splashContainer);
    }
    
    /**
     * 展示开屏广告 - 支持外部传入容器
     */
    public void showSplashAd(FrameLayout container) {
        if (currentSplashAd == null) {
            Log.e(TAG, "开屏广告为空，无法展示");
            sendAdShowResult(false, "广告为空");
            return;
        }
        
        if (container == null) {
            Log.e(TAG, "容器为空，无法展示开屏广告");
            sendAdShowResult(false, "容器为空");
            return;
        }
        
        showSplashAd(currentSplashAd, container);
    }
    
    /**
     * 展示开屏广告
     */
    private void showSplashAd(CSJSplashAd splashAd, FrameLayout container) {
        if (splashAd == null || container == null) {
            Log.e(TAG, "广告或容器为空，无法展示");
            sendAdShowResult(false, "广告或容器为空");
            return;
        }
        
        Log.d(TAG, "开始展示开屏广告");
        
        // 确保容器真正全屏显示并正确添加到Activity
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        // 设置全屏标志位，隐藏系统栏
                        setFullScreenFlags();
                        
                        // 清理容器中的旧视图
                        container.removeAllViews();
                        
                        // 获取真实屏幕尺寸（包括系统栏区域）
                        int[] realScreenSize = getRealScreenSize();
                        int screenWidth = realScreenSize[0];
                        int screenHeight = realScreenSize[1];
                        
                        Log.d(TAG, "设置广告容器 - 真实屏幕尺寸: " + screenWidth + "x" + screenHeight);
                        
                        // 设置容器为真实全屏布局参数
                        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
                            screenWidth, screenHeight
                        );
                        container.setLayoutParams(layoutParams);
                        
                        // 将容器添加到Activity的根视图
                        if (container.getParent() == null) {
                            activity.setContentView(container, layoutParams);
                            Log.d(TAG, "广告容器已设置为真实全屏: " + screenWidth + "x" + screenHeight);
                        }
                        
                        // 确保容器填满整个屏幕
                        container.post(new Runnable() {
                            @Override
                            public void run() {
                                // 再次确认容器尺寸
                                android.view.ViewGroup.LayoutParams params = container.getLayoutParams();
                                if (params != null) {
                                    params.width = screenWidth;
                                    params.height = screenHeight;
                                    container.setLayoutParams(params);
                                    Log.d(TAG, "二次确认容器尺寸: " + screenWidth + "x" + screenHeight);
                                }
                            }
                        });
                        
                    } catch (Exception e) {
                        Log.e(TAG, "设置广告容器时出错: " + e.getMessage());
                        sendAdShowResult(false, "设置广告容器失败");
                        return;
                    }
                }
            });
        }
        
        splashAd.setSplashAdListener(new CSJSplashAd.SplashAdListener() {
            @Override
            public void onSplashAdShow(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "开屏广告展示");
                
                // 获取展示广告相关信息，需要在show回调之后进行获取
                String ecpmInfo = "";
                MediationBaseManager manager = splashAd.getMediationManager();
                if (manager != null && manager.getShowEcpm() != null) {
                    MediationAdEcpmInfo showEcpm = manager.getShowEcpm();
                    String ecpm = showEcpm.getEcpm(); //展示广告的价格
                    String sdkName = showEcpm.getSdkName();  //展示广告的adn名称
                    String slotId = showEcpm.getSlotId(); //展示广告的代码位ID
                    ecpmInfo = String.format("ecpm:%s, sdk:%s, slotId:%s", ecpm, sdkName, slotId);
                    Log.d(TAG, "广告展示信息: " + ecpmInfo);
                }
                
                sendAdShowResult(true, "广告展示成功", ecpmInfo);
            }

            @Override
            public void onSplashAdClick(CSJSplashAd csjSplashAd) {
                Log.d(TAG, "开屏广告点击");
                sendAdClickResult();
            }

            @Override
            public void onSplashAdClose(CSJSplashAd csjSplashAd, int closeType) {
                Log.d(TAG, "开屏广告关闭, 关闭类型: " + closeType);
                
                // 清理广告视图和恢复游戏界面
                if (activity != null && container != null) {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                // 清除所有广告视图
                                container.removeAllViews();
                                
                                // 清除容器自身
                                if (container.getParent() != null) {
                                    ((android.view.ViewGroup) container.getParent()).removeView(container);
                                }
                                
                                // 恢复正常的系统UI显示
                                restoreSystemUI();
                                
                                Log.d(TAG, "广告视图已清理，系统UI已恢复，准备恢复游戏界面");
                                
                                // 这里可以添加恢复游戏界面的逻辑
                                // 例如：重新设置游戏的主视图
                                // activity.setContentView(gameMainView);
                                
                            } catch (Exception e) {
                                Log.e(TAG, "清理广告视图时出错: " + e.getMessage());
                            }
                        }
                    });
                }
                
                sendAdCloseResult(closeType);
                currentSplashAd = null;
            }
        });
        
        // 展示开屏广告
        try {
            splashAd.showSplashView(container);
            Log.d(TAG, "开屏广告已调用showSplashView");
        } catch (Exception e) {
            Log.e(TAG, "展示开屏广告时出错: " + e.getMessage());
            sendAdShowResult(false, "展示广告异常: " + e.getMessage());
        }
    }
    
    /**
     * 设置全屏标志位，隐藏系统栏
     */
    private void setFullScreenFlags() {
        if (activity == null) return;
        
        try {
            android.view.Window window = activity.getWindow();
            android.view.View decorView = window.getDecorView();
            
            // 设置全屏标志位
            int uiOptions = android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                    | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            
            decorView.setSystemUiVisibility(uiOptions);
            
            // 设置窗口标志位
            window.setFlags(
                android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN,
                android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            
            Log.d(TAG, "已设置全屏标志位");
            
        } catch (Exception e) {
            Log.e(TAG, "设置全屏标志位失败: " + e.getMessage());
        }
    }
    
    /**
     * 恢复系统UI显示
     */
    private void restoreSystemUI() {
        if (activity == null) return;
        
        try {
            android.view.Window window = activity.getWindow();
            android.view.View decorView = window.getDecorView();
            
            // 清除全屏标志位
            decorView.setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE);
            
            // 清除窗口标志位
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
            
            Log.d(TAG, "已恢复系统UI显示");
            
        } catch (Exception e) {
            Log.e(TAG, "恢复系统UI失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取当前广告是否可以展示
     */
    public boolean isAdReady() {
        return currentSplashAd != null;
    }
    
    /**
     * 销毁当前广告
     */
    public void destroyAd() {
        if (currentSplashAd != null) {
            Log.d(TAG, "销毁当前广告");
            currentSplashAd = null;
        }
    }
    
    /**
     * 获取广告容器
     */
    public FrameLayout getSplashContainer() {
        return splashContainer;
    }
    
    // 以下方法用于向JS发送事件回调
    private void sendInitResult(boolean success, String message) {
        JSONObject data = new JSONObject();
        try {
            data.put("success", success);
            data.put("message", message);
        } catch (JSONException e) {
            Log.e(TAG, "构造初始化结果JSON失败", e);
            return;
        }
        sendToScript("pangleInitResult", data.toString());
    }
    
    private void sendAdLoadResult(boolean success, String message) {
        JSONObject data = new JSONObject();
        try {
            data.put("success", success);
            data.put("message", message);
        } catch (JSONException e) {
            Log.e(TAG, "构造加载结果JSON失败", e);
            return;
        }
        sendToScript("pangleAdLoadResult", data.toString());
    }
    
    /**
     * 发送激励视频广告加载结果到JS
     */
    private void sendRewardAdLoadResult(boolean success, String message) {
        JSONObject data = new JSONObject();
        try {
            data.put("success", success);
            data.put("message", message);
        } catch (JSONException e) {
            Log.e(TAG, "构造激励视频加载结果JSON失败", e);
            return;
        }
        sendToScript("pangleRewardAdLoadResult", data.toString());
    }
    
    /**
     * 发送激励视频广告展示结果到JS
     */
    private void sendRewardAdShowResult(boolean success, String message) {
        JSONObject data = new JSONObject();
        try {
            data.put("success", success);
            data.put("message", message);
        } catch (JSONException e) {
            Log.e(TAG, "构造激励视频展示结果JSON失败", e);
            return;
        }
        sendToScript("pangleRewardAdShowResult", data.toString());
    }
    
    /**
     * 发送激励视频广告关闭结果到JS
     */
    private void sendRewardAdCloseResult() {
        JSONObject data = new JSONObject();
        try {
            data.put("timestamp", System.currentTimeMillis());
        } catch (JSONException e) {
            Log.e(TAG, "构造激励视频关闭结果JSON失败", e);
            return;
        }
        sendToScript("pangleRewardAdClose", data.toString());
    }
    
    /**
     * 发送激励视频广告奖励结果到JS
     */
    private void sendRewardAdRewardResult(boolean isValid, int rewardType, String message) {
        JSONObject data = new JSONObject();
        try {
            data.put("isValid", isValid);
            data.put("rewardType", rewardType);
            data.put("message", message);
        } catch (JSONException e) {
            Log.e(TAG, "构造激励视频奖励结果JSON失败", e);
            return;
        }
        sendToScript("pangleRewardAdReward", data.toString());
    }
    
    private void sendAdRenderResult(boolean success, String message) {
        JSONObject data = new JSONObject();
        try {
            data.put("success", success);
            data.put("message", message);
        } catch (JSONException e) {
            Log.e(TAG, "构造渲染结果JSON失败", e);
            return;
        }
        sendToScript("pangleAdRenderResult", data.toString());
    }
    
    private void sendAdShowResult(boolean success, String message) {
        sendAdShowResult(success, message, "");
    }
    
    private void sendAdShowResult(boolean success, String message, String ecpmInfo) {
        JSONObject data = new JSONObject();
        try {
            data.put("success", success);
            data.put("message", message);
            data.put("ecpmInfo", ecpmInfo);
        } catch (JSONException e) {
            Log.e(TAG, "构造展示结果JSON失败", e);
            return;
        }
        sendToScript("pangleAdShowResult", data.toString());
    }
    
    private void sendAdClickResult() {
        JSONObject data = new JSONObject();
        try {
            data.put("timestamp", System.currentTimeMillis());
        } catch (JSONException e) {
            Log.e(TAG, "构造点击结果JSON失败", e);
            return;
        }
        sendToScript("pangleAdClick", data.toString());
    }
    
    private void sendAdCloseResult(int closeType) {
        JSONObject data = new JSONObject();
        try {
            data.put("closeType", closeType);
            data.put("timestamp", System.currentTimeMillis());
        } catch (JSONException e) {
            Log.e(TAG, "构造关闭结果JSON失败", e);
            return;
        }
        sendToScript("pangleAdClose", data.toString());
    }
    
    /**
     * 向JS发送消息 - 通过AppActivity统一处理 (Cocos Creator 3.8.6正确方式)
     */
    private void sendToScript(String command, String data) {
        if (activity != null && activity instanceof AppActivity) {
            try {
                // 通过AppActivity的sendToScript方法发送，AppActivity会正确处理JS回调
                Method sendToScriptMethod = AppActivity.class.getDeclaredMethod("sendToScript", String.class, String.class);
                sendToScriptMethod.setAccessible(true);
                sendToScriptMethod.invoke(activity, command, data);
                Log.d(TAG, "发送到JS成功 (通过AppActivity): " + command + " -> " + data);
            } catch (Exception e) {
                Log.e(TAG, "通过AppActivity发送失败: " + e.getMessage());
                // 不再使用备用方式，避免重复发送
            }
        } else {
            Log.e(TAG, "Activity为空或不是AppActivity类型，无法发送消息");
        }
    }

}