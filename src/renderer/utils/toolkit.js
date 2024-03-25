import { Message } from 'element-ui';
export function copyPaste(c){
    if(!c) return false;
    const element = document.createElement('input');
    element.style.height = '0';
    // 将该 input 设为 readonly 防止 iOS 下自动唤起键盘，同时将 input 移出可视区域
    element.readOnly = 'readonly';
    element.value = c;
    document.body.appendChild(element);
    if (document.execCommand) {
        element.select();
        document.execCommand('copy');
        Message({
            type:'success',
            message: 'copied  successfully',
            duration:1500
        })
    } else {
        Message({
            type:'error',
            message: 'copied failed for your browser not support copy'
        })
    }
    document.body.removeChild(element);
}