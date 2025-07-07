import { _decorator, Component, log, warn } from 'cc';
import { ApiConfig } from './ApiConfig';

const { ccclass } = _decorator;

/**
 * 查询游戏进度响应结构
 * 注意：实际后端返回内容可能包含更多字段，这里仅示例 success 与 data 字段
 */
export interface QueryGameProgressResponse<T = any> {
    success: boolean;
    error?: boolean;
    warn?: boolean;
    empty?: boolean;
    msg?: string;
    code?: number;
    data?: T;
}

// 保存游戏进度请求数据结构
export interface SaveGameProgressDto {
    androidId: string;
    deviceId: string;
    requestId: string;
    timeStamp: number;
    packageName?: string;
    times?: number;
    composeTgcfNum?: number;
    composeIllustrationCodeList?: string[];
    progress?: string;
}

// 保存游戏进度响应数据结构
export interface SaveGameProgressVo {
    isOpenAd: boolean;
    goldNum: number;
    redBagNum: number;
    nextRewardTimes: number;
    composeTgcfNum: number;
    exp: number;
    level: number;
}

// API 响应统一结构
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

/**
 * 游戏进度服务
 * 调用 /game/queryGameProgress 接口，并将成功返回的数据保存到 ApiConfig
 */
@ccclass('GameProgressService')
export class GameProgressService extends Component {

    // 接口端点
    private readonly GAME_PROGRESS_ENDPOINT: string = ApiConfig.ENDPOINTS.QUERY_GAME_PROGRESS;
    private readonly SAVE_GAME_PROGRESS_ENDPOINT: string = ApiConfig.ENDPOINTS.SAVE_GAME_PROGRESS;

    /**
     * 查询游戏进度
     * @returns Promise<any> 返回后端 data 字段（游戏进度数据）
     */
    public async queryGameProgress(): Promise<any> {
        const token = ApiConfig.getUserData()?.access_token;
        if (!token) {
            warn('未获取到 access_token，请先登录');
            throw new Error('access_token 缺失');
        }

        const url = ApiConfig.getFullUrl(this.GAME_PROGRESS_ENDPOINT);
        const timeout = ApiConfig.getTimeout();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    log('HTTP状态码:', xhr.status);
                    log('响应内容:', xhr.responseText);
                    
                    if (xhr.status === 200) {
                        try {
                            const response: QueryGameProgressResponse = JSON.parse(xhr.responseText);
                            log('解析后的响应:', response);

                            if (response.success) {
                                const progressData = response.data ?? null;
                                // 保存到 ApiConfig 供全局使用
                                ApiConfig.setGameProgress(progressData);
                                log('游戏进度已保存至 ApiConfig', progressData);
                                resolve(progressData);
                            } else {
                                const message = response.msg || '获取游戏进度失败';
                                
                                // 特殊处理：如果响应消息表示成功但success字段为false，记录警告并尝试使用数据
                                if (message.includes('成功') || message.includes('success')) {
                                    warn('后端响应矛盾：success=false但消息表示成功，尝试使用返回的数据');
                                    const progressData = response.data ?? null;
                                    ApiConfig.setGameProgress(progressData);
                                    log('已保存可能有效的游戏进度数据', progressData);
                                    resolve(progressData);
                                } else {
                                    warn('业务逻辑失败:', message);
                                    reject(new Error(message));
                                }
                            }
                        } catch (parseErr) {
                            warn('解析响应失败:', parseErr);
                            warn('原始响应内容:', xhr.responseText);
                            reject(new Error('响应解析失败: ' + parseErr));
                        }
                    } else if (xhr.status === 401) {
                        warn('认证失败 (401)，可能Token无效或已过期');
                        reject(new Error('认证失败，无法访问系统资源'));
                    } else if (xhr.status === 403) {
                        warn('权限不足 (403)，用户没有访问权限');
                        reject(new Error('权限不足，无法访问系统资源'));
                    } else {
                        warn(`HTTP错误: ${xhr.status} ${xhr.statusText}`);
                        warn('响应内容:', xhr.responseText);
                        reject(new Error(`HTTP错误: ${xhr.status} ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error('网络请求失败'));
            };

            xhr.ontimeout = () => {
                reject(new Error(`请求超时 (${timeout}ms)`));
            };

            // 发送 GET 请求
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);

            log('发送获取游戏进度请求:', url, `Authorization: Bearer ${token.substring(0, 10)}...`);
            xhr.send();
        });
    }

    /**
     * 保存游戏进度
     * @param dto SaveGameProgressDto
     * @returns Promise<SaveGameProgressVo>
     */
    public async saveGameProgress(dto: SaveGameProgressDto): Promise<SaveGameProgressVo> {
        const token = ApiConfig.getUserData()?.access_token;
        if (!token) {
            warn('未获取到 access_token，请先登录');
            throw new Error('access_token 缺失');
        }

        const url = ApiConfig.getFullUrl(this.SAVE_GAME_PROGRESS_ENDPOINT);
        const timeout = ApiConfig.getTimeout();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = timeout;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    log('HTTP状态码:', xhr.status);
                    log('响应内容:', xhr.responseText);

                    if (xhr.status === 200) {
                        try {
                            const response: ApiResponse<SaveGameProgressVo> = JSON.parse(xhr.responseText);
                            log('解析后的响应:', response);

                            if (ApiConfig.isResponseSuccess(response.code)) {
                                const data = response.data;
                                // 保存到 ApiConfig 供全局使用
                                ApiConfig.setGameProgress(data);
                                log('保存游戏进度成功', data);
                                resolve(data);
                            } else {
                                const message = response.msg || '保存游戏进度失败';
                                warn('业务逻辑失败:', message);
                                reject(new Error(message));
                            }
                        } catch (parseErr) {
                            warn('解析响应失败:', parseErr);
                            warn('原始响应内容:', xhr.responseText);
                            reject(new Error('响应解析失败: ' + parseErr));
                        }
                    } else if (xhr.status === 401) {
                        warn('认证失败 (401)，可能Token无效或已过期');
                        reject(new Error('认证失败，无法访问系统资源'));
                    } else if (xhr.status === 403) {
                        warn('权限不足 (403)，用户没有访问权限');
                        reject(new Error('权限不足，无法访问系统资源'));
                    } else {
                        warn(`HTTP错误: ${xhr.status} ${xhr.statusText}`);
                        warn('响应内容:', xhr.responseText);
                        reject(new Error(`HTTP错误: ${xhr.status} ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error('网络请求失败'));
            };

            xhr.ontimeout = () => {
                reject(new Error(`请求超时 (${timeout}ms)`));
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.setRequestHeader('Content-Type', 'application/json');

            log('发送保存游戏进度请求:', url, dto);
            xhr.send(JSON.stringify(dto));
        });
    }
} 