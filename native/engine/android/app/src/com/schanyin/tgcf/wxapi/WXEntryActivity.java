package com.schanyin.tgcf.wxapi;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.tencent.mm.opensdk.constants.ConstantsAPI;
import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

import org.json.JSONObject;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler {

    private static final String TAG = "WXEntryActivity";
    private static final String APP_ID = "wx7870c770371205e4"; // 您的微信AppID
    
    private IWXAPI api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "=== WXEntryActivity onCreate 开始 ===");
        
        api = WXAPIFactory.createWXAPI(this, APP_ID, false);
        try {
            api.handleIntent(getIntent(), this);
            Log.d(TAG, "微信Intent处理成功");
        } catch (Exception e) {
            Log.e(TAG, "处理微信回调失败", e);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.d(TAG, "=== WXEntryActivity onNewIntent ===");
        setIntent(intent);
        api.handleIntent(intent, this);
    }

    @Override
    public void onReq(BaseReq req) {
        Log.d(TAG, "=== 收到微信请求: " + req.getType() + " ===");
        switch (req.getType()) {
            case ConstantsAPI.COMMAND_GETMESSAGE_FROM_WX:
                Log.d(TAG, "处理COMMAND_GETMESSAGE_FROM_WX");
                break;
            case ConstantsAPI.COMMAND_SHOWMESSAGE_FROM_WX:
                Log.d(TAG, "处理COMMAND_SHOWMESSAGE_FROM_WX");
                break;
            default:
                Log.d(TAG, "未知微信请求类型: " + req.getType());
                break;
        }
    }

    @Override
    public void onResp(BaseResp resp) {
        Log.d(TAG, "=== 收到微信响应 ===");
        Log.d(TAG, "响应错误码: " + resp.errCode);
        Log.d(TAG, "响应类型: " + resp.getType());
        Log.d(TAG, "响应字符串: " + resp.errStr);
        
        switch (resp.errCode) {
            case BaseResp.ErrCode.ERR_OK:
                Log.d(TAG, ">>> 微信操作成功 <<<");
                // 用户同意授权
                if (resp instanceof SendAuth.Resp) {
                    SendAuth.Resp authResp = (SendAuth.Resp) resp;
                    String code = authResp.code;
                    String state = authResp.state;
                    Log.d(TAG, ">>> 微信授权成功详情 <<<");
                    Log.d(TAG, "授权码 code: " + code);
                    Log.d(TAG, "状态 state: " + state);
                    Log.d(TAG, ">>> 准备发送code给游戏端获取access_token <<<");
                    
                    // 发送code给游戏端处理
                    notifyGameWeChatLoginSuccess(code);
                    Toast.makeText(this, "授权成功，正在获取用户信息...", Toast.LENGTH_SHORT).show();
                } else {
                    Log.d(TAG, "微信操作成功但不是授权响应");
                    notifyGameWeChatLoginSuccess("");
                }
                break;
            case BaseResp.ErrCode.ERR_USER_CANCEL:
                Log.d(TAG, ">>> 用户取消微信授权 <<<");
                Toast.makeText(this, "用户取消授权", Toast.LENGTH_SHORT).show();
                notifyGameWeChatLoginCancel();
                break;
            case BaseResp.ErrCode.ERR_AUTH_DENIED:
                Log.d(TAG, ">>> 用户拒绝微信授权 <<<");
                Toast.makeText(this, "授权被拒绝", Toast.LENGTH_SHORT).show();
                notifyGameWeChatLoginError("授权被拒绝");
                break;
            default:
                Log.d(TAG, ">>> 微信授权失败: " + resp.errCode + " <<<");
                Log.d(TAG, "错误详情: " + resp.errStr);
                Toast.makeText(this, "授权失败", Toast.LENGTH_SHORT).show();
                notifyGameWeChatLoginError("授权失败，错误码：" + resp.errCode + ", 详情: " + resp.errStr);
                break;
        }
        
        Log.d(TAG, "=== WXEntryActivity 处理完成，准备关闭 ===");
        finish();
    }

    /**
     * 通知游戏微信授权成功，返回code
     */
    private void notifyGameWeChatLoginSuccess(String code) {
        try {
            Log.d(TAG, "=== 开始通知游戏端授权成功 ===");
            
            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("code", code);
            result.put("message", "微信授权成功");
            result.put("timestamp", System.currentTimeMillis());
            
            String resultStr = result.toString();
            Log.d(TAG, "准备发送的消息内容: " + resultStr);
            
            // 使用JsbBridge发送到Cocos Creator
            sendToScript("wechatLoginResult", resultStr);
            Log.d(TAG, "=== 微信授权成功消息已发送 ===");
            
        } catch (Exception e) {
            Log.e(TAG, "通知游戏授权成功失败", e);
        }
    }

    /**
     * 通知游戏微信登录取消
     */
    private void notifyGameWeChatLoginCancel() {
        try {
            Log.d(TAG, "=== 开始通知游戏端登录取消 ===");
            
            JSONObject result = new JSONObject();
            result.put("success", false);
            result.put("error", "用户取消登录");
            result.put("code", "USER_CANCEL");
            result.put("timestamp", System.currentTimeMillis());
            
            String resultStr = result.toString();
            Log.d(TAG, "取消登录消息: " + resultStr);
            
            sendToScript("wechatLoginResult", resultStr);
            Log.d(TAG, "=== 微信登录取消消息已发送 ===");
            
        } catch (Exception e) {
            Log.e(TAG, "通知游戏登录取消失败", e);
        }
    }

    /**
     * 通知游戏微信登录失败
     */
    private void notifyGameWeChatLoginError(String errorMsg) {
        try {
            Log.d(TAG, "=== 开始通知游戏端登录失败 ===");
            
            JSONObject result = new JSONObject();
            result.put("success", false);
            result.put("error", errorMsg);
            result.put("code", "AUTH_ERROR");
            result.put("timestamp", System.currentTimeMillis());
            
            String resultStr = result.toString();
            Log.d(TAG, "登录失败消息: " + resultStr);
            
            sendToScript("wechatLoginResult", resultStr);
            Log.d(TAG, "=== 微信登录失败消息已发送 ===");
            
        } catch (Exception e) {
            Log.e(TAG, "通知游戏登录失败失败", e);
        }
    }

    /**
     * 发送消息到Cocos Creator
     * 修复：确保消息能正确发送到JS端
     */
    private void sendToScript(String command, String data) {
        try {
            Log.d(TAG, "=== 开始发送消息到JS ===");
            Log.d(TAG, "命令: " + command);
            Log.d(TAG, "数据: " + data);
            
            Class<?> jsbBridgeClass = Class.forName("com.cocos.lib.JsbBridge");
            java.lang.reflect.Method sendToScriptMethod = jsbBridgeClass.getMethod("sendToScript", String.class, String.class);
            sendToScriptMethod.invoke(null, command, data);
            
            Log.d(TAG, "=== 消息发送成功到JsbBridge ===");
            
        } catch (Exception e) {
            Log.e(TAG, "发送消息到JS失败: " + e.getMessage(), e);
            Log.e(TAG, "错误详情: " + e.toString());
        }
    }
} 