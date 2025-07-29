import { _decorator, Component, log, warn } from 'cc';
import { ApiConfig } from '../../API/ApiConfig';

const { ccclass, property } = _decorator;

/**
 * 签到日历数据结构
 */

export interface SignInCalendarData {
    date: string;      // 日期 "5.12"
    type: number;      // 0=未签到, 1=已签到, 2=可补签
}

/**
 * 签到日历响应数据
 */
export interface SignInCalendarResponse {
    calendarList: SignInCalendarData[];
    calendar: any[];
    signInCount: number;        // 可补签次数
    signInCountToday: number;   // 已签到次数
    canReSignDate: string;      // 可补签的日期
}

/**
 * 活跃任务数据结构
 */
export interface ActiveTaskData {
    time: number;    // 累计时长要求（分钟）
    gold: number;    // 金币奖励
    isGet: boolean;  // 是否已观看广告
}

/**
 * 活跃任务响应数据结构
 */
export interface ActiveTaskResponse {
    activeTask: any;              // 当前活跃任务（可能为null）
    taskMap: ActiveTaskData[];    // 任务列表数组
}

/**
 * 签到服务类
 */
@ccclass('SignInService')
export class SignInService extends Component {
    
    /**
     * 查询签到日历- 标准API调用模板
     */
    public async querySignInCalendar(uiNodeCount?: number): Promise<SignInCalendarResponse> {
        try {
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) {
                throw new Error('用户未登录');
            }

            const url = ApiConfig.getFullUrl('/account/querySignInCalendar');
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            log('签到日历查询成功:', result);
            
            const data = result.data || result;
            
            // 转换数据格式
            const calendarList: SignInCalendarData[] = [];
            
            if (data.calendar && Array.isArray(data.calendar)) {
                data.calendar.forEach(dateStr => {
                    // 将 "2025-07-01" 转换为 "7.1"
                    const date = this.convertDateFormat(dateStr);
                    calendarList.push({
                        date: date,
                        type: 1  // 假设返回的都是已签到的日期
                    });
                });
            }
            
            // 生成完整的日历数据（根据UI节点数量）
            const fullCalendarList = this.generateFullCalendar(calendarList, uiNodeCount);
            
            return {
                calendarList: fullCalendarList,
                calendar: data.calendar || [],
                signInCount: data.signInCount || 0,
                signInCountToday: data.signInCountToday || 0,
                canReSignDate: data.canReSignDate || ''
            };
        } catch (error) {
            warn('查询签到日历失败:', error);
            throw error;
        }
    }

    /**
     * 执行签到
     */
    public async performSignIn(date: string): Promise<boolean> {
        try {
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) {
                throw new Error('用户未登录');
            }

            const url = ApiConfig.getFullUrl('/account/signIn');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: date,
                    type: 1  // 1=正常签到
                })
            });

            const result = await response.json();
            log('签到结果:', result);
            
            return result.success || result.code === 200;
        } catch (error) {
            warn('签到失败:', error);
            return false;
        }
    }

    /**
     * 执行补签
     */
    public async performMakeupSignIn(date: string): Promise<boolean> {
        try {
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) {
                throw new Error('用户未登录');
            }

            const url = ApiConfig.getFullUrl('/account/signIn');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: date,
                    type: 2  // 2=补签
                })
            });

            const result = await response.json();
            log('补签结果:', result);
            
            return result.success || result.code === 200;
        } catch (error) {
            warn('补签失败:', error);
            return false;
        }
    }

    /**
     * 转换日期格式：从 "2025-07-01" 转换为 "7.1"
     */
    private convertDateFormat(dateStr: string): string {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return `${month}.${day}`;
        }
        return dateStr;
    }

    /**
     * 生成完整的日历数据
     */
    private generateFullCalendar(signedDates: SignInCalendarData[], uiNodeCount?: number): SignInCalendarData[] {
        const fullCalendar: SignInCalendarData[] = [];
        const signedDateMap = new Map<string, boolean>();
        
        // 创建已签到日期的映射
        signedDates.forEach(item => {
            signedDateMap.set(item.date, true);
        });
        
        // 确定要生成的日期数量
        const nodeCount = uiNodeCount || 6; // 默认6个节点
        
        // 从API返回的日期中确定月份
        let targetMonth = 7; // 默认7月
        if (signedDates.length > 0) {
            const firstDate = signedDates[0].date.split('.');
            targetMonth = parseInt(firstDate[0]);
        }
        
        // 根据节点数量生成对应数量的日期
        let startDay = 12; // 默认从12号开始
        
        // 如果是补签模式（节点数量较多），从1号开始生成整月数据
        if (nodeCount > 10) {
            startDay = 1;
        }
        
        for (let i = 0; i < nodeCount; i++) {
            const day = startDay + i;
            const dateStr = `${targetMonth}.${day}`;
            const isSigned = signedDateMap.has(dateStr);
            
            fullCalendar.push({
                date: dateStr,
                type: isSigned ? 1 : 0  // 1=已签到, 0=未签到
            });
        }
        
        return fullCalendar;
    }

    /**
     * 查询今日活跃任务
     */
    public async queryActiveTasks(): Promise<ActiveTaskResponse> {
        try {
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) {
                throw new Error('用户未登录');
            }

            // 使用正确的API端点
            const url = ApiConfig.getFullUrl('/game/getActiveTask');
            
            console.log('查询活跃任务请求URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('活跃任务查询响应:', result);
            
            if (result.code !== 200) {
                throw new Error(`API错误: ${result.msg || '未知错误'}`);
            }
            
            const data = result.data;
            
            return {
                activeTask: data.activeTask || null,
                taskMap: data.taskMap || []
            };
        } catch (error) {
            console.error('查询活跃任务失败:', error);
            throw error;
        }
    }

    /**
     * 完成任务
     */
    public async completeTask(taskIndex: number): Promise<boolean> {
        try {
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) {
                throw new Error('用户未登录');
            }

            const url = ApiConfig.getFullUrl('/task/completeTask');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    taskIndex: taskIndex
                })
            });

            const result = await response.json();
            log('任务完成结果:', result);
            
            return result.success || result.code === 200;
        } catch (error) {
            warn('完成任务失败:', error);
            return false;
        }
    }

    /**
     * 领取任务奖励
     */
    public async claimTaskReward(taskIndex: number, taskData: ActiveTaskData): Promise<boolean> {
        try {
            const token = ApiConfig.getUserData()?.access_token;
            if (!token) {
                throw new Error('用户未登录');
            }

            const url = ApiConfig.getFullUrl('/game/claimTaskReward');
            
            const requestData = {
                taskIndex: taskIndex,
                taskTime: taskData.time,
                taskGold: taskData.gold,
                timestamp: Date.now()
            };
            
            console.log('领取任务奖励请求:', requestData);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('领取任务奖励响应:', result);
            
            if (result.code !== 200) {
                throw new Error(`API错误: ${result.msg || '未知错误'}`);
            }
            
            return true;
        } catch (error) {
            console.error('领取任务奖励失败:', error);
            return false;
        }
    }
}
