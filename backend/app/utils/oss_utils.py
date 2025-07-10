"""
阿里云OSS工具类
用于视频文件上传和预签名URL生成
使用 alibabacloud_oss_v2 SDK
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any

from alibabacloud_oss_v2.models import (
    PutObjectRequest, GetObjectRequest, DeleteObjectRequest,
    HeadObjectRequest, InitiateMultipartUploadRequest,
    UploadPartRequest, CompleteMultipartUploadRequest,
    AbortMultipartUploadRequest
)
import alibabacloud_oss_v2 as oss_v2

from app.settings import get_settings

logger = logging.getLogger(__name__)

class OSSUploader:
    """阿里云OSS上传工具类 - 使用alibabacloud_oss_v2"""
    
    def __init__(self):
        self.settings = get_settings()
        self._client = None
        
    def _get_client(self):
        """获取OSS Client实例"""
        if self._client is None:
            try:
                # 初始化认证配置
                cfg = oss_v2.config.load_default()
        
                # 设置认证信息
                cfg.credentials_provider = oss_v2.credentials.StaticCredentialsProvider(
                    access_key_id=self.settings.oss_access_key_id,
                    access_key_secret=self.settings.oss_access_key_secret
                )
                
                # 设置区域和端点
                cfg.region = self.settings.oss_region
                cfg.endpoint = self.settings.oss_endpoint
                
                # 初始化客户端
                self._client = oss_v2.Client(cfg)
                
                logger.info(f"OSS Client初始化成功: {self.settings.oss_bucket_name}")
                
            except Exception as e:
                logger.error(f"OSS Client初始化失败: {e}")
                raise
                
        return self._client
    
    def upload_video(self, local_file_path: str, object_key: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
        """
        上传视频文件到OSS
        
        Args:
            local_file_path: 本地文件路径
            object_key: OSS对象键名，如果为None则自动生成
            
        Returns:
            tuple: (是否成功, 消息, OSS对象键名)
        """
        try:
            if not os.path.exists(local_file_path):
                return False, f"文件不存在: {local_file_path}", None
                
            # 自动生成object_key
            if object_key is None:
                filename = os.path.basename(local_file_path)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                object_key = f"videos/{timestamp}_{filename}"
            
            client = self._get_client()
            
            # 获取文件大小决定上传方式
            file_size = os.path.getsize(local_file_path)
            
            if file_size <= 100 * 1024 * 1024:  # 100MB以下直接上传
                with open(local_file_path, 'rb') as f:
                    request = PutObjectRequest(
                        bucket=self.settings.oss_bucket_name,
                        key=object_key,
                        body=f,
                        content_type='video/mp4'
                    )
                    
                    result = client.put_object(request)
                
                if result.status_code == 200:
                    logger.info(f"文件上传成功: {object_key}")
                    return True, "上传成功", object_key
                else:
                    logger.error(f"文件上传失败: status={result.status_code}")
                    return False, f"上传失败: {result.status_code}", None
            else:
                # 大文件分片上传
                object_key = self._multipart_upload(local_file_path, object_key)
                logger.info(f"大文件分片上传成功: {object_key}")
                return True, "分片上传成功", object_key
                    
        except Exception as e:
            logger.error(f"上传视频文件时发生错误: {e}")
            return False, f"上传错误: {str(e)}", None
    
    def _multipart_upload(self, local_file_path: str, object_key: str) -> str:
        """
        分片上传大文件
        
        Args:
            local_file_path: 本地文件路径
            object_key: OSS对象键名
            
        Returns:
            str: OSS对象键名
        """
        client = self._get_client()
        
        # 初始化分片上传
        init_request = InitiateMultipartUploadRequest(
            bucket=self.settings.oss_bucket_name,
            key=object_key,
            content_type='video/mp4'
        )
        init_result = client.initiate_multipart_upload(init_request)
        upload_id = init_result.upload_id
        
        parts = []
        part_size = 10 * 1024 * 1024  # 10MB per part
        
        try:
            with open(local_file_path, 'rb') as f:
                part_number = 1
                while True:
                    data = f.read(part_size)
                    if not data:
                        break
                    
                    part_request = UploadPartRequest(
                        bucket=self.settings.oss_bucket_name,
                        key=object_key,
                        upload_id=upload_id,
                        part_number=part_number,
                        body=data
                    )
                    
                    result = client.upload_part(part_request)
                    # parts.append(CompletedPart(
                    #     part_number=part_number,
                    #     etag=result.etag
                    # ))
                    part_number += 1
                    
                    logger.debug(f"上传分片 {part_number-1}")
            
            # 完成分片上传
            complete_request = CompleteMultipartUploadRequest(
                bucket=self.settings.oss_bucket_name,
                key=object_key,
                upload_id=upload_id,
                complete_multipart_upload=oss_v2.models.CompleteMultipartUpload(
                    parts=parts
                )
            )
            client.complete_multipart_upload(complete_request)
            return object_key
            
        except Exception as e:
            # 取消分片上传
            try:
                abort_request = AbortMultipartUploadRequest(
                    bucket=self.settings.oss_bucket_name,
                    key=object_key,
                    upload_id=upload_id
                )
                client.abort_multipart_upload(abort_request)
            except:
                pass
            raise
    
    def generate_presigned_url(self, object_key: str, expires_in: int = 3600) -> Optional[str]:
        """
        生成预签名URL
        
        Args:
            object_key: OSS对象键名
            expires_in: 过期时间(秒)，默认1小时
            
        Returns:
            预签名URL，失败时返回None
        """
        try:
            client = self._get_client()
            
            # 生成预签名URL
            request = GetObjectRequest(
                bucket=self.settings.oss_bucket_name,
                key=object_key
            )
            
            # 计算过期时间
            expiration_time = datetime.now() + timedelta(seconds=expires_in)
            
            presign_url = client.presign(request, expiration=expiration_time)
            
            logger.info(f"预签名URL生成成功: {object_key}, 有效期: {expires_in}秒")
            return presign_url.url
                
        except Exception as e:
            logger.error(f"生成预签名URL时发生错误: {e}")
            return None
    
    def get_public_url(self, object_key: str) -> str:
        """
        获取公共访问URL（需要bucket为公共读取）
        
        Args:
            object_key: OSS对象键名
            
        Returns:
            str: 公共URL
        """
        endpoint = self.settings.oss_endpoint
        bucket_name = self.settings.oss_bucket_name
        
        if endpoint.startswith('http'):
            base_url = endpoint
        else:
            base_url = f"https://{endpoint}"
        
        return f"{base_url.replace('://', f'://{bucket_name}.')}/{object_key}"
    
    def upload_and_get_url(self, local_file_path: str, object_key: Optional[str] = None, 
                          expires_in: int = 3600) -> Tuple[bool, str, Optional[str]]:
        """
        上传文件并生成预签名URL
        
        Args:
            local_file_path: 本地文件路径
            object_key: OSS对象键名，如果为None则自动生成
            expires_in: 预签名URL过期时间(秒)
            
        Returns:
            tuple: (是否成功, 消息, 预签名URL)
        """
        # 先上传文件
        success, message, oss_key = self.upload_video(local_file_path, object_key)
        
        if not success:
            return False, message, None
            
        # 生成预签名URL
        presigned_url = self.generate_presigned_url(oss_key, expires_in)
        
        if presigned_url:
            return True, "上传成功并生成预签名URL", presigned_url
        else:
            return False, "上传成功但预签名URL生成失败", None
    
    def upload_and_get_urls(
        self, 
        local_file_path: str, 
        object_key: Optional[str] = None,
        expiration: int = 3600
    ) -> Dict[str, Any]:
        """
        上传文件并获取访问URL
        
        Args:
            local_file_path: 本地文件路径
            object_key: OSS对象键名
            expiration: 预签名URL有效期（秒）
            
        Returns:
            Dict: 包含上传结果和URL信息
        """
        # 上传文件
        success, message, oss_key = self.upload_video(local_file_path, object_key)
        
        if not success:
            return {
                'success': False,
                'error': f"上传失败: {message}"
            }
        
        # 生成URLs
        presigned_url = self.generate_presigned_url(oss_key, expiration)
        public_url = self.get_public_url(oss_key)
        
        if not presigned_url:
            return {
                'success': False,
                'error': "上传成功但预签名URL生成失败",
            }
        
        # 计算过期时间
        expiration_time = datetime.now() + timedelta(seconds=expiration)
        
        return {
            'success': True,
            'error': "",
            'object_key': oss_key,
            'presigned_url': presigned_url,
            'public_url': public_url,
            'expiration': expiration_time.isoformat(),
            'expiration_seconds': expiration
        }
    
    def delete_object(self, object_key: str) -> bool:
        """
        删除OSS对象
        
        Args:
            object_key: OSS对象键名
            
        Returns:
            是否删除成功
        """
        try:
            client = self._get_client()
            request = DeleteObjectRequest(
                bucket=self.settings.oss_bucket_name,
                key=object_key
            )
            client.delete_object(request)
            
            logger.info(f"OSS对象删除成功: {object_key}")
            return True
            
        except Exception as e:
            logger.error(f"删除OSS对象时发生错误: {e}")
            return False
    
    def object_exists(self, object_key: str) -> bool:
        """
        检查OSS对象是否存在
        
        Args:
            object_key: OSS对象键名
            
        Returns:
            bool: 对象是否存在
        """
        try:
            client = self._get_client()
            request = HeadObjectRequest(
                bucket=self.settings.oss_bucket_name,
                key=object_key
            )
            result = client.head_object(request)
            return result.status_code == 200
        except Exception as e:
            if "NoSuchKey" in str(e) or "404" in str(e):
                return False
            logger.error(f"检查OSS对象存在性失败: {object_key}, 错误: {e}")
            return False


# 全局实例
oss_uploader = OSSUploader()


def upload_video_to_oss(local_file_path: str, object_key: Optional[str] = None, 
                       expires_in: int = 3600) -> Tuple[bool, str, Optional[str]]:
    """
    便捷函数：上传视频到OSS并获取预签名URL
    
    Args:
        local_file_path: 本地文件路径
        object_key: OSS对象键名，如果为None则自动生成
        expires_in: 预签名URL过期时间(秒)，默认1小时
        
    Returns:
        tuple: (是否成功, 消息, 预签名URL)
    """
    return oss_uploader.upload_and_get_url(local_file_path, object_key, expires_in)


def upload_video_and_get_urls(
    local_file_path: str, 
    object_key: Optional[str] = None,
    expiration: int = 3600
) -> Dict[str, Any]:
    """
    便捷函数：上传视频到OSS并获取访问URL
    
    Args:
        local_file_path: 本地文件路径
        object_key: OSS对象键名，为空时自动生成
        expiration: 预签名URL有效期（秒），默认1小时
        
    Returns:
        Dict: 包含上传结果和URL信息
    """
    return oss_uploader.upload_and_get_urls(local_file_path, object_key, expiration)


def generate_oss_presigned_url(object_key: str, expires_in: int = 3600) -> Optional[str]:
    """
    便捷函数：为已存在的OSS对象生成预签名URL
    
    Args:
        object_key: OSS对象键名
        expires_in: 过期时间(秒)
        
    Returns:
        预签名URL，失败时返回None
    """
    return oss_uploader.generate_presigned_url(object_key, expires_in)


def get_public_url(object_key: str) -> str:
    """
    便捷函数：获取公共访问URL
    
    Args:
        object_key: OSS对象键名
        
    Returns:
        str: 公共URL
    """
    return oss_uploader.get_public_url(object_key)


def get_oss_uploader() -> OSSUploader:
    """
    获取全局OSS上传器实例（单例模式）
    
    Returns:
        OSSUploader: OSS上传器实例
    """
    return oss_uploader
