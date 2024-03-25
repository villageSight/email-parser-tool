import Vue from 'vue';
import { Message } from 'element-ui';
//v-copy 复制指令 v-copy:params = "xxx"
Vue.directive('copy', {
  inserted(el, binding, vnode) {
    // create copy element
    const {value, arg} = {...binding};
    const eventType = arg || 'dblclick'; //如果没有传入事件，则默认为双击事件dblclick
    binding._eventType = eventType;
    el._handler = () => {
      const element = document.createElement('input');
      element.style.height = '0';
      // 将该 input 设为 readonly 防止 iOS 下自动唤起键盘，同时将 input 移出可视区域
      element.readOnly = 'readonly';
      element.value = value;
      document.body.appendChild(element);
      if (document.execCommand) {
        element.select();
        document.execCommand('copy');
        Message({
          type:'success',
          message: 'copy succeed',
          duration:1500
        })
      } else {
        this.$message.error('copy failed for your browser not support copy');
        Message({
          type:'error',
          message: 'copy failed for your browser not support copy'
        })
      }
      document.body.removeChild(element);
    };
    // listen event
    el.addEventListener(binding._eventType, el._handler);
  },
  unbind(el, binding) {
    // remove listen (GC)
    el.removeEventListener(binding.arg, el._handler);
  },
});
