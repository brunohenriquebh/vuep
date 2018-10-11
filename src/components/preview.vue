<template>
  <div class="preview">
     <div ref="iframe"></div>
  </div>
</template>

<script>
import createIframe from '../utils/iframe';


export default {
  props: ['iframe'],

  mounted() {
    /*this.iframe = createIframe({
      el: this.$refs.iframe,
      sandboxAttributes
    });*/

   //const     html = `<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>`;
    
    const iframe = document.getElementById(this.iframe);

   iframe.setAttribute('scrolling', 'yes');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.paddingBottom = '40px';
   
    this.$el.parentNode.replaceChild(iframe, this.$el);
    /*


    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

         this.$emit('iframeCreated',  this.$refs.iframe );
    */

   
  },
  created(){

  },


};
</script>

<style lang="stylus" scoped>
</style>
