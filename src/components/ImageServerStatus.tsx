interface ImageServerStartedToastProps {
  status: {
    success: boolean;
    tunnelUrl: string;
  }
}

const ImageServerStartedToast = ({ status }: ImageServerStartedToastProps) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (window.electron) {
      // 使用 electron 的 shell.openExternal 在默认浏览器中打开链接
      window.electron.openExternal(status.tunnelUrl);
    } else {
      // 如果没有 electron 环境，则使用普通方式打开
      window.open(status.tunnelUrl, '_blank');
    }
  };

  return (
    <div 
      className="flex flex-col gap-2 w-full"
    >
      <small>图片服务器已启动</small>
      <a 
        href={status.tunnelUrl}
        onClick={handleLinkClick}
        className="text-purple-600 text-nowrap"
      >{status.tunnelUrl}</a>
    </div>
  )
}

export default ImageServerStartedToast;