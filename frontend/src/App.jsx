import React, { useState, useEffect, useRef } from 'react';
import FeatureSelector from './components/FeatureSelector';
import EffectSelector from './components/EffectSelector';
import UploadUrlPanel from './components/UploadUrlPanel';
import ResultPanel from './components/ResultPanel';
import axios from 'axios';

function App() {
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [shouldStartUpload, setShouldStartUpload] = useState(false);
  
  // 新增：保存当前处理中的任务ID和预签名URL
  const currentTaskIdRef = useRef(null);
  const currentPresignedUrlRef = useRef('');
  const fileToUploadRef = useRef(null);

  const [presignedUrl, setPresignedUrl] = useState('');

  // WebSocket 相关
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket 连接管理
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('/socket/notify');
    
    ws.onopen = () => {
      console.log('WebSocket 已连接');
      setError(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到 WebSocket 消息:', data);
        
        if (data.task_id === currentTaskIdRef.current && data.status === 'SUCCESS') {
          setStatus('SUCCESS');
          
          if (data.result && data.result.oss && data.result.oss.presigned_url) {
            setResult(data.result.oss.presigned_url);
          } else {
            setResult(`/api/result/${data.task_id}`);
          }
          
          ws.close();
        }
      } catch (e) {
        console.warn('WebSocket 消息解析失败:', e);
      }
    };
    
    ws.onerror = (e) => {
      console.error('WebSocket 错误:', e);
      setError('连接错误，请检查网络');
    };
    
    ws.onclose = (e) => {
      console.log('WebSocket 连接关闭:', e.code, e.reason);
      wsRef.current = null;
      
      if (currentTaskIdRef.current && e.code !== 1000 && e.code !== 1001) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('尝试重新连接 WebSocket...');
          connectWebSocket();
        }, 3000);
      }
    };
    
    wsRef.current = ws;
  };

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'cleanup');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (taskId && status !== 'SUCCESS') {
      currentTaskIdRef.current = taskId;
      connectWebSocket();
    } else {
      cleanupWebSocket();
    }
    
    return cleanupWebSocket;
  }, [taskId, status]);

  // API 方法
  const generatePresignedUrl = async () => {
    setStatus('UPLOADING');
    setUploading(true);
    setError(null);
    try {
      console.log('请求预签名URL...');
      const response = await fetch('/api/presign_url');
      if (!response.ok) {
        throw new Error('生成上传链接失败');
      }
      
      const data = await response.json();
      console.log('预签名URL生成成功:', data);
      setPresignedUrl(data.presigned_url);
      setTaskId(data.task_id);
      currentPresignedUrlRef.current = data.presigned_url; // 保存到引用
      return data;
    } catch (err) {
      console.error('预签名URL生成失败:', err);
      setError(err.message);
      setStatus('FAILURE');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const uploadFileToUrl = async (file) => {
    // 从引用中获取预签名URL而不是状态
    const url = currentPresignedUrlRef.current;
    console.log('使用预签名URL上传文件:', url);
    
    if (!url || !file) {
      console.error('缺少预签名URL或文件');
      setError('缺少必要的上传信息');
      setStatus('FAILURE');
      return;
    }
    
    setStatus('UPLOADING');
    setUploading(true);
    setError(null);
    
    try {
      console.log('开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
      
      // 创建可取消的请求
      const source = axios.CancelToken.source();
      const cancelTimeout = setTimeout(() => {
        source.cancel('上传超时 (300秒)');
      }, 300000);
      
      // 上传进度处理
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`上传进度: ${percentCompleted}%`);
        // 可以在这里添加上传进度状态
      };
      
      const response = await axios.put(url, file, {
        headers: {
          'Content-Type': file.type || 'video/mp4'
        },
        cancelToken: source.token,
        onUploadProgress
      });

      clearTimeout(cancelTimeout);

      if (response.status !== 200) {
        throw new Error(`上传失败: ${response.statusText}`);
      }
      console.log('文件上传成功:', response.status);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.error('上传被取消:', err.message);
        setError('上传超时，请重试');
      } else {
        console.error('文件上传失败:', err);
        setError(err.message);
      }
      setStatus('FAILURE');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const notifyUploadComplete = async () => {
    // 从引用中获取任务ID和预签名URL
    const taskId = currentTaskIdRef.current;
    const url = currentPresignedUrlRef.current;
    
    if (!taskId || !url) return;
    
    setStatus('PENDING');
    setError(null);
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('presigned_url', url);
    formData.append('features', JSON.stringify(selectedFeatures));
    formData.append('effects', JSON.stringify(selectedEffects));

    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    try {
      console.log('通知后端上传完成完成...');
      const response = await fetch('/api/upload_complete', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`上传完成通知失败: ${response.status}`);
      }
      
      console.log('上传完成');
      return await response.json();
    } catch (err) {
      console.error('失败:', err);
      setError(err.message);
      setStatus('FAILURE');
      throw err;
    }
  };

  const handleUrlUpload = (file) => {
    console.log('开始处理上传请求:', file.name);
    fileToUploadRef.current = file;
    setStatus(null);
    setResult(null);
    setShouldStartUpload(true);
  };

  useEffect(() => {
    if (shouldStartUpload && fileToUploadRef.current) {
      const uploadFile = async () => {
        try {
          console.log('开始执行上传流程');
          await generatePresignedUrl();
          await uploadFileToUrl(fileToUploadRef.current);
          await notifyUploadComplete();
        } catch (error) {
          console.error('上传流程错误:', error);
        } finally {
          setShouldStartUpload(false);
        }
      };
      
      uploadFile();
    }
  }, [shouldStartUpload]);

  const refreshResult = () => {
    if (taskId && status === 'SUCCESS') {
      fetchResult();
    }
  };

  const getFeatureLabel = (key) => {
    const featureLabels = {
      dedup: '基础去重',
      mirrorflip: '镜像翻转',
      md5: '修改MD5',
      smart_capture: '智能抽帧',
      color: '智能调色',
      sharpen: '画面锐化',
      breakoffbothends: '掐头去尾',
      speedup: '随机加速',
      randommirror: '随机镜像',
      randomrotation: '随机旋转',
    };
    return featureLabels[key] || key;
  };

  const getEffectLabel = (key) => {
    const effectLabels = {
      light: '扫光',
      fadein: '泛光开幕',
      dropin: '下降开幕',
      bookmode: '书单模式',
      blendmode: '溶图模式',
      triple: '横版三屏',
      goods: '好物',
      movie: '影视',
      drama: '短剧',
      shop: '探店',
    };
    return effectLabels[key] || key;
  };

  return (
    <div style={{
      maxWidth: 1100,
      margin: '40px auto',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 8px #eee',
      padding: 32,
      minHeight: '80vh',
      width: '95vw',
      boxSizing: 'border-box',
      overflowX: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <img src="/logo.svg" alt="logo" style={{ height: 40, marginRight: 16 }} />
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>NovaVision | 快速剪辑</h1>
      </div>
      
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
            <FeatureSelector selected={selectedFeatures} onChange={setSelectedFeatures} />
          </div>
          <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
            <EffectSelector selected={selectedEffects} onChange={setSelectedEffects} />
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 320 }}>
          {(selectedFeatures.length > 0 || selectedEffects.length > 0) && (
            <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
              <div style={{ color: '#7c3aed', fontWeight: 600, marginBottom: 8, fontSize: 16 }}>
                <span style={{ marginRight: 8, fontSize: 18 }}>⎯⎯</span>已选择的处理方式与特效
              </div>
              {selectedFeatures.length > 0 && (
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>处理方式：
                  <span style={{ color: '#333', fontWeight: 400, fontSize: 15 }}>
                    {selectedFeatures.map(f => `【${getFeatureLabel(f)}】`).join('、')}
                  </span>
                </div>
              )}
              {selectedEffects.length > 0 && (
                <div style={{ fontWeight: 600, fontSize: 16 }}>特效：
                  <span style={{ color: '#333', fontWeight: 400, fontSize: 15 }}>
                    {selectedEffects.map(e => `【${getEffectLabel(e)}】`).join('、')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <UploadUrlPanel
            onUpload={handleUrlUpload}
            taskId={taskId}
            status={status}
            error={error}
            presignedUrl={presignedUrl}
          />

          <ResultPanel 
            result={result}
            status={status}
            taskId={taskId}
            resultLoading={resultLoading}
            refreshResult={refreshResult}
          />
          
          {error && (
            <div style={{ color: '#ef4444', marginTop: 12, fontWeight: 500, textAlign: 'center' }}>
              错误: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;