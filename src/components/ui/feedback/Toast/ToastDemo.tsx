import { ToastProvider, useToast } from './Toast';

function ToastButtons() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        onClick={() =>
          toast({
            title: '默认提示',
            description: '这是一个默认通知。',
          })
        }
      >
        默认
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        onClick={() =>
          toast({
            variant: 'success',
            title: '成功！',
            description: '您的更改已被保存。',
          })
        }
      >
        成功
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        onClick={() =>
          toast({
            variant: 'error',
            title: '错误',
            description: '出了些问题。请重试。',
          })
        }
      >
        错误
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        onClick={() =>
          toast({
            variant: 'warning',
            title: '警告',
            description: '您的会话将在 5 分钟后过期。',
          })
        }
      >
        警告
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        onClick={() =>
          toast({
            variant: 'info',
            title: '信息',
            description: '新版本现已可供下载。',
          })
        }
      >
        信息
      </button>
    </div>
  );
}

export function ToastDemo() {
  return (
    <ToastProvider>
      <ToastButtons />
    </ToastProvider>
  );
}
