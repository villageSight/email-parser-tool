<template>
  <div 
    id="wrapper"
    class="wrapper"
    :class="isDragover ? 'dragover':''"             
    @dragover.prevent="handleDragover($event)"
    @dragleave.prevent="handleDragleave($event)"
    @drop.prevent="handleDrop($event)">
    <div class="wrapper-content">
      <el-form ref="form" :model="formData" inline>
        <el-form-item prop="attachments">
            <div>
              <div class="el-upload__text">
                <el-button @click="hanleOpenFile" type="primary" size="small" icon="el-icon-folder-opened">选择文件</el-button>
                <em>{{ selectedFilePath }}</em>
              </div>
            </div>
        </el-form-item>
      </el-form>
      <div class="eml-wraper" >
        <div class="eml-head">
          <div class="eml-snapshot">
            <el-skeleton :loading="imgLoading" animated style="width:100%">
              <template slot="template">
                <el-skeleton-item variant="image" style="width: 200px; height: 267px;margin:20px auto" />
                <el-skeleton-item variant="text" style="width: 30%;margin-left: 60%;padding:5px 0" />
              </template>
              <template>
                <span class="img">
                  <el-image :src="emlInfo.snapshot" fit="contain" :preview-src-list="[emlInfo.snapshot]">
                    <div slot="error" class="image-slot">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </el-image>
                  <span class="btn-save" v-if="emlInfo.snapshot" @click="onDownload"><i class="el-icon-download"></i>&nbsp;导出图片</span>
                </span>
              </template>
            </el-skeleton>
          </div>
          <div class="eml-header">
            <el-skeleton :loading="headerLoading" animated :count="6" style="width:100%">
              <template slot="template">
                  <div
                    style="display: flex; align-items: center; justify-items: space-between; margin:20px 0;"
                  >
                    <el-skeleton-item variant="text" style="width: 30%;margin: 0 10px;padding:5px 0" />
                    <el-skeleton-item variant="text" style="margin: 0 10px;padding:5px 0" />
                  </div>
              </template>
              <template>
                <el-descriptions direction="horizontal" :column="1" border label-class-name="custom-desc-label">
                  <el-descriptions-item label="subject">{{ emlInfo.subject }}</el-descriptions-item>
                  <el-descriptions-item label="from">{{ froms }}</el-descriptions-item>
                  <el-descriptions-item label="to">{{ tos }}</el-descriptions-item>
                  <el-descriptions-item label="attachments" v-if="attachments.length">
                    <div class="atm-wrapper">
                      <span v-for="(f,index) in attachments" :key="index"><el-button type="text" @click="onDownloadAttachments(f)">{{ f.filename || f.cid }}</el-button><span class="dot">, </span></span>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item label="date">{{ emlInfo.date| formatDate }}</el-descriptions-item>
                  <!--dynamic header items start-->
                  <el-descriptions-item v-for="h in extraHeaders" :key="h.key">
                    <template v-if="h.key.indexOf('remote_ip')!=-1">
                      <span slot="label">remote_ip</span>
                      <json-viewer copyable :expand-depth="2" :expanded="true" @copied="onCopyJson" :value="remoteIpJSon(h.line)"></json-viewer>
                    </template>
                    <template v-else>
                      <span slot="label">{{h.key}}</span>
                      {{ h.line }}
                    </template>
                  </el-descriptions-item>
                  <!--dynamic header items end-->
                  <el-descriptions-item label="cc" v-if="emlInfo.cc">{{ emlInfo.cc }}</el-descriptions-item>
                  <el-descriptions-item label="in-reply-to" v-if="emlInfo.inReplyTo">{{ emlInfo.inReplyTo }}</el-descriptions-item>
                </el-descriptions>
              </template>
            </el-skeleton>
          </div>
        </div>
        <div class="eml-content">
          <div class="eml-template">
            <div class="title">
              <strong>邮件内容</strong>
            </div>
            <div class="code">
              <el-skeleton :loading="tempLoading" animated style="width:100%">
                <template slot="template">
                  <div
                    style="display: flex; align-items: center; justify-content: flex-end; margin:10px 0;"
                  >
                    <el-skeleton-item variant="button" style="margin: 0 10px;" />
                    <el-skeleton-item variant="button" style="margin: 0 10px;" />
                    <el-skeleton-item variant="button" style="margin: 0 10px;" />
                    <el-skeleton-item variant="button" style="margin: 0 10px;" />
                  </div>
                  <el-skeleton-item variant="rect" style="margin: 0 10px;width: calc(100% - 20px);height: 300px;" />
                </template>
                <template>
                  <CodeHtml :defaultCode="emlInfo.html" :disabled="true" @onView="onView" @onSaveAs="onSaveAs">
                    <span slot="footer"></span>
                  </CodeHtml>
                </template>
              </el-skeleton>
            </div>
          </div>
          <div class="emlPngWrapper" ref="emlPngWrapper" v-html="emlInfo.html"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import  Vue from 'vue';
  import JsonViewer from 'vue-json-viewer'
  import { Skeleton, SkeletonItem, Button,Descriptions, DescriptionsItem,Image, Form, FormItem , Message, Tag} from 'element-ui';
  import CodeHtml from '@/components/CodeHtml';
  import path from "path";
  import fs from "fs";
  import { EmlParser } from '@/utils/emlParser';
  import html2canvas from "html2canvas";
  import dayjs from 'dayjs';
  import { copyPaste } from "@/utils/toolkit";
  const { ipcRenderer } = require("electron");
  const { dialog, app } = require("electron").remote;
  import "@/utils/menus";
  const cmpnts = [ Skeleton, SkeletonItem, Button,Descriptions, DescriptionsItem,Image, Form, FormItem, Tag];
  cmpnts.forEach(cnp=> Vue.use(cnp));
  export default {
    name: 'home-page',
    components: { CodeHtml, JsonViewer },
    data() {
      return {
          isDragover:false, //是否
          headerLoading:false,
          imgLoading:false, //图片加载状态
          tempLoading:false,
          basePath:"",
          emlInfo:{
            html:"",
            snapshot:'',
            subject:'',
            from:'',
            to:'',
            date:'',
            cc:"",
            inReplyTo:'',
            messageId:"",
            attachments:[],
            extra:'',
            headerLines:[]
          },
          selectedFileExtname:'', //选中文件的后缀名
          selectedFileBasename:'',//选中文件的名称
          selectedFilePath:'',
          formData:{
            attachments: []
          }
        }
    },
    computed:{
      froms(){
        if(this.emlInfo.from&&Array.isArray(this.emlInfo.from)){
          return this.emlInfo.from.map((item)=> `${item.name}<${item.address}>`).join(',');
        }
        return `<${this.emlInfo.from}>`;
      },
      tos(){
        if(this.emlInfo.to&&Array.isArray(this.emlInfo.to)){
          return this.emlInfo.to.map((item)=> `${item.name}<${item.address}>`).join(',');
        }
        return `<${this.emlInfo.to}>`;
      },
      //header扩展字段信息
      extraHeaders(){
        const headers = [];
        const keys = Object.keys(this.emlInfo);
        if(!this.emlInfo.headerLines.length) return headers;
        this.emlInfo.headerLines.forEach(h=>{
          if(h.key && h.line && !keys.includes(h.key)){
            headers.push(h);
          }
        })
        return headers;
      },
      //邮件附件
      attachments(){
        if(!this.emlInfo.attachments.length) return '';
        return this.emlInfo.attachments.map(({ filename, content, cid })=>{
          return {filename, content, cid}
        });
      }
    },
    filters:{
      formatDate(date){
        if(!date){ return ''};
        return  dayjs(date).format('YYYY-MM-DD HH:mm:ss');
      }
    },
    methods: {
      onCopyJson(e){
        copyPaste(e.text)
      },
      //转化remote_ip字段值为json格式
      remoteIpJSon(data){
        if(!data) return '';
        let json ;
        const substrStart = data.indexOf('remote_ip');
        const substrEnd = data.indexOf('Received');
        if(substrStart>=0 && substrEnd>=0){
          try {
            //substrStart-2 是为了加上{"2个字符长度，故截取下标往前移动2位
            const target = data.substring(substrStart-2,substrEnd);
            json = JSON.parse(target);
          } catch (error) {
            conslog.log(error);
            json = data;
          }
        }
        return json;
      },
      //预览eml html
      onView(){
        //向主进程发送打开新窗口的消息
        ipcRenderer.send('template-preview', this.emlInfo.htmlSrc);
      },
      //创建缓存文件夹temp
      mkdir(){
        const path = require('path')
        // 设置存放缓存文件的文件夹
        const AVATARPATH = 'temp'
        // 设置文件夹位置（在安装应用文件夹内）
        const basePath = path.join(app.getPath('userData'), AVATARPATH);
        this.basePath = basePath;
        //如果文件夹存在则不创建
        if(fs.existsSync(basePath)) return;
        //如果文件夹不存在创建文件夹
        fs.mkdir(basePath, { recursive: true }, err => {
            if (err) console.log(`mkdir path: ${basePath} err`)
        })
      },
      //read eml file, includes email headers and content info
      getEmlFileInfo(filepath){
        this.getEmailHeaders(filepath);
        this.getEmailBodyHtml(filepath,filepath+`.html`);
        this.parserEml(filepath);
        // this.getEmailAsPng(filepath);
      },
      //return all email data info
      async parserEml(emlPath){
        const parser = new EmlParser(fs.createReadStream(emlPath));
        const result = await parser.parseEml();
        this.emlInfo.headerLines = result.headerLines || [];
        this.emlInfo.attachments = result.attachments || [];
        if(result.attachments.length){
          result.attachments.forEach(async item=>{
            const filepath = path.join(this.basePath, item.filename || item.cid+'.png');
            item.sourcePath = filepath;
            try {
              await fs.writeFileSync(filepath, item.content);
            } catch (error) {
              console.log(error)
            }
          })
        }
      },
      // return only email headers info
      async getEmailHeaders(emlPath){
        this.headerLoading = true;
        const parser = new EmlParser(fs.createReadStream(emlPath));
        const result = await parser.getEmailHeaders();
        this.headerLoading = false;
        Object.assign(this.emlInfo,result);
      },
      // returns email content as a html string (without headers like subject, from, etc).
      async getEmailBodyHtml(emlPath) {
        this.tempLoading = true;
        this.imgLoading = true;
        const parser = new EmlParser(fs.createReadStream(emlPath));
        let htmlString = await parser.getEmailBodyHtml();
        //为防止浏览器打开乱码，将模板中的编码设置由原本的gb2312替换为utf-8
        htmlString = htmlString.replace(/GB2312/gi,'utf-8');
        this.emlInfo.html = htmlString;
        this.tempLoading = false;
        this.$nextTick(()=>{
          htmlString && this.getEmailPngByHtml(htmlString);
        })
        try {
          const writeFilePath = path.join(this.basePath, `${this.selectedFileBasename}.html`);
          this.emlInfo.htmlSrc=writeFilePath;
          fs.writeFileSync(writeFilePath,htmlString, { encoding:'utf-8' })
        } catch (error) {
          dialog.showMessageBox({
            title: "错误提示",
            type: "error",
            message: `htmlString写入失败`,
          });
        } finally {

        }
      },
      // return email as a png image
      async getEmailAsPng(emlPath, format='png'){
        this.imgLoading = true;
        let  file = fs.createReadStream(emlPath), 
          parser = new EmlParser(file), 
          filePath = path.join(this.basePath, `${this.selectedFileBasename}.${format}`);
        parser.convertEmailToBuffer(format).then(buffer=>{
          this.emlInfo.snapshot = `data:image/png;base64,${buffer.toString('base64')}`;
        }).catch(err=> console.log(err)).finally(()=>{
          this.imgLoading = false;
        });

        parser.convertEmailToStream(format).then(stream=>{
          stream.pipe(fs.createWriteStream(filePath));
          this.emlInfo.imgSrc = filePath;
        }).catch(err=> 
          console.log(err)
        ).finally(()=>{
        });
      },
      getEmailPngByHtml(){
        const container = this.$refs['emlPngWrapper'];
        html2canvas(container, {
          useCORS: true,
          with:600,
          removeContainer: true,
          scale: window.devicePixelRatio,
        }).then(canvas => {
          const filePath = path.join(this.basePath, `${this.selectedFileBasename}.png`);
          const base64 = canvas.toDataURL('image/png', 0.7);
          this.emlInfo.snapshot = base64;
          const base64Data = base64.split(';base64,')[1];
          // 将base64数据转换为Buffer对象
          const imageBuffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, imageBuffer);
          this.emlInfo.imgSrc = filePath;
        }).catch(err=>{
          console.log(err);
        }).finally(() => {
          this.imgLoading = false;
        });
      },
      //判断文件是否为可接受的文件类型，是否size过大
      isValidFile(file) {
        let acceptFilesType = /[\/.eml|\/.emlx]$/i;
        let maxSize = 1024 * 1024 * 50; //限制5M大小
        let bname = path.basename(file.path);
        if (!acceptFilesType.test(path.extname(file.path))) {
          dialog.showMessageBox({
            title: "错误提示",
            type: "error",
            message: `${path.basename(file.path)}文件格式类型错误`,
          });
          return false;
        }
        if (file.size > maxSize) {
          dialog.showMessageBox({
            title: "错误提示",
            type: "error",
            message: `${bname}超过了文件限制大小50M`,
          });
          return false;
        }
        return true;
      },
      //文件拖拽
      async handleDrop(e) {
        this.isDragover = false;
        let file = e.dataTransfer.files[0];
        let result = this.isValidFile(file);
        if (!result) {
          return dialog.showMessageBox({
            title: "错误提示",
            type: "error",
            message: `${file.name}文件不支持`,
          });
        }
        this.selectedFilePath = file.path;
        this.getEmlFileInfo(file.path);
      },
      handleDragover(e){
        this.isDragover = true;
      },
      handleDragleave(e){
        const rect = document.getElementById('wrapper').getBoundingClientRect();
        if(e.clientY < rect.top || e.clientY >= rect.bottom || e.clientX < rect.left || e.clientX >= rect.right){
          this.isDragover = false;
        }
      },
      //选择文件
      hanleOpenFile() {
        dialog.showOpenDialog(
          {
            properties: ["openFile"],
            filters: [
              {
                name: "Text",
                extensions: ["eml", "emlx"],
              },
            ],
          },
          async (filenames) => {
            if (!filenames||!filenames.length) return false;
            let file = filenames[0];
            let extname = path.extname(file);
            this.selectedFileExtname = extname;
            this.selectedFileBasename = path.parse(file).name;
            this.selectedFilePath = file;
            this.getEmlFileInfo(file);
          }
        );
      },
      //保存eml html模板
      onSaveAs(){
        this.exportFile(this.emlInfo.htmlSrc,`${this.selectedFileBasename || 'eml'}.html`);
      },
      /*
       * 导出文件 
       * source:源文件路径，format：导出文件格式
      */
      exportFile(source, filename){
        dialog.showOpenDialog(
          {
            properties: ["openDirectory", "createDirectory"],
            buttonLabel: "保存",
          },
          (folders) => {
            if (!folders||!folders.length) return false;
            const dest = path.join(folders[0], filename);
            fs.copyFile(source, dest, (error) => {
              if (error) {
                return dialog.showErrorBox(
                  "错误",
                  `文件保存失败: \n ${dest}`
                );
              }
              dialog.showMessageBox({
                type: "info",
                title: "成功",
                message: `文件保存成功！\n\n 文件名称：${dest}\n\n 所在目录：${folders[0]}`,
              });
            });
          }
        )
      },
      //下载图片
      onDownload(){
        this.exportFile(this.emlInfo.imgSrc, `${this.selectedFileBasename || 'eml'}.png`);
      },
      //下载附件
      onDownloadAttachments(h){
        let isIMG = false;
        if(h.cid&&h.cid.indexOf('image')!==-1){ isIMG = true;}
        const filename = isIMG ? h.cid+'.png' : h.filename;
        const atmFilePath = path.join(this.basePath, filename);
        dialog.showOpenDialog(
          {
            defaultPath:atmFilePath,
            properties: ["openFile"],
          },
          (filepath,bookmarks) => {
            if(filepath&&filepath.length){
              ipcRenderer.send('template-preview', atmFilePath);
            }
          }
        );
      }
    },
    mounted() {
      this.mkdir()
    },
  }
</script>
<style>
*{
  padding: 0;
  margin:0;
}
.el-image-viewer__canvas .el-image-viewer__img {
  background-color: #fff !important;
}
</style>

<style lang="scss" scoped>
.wrapper{
  padding:10px;
  &.dragover{
    position: fixed;
    z-index: 9;
    background-color: #fff;
    opacity: 0.85;
    border:5px dashed #cfcfcf;
    left: 0;
    right: 0;
    top:0;
    bottom: 0;
    .wrapper-content{
      user-select: none;
      pointer-events: none;
      opacity: 0.2;
    }
    &::before{
      content: '将文件拖拽至此区域';
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%);
      line-height: 100%;
      text-align: center;
      font-weight: bold;
      font-size: 16px;
      color: #8c95a8;
    }
  }
  .eml-wraper{
    border:1px solid #cfcfcf;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    .eml-head{
      display: flex;
      .eml-snapshot{
        background-color: #fff;
        width: 250px;
        border-bottom: 1px solid #cfcfcf;
        display: flex;
        justify-content: center;
        // align-items: center;
        span.img{
          display: block;
          width: 250px;
          height: 358px;
          max-width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          .btn-save{
            position: absolute;
            right: 0;
            bottom: 0;
            z-index: 2;
            font-size: 13px;
            padding:6px 10px;
            color:#409EFF;
            cursor: pointer;
          }
          .el-image{
            height: 100%;
            width: auto;
            display: flex;
            align-items: center;
          }
          .image-slot{
            i{
              font-size: 6rem;
              font-weight: normal;
              opacity: 0.7;
            }
          }
        }
      }
      .eml-header{
        border-left: 1px solid #cfcfcf;
        width: calc(100% - 250px);
        display: flex;
        ::v-deep(.custom-desc-label){
          font-weight:bold;
          color:#3e3e3e;
          width: 8rem;
        }
        .atm-wrapper{
          span:last-child{
            .dot{
              display: none;
            }
          }
        }
        .el-descriptions{
          width: 100%;
        }
      }
  
    }
    .eml-content{
      position: relative;
      overflow: hidden;
      .eml-template{
        .title{
          padding:10px;
          background-color:#EBEEF5;
        }
      }
      .emlPngWrapper{
        position: absolute;
        width: 100%;
        height: auto;
        left: -999px;
        bottom: -9999px;
      }
    }
  }
}
</style>
