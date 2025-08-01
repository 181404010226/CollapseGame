package com.schanyin.tgcf;

import android.content.Context;
import com.umeng.analytics.MobclickAgent;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 友盟统计助手类
 * 用于处理Cocos Creator与友盟SDK之间的桥接
 */
public class UmengHelper {
    
    private static Context getContext() {
        // 使用Application的Context，更安全可靠
        return App.getContext();
    }
    
    /**
     * 简单事件统计
     * @param eventId 事件ID
     */
    public static void onEvent(String eventId) {
        try {
            Context context = getContext();
            if (context != null) {
                // 使用onEventObject接口，传入空的Map
                MobclickAgent.onEventObject(context, eventId, null);
                android.util.Log.d("UmengHelper", "友盟事件统计: " + eventId);
            } else {
                android.util.Log.e("UmengHelper", "Context为空，无法进行友盟事件统计");
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟事件统计失败: " + e.getMessage());
        }
    }
    
    /**
     * 带属性的事件统计
     * @param eventId 事件ID
     * @param attributesJson 属性JSON字符串
     */
    public static void onEventWithAttributes(String eventId, String attributesJson) {
        try {
            Context context = getContext();
            if (context != null) {
                Map<String, Object> attributes = parseJsonToObjectMap(attributesJson);
                // 使用官方推荐的onEventObject接口
                MobclickAgent.onEventObject(context, eventId, attributes);
                android.util.Log.d("UmengHelper", "友盟事件统计(带属性): " + eventId + ", 属性: " + attributesJson);
            } else {
                android.util.Log.e("UmengHelper", "Context为空，无法进行友盟事件统计");
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟事件统计(带属性)失败: " + e.getMessage());
        }
    }
    
    /**
     * 将JSON字符串转换为Map<String, Object>
     * @param jsonString JSON字符串
     * @return Map对象
     */
    private static Map<String, Object> parseJsonToObjectMap(String jsonString) {
        Map<String, Object> map = new HashMap<>();
        try {
            JSONObject jsonObject = new JSONObject(jsonString);
            Iterator<String> keys = jsonObject.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Object value = jsonObject.get(key);
                // 根据友盟文档，支持String、Long、Integer、Float、Double、Short类型
                if (value instanceof String || value instanceof Number || value instanceof Boolean) {
                    map.put(key, value);
                } else {
                    // 其他类型转为字符串
                    map.put(key, value.toString());
                }
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "JSON解析失败: " + e.getMessage());
        }
        return map;
    }
    
    /**
     * 将JSON字符串转换为Map<String, String>（保留兼容性）
     * @param jsonString JSON字符串
     * @return Map对象
     */
    private static Map<String, String> parseJsonToMap(String jsonString) {
        Map<String, String> map = new HashMap<>();
        try {
            JSONObject jsonObject = new JSONObject(jsonString);
            Iterator<String> keys = jsonObject.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                String value = jsonObject.getString(key);
                map.put(key, value);
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "JSON解析失败: " + e.getMessage());
        }
        return map;
    }
    
    /**
     * 页面开始统计
     * @param pageName 页面名称
     */
    public static void onPageStart(String pageName) {
        try {
            Context context = getContext();
            if (context != null) {
                MobclickAgent.onPageStart(pageName);
                android.util.Log.d("UmengHelper", "友盟页面开始统计: " + pageName);
            } else {
                android.util.Log.e("UmengHelper", "Context为空，无法进行友盟页面统计");
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟页面开始统计失败: " + e.getMessage());
        }
    }
    
    /**
     * 页面结束统计
     * @param pageName 页面名称
     */
    public static void onPageEnd(String pageName) {
        try {
            Context context = getContext();
            if (context != null) {
                MobclickAgent.onPageEnd(pageName);
                android.util.Log.d("UmengHelper", "友盟页面结束统计: " + pageName);
            } else {
                android.util.Log.e("UmengHelper", "Context为空，无法进行友盟页面统计");
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟页面结束统计失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户登录统计
     * @param userId 用户ID
     */
    public static void onProfileSignIn(String userId) {
        try {
            if (userId != null && !userId.isEmpty()) {
                MobclickAgent.onProfileSignIn(userId);
                android.util.Log.d("UmengHelper", "友盟用户登录统计: " + userId);
            } else {
                android.util.Log.e("UmengHelper", "用户ID为空，无法进行友盟用户登录统计");
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟用户登录统计失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户登录统计（带提供商）
     * @param provider 账号来源
     * @param userId 用户ID
     */
    public static void onProfileSignInWithProvider(String provider, String userId) {
        try {
            if (provider != null && !provider.isEmpty() && userId != null && !userId.isEmpty()) {
                MobclickAgent.onProfileSignIn(provider, userId);
                android.util.Log.d("UmengHelper", "友盟用户登录统计(带提供商): " + provider + ", " + userId);
            } else {
                android.util.Log.e("UmengHelper", "提供商或用户ID为空，无法进行友盟用户登录统计");
            }
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟用户登录统计(带提供商)失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户登出统计
     */
    public static void onProfileSignOff() {
        try {
            MobclickAgent.onProfileSignOff();
            android.util.Log.d("UmengHelper", "友盟用户登出统计");
        } catch (Exception e) {
            android.util.Log.e("UmengHelper", "友盟用户登出统计失败: " + e.getMessage());
        }
    }
}