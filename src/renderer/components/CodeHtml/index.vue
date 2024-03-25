<template>
    <div class="codeWrap">
        <slot name="header">
            <div class="cmr-toolbar" slot="header" :class="!code ? 'disabled':''">
                <span class="btn btn-preview" @click="onView(code)"><i class="el-icon-view"></i></span>
                <span class="btn btn-saveAs" @click="onSaveAs(code)"><i class="el-icon-download"></i></span>
                <span class="btn btn-copy" @click="copyHtmltoPaste(code)"><i class="el-icon-document-copy"></i></span>
                <span class="btn" @click="showFullscreen(true)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true" data-testid="maximize-editor-button" class="wink-icon" style="stroke-opacity: 0; fill: white; cursor: pointer;width:1rem;height:1rem"><path d="M5 7h7v2H7v5H5V7zm7 10h7v-7h-2v5h-5v2z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M1 5a2 2 0 012-2h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5zm2 0h18v14H3V5z"></path></svg>
                </span>
            </div>
        </slot>
        <div class="cmr-content">
            <fullscreen class="unfullscreen" v-model="fullscreenVisible">
                <span class="close" @click="showFullscreen(false)"><i class="el-icon-circle-close"></i></span>
                <CodemMirror 
                    ref="cmr"
                    v-model="code" 
                    :options="cmOption"
                    @blur="onBlur($event)"
                    @focus="onFocus($event)"
                    @ready="onReady($event)"
                ></CodemMirror>
            </fullscreen>
        </div>
        <slot name="footer"></slot>
    </div>
</template>

<script>
import Vue from "vue";
import { codemirror } from "vue-codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/ayu-dark.css";
// html代码高亮
import "codemirror/mode/htmlmixed/htmlmixed.js";
import 'codemirror/mode/htmlembedded/htmlembedded.js';
import { copyPaste } from "@/utils/toolkit";
import VueFullscreen from 'vue-fullscreen';
Vue.use(VueFullscreen);

export default {
    name: "CodeHtml",
	components: {
        CodemMirror:codemirror,
    },
    props: {
        defaultCode: {
          type: String,
          default:()=>'',
        },
        disabled:{
          type: Boolean,
          default:()=>false
        }
    },
    data(){
		return {
            code:this.defaultCode,
            // extensions:[html(), oneDark],
            fullscreenVisible:false,
            cmOption:{
                line: true,
                theme: "ayu-dark", // 主题
                tabSize: 4, // 制表符的宽度
                indentUnit: 2, // 一个块应该缩进多少个空格,默认值为 2。
                viewportMargin: Infinity, //处理高度自适应时搭配使用
                showCursorWhenSelecting: true, // 当选择处于活动状态时是否应绘制游标
                mode: "htmlembedded",
                lineNumbers: true,
                readOnly:false,
                showCursorWhenSelecting:true,
                spellcheck:true,
                autocorrect:true,
                autoCloseBrackets:true,
                matchBrackets:true,
                placeholder:'place your html code'
            }
		}
    },
    watch:{
        defaultCode(v){
            this.code = v;
        }
    },
    mounted(){
    },
    methods: {
        copyHtmltoPaste(c){
            copyPaste(JSON.stringify(c))
        },
        onReady(e){
            // console.log(e,'ready')
        },
        onFocus(e){
            // console.log(e, 'focus');
            //todo something...
        },
        onBlur(e){
            this.$emit('changed', this.code);
        },
        showFullscreen(bool){
            this.fullscreenVisible = bool;
        },
        onView(){
            this.$emit('onView', this.code);
        },
        onSaveAs(){
            this.$emit('onSaveAs', this.code);
        }
    },
}
</script>

<style lang="scss" scoped>
.codeWrap{
    .cmr-toolbar{
        display:flex;
        justify-content:flex-end;
        align-items:center;
        padding:6px 10px;
        background-color:#282c34;
        border-bottom:1px solid #5f5f5f;
        &.disabled{
            .btn{
                user-select: none;
                pointer-events: none;
                opacity: 0.6;
            }
        }
        .btn-copy{
            font-size: 16px;
        }
        .btn{
            color:#fff;
            cursor: pointer;
            margin-left: 10px;
            padding:5px;
        }
    }
    .cmr-content{
        border-bottom-left-radius:3px;
        border-bottom-right-radius:3px;
        .unfullscreen{
            height:100%;
            width: 100%;
            .v-codemirror{
                height: 100%;
            }
            .close{
                position:absolute;
                right:1.5rem;
                top:1rem;
                color:#cfcfcf;
                font-weight:bold;
                display:none;
                font-size:2.5rem;
                z-index:10;
                cursor:pointer;
            }
        }
        .fullscreen{
            position:relative;
            width: 100%;
            .vue-codemirror{
                height: 100%;
                ::v-deep(.CodeMirror){
                    height: 100%;
                    min-height: 300px;
                }
            }
            .close{
                display:block;
            }
        }
        .vue-codemirror{
            height: 100%;
        }
    }
    .cmr-footer{
        background-color:#282c34;
        border-top:1px solid #5f5f5f;
        padding:6px 10px;
        .infos {
            display:flex;
            align-items:center;
            .item {
                margin-left: 1em;
                display: inline-block;
                font-feature-settings: 'tnum';
                font-size:12px;
                color:#999
            }
      }
    }
    :global(.cm-editor){
        height:100%;
        width:100%;
        &:focus{
            outline:none !important;
        }
    }
}
</style>