<template>
  <div class="preview">
    <iframe san123dbox="allow-modals allow-forms allow-pointer-lock allow-popups allow-scripts" s123rc="data:text/html;charset=utf-8,%3C!DOCTYPE%20html%3E%3Chtml%3E%3Chead%3E%3C%2Fhead%3E%3Cbody%3E%3Cdiv%20id%3D%22app%22%3E%3C%2Fdiv%3E%3C%2Fbody%3E%3C%2Fhtml%3E" ref="iframe">
    </iframe>
  </div>
</template>

<script>
import createIframe from '../utils/iframe';


export default {
  props: ['value'],

  mounted() {
    /*this.iframe = createIframe({
      el: this.$refs.iframe,
      sandboxAttributes
    });*/

    console.log("########Aqui");
    console.log(this.$refs.iframe.contentWindow);

   const     html = `<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>`;
    const iframe = this.$refs.iframe;

   iframe.setAttribute('scrolling', 'yes');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    //this.$el.parentNode.replaceChild(iframe, this.$el);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

         this.$emit('iframeCreated',  this.$refs.iframe );

   
  },
  created(){

  },

  /*watch: {
    value(val) {
      this.iframe.setHTML(val);
    }
  }*/
};
</script>

<style lang="stylus" scoped>
</style>
