<template>
  <div class="preview">
     <div ref="iframe"></div>
  </div>
</template>

<script>
import createIframe from '../utils/iframe';


export default {
  props: ['iframe', 'complexPreviewUrl'],

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
    iframe.style.marginTop = '20px';
    //console.log($(iframe).contents().find("html").html());
   // var htmlCopy = $(iframe).contents().find("html").html();
   if(this.complexPreviewUrl == ''){
    var htmlCopy  = decodeURI(iframe.getAttribute("data-html")); //Busca o html inicial via attribute para evitar reload duplicado

    this.$el.parentNode.replaceChild(iframe, this.$el); //Isso gera um reload no iframe e cancela qualquer requisição que ainda não tenha sido finalizada
     //console.log($(iframe).contents().find("html").html());
        //  console.log(this.$el);
    //Exeplo se o iframe busca arquivos externos, estes podem não ser cancelados 
    


    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlCopy);
    iframe.contentWindow.document.close();

    }
    else{
          this.$el.parentNode.replaceChild(iframe, this.$el); //Isso gera um reload no iframe e cancela qualquer requisição que ainda não tenha sido finalizada
          iframe.src = this.complexPreviewUrl;
    }


   
  },
  created(){

  },


};
</script>

<style lang="stylus" scoped>
</style>
